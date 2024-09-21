import * as cdk from 'aws-cdk-lib';
import { SecretValue } from 'aws-cdk-lib';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { Construct } from 'constructs';
import { CloudFormationCreateUpdateStackAction, CodeBuildAction, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { PipelineProject, LinuxBuildImage, BuildSpec } from 'aws-cdk-lib/aws-codebuild';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new Pipeline(this, 'Pipeline', {
      pipelineName: 'Pipeline',
      crossAccountKeys: false
    });

    const cdksourceOutput = new Artifact('CDKSourceOutput');
    const servicekSourceOutput = new Artifact('ServicekSourceOutput');

    pipeline.addStage({
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

    const cdkBuildOutput = new Artifact('CDKBuildOutput');
    pipeline.addStage({
      stageName: 'Build',
      actions: [new CodeBuildAction({
        actionName: 'CDK_Build',
        input: cdksourceOutput,
        outputs: [cdkBuildOutput],
        project: new PipelineProject(this, 'CDKBuildProject', {
          environment: {
            buildImage: LinuxBuildImage.STANDARD_6_0
          },

          buildSpec: BuildSpec.fromSourceFilename('build-specs/cdk-build-spec.yml')
        })
      })]
    });

    pipeline.addStage({
      stageName: 'Pipeline_Update',
      actions: [
        new CloudFormationCreateUpdateStackAction({
          actionName: 'Pipeline_Update',
          stackName: 'PipelineStack',
          templatePath: cdkBuildOutput.atPath('PipelineStack.template.json'),
          adminPermissions: true
        })
      ]
    })
  }
}
