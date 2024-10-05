"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineStack = void 0;
const cdk = require("aws-cdk-lib");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_codepipeline_1 = require("aws-cdk-lib/aws-codepipeline");
const aws_codepipeline_actions_1 = require("aws-cdk-lib/aws-codepipeline-actions");
const aws_codebuild_1 = require("aws-cdk-lib/aws-codebuild");
const aws_events_targets_1 = require("aws-cdk-lib/aws-events-targets");
const aws_sns_1 = require("aws-cdk-lib/aws-sns");
const aws_events_1 = require("aws-cdk-lib/aws-events");
const aws_sns_subscriptions_1 = require("aws-cdk-lib/aws-sns-subscriptions");
class PipelineStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this.pipelineNotificationTopic = new aws_sns_1.Topic(this, 'PipelineNotificationTopic', {
            topicName: 'PipelineNotifications',
        });
        this.pipelineNotificationTopic.addSubscription(new aws_sns_subscriptions_1.EmailSubscription('davidnyaika2@gmail.com'));
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
        const integTestAction = new aws_codepipeline_actions_1.CodeBuildAction({
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
        });
        stage.addAction(integTestAction);
        integTestAction.onStateChange("integrationTestFailed", new aws_events_targets_1.SnsTopic(this.pipelineNotificationTopic, {
            message: aws_events_1.RuleTargetInput.fromText(`Integration Test Failed for ${aws_events_1.EventField.fromPath('$.detail.execution-result.external-execution-url')}`),
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
exports.PipelineStack = PipelineStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaXBlbGluZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMsNkNBQTBDO0FBQzFDLG1FQUEwRTtBQUUxRSxtRkFBdUo7QUFDdkosNkRBQXNIO0FBR3RILHVFQUEwRDtBQUMxRCxpREFBNEM7QUFDNUMsdURBQXFFO0FBQ3JFLDZFQUFzRTtBQUV0RSxNQUFhLGFBQWMsU0FBUSxHQUFHLENBQUMsS0FBSztJQU8xQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hCLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLGVBQUssQ0FBQyxJQUFJLEVBQUUsMkJBQTJCLEVBQUU7WUFDNUUsU0FBUyxFQUFFLHVCQUF1QjtTQUNuQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMseUJBQXlCLENBQUMsZUFBZSxDQUM1QyxJQUFJLHlDQUFpQixDQUFDLHdCQUF3QixDQUFDLENBQ2hELENBQUE7UUFFRCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksMkJBQVEsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQzdDLFlBQVksRUFBRSxVQUFVO1lBQ3hCLGdCQUFnQixFQUFFLEtBQUs7WUFDdkIsd0JBQXdCLEVBQUUsSUFBSTtTQUMvQixDQUFDLENBQUM7UUFFSCxNQUFNLGVBQWUsR0FBRyxJQUFJLDJCQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUN4RCxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSwyQkFBUSxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFFaEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7WUFDckIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsT0FBTyxFQUFFO2dCQUNQLElBQUksNkNBQWtCLENBQUM7b0JBQ3JCLEtB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QUFTLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDakMsZUFBZSxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLDZCQUFRLENBQUMsSUFBSSxDQUFDLHlCQUF5QixFQUFFO1lBQ2xHLE9BQU8sRUFBRSw0QkFBZSxDQUFDLFFBQVEsQ0FDL0IsK0JBQStCLHVCQUFVLENBQUMsUUFBUSxDQUFDLGtEQUFrRCxDQUFDLEVBQUUsQ0FDekc7U0FDRixDQUFDLEVBQUU7WUFDRixRQUFRLEVBQUUsdUJBQXVCO1lBQ2pDLFlBQVksRUFBRTtnQkFDWixNQUFNLEVBQUU7b0JBQ04sS0FBSyxFQUFFLENBQUMsUUFBUSxDQUFDO2lCQUNsQjthQUNGO1lBQ0QsV0FBVyxFQUFFLHlCQUF5QjtTQUN2QyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFqS0Qsc0NBaUtDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFNlY3JldFZhbHVlIH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQXJ0aWZhY3QsIElTdGFnZSwgUGlwZWxpbmUgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29kZXBpcGVsaW5lJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgQ2xvdWRGb3JtYXRpb25DcmVhdGVVcGRhdGVTdGFja0FjdGlvbiwgQ29kZUJ1aWxkQWN0aW9uLCBDb2RlQnVpbGRBY3Rpb25UeXBlLCBHaXRIdWJTb3VyY2VBY3Rpb24gfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29kZXBpcGVsaW5lLWFjdGlvbnMnO1xuaW1wb3J0IHsgUGlwZWxpbmVQcm9qZWN0LCBMaW51eEJ1aWxkSW1hZ2UsIEJ1aWxkU3BlYywgQnVpbGRFbnZpcm9ubWVudFZhcmlhYmxlVHlwZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2RlYnVpbGQnO1xuaW1wb3J0IHsgU2VydmljZVN0YWNrIH0gZnJvbSAnLi9zZXJ2aWNlLXN0YWNrJztcbmltcG9ydCB7IEJpbGxpbmdTdGFjayB9IGZyb20gJy4vYmlsbGluZy1zdGFjayc7XG5pbXBvcnQgeyBTbnNUb3BpYyB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMtdGFyZ2V0cyc7XG5pbXBvcnQgeyBUb3BpYyB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMnO1xuaW1wb3J0IHsgUnVsZVRhcmdldElucHV0LCBFdmVudEZpZWxkIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cyc7XG5pbXBvcnQgeyBFbWFpbFN1YnNjcmlwdGlvbiB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMtc3Vic2NyaXB0aW9ucyc7XG5cbmV4cG9ydCBjbGFzcyBQaXBlbGluZVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHJpdmF0ZSByZWFkb25seSBwaXBlbGluZTogUGlwZWxpbmU7XG4gIHByaXZhdGUgcmVhZG9ubHkgY2RrQnVpbGRPdXRwdXQ6IEFydGlmYWN0O1xuICBwcml2YXRlIHJlYWRvbmx5IHNlcnZpY2VCdWlsZE91dHB1dDogQXJ0aWZhY3Q7XG4gIHByaXZhdGUgcmVhZG9ubHkgc2VydmljZVNvdXJjZU91dHB1dDogQXJ0aWZhY3Q7XG4gIHByaXZhdGUgcmVhZG9ubHkgcGlwZWxpbmVOb3RpZmljYXRpb25Ub3BpYzogVG9waWM7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuICAgIHRoaXMucGlwZWxpbmVOb3RpZmljYXRpb25Ub3BpYyA9IG5ldyBUb3BpYyh0aGlzLCAnUGlwZWxpbmVOb3RpZmljYXRpb25Ub3BpYycsIHtcbiAgICAgIHRvcGljTmFtZTogJ1BpcGVsaW5lTm90aWZpY2F0aW9ucycsXG4gICAgfSk7XG5cbiAgICB0aGlzLnBpcGVsaW5lTm90aWZpY2F0aW9uVG9waWMuYWRkU3Vic2NyaXB0aW9uKFxuICAgICAgbmV3IEVtYWlsU3Vic2NyaXB0aW9uKCdkYXZpZG55YWlrYTJAZ21haWwuY29tJylcbiAgICApXG5cbiAgICB0aGlzLnBpcGVsaW5lID0gbmV3IFBpcGVsaW5lKHRoaXMsICdQaXBlbGluZScsIHtcbiAgICAgIHBpcGVsaW5lTmFtZTogJ1BpcGVsaW5lJyxcbiAgICAgIGNyb3NzQWNjb3VudEtleXM6IGZhbHNlLFxuICAgICAgcmVzdGFydEV4ZWN1dGlvbk9uVXBkYXRlOiB0cnVlXG4gICAgfSk7XG5cbiAgICBjb25zdCBjZGtzb3VyY2VPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoJ0NES1NvdXJjZU91dHB1dCcpO1xuICAgIHRoaXMuc2VydmljZVNvdXJjZU91dHB1dCA9IG5ldyBBcnRpZmFjdCgnU2VydmljZWtTb3VyY2VPdXRwdXQnKTtcblxuICAgIHRoaXMucGlwZWxpbmUuYWRkU3RhZ2Uoe1xuICAgICAgc3RhZ2VOYW1lOiAnU291cmNlJyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgbmV3IEdpdEh1YlNvdXJjZUFjdGlvbih7XG4gICAgICAgICAgb3duZXI6ICdETnlhaWthJyxcbiAgICAgICAgICByZXBvOiAnYXdzLXBpcGVsaW5lJyxcbiAgICAgICAgICBicmFuY2g6ICdtYWluJyxcbiAgICAgICAgICBhY3Rpb25OYW1lOiAncGlwZWxpbmUtc291cmNlJyxcbiAgICAgICAgICBvYXV0aFRva2VuOiBTZWNyZXRWYWx1ZS5zZWNyZXRzTWFuYWdlcignZ2l0aHViLXBpcGVsaW5lLXRva2VuJyksXG4gICAgICAgICAgb3V0cHV0OiBjZGtzb3VyY2VPdXRwdXRcbiAgICAgICAgfSksXG4gICAgICAgIG5ldyBHaXRIdWJTb3VyY2VBY3Rpb24oe1xuICAgICAgICAgIG93bmVyOiAnRE55YWlrYScsXG4gICAgICAgICAgcmVwbzogJ2V4cHJlc3MtbGFtYmRhJyxcbiAgICAgICAgICBicmFuY2g6ICdtYWluJyxcbiAgICAgICAgICBhY3Rpb25OYW1lOiAnc2VydmljZS1zb3VyY2UnLFxuICAgICAgICAgIG9hdXRoVG9rZW46IFNlY3JldFZhbHVlLnNlY3JldHNNYW5hZ2VyKCdnaXRodWItcGlwZWxpbmUtdG9rZW4nKSxcbiAgICAgICAgICBvdXRwdXQ6IHRoaXMuc2VydmljZVNvdXJjZU91dHB1dCxcbiAgICAgICAgfSlcbiAgICAgIF1cbiAgICB9KTtcblxuICAgIHRoaXMuY2RrQnVpbGRPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoJ0NES0J1aWxkT3V0cHV0Jyk7XG4gICAgdGhpcy5zZXJ2aWNlQnVpbGRPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoJ1NlcnZpY2VCdWlsZE91dHB1dCcpO1xuXG4gICAgdGhpcy5waXBlbGluZS5hZGRTdGFnZSh7XG4gICAgICBzdGFnZU5hbWU6ICdCdWlsZCcsXG4gICAgICBhY3Rpb25zOiBbbmV3IENvZGVCdWlsZEFjdGlvbih7XG4gICAgICAgIGFjdGlvbk5hbWU6ICdDREtfQnVpbGQnLFxuICAgICAgICBpbnB1dDogY2Rrc291cmNlT3V0cHV0LFxuICAgICAgICBvdXRwdXRzOiBbdGhpcy5jZGtCdWlsZE91dHB1dF0sXG4gICAgICAgIHByb2plY3Q6IG5ldyBQaXBlbGluZVByb2plY3QodGhpcywgJ0NES0J1aWxkUHJvamVjdCcsIHtcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgYnVpbGRJbWFnZTogTGludXhCdWlsZEltYWdlLlNUQU5EQVJEXzZfMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYnVpbGRTcGVjOiBCdWlsZFNwZWMuZnJvbVNvdXJjZUZpbGVuYW1lKCdidWlsZC1zcGVjcy9jZGstYnVpbGQtc3BlYy55bWwnKVxuICAgICAgICB9KVxuICAgICAgfSksXG4gICAgICBuZXcgQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgICAgYWN0aW9uTmFtZTogJ1NlcnZpY2VfQnVpbGQnLFxuICAgICAgICBpbnB1dDogdGhpcy5zZXJ2aWNlU291cmNlT3V0cHV0LFxuICAgICAgICBvdXRwdXRzOiBbdGhpcy5zZXJ2aWNlQnVpbGRPdXRwdXRdLFxuICAgICAgICBwcm9qZWN0OiBuZXcgUGlwZWxpbmVQcm9qZWN0KHRoaXMsICdTZXJ2aWNlQnVpbGRQcm9qZWN0Jywge1xuICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICBidWlsZEltYWdlOiBMaW51eEJ1aWxkSW1hZ2UuU1RBTkRBUkRfNl8wXG4gICAgICAgICAgfSxcbiAgICAgICAgICBidWlsZFNwZWM6IEJ1aWxkU3BlYy5mcm9tU291cmNlRmlsZW5hbWUoJ2J1aWxkLXNwZWNzL3NlcnZpY2UtYnVpbGQtc3BlYy55bWwnKVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICAgIF1cbiAgICB9KTtcblxuICAgIHRoaXMucGlwZWxpbmUuYWRkU3RhZ2Uoe1xuICAgICAgc3RhZ2VOYW1lOiAnUGlwZWxpbmVfVXBkYXRlJyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgbmV3IENsb3VkRm9ybWF0aW9uQ3JlYXRlVXBkYXRlU3RhY2tBY3Rpb24oe1xuICAgICAgICAgIGFjdGlvbk5hbWU6ICdQaXBlbGluZV9VcGRhdGUnLFxuICAgICAgICAgIHN0YWNrTmFtZTogJ1BpcGVsaW5lU3RhY2snLFxuICAgICAgICAgIHRlbXBsYXRlUGF0aDogdGhpcy5jZGtCdWlsZE91dHB1dC5hdFBhdGgoJ1BpcGVsaW5lU3RhY2sudGVtcGxhdGUuanNvbicpLFxuICAgICAgICAgIGFkbWluUGVybWlzc2lvbnM6IHRydWVcbiAgICAgICAgfSlcbiAgICAgIF1cbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBhZGRTZXJ2aWNlU3RhZ2UoXG4gICAgc2VydmljZVN0YWNrOiBTZXJ2aWNlU3RhY2ssXG4gICAgc3RhZ2VOYW1lOiBzdHJpbmdcbiAgKTogSVN0YWdlIHtcbiAgICByZXR1cm4gdGhpcy5waXBlbGluZS5hZGRTdGFnZSh7XG4gICAgICBzdGFnZU5hbWU6IHN0YWdlTmFtZSxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgbmV3IENsb3VkRm9ybWF0aW9uQ3JlYXRlVXBkYXRlU3RhY2tBY3Rpb24oe1xuICAgICAgICAgIGFjdGlvbk5hbWU6IFwiU2VydmljZV9VcGRhdGVcIixcbiAgICAgICAgICBzdGFja05hbWU6IHNlcnZpY2VTdGFjay5zdGFja05hbWUsXG4gICAgICAgICAgdGVtcGxhdGVQYXRoOiB0aGlzLmNka0J1aWxkT3V0cHV0LmF0UGF0aChcbiAgICAgICAgICAgIGAke3NlcnZpY2VTdGFjay5zdGFja05hbWV9LnRlbXBsYXRlLmpzb25gXG4gICAgICAgICAgKSxcbiAgICAgICAgICBhZG1pblBlcm1pc3Npb25zOiB0cnVlLFxuICAgICAgICAgIHBhcmFtZXRlck92ZXJyaWRlczoge1xuICAgICAgICAgICAgLi4uc2VydmljZVN0YWNrLnNlcnZpY2VDb2RlLmFzc2lnbihcbiAgICAgICAgICAgICAgdGhpcy5zZXJ2aWNlQnVpbGRPdXRwdXQuczNMb2NhdGlvblxuICAgICAgICAgICAgKSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGV4dHJhSW5wdXRzOiBbdGhpcy5zZXJ2aWNlQnVpbGRPdXRwdXRdLFxuICAgICAgICB9KSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgYWRkQmlsbGluZ1N0YWdlKGJpbGxpbmdTdGFjazogQmlsbGluZ1N0YWNrLCBzdGFnZTogSVN0YWdlKSB7XG4gICAgc3RhZ2UuYWRkQWN0aW9uKFxuICAgICAgbmV3IENsb3VkRm9ybWF0aW9uQ3JlYXRlVXBkYXRlU3RhY2tBY3Rpb24oe1xuICAgICAgICBhY3Rpb25OYW1lOiAnQmlsbGluZ19VcGRhdGUnLFxuICAgICAgICBzdGFja05hbWU6IGJpbGxpbmdTdGFjay5zdGFja05hbWUsXG4gICAgICAgIHRlbXBsYXRlUGF0aDogdGhpcy5jZGtCdWlsZE91dHB1dC5hdFBhdGgoYCR7YmlsbGluZ1N0YWNrLnN0YWNrTmFtZX0udGVtcGxhdGUuanNvbmApLFxuICAgICAgICBhZG1pblBlcm1pc3Npb25zOiB0cnVlLFxuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgcHVibGljIGFkZFNlcnZpY2VJbnRlZ3JhdGlvblRlc3RUb1N0YWdlKHN0YWdlOiBJU3RhZ2UsIHNlcnZpY2VFbmRQb2ludDogc3RyaW5nKSB7XG4gICAgY29uc3QgaW50ZWdUZXN0QWN0aW9uID0gbmV3IENvZGVCdWlsZEFjdGlvbih7XG4gICAgICBhY3Rpb25OYW1lOiAnSW50ZWdyYXRpb25fVGVzdCcsXG4gICAgICBpbnB1dDogdGhpcy5zZXJ2aWNlU291cmNlT3V0cHV0LFxuICAgICAgcHJvamVjdDogbmV3IFBpcGVsaW5lUHJvamVjdCh0aGlzLCAnU2VydmljZUludGVncmF0aW9uVGVzdHNQcm9qZWN0Jywge1xuICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgIGJ1aWxkSW1hZ2U6IExpbnV4QnVpbGRJbWFnZS5TVEFOREFSRF82XzBcbiAgICAgICAgfSxcbiAgICAgICAgYnVpbGRTcGVjOiBCdWlsZFNwZWMuZnJvbVNvdXJjZUZpbGVuYW1lKCdidWlsZC1zcGVjcy9pbnRlZy10ZXN0LWJ1aWxkLXNwZWMueW1sJyksXG4gICAgICB9KSxcbiAgICAgIGVudmlyb25tZW50VmFyaWFibGVzOiB7XG4gICAgICAgIFNFUlZJQ0VfRU5EUE9JTlQ6IHtcbiAgICAgICAgICB2YWx1ZTogc2VydmljZUVuZFBvaW50LFxuICAgICAgICAgIHR5cGU6IEJ1aWxkRW52aXJvbm1lbnRWYXJpYWJsZVR5cGUuUExBSU5URVhULFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHR5cGU6IENvZGVCdWlsZEFjdGlvblR5cGUuVEVTVCxcbiAgICAgIHJ1bk9yZGVyOiAyLFxuICAgIH0pXG4gICAgc3RhZ2UuYWRkQWN0aW9uKGludGVnVGVzdEFjdGlvbik7XG4gICAgaW50ZWdUZXN0QWN0aW9uLm9uU3RhdGVDaGFuZ2UoXCJpbnRlZ3JhdGlvblRlc3RGYWlsZWRcIiwgbmV3IFNuc1RvcGljKHRoaXMucGlwZWxpbmVOb3RpZmljYXRpb25Ub3BpYywge1xuICAgICAgbWVzc2FnZTogUnVsZVRhcmdldElucHV0LmZyb21UZXh0KFxuICAgICAgICBgSW50ZWdyYXRpb24gVGVzdCBGYWlsZWQgZm9yICR7RXZlbnRGaWVsZC5mcm9tUGF0aCgnJC5kZXRhaWwuZXhlY3V0aW9uLXJlc3VsdC5leHRlcm5hbC1leGVjdXRpb24tdXJsJyl9YFxuICAgICAgKSxcbiAgICB9KSwge1xuICAgICAgcnVsZU5hbWU6ICdJbnRlZ3JhdGlvblRlc3RGYWlsZWQnLFxuICAgICAgZXZlbnRQYXR0ZXJuOiB7XG4gICAgICAgIGRldGFpbDoge1xuICAgICAgICAgIHN0YXRlOiBbJ0ZBSUxFRCddLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnSW50ZWdyYXRpb24gVGVzdCBGYWlsZWQnXG4gICAgfSk7XG4gIH1cbn0iXX0=