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
        this.serviceSourceOutput = new aws_codepipeline_1.Artifact('ServicekSourceOutput');
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
                    output: this.serviceSourceOutput,
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
                    input: this.serviceSourceOutput,
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
        return this.pipeline.addStage({
            stageName: stageName,
            actions: [
                new aws_codepipeline_actions_1.CloudFormationCreateUpdateStackAction({
                    actionName: "Service_Update",
                    stackName: serviceStack.stackName,
                    templatePath: this.cdkBuildOutput.atPath(`${serviceStack.stackName}.template.json`),
                    adminPermissions: true,
                    parameterOverrides: {
                        ...serviceStack.serviceCode.assign(this.serviceBuildOutput.s3Location),
                    },
                    extraInputs: [this.serviceBuildOutput],
                }),
            ],
        });
    }
    addBillingStage(billingStack, stage) {
        stage.addAction(new aws_codepipeline_actions_1.CloudFormationCreateUpdateStackAction({
            actionName: 'Billing_Update',
            stackName: billingStack.stackName,
            templatePath: this.cdkBuildOutput.atPath(`${billingStack.stackName}.template.json`),
            adminPermissions: true,
        }));
    }
    addServiceIntegrationTestToStage(stage, serviceEndPoint) {
        stage.addAction(new aws_codepipeline_actions_1.CodeBuildAction({
            actionName: 'Integration_Test',
            input: this.serviceSourceOutput,
            project: new aws_codebuild_1.PipelineProject(this, 'ServiceIntegrationTestsProject', {
                environment: {
                    buildImage: aws_codebuild_1.LinuxBuildImage.STANDARD_6_0
                },
                buildSpec: aws_codebuild_1.BuildSpec.fromSourceFilename('build-specs/integ-test-build-spec.yml'),
            }),
            environmentVariables: {
                SERVICE_ENDPOINT: {
                    value: serviceEndPoint,
                    type: aws_codebuild_1.BuildEnvironmentVariableType.PLAINTEXT,
                },
            },
            type: aws_codepipeline_actions_1.CodeBuildActionType.TEST,
            runOrder: 2,
        }));
    }
}
exports.PipelineStack = PipelineStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaXBlbGluZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMsNkNBQTBDO0FBQzFDLG1FQUEwRTtBQUUxRSxtRkFBdUo7QUFDdkosNkRBQXNIO0FBSXRILE1BQWEsYUFBYyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBTTFDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLDJCQUFRLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUM3QyxZQUFZLEVBQUUsVUFBVTtZQUN4QixnQkFBZ0IsRUFBRSxLQUFLO1lBQ3ZCLHdCQUF3QixFQUFFLElBQUk7U0FDL0IsQ0FBQyxDQUFDO1FBRUgsTUFBTSxlQUFlLEdBQUcsSUFBSSwyQkFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksMkJBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBRWhFLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1lBQ3JCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLE9BQU8sRUFBRTtnQkFDUCxJQUFJLDZDQUFrQixDQUFDO29CQUNyQixLQUFLLEVBQUUsU0FBUztvQkFDaEIsSUFBSSxFQUFFLGNBQWM7b0JBQ3BCLE1BQU0sRUFBRSxNQUFNO29CQUNkLFVBQVUsRUFBRSxpQkFBaUI7b0JBQzdCLFVBQVUsRUFBRSx5QkFBVyxDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQztvQkFDL0QsTUFBTSxFQUFFLGVBQWU7aUJBQ3hCLENBQUM7Z0JBQ0YsSUFBSSw2Q0FBa0IsQ0FBQztvQkFDckIsS0FBSyxFQUFFLFNBQVM7b0JBQ2hCLElBQUksRUFBRSxnQkFBZ0I7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LFVBQVUsRUFBRSxnQkFBZ0I7WUFDNUIsU0FBUyxFQUFFLFlBQVksQ0FBQyxTQUFTO1lBQ2pDLFlBQVksRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxHQUFHLFlBQVksQ0FBQyxTQUFTLGdCQUFnQixDQUFDO1lBQ25GLGdCQUFnQixFQUFFLElBQUk7U0FDdkIsQ0FBQyxDQUNILENBQUM7SUFDSixDQUFDO0lBRU0sZ0NBQWdDLENBQUMsS0FBYSxFQUFFLGVBQXVCO1FBQzVFLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSwwQ0FBZSxDQUFDO1lBQ2xDLFVBQVUsRUFBRSxrQkFBa0I7WUFDOUIsS0FBSyxFQUFFLElBQUksQ0FBQyxtQkFBbUI7WUFDL0IsT0FBTyxFQUFFLElBQUksK0JBQWUsQ0FBQyxJQUFJLEVBQUUsZ0NBQWdDLEVBQUU7Z0JBQ25FLFdBQVcsRUFBRTtvQkFDWCxVQUFVLEVBQUUsK0JBQWUsQ0FBQyxZQUFZO2lCQUN6QztnQkFDRCxTQUFTLEVBQUUseUJBQVMsQ0FBQyxrQkFBa0IsQ0FBQyx1Q0FBdUMsQ0FBQzthQUNqRixDQUFDO1lBQ0Ysb0JBQW9CLEVBQUU7Z0JBQ3BCLGdCQUFnQixFQUFFO29CQUNoQixLQUFLLEVBQUUsZUFBZTtvQkFDdEIsSUFBSSxFQUFFLDRDQUE0QixDQUFDLFNBQVM7aUJBQzdDO2FBQ0Y7WUFDRCxJQUFJLEVBQUUsOENBQW1CLENBQUMsSUFBSTtZQUM5QixRQUFRLEVBQUUsQ0FBQztTQUNaLENBQUMsQ0FBQyxDQUFDO0lBQ04sQ0FBQztDQUNGO0FBM0lELHNDQTJJQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBTZWNyZXRWYWx1ZSB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IEFydGlmYWN0LCBJU3RhZ2UsIFBpcGVsaW5lIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVwaXBlbGluZSc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IENsb3VkRm9ybWF0aW9uQ3JlYXRlVXBkYXRlU3RhY2tBY3Rpb24sIENvZGVCdWlsZEFjdGlvbiwgQ29kZUJ1aWxkQWN0aW9uVHlwZSwgR2l0SHViU291cmNlQWN0aW9uIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zJztcbmltcG9ydCB7IFBpcGVsaW5lUHJvamVjdCwgTGludXhCdWlsZEltYWdlLCBCdWlsZFNwZWMsIEJ1aWxkRW52aXJvbm1lbnRWYXJpYWJsZVR5cGUgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29kZWJ1aWxkJztcbmltcG9ydCB7IFNlcnZpY2VTdGFjayB9IGZyb20gJy4vc2VydmljZS1zdGFjayc7XG5pbXBvcnQgeyBCaWxsaW5nU3RhY2sgfSBmcm9tICcuL2JpbGxpbmctc3RhY2snO1xuXG5leHBvcnQgY2xhc3MgUGlwZWxpbmVTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHByaXZhdGUgcmVhZG9ubHkgcGlwZWxpbmU6IFBpcGVsaW5lO1xuICBwcml2YXRlIHJlYWRvbmx5IGNka0J1aWxkT3V0cHV0OiBBcnRpZmFjdDtcbiAgcHJpdmF0ZSByZWFkb25seSBzZXJ2aWNlQnVpbGRPdXRwdXQ6IEFydGlmYWN0O1xuICBwcml2YXRlIHJlYWRvbmx5IHNlcnZpY2VTb3VyY2VPdXRwdXQ6IEFydGlmYWN0O1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIHRoaXMucGlwZWxpbmUgPSBuZXcgUGlwZWxpbmUodGhpcywgJ1BpcGVsaW5lJywge1xuICAgICAgcGlwZWxpbmVOYW1lOiAnUGlwZWxpbmUnLFxuICAgICAgY3Jvc3NBY2NvdW50S2V5czogZmFsc2UsXG4gICAgICByZXN0YXJ0RXhlY3V0aW9uT25VcGRhdGU6IHRydWVcbiAgICB9KTtcblxuICAgIGNvbnN0IGNka3NvdXJjZU91dHB1dCA9IG5ldyBBcnRpZmFjdCgnQ0RLU291cmNlT3V0cHV0Jyk7XG4gICAgdGhpcy5zZXJ2aWNlU291cmNlT3V0cHV0ID0gbmV3IEFydGlmYWN0KCdTZXJ2aWNla1NvdXJjZU91dHB1dCcpO1xuXG4gICAgdGhpcy5waXBlbGluZS5hZGRTdGFnZSh7XG4gICAgICBzdGFnZU5hbWU6ICdTb3VyY2UnLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICBuZXcgR2l0SHViU291cmNlQWN0aW9uKHtcbiAgICAgICAgICBvd25lcjogJ0ROeWFpa2EnLFxuICAgICAgICAgIHJlcG86ICdhd3MtcGlwZWxpbmUnLFxuICAgICAgICAgIGJyYW5jaDogJ21haW4nLFxuICAgICAgICAgIGFjdGlvbk5hbWU6ICdwaXBlbGluZS1zb3VyY2UnLFxuICAgICAgICAgIG9hdXRoVG9rZW46IFNlY3JldFZhbHVlLnNlY3JldHNNYW5hZ2VyKCdnaXRodWItcGlwZWxpbmUtdG9rZW4nKSxcbiAgICAgICAgICBvdXRwdXQ6IGNka3NvdXJjZU91dHB1dFxuICAgICAgICB9KSxcbiAgICAgICAgbmV3IEdpdEh1YlNvdXJjZUFjdGlvbih7XG4gICAgICAgICAgb3duZXI6ICdETnlhaWthJyxcbiAgICAgICAgICByZXBvOiAnZXhwcmVzcy1sYW1iZGEnLFxuICAgICAgICAgIGJyYW5jaDogJ21haW4nLFxuICAgICAgICAgIGFjdGlvbk5hbWU6ICdzZXJ2aWNlLXNvdXJjZScsXG4gICAgICAgICAgb2F1dGhUb2tlbjogU2VjcmV0VmFsdWUuc2VjcmV0c01hbmFnZXIoJ2dpdGh1Yi1waXBlbGluZS10b2tlbicpLFxuICAgICAgICAgIG91dHB1dDogdGhpcy5zZXJ2aWNlU291cmNlT3V0cHV0LFxuICAgICAgICB9KVxuICAgICAgXVxuICAgIH0pO1xuXG4gICAgdGhpcy5jZGtCdWlsZE91dHB1dCA9IG5ldyBBcnRpZmFjdCgnQ0RLQnVpbGRPdXRwdXQnKTtcbiAgICB0aGlzLnNlcnZpY2VCdWlsZE91dHB1dCA9IG5ldyBBcnRpZmFjdCgnU2VydmljZUJ1aWxkT3V0cHV0Jyk7XG5cbiAgICB0aGlzLnBpcGVsaW5lLmFkZFN0YWdlKHtcbiAgICAgIHN0YWdlTmFtZTogJ0J1aWxkJyxcbiAgICAgIGFjdGlvbnM6IFtuZXcgQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgICAgYWN0aW9uTmFtZTogJ0NES19CdWlsZCcsXG4gICAgICAgIGlucHV0OiBjZGtzb3VyY2VPdXRwdXQsXG4gICAgICAgIG91dHB1dHM6IFt0aGlzLmNka0J1aWxkT3V0cHV0XSxcbiAgICAgICAgcHJvamVjdDogbmV3IFBpcGVsaW5lUHJvamVjdCh0aGlzLCAnQ0RLQnVpbGRQcm9qZWN0Jywge1xuICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICBidWlsZEltYWdlOiBMaW51eEJ1aWxkSW1hZ2UuU1RBTkRBUkRfNl8wXG4gICAgICAgICAgfSxcbiAgICAgICAgICBidWlsZFNwZWM6IEJ1aWxkU3BlYy5mcm9tU291cmNlRmlsZW5hbWUoJ2J1aWxkLXNwZWNzL2Nkay1idWlsZC1zcGVjLnltbCcpXG4gICAgICAgIH0pXG4gICAgICB9KSxcbiAgICAgIG5ldyBDb2RlQnVpbGRBY3Rpb24oe1xuICAgICAgICBhY3Rpb25OYW1lOiAnU2VydmljZV9CdWlsZCcsXG4gICAgICAgIGlucHV0OiB0aGlzLnNlcnZpY2VTb3VyY2VPdXRwdXQsXG4gICAgICAgIG91dHB1dHM6IFt0aGlzLnNlcnZpY2VCdWlsZE91dHB1dF0sXG4gICAgICAgIHByb2plY3Q6IG5ldyBQaXBlbGluZVByb2plY3QodGhpcywgJ1NlcnZpY2VCdWlsZFByb2plY3QnLCB7XG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICAgIGJ1aWxkSW1hZ2U6IExpbnV4QnVpbGRJbWFnZS5TVEFOREFSRF82XzBcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJ1aWxkU3BlYzogQnVpbGRTcGVjLmZyb21Tb3VyY2VGaWxlbmFtZSgnYnVpbGQtc3BlY3Mvc2VydmljZS1idWlsZC1zcGVjLnltbCcpXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgICAgXVxuICAgIH0pO1xuXG4gICAgdGhpcy5waXBlbGluZS5hZGRTdGFnZSh7XG4gICAgICBzdGFnZU5hbWU6ICdQaXBlbGluZV9VcGRhdGUnLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICBuZXcgQ2xvdWRGb3JtYXRpb25DcmVhdGVVcGRhdGVTdGFja0FjdGlvbih7XG4gICAgICAgICAgYWN0aW9uTmFtZTogJ1BpcGVsaW5lX1VwZGF0ZScsXG4gICAgICAgICAgc3RhY2tOYW1lOiAnUGlwZWxpbmVTdGFjaycsXG4gICAgICAgICAgdGVtcGxhdGVQYXRoOiB0aGlzLmNka0J1aWxkT3V0cHV0LmF0UGF0aCgnUGlwZWxpbmVTdGFjay50ZW1wbGF0ZS5qc29uJyksXG4gICAgICAgICAgYWRtaW5QZXJtaXNzaW9uczogdHJ1ZVxuICAgICAgICB9KVxuICAgICAgXVxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGFkZFNlcnZpY2VTdGFnZShcbiAgICBzZXJ2aWNlU3RhY2s6IFNlcnZpY2VTdGFjayxcbiAgICBzdGFnZU5hbWU6IHN0cmluZ1xuICApOiBJU3RhZ2Uge1xuICAgIHJldHVybiB0aGlzLnBpcGVsaW5lLmFkZFN0YWdlKHtcbiAgICAgIHN0YWdlTmFtZTogc3RhZ2VOYW1lLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICBuZXcgQ2xvdWRGb3JtYXRpb25DcmVhdGVVcGRhdGVTdGFja0FjdGlvbih7XG4gICAgICAgICAgYWN0aW9uTmFtZTogXCJTZXJ2aWNlX1VwZGF0ZVwiLFxuICAgICAgICAgIHN0YWNrTmFtZTogc2VydmljZVN0YWNrLnN0YWNrTmFtZSxcbiAgICAgICAgICB0ZW1wbGF0ZVBhdGg6IHRoaXMuY2RrQnVpbGRPdXRwdXQuYXRQYXRoKFxuICAgICAgICAgICAgYCR7c2VydmljZVN0YWNrLnN0YWNrTmFtZX0udGVtcGxhdGUuanNvbmBcbiAgICAgICAgICApLFxuICAgICAgICAgIGFkbWluUGVybWlzc2lvbnM6IHRydWUsXG4gICAgICAgICAgcGFyYW1ldGVyT3ZlcnJpZGVzOiB7XG4gICAgICAgICAgICAuLi5zZXJ2aWNlU3RhY2suc2VydmljZUNvZGUuYXNzaWduKFxuICAgICAgICAgICAgICB0aGlzLnNlcnZpY2VCdWlsZE91dHB1dC5zM0xvY2F0aW9uXG4gICAgICAgICAgICApLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgZXh0cmFJbnB1dHM6IFt0aGlzLnNlcnZpY2VCdWlsZE91dHB1dF0sXG4gICAgICAgIH0pLFxuICAgICAgXSxcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBhZGRCaWxsaW5nU3RhZ2UoYmlsbGluZ1N0YWNrOiBCaWxsaW5nU3RhY2ssIHN0YWdlOiBJU3RhZ2UpIHtcbiAgICBzdGFnZS5hZGRBY3Rpb24oXG4gICAgICBuZXcgQ2xvdWRGb3JtYXRpb25DcmVhdGVVcGRhdGVTdGFja0FjdGlvbih7XG4gICAgICAgIGFjdGlvbk5hbWU6ICdCaWxsaW5nX1VwZGF0ZScsXG4gICAgICAgIHN0YWNrTmFtZTogYmlsbGluZ1N0YWNrLnN0YWNrTmFtZSxcbiAgICAgICAgdGVtcGxhdGVQYXRoOiB0aGlzLmNka0J1aWxkT3V0cHV0LmF0UGF0aChgJHtiaWxsaW5nU3RhY2suc3RhY2tOYW1lfS50ZW1wbGF0ZS5qc29uYCksXG4gICAgICAgIGFkbWluUGVybWlzc2lvbnM6IHRydWUsXG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBwdWJsaWMgYWRkU2VydmljZUludGVncmF0aW9uVGVzdFRvU3RhZ2Uoc3RhZ2U6IElTdGFnZSwgc2VydmljZUVuZFBvaW50OiBzdHJpbmcpIHtcbiAgICBzdGFnZS5hZGRBY3Rpb24obmV3IENvZGVCdWlsZEFjdGlvbih7XG4gICAgICBhY3Rpb25OYW1lOiAnSW50ZWdyYXRpb25fVGVzdCcsXG4gICAgICBpbnB1dDogdGhpcy5zZXJ2aWNlU291cmNlT3V0cHV0LFxuICAgICAgcHJvamVjdDogbmV3IFBpcGVsaW5lUHJvamVjdCh0aGlzLCAnU2VydmljZUludGVncmF0aW9uVGVzdHNQcm9qZWN0Jywge1xuICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgIGJ1aWxkSW1hZ2U6IExpbnV4QnVpbGRJbWFnZS5TVEFOREFSRF82XzBcbiAgICAgICAgfSxcbiAgICAgICAgYnVpbGRTcGVjOiBCdWlsZFNwZWMuZnJvbVNvdXJjZUZpbGVuYW1lKCdidWlsZC1zcGVjcy9pbnRlZy10ZXN0LWJ1aWxkLXNwZWMueW1sJyksXG4gICAgICB9KSxcbiAgICAgIGVudmlyb25tZW50VmFyaWFibGVzOiB7XG4gICAgICAgIFNFUlZJQ0VfRU5EUE9JTlQ6IHtcbiAgICAgICAgICB2YWx1ZTogc2VydmljZUVuZFBvaW50LFxuICAgICAgICAgIHR5cGU6IEJ1aWxkRW52aXJvbm1lbnRWYXJpYWJsZVR5cGUuUExBSU5URVhULFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHR5cGU6IENvZGVCdWlsZEFjdGlvblR5cGUuVEVTVCxcbiAgICAgIHJ1bk9yZGVyOiAyLFxuICAgIH0pKTtcbiAgfVxufSJdfQ==