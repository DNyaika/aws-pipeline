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
}
exports.PipelineStack = PipelineStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaXBlbGluZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMsNkNBQTBDO0FBQzFDLG1FQUEwRTtBQUUxRSxtRkFBa0k7QUFDbEksNkRBQXdGO0FBSXhGLE1BQWEsYUFBYyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBSzFDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLDJCQUFRLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUM3QyxZQUFZLEVBQUUsVUFBVTtZQUN4QixnQkFBZ0IsRUFBRSxLQUFLO1lBQ3ZCLHdCQUF3QixFQUFFLElBQUk7U0FDL0IsQ0FBQyxDQUFDO1FBRUgsTUFBTSxlQUFlLEdBQUcsSUFBSSwyQkFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDeEQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLDJCQUFRLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUVsRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQztZQUNyQixTQUFTLEVBQUUsUUFBUTtZQUNuQixPQUFPLEVBQUU7Z0JBQ1AsSUFBSSw2Q0FBa0IsQ0FBQztvQkFDckIsS0FBSyxFQUFFLFNBQVM7b0JBQ2hCLElBQUksRUFBRSxjQUFjO29CQUNwQixNQUFNLEVBQUUsTUFBTTtvQkFDZCxVQUFVLEVBQUUsaUJBQWlCO29CQUM3QixVQUFVLEVBQUUseUJBQVcsQ0FBQyxjQUFjLENBQUMsdUJBQXVCLENBQUM7b0JBQy9ELE1BQU0sRUFBRSxlQUFlO2lCQUN4QixDQUFDO2dCQUNGLElBQUksNkNBQWtCLENBQUM7b0JBQ3JCLEtBQUssRUFBRSxTQUFTO29CQUNoQixJQUFJLEVBQUUsZ0JBQWdCO29CQUN0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QUFTLEVBQUUsWUFBWSxDQUFDLFNBQVM7WUFDakMsWUFBWSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUcsWUFBWSxDQUFDLFNBQVMsZ0JBQWdCLENBQUM7WUFDbkYsZ0JBQWdCLEVBQUUsSUFBSTtTQUN2QixDQUFDLENBQ0gsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQXJIRCxzQ0FxSEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgU2VjcmV0VmFsdWUgfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBBcnRpZmFjdCwgSVN0YWdlLCBQaXBlbGluZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2RlcGlwZWxpbmUnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBDbG91ZEZvcm1hdGlvbkNyZWF0ZVVwZGF0ZVN0YWNrQWN0aW9uLCBDb2RlQnVpbGRBY3Rpb24sIEdpdEh1YlNvdXJjZUFjdGlvbiB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2RlcGlwZWxpbmUtYWN0aW9ucyc7XG5pbXBvcnQgeyBQaXBlbGluZVByb2plY3QsIExpbnV4QnVpbGRJbWFnZSwgQnVpbGRTcGVjIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVidWlsZCc7XG5pbXBvcnQgeyBTZXJ2aWNlU3RhY2sgfSBmcm9tICcuL3NlcnZpY2Utc3RhY2snO1xuaW1wb3J0IHsgQmlsbGluZ1N0YWNrIH0gZnJvbSAnLi9iaWxsaW5nLXN0YWNrJztcblxuZXhwb3J0IGNsYXNzIFBpcGVsaW5lU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwcml2YXRlIHJlYWRvbmx5IHBpcGVsaW5lOiBQaXBlbGluZTtcbiAgcHJpdmF0ZSByZWFkb25seSBjZGtCdWlsZE91dHB1dDogQXJ0aWZhY3Q7XG4gIHByaXZhdGUgcmVhZG9ubHkgc2VydmljZUJ1aWxkT3V0cHV0OiBBcnRpZmFjdDtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICB0aGlzLnBpcGVsaW5lID0gbmV3IFBpcGVsaW5lKHRoaXMsICdQaXBlbGluZScsIHtcbiAgICAgIHBpcGVsaW5lTmFtZTogJ1BpcGVsaW5lJyxcbiAgICAgIGNyb3NzQWNjb3VudEtleXM6IGZhbHNlLFxuICAgICAgcmVzdGFydEV4ZWN1dGlvbk9uVXBkYXRlOiB0cnVlXG4gICAgfSk7XG5cbiAgICBjb25zdCBjZGtzb3VyY2VPdXRwdXQgPSBuZXcgQXJ0aWZhY3QoJ0NES1NvdXJjZU91dHB1dCcpO1xuICAgIGNvbnN0IHNlcnZpY2VrU291cmNlT3V0cHV0ID0gbmV3IEFydGlmYWN0KCdTZXJ2aWNla1NvdXJjZU91dHB1dCcpO1xuXG4gICAgdGhpcy5waXBlbGluZS5hZGRTdGFnZSh7XG4gICAgICBzdGFnZU5hbWU6ICdTb3VyY2UnLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICBuZXcgR2l0SHViU291cmNlQWN0aW9uKHtcbiAgICAgICAgICBvd25lcjogJ0ROeWFpa2EnLFxuICAgICAgICAgIHJlcG86ICdhd3MtcGlwZWxpbmUnLFxuICAgICAgICAgIGJyYW5jaDogJ21haW4nLFxuICAgICAgICAgIGFjdGlvbk5hbWU6ICdwaXBlbGluZS1zb3VyY2UnLFxuICAgICAgICAgIG9hdXRoVG9rZW46IFNlY3JldFZhbHVlLnNlY3JldHNNYW5hZ2VyKCdnaXRodWItcGlwZWxpbmUtdG9rZW4nKSxcbiAgICAgICAgICBvdXRwdXQ6IGNka3NvdXJjZU91dHB1dFxuICAgICAgICB9KSxcbiAgICAgICAgbmV3IEdpdEh1YlNvdXJjZUFjdGlvbih7XG4gICAgICAgICAgb3duZXI6ICdETnlhaWthJyxcbiAgICAgICAgICByZXBvOiAnZXhwcmVzcy1sYW1iZGEnLFxuICAgICAgICAgIGJyYW5jaDogJ21haW4nLFxuICAgICAgICAgIGFjdGlvbk5hbWU6ICdzZXJ2aWNlLXNvdXJjZScsXG4gICAgICAgICAgb2F1dGhUb2tlbjogU2VjcmV0VmFsdWUuc2VjcmV0c01hbmFnZXIoJ2dpdGh1Yi1waXBlbGluZS10b2tlbicpLFxuICAgICAgICAgIG91dHB1dDogc2VydmljZWtTb3VyY2VPdXRwdXQsXG4gICAgICAgIH0pXG4gICAgICBdXG4gICAgfSk7XG5cbiAgICB0aGlzLmNka0J1aWxkT3V0cHV0ID0gbmV3IEFydGlmYWN0KCdDREtCdWlsZE91dHB1dCcpO1xuICAgIHRoaXMuc2VydmljZUJ1aWxkT3V0cHV0ID0gbmV3IEFydGlmYWN0KCdTZXJ2aWNlQnVpbGRPdXRwdXQnKTtcblxuICAgIHRoaXMucGlwZWxpbmUuYWRkU3RhZ2Uoe1xuICAgICAgc3RhZ2VOYW1lOiAnQnVpbGQnLFxuICAgICAgYWN0aW9uczogW25ldyBDb2RlQnVpbGRBY3Rpb24oe1xuICAgICAgICBhY3Rpb25OYW1lOiAnQ0RLX0J1aWxkJyxcbiAgICAgICAgaW5wdXQ6IGNka3NvdXJjZU91dHB1dCxcbiAgICAgICAgb3V0cHV0czogW3RoaXMuY2RrQnVpbGRPdXRwdXRdLFxuICAgICAgICBwcm9qZWN0OiBuZXcgUGlwZWxpbmVQcm9qZWN0KHRoaXMsICdDREtCdWlsZFByb2plY3QnLCB7XG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICAgIGJ1aWxkSW1hZ2U6IExpbnV4QnVpbGRJbWFnZS5TVEFOREFSRF82XzBcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJ1aWxkU3BlYzogQnVpbGRTcGVjLmZyb21Tb3VyY2VGaWxlbmFtZSgnYnVpbGQtc3BlY3MvY2RrLWJ1aWxkLXNwZWMueW1sJylcbiAgICAgICAgfSlcbiAgICAgIH0pLFxuICAgICAgbmV3IENvZGVCdWlsZEFjdGlvbih7XG4gICAgICAgIGFjdGlvbk5hbWU6ICdTZXJ2aWNlX0J1aWxkJyxcbiAgICAgICAgaW5wdXQ6IHNlcnZpY2VrU291cmNlT3V0cHV0LFxuICAgICAgICBvdXRwdXRzOiBbdGhpcy5zZXJ2aWNlQnVpbGRPdXRwdXRdLFxuICAgICAgICBwcm9qZWN0OiBuZXcgUGlwZWxpbmVQcm9qZWN0KHRoaXMsICdTZXJ2aWNlQnVpbGRQcm9qZWN0Jywge1xuICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICBidWlsZEltYWdlOiBMaW51eEJ1aWxkSW1hZ2UuU1RBTkRBUkRfNl8wXG4gICAgICAgICAgfSxcbiAgICAgICAgICBidWlsZFNwZWM6IEJ1aWxkU3BlYy5mcm9tU291cmNlRmlsZW5hbWUoJ2J1aWxkLXNwZWNzL3NlcnZpY2UtYnVpbGQtc3BlYy55bWwnKVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICAgIF1cbiAgICB9KTtcblxuICAgIHRoaXMucGlwZWxpbmUuYWRkU3RhZ2Uoe1xuICAgICAgc3RhZ2VOYW1lOiAnUGlwZWxpbmVfVXBkYXRlJyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgbmV3IENsb3VkRm9ybWF0aW9uQ3JlYXRlVXBkYXRlU3RhY2tBY3Rpb24oe1xuICAgICAgICAgIGFjdGlvbk5hbWU6ICdQaXBlbGluZV9VcGRhdGUnLFxuICAgICAgICAgIHN0YWNrTmFtZTogJ1BpcGVsaW5lU3RhY2snLFxuICAgICAgICAgIHRlbXBsYXRlUGF0aDogdGhpcy5jZGtCdWlsZE91dHB1dC5hdFBhdGgoJ1BpcGVsaW5lU3RhY2sudGVtcGxhdGUuanNvbicpLFxuICAgICAgICAgIGFkbWluUGVybWlzc2lvbnM6IHRydWVcbiAgICAgICAgfSlcbiAgICAgIF1cbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBhZGRTZXJ2aWNlU3RhZ2UoXG4gICAgc2VydmljZVN0YWNrOiBTZXJ2aWNlU3RhY2ssXG4gICAgc3RhZ2VOYW1lOiBzdHJpbmdcbiAgKTogSVN0YWdlIHtcbiAgICByZXR1cm4gdGhpcy5waXBlbGluZS5hZGRTdGFnZSh7XG4gICAgICBzdGFnZU5hbWU6IHN0YWdlTmFtZSxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgbmV3IENsb3VkRm9ybWF0aW9uQ3JlYXRlVXBkYXRlU3RhY2tBY3Rpb24oe1xuICAgICAgICAgIGFjdGlvbk5hbWU6IFwiU2VydmljZV9VcGRhdGVcIixcbiAgICAgICAgICBzdGFja05hbWU6IHNlcnZpY2VTdGFjay5zdGFja05hbWUsXG4gICAgICAgICAgdGVtcGxhdGVQYXRoOiB0aGlzLmNka0J1aWxkT3V0cHV0LmF0UGF0aChcbiAgICAgICAgICAgIGAke3NlcnZpY2VTdGFjay5zdGFja05hbWV9LnRlbXBsYXRlLmpzb25gXG4gICAgICAgICAgKSxcbiAgICAgICAgICBhZG1pblBlcm1pc3Npb25zOiB0cnVlLFxuICAgICAgICAgIHBhcmFtZXRlck92ZXJyaWRlczoge1xuICAgICAgICAgICAgLi4uc2VydmljZVN0YWNrLnNlcnZpY2VDb2RlLmFzc2lnbihcbiAgICAgICAgICAgICAgdGhpcy5zZXJ2aWNlQnVpbGRPdXRwdXQuczNMb2NhdGlvblxuICAgICAgICAgICAgKSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGV4dHJhSW5wdXRzOiBbdGhpcy5zZXJ2aWNlQnVpbGRPdXRwdXRdLFxuICAgICAgICB9KSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgYWRkQmlsbGluZ1N0YWdlKGJpbGxpbmdTdGFjazogQmlsbGluZ1N0YWNrLCBzdGFnZTogSVN0YWdlKSB7XG4gICAgc3RhZ2UuYWRkQWN0aW9uKFxuICAgICAgbmV3IENsb3VkRm9ybWF0aW9uQ3JlYXRlVXBkYXRlU3RhY2tBY3Rpb24oe1xuICAgICAgICBhY3Rpb25OYW1lOiAnQmlsbGluZ19VcGRhdGUnLFxuICAgICAgICBzdGFja05hbWU6IGJpbGxpbmdTdGFjay5zdGFja05hbWUsXG4gICAgICAgIHRlbXBsYXRlUGF0aDogdGhpcy5jZGtCdWlsZE91dHB1dC5hdFBhdGgoYCR7YmlsbGluZ1N0YWNrLnN0YWNrTmFtZX0udGVtcGxhdGUuanNvbmApLFxuICAgICAgICBhZG1pblBlcm1pc3Npb25zOiB0cnVlLFxuICAgICAgfSlcbiAgICApO1xuICB9XG59Il19