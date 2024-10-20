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
            crossAccountKeys: true,
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
                    account: serviceStack.account,
                    region: serviceStack.region,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaXBlbGluZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMsNkNBQTBDO0FBQzFDLG1FQUEwRTtBQUUxRSxtRkFBdUo7QUFDdkosNkRBQXNIO0FBR3RILHVFQUEwRDtBQUMxRCxpREFBNEM7QUFDNUMsdURBQXFFO0FBQ3JFLDZFQUFzRTtBQUV0RSxNQUFhLGFBQWMsU0FBUSxHQUFHLENBQUMsS0FBSztJQU8xQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hCLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLGVBQUssQ0FBQyxJQUFJLEVBQUUsMkJBQTJCLEVBQUU7WUFDNUUsU0FBUyxFQUFFLHVCQUF1QjtTQUNuQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMseUJBQXlCLENBQUMsZUFBZSxDQUM1QyxJQUFJLHlDQUFpQixDQUFDLHdCQUF3QixDQUFDLENBQ2hELENBQUE7UUFFRCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksMkJBQVEsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQzdDLFlBQVksRUFBRSxVQUFVO1lBQ3hCLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsd0JBQXdCLEVBQUUsSUFBSTtTQUMvQixDQUFDLENBQUM7UUFFSCxNQUFNLGVBQWUsR0FBRyxJQUFJLDJCQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUN4RCxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSwyQkFBUSxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFFaEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7WUFDckIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsT0FBTyxFQUFFO2dCQUNQLElBQUksNkNBQWtCLENBQUM7b0JBQ3JCLEtB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QixDQUFDLElBQUk7WUFDOUIsUUFBUSxFQUFFLENBQUM7U0FDWixDQUFDLENBQUE7UUFDRixLQUFLLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ2pDLGVBQWUsQ0FBQyxhQUFhLENBQUMsdUJBQXVCLEVBQUUsSUFBSSw2QkFBUSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsRUFBRTtZQUNsRyxPQUFPLEVBQUUsNEJBQWUsQ0FBQyxRQUFRLENBQy9CLCtCQUErQix1QkFBVSxDQUFDLFFBQVEsQ0FBQyxrREFBa0QsQ0FBQyxFQUFFLENBQ3pHO1NBQ0YsQ0FBQyxFQUFFO1lBQ0YsUUFBUSxFQUFFLHVCQUF1QjtZQUNqQyxZQUFZLEVBQUU7Z0JBQ1osTUFBTSxFQUFFO29CQUNOLEtBQUssRUFBRSxDQUFDLFFBQVEsQ0FBQztpQkFDbEI7YUFDRjtZQUNELFdBQVcsRUFBRSx5QkFBeUI7U0FDdkMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBbktELHNDQW1LQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBTZWNyZXRWYWx1ZSB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IEFydGlmYWN0LCBJU3RhZ2UsIFBpcGVsaW5lIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVwaXBlbGluZSc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IENsb3VkRm9ybWF0aW9uQ3JlYXRlVXBkYXRlU3RhY2tBY3Rpb24sIENvZGVCdWlsZEFjdGlvbiwgQ29kZUJ1aWxkQWN0aW9uVHlwZSwgR2l0SHViU291cmNlQWN0aW9uIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zJztcbmltcG9ydCB7IFBpcGVsaW5lUHJvamVjdCwgTGludXhCdWlsZEltYWdlLCBCdWlsZFNwZWMsIEJ1aWxkRW52aXJvbm1lbnRWYXJpYWJsZVR5cGUgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29kZWJ1aWxkJztcbmltcG9ydCB7IFNlcnZpY2VTdGFjayB9IGZyb20gJy4vc2VydmljZS1zdGFjayc7XG5pbXBvcnQgeyBCaWxsaW5nU3RhY2sgfSBmcm9tICcuL2JpbGxpbmctc3RhY2snO1xuaW1wb3J0IHsgU25zVG9waWMgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZXZlbnRzLXRhcmdldHMnO1xuaW1wb3J0IHsgVG9waWMgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJztcbmltcG9ydCB7IFJ1bGVUYXJnZXRJbnB1dCwgRXZlbnRGaWVsZCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMnO1xuaW1wb3J0IHsgRW1haWxTdWJzY3JpcHRpb24gfSBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zLXN1YnNjcmlwdGlvbnMnO1xuXG5leHBvcnQgY2xhc3MgUGlwZWxpbmVTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHByaXZhdGUgcmVhZG9ubHkgcGlwZWxpbmU6IFBpcGVsaW5lO1xuICBwcml2YXRlIHJlYWRvbmx5IGNka0J1aWxkT3V0cHV0OiBBcnRpZmFjdDtcbiAgcHJpdmF0ZSByZWFkb25seSBzZXJ2aWNlQnVpbGRPdXRwdXQ6IEFydGlmYWN0O1xuICBwcml2YXRlIHJlYWRvbmx5IHNlcnZpY2VTb3VyY2VPdXRwdXQ6IEFydGlmYWN0O1xuICBwcml2YXRlIHJlYWRvbmx5IHBpcGVsaW5lTm90aWZpY2F0aW9uVG9waWM6IFRvcGljO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcbiAgICB0aGlzLnBpcGVsaW5lTm90aWZpY2F0aW9uVG9waWMgPSBuZXcgVG9waWModGhpcywgJ1BpcGVsaW5lTm90aWZpY2F0aW9uVG9waWMnLCB7XG4gICAgICB0b3BpY05hbWU6ICdQaXBlbGluZU5vdGlmaWNhdGlvbnMnLFxuICAgIH0pO1xuXG4gICAgdGhpcy5waXBlbGluZU5vdGlmaWNhdGlvblRvcGljLmFkZFN1YnNjcmlwdGlvbihcbiAgICAgIG5ldyBFbWFpbFN1YnNjcmlwdGlvbignZGF2aWRueWFpa2EyQGdtYWlsLmNvbScpXG4gICAgKVxuXG4gICAgdGhpcy5waXBlbGluZSA9IG5ldyBQaXBlbGluZSh0aGlzLCAnUGlwZWxpbmUnLCB7XG4gICAgICBwaXBlbGluZU5hbWU6ICdQaXBlbGluZScsXG4gICAgICBjcm9zc0FjY291bnRLZXlzOiB0cnVlLFxuICAgICAgcmVzdGFydEV4ZWN1dGlvbk9uVXBkYXRlOiB0cnVlXG4gICAgfSk7XG5cbiAgICBjb25zdCBjZGtzb3VyY2VPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoJ0NES1NvdXJjZU91dHB1dCcpO1xuICAgIHRoaXMuc2VydmljZVNvdXJjZU91dHB1dCA9IG5ldyBBcnRpZmFjdCgnU2VydmljZWtTb3VyY2VPdXRwdXQnKTtcblxuICAgIHRoaXMucGlwZWxpbmUuYWRkU3RhZ2Uoe1xuICAgICAgc3RhZ2VOYW1lOiAnU291cmNlJyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgbmV3IEdpdEh1YlNvdXJjZUFjdGlvbih7XG4gICAgICAgICAgb3duZXI6ICdETnlhaWthJyxcbiAgICAgICAgICByZXBvOiAnYXdzLXBpcGVsaW5lJyxcbiAgICAgICAgICBicmFuY2g6ICdtYWluJyxcbiAgICAgICAgICBhY3Rpb25OYW1lOiAncGlwZWxpbmUtc291cmNlJyxcbiAgICAgICAgICBvYXV0aFRva2VuOiBTZWNyZXRWYWx1ZS5zZWNyZXRzTWFuYWdlcignZ2l0aHViLXBpcGVsaW5lLXRva2VuJyksXG4gICAgICAgICAgb3V0cHV0OiBjZGtzb3VyY2VPdXRwdXRcbiAgICAgICAgfSksXG4gICAgICAgIG5ldyBHaXRIdWJTb3VyY2VBY3Rpb24oe1xuICAgICAgICAgIG93bmVyOiAnRE55YWlrYScsXG4gICAgICAgICAgcmVwbzogJ2V4cHJlc3MtbGFtYmRhJyxcbiAgICAgICAgICBicmFuY2g6ICdtYWluJyxcbiAgICAgICAgICBhY3Rpb25OYW1lOiAnc2VydmljZS1zb3VyY2UnLFxuICAgICAgICAgIG9hdXRoVG9rZW46IFNlY3JldFZhbHVlLnNlY3JldHNNYW5hZ2VyKCdnaXRodWItcGlwZWxpbmUtdG9rZW4nKSxcbiAgICAgICAgICBvdXRwdXQ6IHRoaXMuc2VydmljZVNvdXJjZU91dHB1dCxcbiAgICAgICAgfSlcbiAgICAgIF1cbiAgICB9KTtcblxuICAgIHRoaXMuY2RrQnVpbGRPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoJ0NES0J1aWxkT3V0cHV0Jyk7XG4gICAgdGhpcy5zZXJ2aWNlQnVpbGRPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoJ1NlcnZpY2VCdWlsZE91dHB1dCcpO1xuXG4gICAgdGhpcy5waXBlbGluZS5hZGRTdGFnZSh7XG4gICAgICBzdGFnZU5hbWU6ICdCdWlsZCcsXG4gICAgICBhY3Rpb25zOiBbbmV3IENvZGVCdWlsZEFjdGlvbih7XG4gICAgICAgIGFjdGlvbk5hbWU6ICdDREtfQnVpbGQnLFxuICAgICAgICBpbnB1dDogY2Rrc291cmNlT3V0cHV0LFxuICAgICAgICBvdXRwdXRzOiBbdGhpcy5jZGtCdWlsZE91dHB1dF0sXG4gICAgICAgIHByb2plY3Q6IG5ldyBQaXBlbGluZVByb2plY3QodGhpcywgJ0NES0J1aWxkUHJvamVjdCcsIHtcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgYnVpbGRJbWFnZTogTGludXhCdWlsZEltYWdlLlNUQU5EQVJEXzZfMFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYnVpbGRTcGVjOiBCdWlsZFNwZWMuZnJvbVNvdXJjZUZpbGVuYW1lKCdidWlsZC1zcGVjcy9jZGstYnVpbGQtc3BlYy55bWwnKVxuICAgICAgICB9KVxuICAgICAgfSksXG4gICAgICBuZXcgQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgICAgYWN0aW9uTmFtZTogJ1NlcnZpY2VfQnVpbGQnLFxuICAgICAgICBpbnB1dDogdGhpcy5zZXJ2aWNlU291cmNlT3V0cHV0LFxuICAgICAgICBvdXRwdXRzOiBbdGhpcy5zZXJ2aWNlQnVpbGRPdXRwdXRdLFxuICAgICAgICBwcm9qZWN0OiBuZXcgUGlwZWxpbmVQcm9qZWN0KHRoaXMsICdTZXJ2aWNlQnVpbGRQcm9qZWN0Jywge1xuICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICBidWlsZEltYWdlOiBMaW51eEJ1aWxkSW1hZ2UuU1RBTkRBUkRfNl8wXG4gICAgICAgICAgfSxcbiAgICAgICAgICBidWlsZFNwZWM6IEJ1aWxkU3BlYy5mcm9tU291cmNlRmlsZW5hbWUoJ2J1aWxkLXNwZWNzL3NlcnZpY2UtYnVpbGQtc3BlYy55bWwnKVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICAgIF1cbiAgICB9KTtcblxuICAgIHRoaXMucGlwZWxpbmUuYWRkU3RhZ2Uoe1xuICAgICAgc3RhZ2VOYW1lOiAnUGlwZWxpbmVfVXBkYXRlJyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgbmV3IENsb3VkRm9ybWF0aW9uQ3JlYXRlVXBkYXRlU3RhY2tBY3Rpb24oe1xuICAgICAgICAgIGFjdGlvbk5hbWU6ICdQaXBlbGluZV9VcGRhdGUnLFxuICAgICAgICAgIHN0YWNrTmFtZTogJ1BpcGVsaW5lU3RhY2snLFxuICAgICAgICAgIHRlbXBsYXRlUGF0aDogdGhpcy5jZGtCdWlsZE91dHB1dC5hdFBhdGgoJ1BpcGVsaW5lU3RhY2sudGVtcGxhdGUuanNvbicpLFxuICAgICAgICAgIGFkbWluUGVybWlzc2lvbnM6IHRydWVcbiAgICAgICAgfSlcbiAgICAgIF1cbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBhZGRTZXJ2aWNlU3RhZ2UoXG4gICAgc2VydmljZVN0YWNrOiBTZXJ2aWNlU3RhY2ssXG4gICAgc3RhZ2VOYW1lOiBzdHJpbmdcbiAgKTogSVN0YWdlIHtcbiAgICByZXR1cm4gdGhpcy5waXBlbGluZS5hZGRTdGFnZSh7XG4gICAgICBzdGFnZU5hbWU6IHN0YWdlTmFtZSxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgbmV3IENsb3VkRm9ybWF0aW9uQ3JlYXRlVXBkYXRlU3RhY2tBY3Rpb24oe1xuICAgICAgICAgIGFjY291bnQ6IHNlcnZpY2VTdGFjay5hY2NvdW50LFxuICAgICAgICAgIHJlZ2lvbjogc2VydmljZVN0YWNrLnJlZ2lvbixcbiAgICAgICAgICBhY3Rpb25OYW1lOiBcIlNlcnZpY2VfVXBkYXRlXCIsXG4gICAgICAgICAgc3RhY2tOYW1lOiBzZXJ2aWNlU3RhY2suc3RhY2tOYW1lLFxuICAgICAgICAgIHRlbXBsYXRlUGF0aDogdGhpcy5jZGtCdWlsZE91dHB1dC5hdFBhdGgoXG4gICAgICAgICAgICBgJHtzZXJ2aWNlU3RhY2suc3RhY2tOYW1lfS50ZW1wbGF0ZS5qc29uYFxuICAgICAgICAgICksXG4gICAgICAgICAgYWRtaW5QZXJtaXNzaW9uczogdHJ1ZSxcbiAgICAgICAgICBwYXJhbWV0ZXJPdmVycmlkZXM6IHtcbiAgICAgICAgICAgIC4uLnNlcnZpY2VTdGFjay5zZXJ2aWNlQ29kZS5hc3NpZ24oXG4gICAgICAgICAgICAgIHRoaXMuc2VydmljZUJ1aWxkT3V0cHV0LnMzTG9jYXRpb25cbiAgICAgICAgICAgICksXG4gICAgICAgICAgfSxcbiAgICAgICAgICBleHRyYUlucHV0czogW3RoaXMuc2VydmljZUJ1aWxkT3V0cHV0XSxcbiAgICAgICAgfSksXG4gICAgICBdLFxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGFkZEJpbGxpbmdTdGFnZShiaWxsaW5nU3RhY2s6IEJpbGxpbmdTdGFjaywgc3RhZ2U6IElTdGFnZSkge1xuICAgIHN0YWdlLmFkZEFjdGlvbihcbiAgICAgIG5ldyBDbG91ZEZvcm1hdGlvbkNyZWF0ZVVwZGF0ZVN0YWNrQWN0aW9uKHtcbiAgICAgICAgYWN0aW9uTmFtZTogJ0JpbGxpbmdfVXBkYXRlJyxcbiAgICAgICAgc3RhY2tOYW1lOiBiaWxsaW5nU3RhY2suc3RhY2tOYW1lLFxuICAgICAgICB0ZW1wbGF0ZVBhdGg6IHRoaXMuY2RrQnVpbGRPdXRwdXQuYXRQYXRoKGAke2JpbGxpbmdTdGFjay5zdGFja05hbWV9LnRlbXBsYXRlLmpzb25gKSxcbiAgICAgICAgYWRtaW5QZXJtaXNzaW9uczogdHJ1ZSxcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIHB1YmxpYyBhZGRTZXJ2aWNlSW50ZWdyYXRpb25UZXN0VG9TdGFnZShzdGFnZTogSVN0YWdlLCBzZXJ2aWNlRW5kUG9pbnQ6IHN0cmluZykge1xuICAgIGNvbnN0IGludGVnVGVzdEFjdGlvbiA9IG5ldyBDb2RlQnVpbGRBY3Rpb24oe1xuICAgICAgYWN0aW9uTmFtZTogJ0ludGVncmF0aW9uX1Rlc3QnLFxuICAgICAgaW5wdXQ6IHRoaXMuc2VydmljZVNvdXJjZU91dHB1dCxcbiAgICAgIHByb2plY3Q6IG5ldyBQaXBlbGluZVByb2plY3QodGhpcywgJ1NlcnZpY2VJbnRlZ3JhdGlvblRlc3RzUHJvamVjdCcsIHtcbiAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICBidWlsZEltYWdlOiBMaW51eEJ1aWxkSW1hZ2UuU1RBTkRBUkRfNl8wXG4gICAgICAgIH0sXG4gICAgICAgIGJ1aWxkU3BlYzogQnVpbGRTcGVjLmZyb21Tb3VyY2VGaWxlbmFtZSgnYnVpbGQtc3BlY3MvaW50ZWctdGVzdC1idWlsZC1zcGVjLnltbCcpLFxuICAgICAgfSksXG4gICAgICBlbnZpcm9ubWVudFZhcmlhYmxlczoge1xuICAgICAgICBTRVJWSUNFX0VORFBPSU5UOiB7XG4gICAgICAgICAgdmFsdWU6IHNlcnZpY2VFbmRQb2ludCxcbiAgICAgICAgICB0eXBlOiBCdWlsZEVudmlyb25tZW50VmFyaWFibGVUeXBlLlBMQUlOVEVYVCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB0eXBlOiBDb2RlQnVpbGRBY3Rpb25UeXBlLlRFU1QsXG4gICAgICBydW5PcmRlcjogMixcbiAgICB9KVxuICAgIHN0YWdlLmFkZEFjdGlvbihpbnRlZ1Rlc3RBY3Rpb24pO1xuICAgIGludGVnVGVzdEFjdGlvbi5vblN0YXRlQ2hhbmdlKFwiaW50ZWdyYXRpb25UZXN0RmFpbGVkXCIsIG5ldyBTbnNUb3BpYyh0aGlzLnBpcGVsaW5lTm90aWZpY2F0aW9uVG9waWMsIHtcbiAgICAgIG1lc3NhZ2U6IFJ1bGVUYXJnZXRJbnB1dC5mcm9tVGV4dChcbiAgICAgICAgYEludGVncmF0aW9uIFRlc3QgRmFpbGVkIGZvciAke0V2ZW50RmllbGQuZnJvbVBhdGgoJyQuZGV0YWlsLmV4ZWN1dGlvbi1yZXN1bHQuZXh0ZXJuYWwtZXhlY3V0aW9uLXVybCcpfWBcbiAgICAgICksXG4gICAgfSksIHtcbiAgICAgIHJ1bGVOYW1lOiAnSW50ZWdyYXRpb25UZXN0RmFpbGVkJyxcbiAgICAgIGV2ZW50UGF0dGVybjoge1xuICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICBzdGF0ZTogWydGQUlMRUQnXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBkZXNjcmlwdGlvbjogJ0ludGVncmF0aW9uIFRlc3QgRmFpbGVkJ1xuICAgIH0pO1xuICB9XG59Il19