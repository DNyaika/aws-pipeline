import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Code, Function, Runtime, InlineCode, CfnParametersCode } from 'aws-cdk-lib/aws-lambda';
import { HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Alias } from 'aws-cdk-lib/aws-lambda';
import { Version } from 'aws-cdk-lib/aws-lambda';
import { LambdaDeploymentGroup, LambdaDeploymentConfig } from 'aws-cdk-lib/aws-codedeploy';

interface ServiceStackProps extends StackProps{
    stageName: string;
}

export class ServiceStack extends Stack{
    public readonly serviceCode: CfnParametersCode;
    public readonly serviceEndpointOutput: CfnOutput;
    constructor(scope: Construct, id: string, props?: ServiceStackProps){
        super(scope, id, props);
        this.serviceCode = Code.fromCfnParameters();

        const lambda = new Function(this, 'ServiceLambda', {
            runtime: Runtime.NODEJS_18_X,
            handler: 'src/lambda.handler',
            code: this.serviceCode,
            functionName: `ServiceLambda${props?.stageName}`,
            description: 'Generated on ${new Date().toISOString()}',
        });

        const alias = new Alias(this, 'ServiceLambdaAlias', {
            version: lambda.currentVersion,
            aliasName: 'ServiceLambdaAlias${props?.stageName}',
           
        });

        const httpApi=new HttpApi(this, 'ServiceApi', {
            defaultIntegration: new HttpLambdaIntegration('ServiceLambdaIntegration', alias),
            apiName: `ServiceApi${props?.stageName}`,
        });

        if(props?.stageName === 'Prod'){
        new LambdaDeploymentGroup(this, 'DeploymentGroup', {
            alias:alias,
            deploymentConfig: LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
        });
        }



        this.serviceEndpointOutput =new CfnOutput(this, 'ApiEndpointOutput', {
            exportName: `ServiceEndpoint${props?.stageName}`,
            value:httpApi.apiEndpoint,
            description: 'API Endpoint'
        })
    }
}