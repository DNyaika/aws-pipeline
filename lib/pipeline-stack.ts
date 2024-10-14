import * as cdk from 'aws-cdk-lib';
import { SecretValue } from 'aws-cdk-lib';
import { Artifact, IStage, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { Construct } from 'constructs';
import { CloudFormationCreateUpdateStackAction, CodeBuildAction, CodeBuildActionType, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { PipelineProject, LinuxBuildImage, BuildSpec, BuildEnvironmentVariableType } from 'aws-cdk-lib/aws-codebuild';
import { ServiceStack } from './service-stack';
import { BillingStack } from './billing-stack';
import { SnsTopic } from 'aws-cdk-lib/aws-events-targets';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { RuleTargetInput, EventField } from 'aws-cdk-lib/aws-events';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';

export class PipelineStack extends cdk.Stack {
  private readonly pipeline: Pipeline;
  private readonly cdkBuildOutput: Artifact;
  private readonly serviceBuildOutput: Artifact;
  private readonly serviceSourceOutput: Artifact;
  private readonly pipelineNotificationTopic: Topic;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.pipelineNotificationTopic = new Topic(this, 'PipelineNotificationTopic', {
      topicName: 'PipelineNotifications',
    });

    this.pipelineNotificationTopic.addSubscription(
      new EmailSubscription('davidnyaika2@gmail.com')
    )

    this.pipeline = new Pipeline(this, 'Pipeline', {
      pipelineName: 'Pipeline',
      crossAccountKeys: false,
      restartExecutionOnUpdate: true
    });

    const cdksourceOutput = new Artifact('CDKSourceOutput');
    this.serviceSourceOutput = new Artifact('ServicekSourceOutput');

    this.pipeline.addStage({
      stageName: 'Source',
      actions: [
        new GitHubSourceAction({
          owner: 'DNyaika',
          repo: 'aws-pipeline',
          branch: 'main',
          actionName: 'pipeline-source',
          oauthToken: SecretValue.secretsManager('github-pipeline-token'),
          output: cdksourceOutput
        }),
        new GitHubSourceAction({
          owner: 'DNyaika',
          repo: 'express-lambda',
          branch: 'main',
          actionName: 'service-source',
          oauthToken: SecretValue.secretsManager('github-pipeline-token'),
          output: this.serviceSourceOutput,
        })
      ]
    });

    this.cdkBuildOutput = new Artifact('CDKBuildOutput');
    this.serviceBuildOutput = new Artifact('ServiceBuildOutput');

    this.pipeline.addStage({
      stageName: 'Build',
      actions: [new CodeBuildAction({
        actionName: 'CDK_Build',
        input: cdksourceOutput,
        outputs: [this.cdkBuildOutput],
        project: new PipelineProject(this, 'CDKBuildProject', {
          environment: {
            buildImage: LinuxBuildImage.STANDARD_6_0
          },
          buildSpec: BuildSpec.fromSourceFilename('build-specs/cdk-build-spec.yml')
        })
      }),
      new CodeBuildAction({
        actionName: 'Service_Build',
        input: this.serviceSourceOutput,
        outputs: [this.serviceBuildOutput],
        project: new PipelineProject(this, 'ServiceBuildProject', {
          environment: {
            buildImage: LinuxBuildImage.STANDARD_6_0
          },
          buildSpec: BuildSpec.fromSourceFilename('build-specs/service-build-spec.yml')
        })
      })
      ]
    });

    this.pipeline.addStage({
      stageName: 'Pipeline_Update',
      actions: [
        new CloudFormationCreateUpdateStackAction({
          actionName: 'Pipeline_Update',
          stackName: 'PipelineStack',
          templatePath: this.cdkBuildOutput.atPath('PipelineStack.template.json'),
          adminPermissions: true
        })
      ]
    });
  }

  public addServiceStage(
    serviceStack: ServiceStack,
    stageName: string
  ): IStage {
    return this.pipeline.addStage({
      stageName: stageName,
      actions: [
        new CloudFormationCreateUpdateStackAction({
          account: serviceStack.account,
          region: serviceStack.region,
          actionName: "Service_Update",
          stackName: serviceStack.stackName,
          templatePath: this.cdkBuildOutput.atPath(
            `${serviceStack.stackName}.template.json`
          ),
          adminPermissions: true,
          parameterOverrides: {
            ...serviceStack.serviceCode.assign(
              this.serviceBuildOutput.s3Location
            ),
          },
          extraInputs: [this.serviceBuildOutput],
        }),
      ],
    });
  }

  public addBillingStage(billingStack: BillingStack, stage: IStage) {
    stage.addAction(
      new CloudFormationCreateUpdateStackAction({
        actionName: 'Billing_Update',
        stackName: billingStack.stackName,
        templatePath: this.cdkBuildOutput.atPath(`${billingStack.stackName}.template.json`),
        adminPermissions: true,
      })
    );
  }

  public addServiceIntegrationTestToStage(stage: IStage, serviceEndPoint: string) {
    const integTestAction = new CodeBuildAction({
      actionName: 'Integration_Test',
      input: this.serviceSourceOutput,
      project: new PipelineProject(this, 'ServiceIntegrationTestsProject', {
        environment: {
          buildImage: LinuxBuildImage.STANDARD_6_0
        },
        buildSpec: BuildSpec.fromSourceFilename('build-specs/integ-test-build-spec.yml'),
      }),
      environmentVariables: {
        SERVICE_ENDPOINT: {
          value: serviceEndPoint,
          type: BuildEnvironmentVariableType.PLAINTEXT,
        },
      },
      type: CodeBuildActionType.TEST,
      runOrder: 2,
    })
    stage.addAction(integTestAction);
    integTestAction.onStateChange("integrationTestFailed", new SnsTopic(this.pipelineNotificationTopic, {
      message: RuleTargetInput.fromText(
        `Integration Test Failed for ${EventField.fromPath('$.detail.execution-result.external-execution-url')}`
      ),
    }), {
      ruleName: 'IntegrationTestFailed',
      eventPattern: {
        detail: {
          state: ['FAILED'],
        },
      },
      description: 'Integration Test Failed'
    });
  }
}