import * as path from 'path';
import * as fs from 'fs';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Alias, Function, Runtime, Code, CfnParametersCode } from 'aws-cdk-lib/aws-lambda';
import { LambdaDeploymentGroup, LambdaDeploymentConfig } from 'aws-cdk-lib/aws-codedeploy';
import { Stack, StackProps, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { TreatMissingData, Statistic, ComparisonOperator } from 'aws-cdk-lib/aws-cloudwatch';
import { Canary, Code as SyntheticsCode, Runtime as SyntheticsRuntime, Schedule } from 'aws-cdk-lib/aws-synthetics';

interface ServiceStackProps extends StackProps {
    stageName: string;
}

export class ServiceStack extends Stack {
    public readonly serviceCode: CfnParametersCode;
    public readonly serviceEndpointOutput: CfnOutput;

    constructor(scope: Construct, id: string, props?: ServiceStackProps) {
        super(scope, id, props);
        this.serviceCode = Code.fromCfnParameters();

        const lambda = new Function(this, 'ServiceLambda', {
            runtime: Runtime.NODEJS_18_X,
            handler: 'src/lambda.handler',
            code: this.serviceCode,
            functionName: `ServiceLambda${props?.stageName}`,
            description: `Generated on ${new Date().toISOString()}`,
        });

        // Sanitize stageName to remove invalid characters and ensure length constraints
        const sanitizedStageName = props?.stageName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);

        const alias = new Alias(this, 'ServiceLambdaAlias', {
            version: lambda.currentVersion,
            aliasName: `ServiceLambdaAlias${sanitizedStageName}`,
        });

        const httpApi = new HttpApi(this, 'ServiceApi', {
            defaultIntegration: new HttpLambdaIntegration('ServiceLambdaIntegration', alias),
            apiName: `ServiceApi${props?.stageName}`,
        });

        if (props?.stageName === 'Prod') {
            new LambdaDeploymentGroup(this, 'DeploymentGroup', {
                alias: alias,
                deploymentConfig: LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
            });
        }

        httpApi.metricServerError()
            .with({
                period: Duration.minutes(1),
                statistic: Statistic.SUM,
            })
            .createAlarm(this, 'ServiceErrorAlarm', {
                threshold: 1,
                alarmDescription: 'Service is experiencing errors',
                alarmName: `ServiceErrorAlarm${props?.stageName}`,
                evaluationPeriods: 1,
                treatMissingData: TreatMissingData.NOT_BREACHING,
                comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            });

        const canaryScriptPath = path.join(__dirname, "../../canary/canary.ts");
        const canaryScript = fs.readFileSync(path.join(canaryScriptPath, "../../canary/canary.ts"), { encoding: 'utf-8' });

        new Canary(this, 'ServiceHealthCanary', {
            runtime: SyntheticsRuntime.SYNTHETICS_NODEJS_PUPPETEER_3_8,
            canaryName: 'service-canary',
            schedule: Schedule.rate(Duration.minutes(5)),
            environmentVariables: {
                API_ENDPOINT: httpApi.apiEndpoint,
            },
            test: {
                code: SyntheticsCode.fromInline(canaryScript),
                handler: 'index.handler',
            },
            timeToLive: Duration.days(1),
        });

        this.serviceEndpointOutput = new CfnOutput(this, 'ApiEndpointOutput', {
            exportName: `ServiceEndpoint${props?.stageName}`,
            value: httpApi.apiEndpoint,
            description: 'API Endpoint'
        });
    }
}