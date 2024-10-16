import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Code, Function, Runtime, InlineCode, CfnParametersCode } from 'aws-cdk-lib/aws-lambda';
import { HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Alias } from 'aws-cdk-lib/aws-lambda';
import { Version } from 'aws-cdk-lib/aws-lambda';
import { LambdaDeploymentGroup, LambdaDeploymentConfig } from 'aws-cdk-lib/aws-codedeploy';
import { ComparisonOperator, Statistic, TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch';
import { Duration } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Service } from 'aws-cdk-lib/aws-servicediscovery';
import { ServiceHealthCanary } from './constructs/service-health-canary';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';

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

        // Grant permissions for CloudWatch Logs
        lambda.addToRolePolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
            ],
            resources: ['*'], // You can restrict this to specific log groups if needed
        }));

        const alias = new Alias(this, 'ServiceLambdaAlias', {
            version: lambda.currentVersion,
            aliasName: `ServiceLambdaAlias${props?.stageName}`,

        });

        const httpApi = new HttpApi(this, 'ServiceApi', {
            defaultIntegration: new HttpLambdaIntegration('ServiceLambdaIntegration', alias),
            apiName: `ServiceApi${props?.stageName}`,
        });

        if (props?.stageName === 'Prod') {
            console.log('Entering the if statement: stageName is Prod');
            new LambdaDeploymentGroup(this, 'ServiceDeploymentGroup', {
                alias: alias,
                deploymentConfig: LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
                autoRollback: {
                    deploymentInAlarm: true,
                },
                alarms: [
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
                        }),
                ],

            });
  
            const alarmTopic = new Topic(this, 'ServiceAlarmTopic', {
                topicName: `ServiceAlarmTopic${props?.stageName}`,
            });

            alarmTopic.addSubscription(
               new EmailSubscription('davidnyaika2@gmail.com'),
            );

            new ServiceHealthCanary(this, 'ServiceHealthCanary', {
                apiEndpoint: httpApi.apiEndpoint,
                canaryName: "service-canary",
                alarmTopic: alarmTopic,
            });
        }


        this.serviceEndpointOutput = new CfnOutput(this, 'ApiEndpointOutput', {
            exportName: `ServiceEndpoint${props?.stageName}`,
            value: httpApi.apiEndpoint,
            description: 'API Endpoint'
        })
    }
}