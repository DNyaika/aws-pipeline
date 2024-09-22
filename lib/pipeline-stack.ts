import * as cdk from 'aws-cdk-lib';
import { SecretValue } from 'aws-cdk-lib';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { Construct } from 'constructs';
import { CloudFormationCreateUpdateStackAction, CodeBuildAction, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { PipelineProject, LinuxBuildImage, BuildSpec } from 'aws-cdk-lib/aws-codebuild';
import { Service } from 'aws-cdk-lib/aws-servicediscovery';
import { ServiceStack } from './service-stack';

export class PipelineStack extends cdk.Stack {
  private readonly pipeline: Pipeline;
  private readonly cdkBuildOutput: Artifact;
  private readonly serviceBuildOutput: Artifact;


  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.pipeline = new Pipeline(this, 'Pipeline', {
      pipelineName: 'Pipeline',
      crossAccountKeys: false,
      restartExecutionOnUpdate: true
    });

    const cdksourceOutput = new Artifact('CDKSourceOutput');
    const servicekSourceOutput = new Artifact('ServicekSourceOutput');

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
          output: servicekSourceOutput,
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
        input: servicekSourceOutput,
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
    })
  }

  public addServiceStage(serviceStack: ServiceStack, stageName: string) {
    this.pipeline.addStage({
      stageName: stageName,
      actions: [
        new CloudFormationCreateUpdateStackAction({
          actionName: 'Service_Update',
          stackName: serviceStack.stackName,
          templatePath: this.cdkBuildOutput.atPath('${serviceStack.stackName}.template.json'),
          adminPermissions: true,
          parameterOverrides: {
            ...serviceStack.serviceCode.assign(this.serviceBuildOutput.s3Location)
          },
          extraInputs: [this.serviceBuildOutput]
        })
      ]
    });
  }
}
