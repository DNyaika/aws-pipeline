import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Code, Function, Runtime, InlineCode, CfnParametersCode } from 'aws-cdk-lib/aws-lambda';
import { HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

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
        });

        const httpApi=new HttpApi(this, 'ServiceApi', {
            defaultIntegration: new HttpLambdaIntegration('ServiceLambdaIntegration', lambda),
            apiName: `ServiceApi${props?.stageName}`,
        });

        this.serviceEndpointOutput =new CfnOutput(this, 'ApiEndpointOutput', {
            exportName: `ServiceEndpoint${props?.stageName}`,
            value:httpApi.apiEndpoint,
            description: 'API Endpoint'
        })
    }
}