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
        const pipeline = new aws_codepipeline_1.Pipeline(this, 'Pipeline', {
            pipelineName: 'Pipeline',
            crossAccountKeys: false
        });
        const sourceOutput = new aws_codepipeline_1.Artifact('SourceOutput');
        pipeline.addStage({
            stageName: 'Source',
            actions: [
                new aws_codepipeline_actions_1.GitHubSourceAction({
                    owner: 'DNyaika',
                    repo: 'aws-pipeline',
                    branch: 'main',
                    actionName: 'pipeline-source',
                    oauthToken: aws_cdk_lib_1.SecretValue.secretsManager('github-pipeline-token'),
                    output: sourceOutput
                })
            ]
        });
        const cdkBuildOutput = new aws_codepipeline_1.Artifact('CDKBuildOutput');
        pipeline.addStage({
            stageName: 'Build',
            actions: [new aws_codepipeline_actions_1.CodeBuildAction({
                    actionName: 'CDK_Build',
                    input: sourceOutput,
                    outputs: [cdkBuildOutput],
                    project: new aws_codebuild_1.PipelineProject(this, 'CDKBuildProject', {
                        environment: {
                            buildImage: aws_codebuild_1.LinuxBuildImage.STANDARD_5_0
                        },
                        buildSpec: aws_codebuild_1.BuildSpec.fromSourceFilename('build-specs/cdk-build-spec.yml')
                    })
                })]
        });
    }
}
exports.PipelineStack = PipelineStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaXBlbGluZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMsNkNBQTBDO0FBQzFDLG1FQUFrRTtBQUVsRSxtRkFBMkY7QUFDM0YsNkRBQXdGO0FBRXhGLE1BQWEsYUFBYyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzFDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxRQUFRLEdBQUcsSUFBSSwyQkFBUSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDOUMsWUFBWSxFQUFFLFVBQVU7WUFDeEIsZ0JBQWdCLEVBQUUsS0FBSztTQUN4QixDQUFDLENBQUM7UUFFSCxNQUFNLFlBQVksR0FBRyxJQUFJLDJCQUFRLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDbEQsUUFBUSxDQUFDLFFBQVEsQ0FBQztZQUNoQixTQUFTLEVBQUUsUUFBUTtZQUNuQixPQUFPLEVBQUU7Z0JBQ1AsSUFBSSw2Q0FBa0IsQ0FBQztvQkFDckIsS0FBSyxFQUFFLFNBQVM7b0JBQ2hCLElBQUksRUFBRSxjQUFjO29CQUNwQixNQUFNLEVBQUUsTUFBTTtvQkFDZCxVQUFVLEVBQUUsaUJBQWlCO29CQUM3QixVQUFVLEVBQUUseUJBQVcsQ0FBQyxjQUFjLENBQUMsdUJBQXVCLENBQUM7b0JBQy9ELE1BQU0sRUFBRSxZQUFZO2lCQUNyQixDQUFDO2FBQ0g7U0FDRixDQUFDLENBQUM7UUFFSCxNQUFNLGNBQWMsR0FBRyxJQUFJLDJCQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUN0RCxRQUFRLENBQUMsUUFBUSxDQUFDO1lBQ2hCLFNBQVMsRUFBRSxPQUFPO1lBQ2xCLE9BQU8sRUFBRSxDQUFDLElBQUksMENBQWUsQ0FBQztvQkFDNUIsVUFBVSxFQUFFLFdBQVc7b0JBQ3ZCLEtBQUssRUFBRSxZQUFZO29CQUNuQixPQUFPLEVBQUUsQ0FBQyxjQUFjLENBQUM7b0JBQ3pCLE9BQU8sRUFBRSxJQUFJLCtCQUFlLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO3dCQUNwRCxXQUFXLEVBQUU7NEJBQ1gsVUFBVSxFQUFFLCtCQUFlLENBQUMsWUFBWTt5QkFDekM7d0JBRUQsU0FBUyxFQUFFLHlCQUFTLENBQUMsa0JBQWtCLENBQUMsZ0NBQWdDLENBQUM7cUJBQzFFLENBQUM7aUJBQ0gsQ0FBQyxDQUFDO1NBQ0osQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBekNELHNDQXlDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBTZWNyZXRWYWx1ZSB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IEFydGlmYWN0LCBQaXBlbGluZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2RlcGlwZWxpbmUnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBDb2RlQnVpbGRBY3Rpb24sIEdpdEh1YlNvdXJjZUFjdGlvbiB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2RlcGlwZWxpbmUtYWN0aW9ucyc7XG5pbXBvcnQgeyBQaXBlbGluZVByb2plY3QsIExpbnV4QnVpbGRJbWFnZSwgQnVpbGRTcGVjIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVidWlsZCc7XG5cbmV4cG9ydCBjbGFzcyBQaXBlbGluZVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3QgcGlwZWxpbmUgPSBuZXcgUGlwZWxpbmUodGhpcywgJ1BpcGVsaW5lJywge1xuICAgICAgcGlwZWxpbmVOYW1lOiAnUGlwZWxpbmUnLFxuICAgICAgY3Jvc3NBY2NvdW50S2V5czogZmFsc2VcbiAgICB9KTtcblxuICAgIGNvbnN0IHNvdXJjZU91dHB1dCA9IG5ldyBBcnRpZmFjdCgnU291cmNlT3V0cHV0Jyk7XG4gICAgcGlwZWxpbmUuYWRkU3RhZ2Uoe1xuICAgICAgc3RhZ2VOYW1lOiAnU291cmNlJyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgbmV3IEdpdEh1YlNvdXJjZUFjdGlvbih7XG4gICAgICAgICAgb3duZXI6ICdETnlhaWthJyxcbiAgICAgICAgICByZXBvOiAnYXdzLXBpcGVsaW5lJyxcbiAgICAgICAgICBicmFuY2g6ICdtYWluJyxcbiAgICAgICAgICBhY3Rpb25OYW1lOiAncGlwZWxpbmUtc291cmNlJyxcbiAgICAgICAgICBvYXV0aFRva2VuOiBTZWNyZXRWYWx1ZS5zZWNyZXRzTWFuYWdlcignZ2l0aHViLXBpcGVsaW5lLXRva2VuJyksXG4gICAgICAgICAgb3V0cHV0OiBzb3VyY2VPdXRwdXRcbiAgICAgICAgfSlcbiAgICAgIF1cbiAgICB9KTtcblxuICAgIGNvbnN0IGNka0J1aWxkT3V0cHV0ID0gbmV3IEFydGlmYWN0KCdDREtCdWlsZE91dHB1dCcpO1xuICAgIHBpcGVsaW5lLmFkZFN0YWdlKHtcbiAgICAgIHN0YWdlTmFtZTogJ0J1aWxkJyxcbiAgICAgIGFjdGlvbnM6IFtuZXcgQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgICAgYWN0aW9uTmFtZTogJ0NES19CdWlsZCcsXG4gICAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICAgIG91dHB1dHM6IFtjZGtCdWlsZE91dHB1dF0sXG4gICAgICAgIHByb2plY3Q6IG5ldyBQaXBlbGluZVByb2plY3QodGhpcywgJ0NES0J1aWxkUHJvamVjdCcsIHtcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgYnVpbGRJbWFnZTogTGludXhCdWlsZEltYWdlLlNUQU5EQVJEXzVfMFxuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBidWlsZFNwZWM6IEJ1aWxkU3BlYy5mcm9tU291cmNlRmlsZW5hbWUoJ2J1aWxkLXNwZWNzL2Nkay1idWlsZC1zcGVjLnltbCcpXG4gICAgICAgIH0pXG4gICAgICB9KV1cbiAgICB9KTtcbiAgfVxufVxuIl19