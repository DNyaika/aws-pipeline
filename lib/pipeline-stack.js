"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineStack = void 0;
const cdk = require("aws-cdk-lib");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_codepipeline_1 = require("aws-cdk-lib/aws-codepipeline");
const aws_codepipeline_actions_1 = require("aws-cdk-lib/aws-codepipeline-actions");
const aws_codebuild_1 = require("aws-cdk-lib/aws-codebuild");
class PipelineStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this.pipeline = new aws_codepipeline_1.Pipeline(this, 'Pipeline', {
            pipelineName: 'Pipeline',
            crossAccountKeys: false,
            restartExecutionOnUpdate: true
        });
        const cdksourceOutput = new aws_codepipeline_1.Artifact('CDKSourceOutput');
        const servicekSourceOutput = new aws_codepipeline_1.Artifact('ServicekSourceOutput');
        this.pipeline.addStage({
            stageName: 'Source',
            actions: [
                new aws_codepipeline_actions_1.GitHubSourceAction({
                    owner: 'DNyaika',
                    repo: 'aws-pipeline',
                    branch: 'main',
                    actionName: 'pipeline-source',
                    oauthToken: aws_cdk_lib_1.SecretValue.secretsManager('github-pipeline-token'),
                    output: cdksourceOutput
                }),
                new aws_codepipeline_actions_1.GitHubSourceAction({
                    owner: 'DNyaika',
                    repo: 'express-lambda',
                    branch: 'main',
                    actionName: 'service-source',
                    oauthToken: aws_cdk_lib_1.SecretValue.secretsManager('github-pipeline-token'),
                    output: servicekSourceOutput,
                })
            ]
        });
        this.cdkBuildOutput = new aws_codepipeline_1.Artifact('CDKBuildOutput');
        this.serviceBuildOutput = new aws_codepipeline_1.Artifact('ServiceBuildOutput');
        this.pipeline.addStage({
            stageName: 'Build',
            actions: [new aws_codepipeline_actions_1.CodeBuildAction({
                    actionName: 'CDK_Build',
                    input: cdksourceOutput,
                    outputs: [this.cdkBuildOutput],
                    project: new aws_codebuild_1.PipelineProject(this, 'CDKBuildProject', {
                        environment: {
                            buildImage: aws_codebuild_1.LinuxBuildImage.STANDARD_6_0
                        },
                        buildSpec: aws_codebuild_1.BuildSpec.fromSourceFilename('build-specs/cdk-build-spec.yml')
                    })
                }),
                new aws_codepipeline_actions_1.CodeBuildAction({
                    actionName: 'Service_Build',
                    input: servicekSourceOutput,
                    outputs: [this.serviceBuildOutput],
                    project: new aws_codebuild_1.PipelineProject(this, 'ServiceBuildProject', {
                        environment: {
                            buildImage: aws_codebuild_1.LinuxBuildImage.STANDARD_6_0
                        },
                        buildSpec: aws_codebuild_1.BuildSpec.fromSourceFilename('build-specs/service-build-spec.yml')
                    })
                })
            ]
        });
        this.pipeline.addStage({
            stageName: 'Pipeline_Update',
            actions: [
                new aws_codepipeline_actions_1.CloudFormationCreateUpdateStackAction({
                    actionName: 'Pipeline_Update',
                    stackName: 'PipelineStack',
                    templatePath: this.cdkBuildOutput.atPath('PipelineStack.template.json'),
                    adminPermissions: true
                })
            ]
        });
    }
    addServiceStage(serviceStack, stageName) {
        this.pipeline.addStage({
            stageName: stageName,
            actions: [
                new aws_codepipeline_actions_1.CloudFormationCreateUpdateStackAction({
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
exports.PipelineStack = PipelineStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaXBlbGluZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMsNkNBQTBDO0FBQzFDLG1FQUFrRTtBQUVsRSxtRkFBa0k7QUFDbEksNkRBQXdGO0FBSXhGLE1BQWEsYUFBYyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBTTFDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLDJCQUFRLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUM3QyxZQUFZLEVBQUUsVUFBVTtZQUN4QixnQkFBZ0IsRUFBRSxLQUFLO1lBQ3ZCLHdCQUF3QixFQUFFLElBQUk7U0FDL0IsQ0FBQyxDQUFDO1FBRUgsTUFBTSxlQUFlLEdBQUcsSUFBSSwyQkFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDeEQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLDJCQUFRLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUVsRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQztZQUNyQixTQUFTLEVBQUUsUUFBUTtZQUNuQixPQUFPLEVBQUU7Z0JBQ1AsSUFBSSw2Q0FBa0IsQ0FBQztvQkFDckIsS0FBSyxFQUFFLFNBQVM7b0JBQ2hCLElBQUksRUFBRSxjQUFjO29CQUNwQixNQUFNLEVBQUUsTUFBTTtvQkFDZCxVQUFVLEVBQUUsaUJBQWlCO29CQUM3QixVQUFVLEVBQUUseUJBQVcsQ0FBQyxjQUFjLENBQUMsdUJBQXVCLENBQUM7b0JBQy9ELE1BQU0sRUFBRSxlQUFlO2lCQUN4QixDQUFDO2dCQUNGLElBQUksNkNBQWtCLENBQUM7b0JBQ3JCLEtBQUssRUFBRSxTQUFTO29CQUNoQixJQUFJLEVBQUUsZ0JBQWdCO29CQUN0QixNQUFNLEVBQUUsTUFBTTtvQkFDZCxVQUFVLEVBQUUsZ0JBQWdCO29CQUM1QixVQUFVLEVBQUUseUJBQVcsQ0FBQyxjQUFjLENBQUMsdUJBQXVCLENBQUM7b0JBQy9ELE1BQU0sRUFBRSxvQkFBb0I7aUJBQzdCLENBQUM7YUFDSDtTQUNGLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSwyQkFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDckQsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksMkJBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBRTdELElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1lBQ3JCLFNBQVMsRUFBRSxPQUFPO1lBQ2xCLE9BQU8sRUFBRSxDQUFDLElBQUksMENBQWUsQ0FBQztvQkFDNUIsVUFBVSxFQUFFLFdBQVc7b0JBQ3ZCLEtBQUssRUFBRSxlQUFlO29CQUN0QixPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDO29CQUM5QixPQUFPLEVBQUUsSUFBSSwrQkFBZSxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTt3QkFDcEQsV0FBVyxFQUFFOzRCQUNYLFVBQVUsRUFBRSwrQkFBZSxDQUFDLFlBQVk7eUJBQ3pDO3dCQUVELFNBQVMsRUFBRSx5QkFBUyxDQUFDLGtCQUFrQixDQUFDLGdDQUFnQyxDQUFDO3FCQUMxRSxDQUFDO2lCQUNILENBQUM7Z0JBRUYsSUFBSSwwQ0FBZSxDQUFDO29CQUNsQixVQUFVLEVBQUUsZUFBZTtvQkFDM0IsS0FBSyxFQUFFLG9CQUFvQjtvQkFDM0IsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDO29CQUNsQyxPQUFPLEVBQUUsSUFBSSwrQkFBZSxDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTt3QkFDeEQsV0FBVyxFQUFFOzRCQUNYLFVBQVUsRUFBRSwrQkFBZSxDQUFDLFlBQVk7eUJBQ3pDO3dCQUVELFNBQVMsRUFBRSx5QkFBUyxDQUFDLGtCQUFrQixDQUFDLG9DQUFvQyxDQUFDO3FCQUM5RSxDQUFDO2lCQUNILENBQUM7YUFDRDtTQUNGLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1lBQ3JCLFNBQVMsRUFBRSxpQkFBaUI7WUFDNUIsT0FBTyxFQUFFO2dCQUNQLElBQUksZ0VBQXFDLENBQUM7b0JBQ3hDLFVBQVUsRUFBRSxpQkFBaUI7b0JBQzdCLFNBQVMsRUFBRSxlQUFlO29CQUMxQixZQUFZLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsNkJBQTZCLENBQUM7b0JBQ3ZFLGdCQUFnQixFQUFFLElBQUk7aUJBQ3ZCLENBQUM7YUFDSDtTQUNGLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFTSxlQUFlLENBQUMsWUFBMEIsRUFBRSxTQUFpQjtRQUNsRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQztZQUNyQixTQUFTLEVBQUUsU0FBUztZQUNwQixPQUFPLEVBQUU7Z0JBQ1AsSUFBSSxnRUFBcUMsQ0FBQztvQkFDeEMsVUFBVSxFQUFFLGdCQUFnQjtvQkFDNUIsU0FBUyxFQUFFLFlBQVksQ0FBQyxTQUFTO29CQUNqQyxZQUFZLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMseUNBQXlDLENBQUM7b0JBQ25GLGdCQUFnQixFQUFFLElBQUk7b0JBQ3RCLGtCQUFrQixFQUFFO3dCQUNsQixHQUFHLFlBQVksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUM7cUJBQ3ZFO29CQUNELFdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztpQkFDdkMsQ0FBQzthQUNIO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBdkdELHNDQXVHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBTZWNyZXRWYWx1ZSB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IEFydGlmYWN0LCBQaXBlbGluZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2RlcGlwZWxpbmUnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBDbG91ZEZvcm1hdGlvbkNyZWF0ZVVwZGF0ZVN0YWNrQWN0aW9uLCBDb2RlQnVpbGRBY3Rpb24sIEdpdEh1YlNvdXJjZUFjdGlvbiB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2RlcGlwZWxpbmUtYWN0aW9ucyc7XG5pbXBvcnQgeyBQaXBlbGluZVByb2plY3QsIExpbnV4QnVpbGRJbWFnZSwgQnVpbGRTcGVjIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVidWlsZCc7XG5pbXBvcnQgeyBTZXJ2aWNlIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXNlcnZpY2VkaXNjb3ZlcnknO1xuaW1wb3J0IHsgU2VydmljZVN0YWNrIH0gZnJvbSAnLi9zZXJ2aWNlLXN0YWNrJztcblxuZXhwb3J0IGNsYXNzIFBpcGVsaW5lU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwcml2YXRlIHJlYWRvbmx5IHBpcGVsaW5lOiBQaXBlbGluZTtcbiAgcHJpdmF0ZSByZWFkb25seSBjZGtCdWlsZE91dHB1dDogQXJ0aWZhY3Q7XG4gIHByaXZhdGUgcmVhZG9ubHkgc2VydmljZUJ1aWxkT3V0cHV0OiBBcnRpZmFjdDtcblxuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIHRoaXMucGlwZWxpbmUgPSBuZXcgUGlwZWxpbmUodGhpcywgJ1BpcGVsaW5lJywge1xuICAgICAgcGlwZWxpbmVOYW1lOiAnUGlwZWxpbmUnLFxuICAgICAgY3Jvc3NBY2NvdW50S2V5czogZmFsc2UsXG4gICAgICByZXN0YXJ0RXhlY3V0aW9uT25VcGRhdGU6IHRydWVcbiAgICB9KTtcblxuICAgIGNvbnN0IGNka3NvdXJjZU91dHB1dCA9IG5ldyBBcnRpZmFjdCgnQ0RLU291cmNlT3V0cHV0Jyk7XG4gICAgY29uc3Qgc2VydmljZWtTb3VyY2VPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoJ1NlcnZpY2VrU291cmNlT3V0cHV0Jyk7XG5cbiAgICB0aGlzLnBpcGVsaW5lLmFkZFN0YWdlKHtcbiAgICAgIHN0YWdlTmFtZTogJ1NvdXJjZScsXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgIG5ldyBHaXRIdWJTb3VyY2VBY3Rpb24oe1xuICAgICAgICAgIG93bmVyOiAnRE55YWlrYScsXG4gICAgICAgICAgcmVwbzogJ2F3cy1waXBlbGluZScsXG4gICAgICAgICAgYnJhbmNoOiAnbWFpbicsXG4gICAgICAgICAgYWN0aW9uTmFtZTogJ3BpcGVsaW5lLXNvdXJjZScsXG4gICAgICAgICAgb2F1dGhUb2tlbjogU2VjcmV0VmFsdWUuc2VjcmV0c01hbmFnZXIoJ2dpdGh1Yi1waXBlbGluZS10b2tlbicpLFxuICAgICAgICAgIG91dHB1dDogY2Rrc291cmNlT3V0cHV0XG4gICAgICAgIH0pLFxuICAgICAgICBuZXcgR2l0SHViU291cmNlQWN0aW9uKHtcbiAgICAgICAgICBvd25lcjogJ0ROeWFpa2EnLFxuICAgICAgICAgIHJlcG86ICdleHByZXNzLWxhbWJkYScsXG4gICAgICAgICAgYnJhbmNoOiAnbWFpbicsXG4gICAgICAgICAgYWN0aW9uTmFtZTogJ3NlcnZpY2Utc291cmNlJyxcbiAgICAgICAgICBvYXV0aFRva2VuOiBTZWNyZXRWYWx1ZS5zZWNyZXRzTWFuYWdlcignZ2l0aHViLXBpcGVsaW5lLXRva2VuJyksXG4gICAgICAgICAgb3V0cHV0OiBzZXJ2aWNla1NvdXJjZU91dHB1dCxcbiAgICAgICAgfSlcbiAgICAgIF1cbiAgICB9KTtcblxuICAgIHRoaXMuY2RrQnVpbGRPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoJ0NES0J1aWxkT3V0cHV0Jyk7XG4gICAgdGhpcy5zZXJ2aWNlQnVpbGRPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoJ1NlcnZpY2VCdWlsZE91dHB1dCcpO1xuXG4gICAgdGhpcy5waXBlbGluZS5hZGRTdGFnZSh7XG4gICAgICBzdGFnZU5hbWU6ICdCdWlsZCcsXG4gICAgICBhY3Rpb25zOiBbbmV3IENvZGVCdWlsZEFjdGlvbih7XG4gICAgICAgIGFjdGlvbk5hbWU6ICdDREtfQnVpbGQnLFxuICAgICAgICBpbnB1dDogY2Rrc291cmNlT3V0cHV0LFxuICAgICAgICBvdXRwdXRzOiBbdGhpcy5jZGtCdWlsZE91dHB1dF0sXG4gICAgICAgIHByb2plY3Q6IG5ldyBQaXBlbGluZVByb2plY3QodGhpcywgJ0NES0J1aWxkUHJvamVjdCcsIHtcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgYnVpbGRJbWFnZTogTGludXhCdWlsZEltYWdlLlNUQU5EQVJEXzZfMFxuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBidWlsZFNwZWM6IEJ1aWxkU3BlYy5mcm9tU291cmNlRmlsZW5hbWUoJ2J1aWxkLXNwZWNzL2Nkay1idWlsZC1zcGVjLnltbCcpXG4gICAgICAgIH0pXG4gICAgICB9KSxcblxuICAgICAgbmV3IENvZGVCdWlsZEFjdGlvbih7XG4gICAgICAgIGFjdGlvbk5hbWU6ICdTZXJ2aWNlX0J1aWxkJyxcbiAgICAgICAgaW5wdXQ6IHNlcnZpY2VrU291cmNlT3V0cHV0LFxuICAgICAgICBvdXRwdXRzOiBbdGhpcy5zZXJ2aWNlQnVpbGRPdXRwdXRdLFxuICAgICAgICBwcm9qZWN0OiBuZXcgUGlwZWxpbmVQcm9qZWN0KHRoaXMsICdTZXJ2aWNlQnVpbGRQcm9qZWN0Jywge1xuICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICBidWlsZEltYWdlOiBMaW51eEJ1aWxkSW1hZ2UuU1RBTkRBUkRfNl8wXG4gICAgICAgICAgfSxcblxuICAgICAgICAgIGJ1aWxkU3BlYzogQnVpbGRTcGVjLmZyb21Tb3VyY2VGaWxlbmFtZSgnYnVpbGQtc3BlY3Mvc2VydmljZS1idWlsZC1zcGVjLnltbCcpXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgICAgXVxuICAgIH0pO1xuXG4gICAgdGhpcy5waXBlbGluZS5hZGRTdGFnZSh7XG4gICAgICBzdGFnZU5hbWU6ICdQaXBlbGluZV9VcGRhdGUnLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICBuZXcgQ2xvdWRGb3JtYXRpb25DcmVhdGVVcGRhdGVTdGFja0FjdGlvbih7XG4gICAgICAgICAgYWN0aW9uTmFtZTogJ1BpcGVsaW5lX1VwZGF0ZScsXG4gICAgICAgICAgc3RhY2tOYW1lOiAnUGlwZWxpbmVTdGFjaycsXG4gICAgICAgICAgdGVtcGxhdGVQYXRoOiB0aGlzLmNka0J1aWxkT3V0cHV0LmF0UGF0aCgnUGlwZWxpbmVTdGFjay50ZW1wbGF0ZS5qc29uJyksXG4gICAgICAgICAgYWRtaW5QZXJtaXNzaW9uczogdHJ1ZVxuICAgICAgICB9KVxuICAgICAgXVxuICAgIH0pXG4gIH1cblxuICBwdWJsaWMgYWRkU2VydmljZVN0YWdlKHNlcnZpY2VTdGFjazogU2VydmljZVN0YWNrLCBzdGFnZU5hbWU6IHN0cmluZykge1xuICAgIHRoaXMucGlwZWxpbmUuYWRkU3RhZ2Uoe1xuICAgICAgc3RhZ2VOYW1lOiBzdGFnZU5hbWUsXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgIG5ldyBDbG91ZEZvcm1hdGlvbkNyZWF0ZVVwZGF0ZVN0YWNrQWN0aW9uKHtcbiAgICAgICAgICBhY3Rpb25OYW1lOiAnU2VydmljZV9VcGRhdGUnLFxuICAgICAgICAgIHN0YWNrTmFtZTogc2VydmljZVN0YWNrLnN0YWNrTmFtZSxcbiAgICAgICAgICB0ZW1wbGF0ZVBhdGg6IHRoaXMuY2RrQnVpbGRPdXRwdXQuYXRQYXRoKCcke3NlcnZpY2VTdGFjay5zdGFja05hbWV9LnRlbXBsYXRlLmpzb24nKSxcbiAgICAgICAgICBhZG1pblBlcm1pc3Npb25zOiB0cnVlLFxuICAgICAgICAgIHBhcmFtZXRlck92ZXJyaWRlczoge1xuICAgICAgICAgICAgLi4uc2VydmljZVN0YWNrLnNlcnZpY2VDb2RlLmFzc2lnbih0aGlzLnNlcnZpY2VCdWlsZE91dHB1dC5zM0xvY2F0aW9uKVxuICAgICAgICAgIH0sXG4gICAgICAgICAgZXh0cmFJbnB1dHM6IFt0aGlzLnNlcnZpY2VCdWlsZE91dHB1dF1cbiAgICAgICAgfSlcbiAgICAgIF1cbiAgICB9KTtcbiAgfVxufVxuIl19