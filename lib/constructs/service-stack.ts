import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Code, Function, Runtime, InlineCode } from 'aws-cdk-lib/aws-lambda';
import { HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { LambdaProxyIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export class ServiceStack extends Stack{
    public readonly serviceCode: Code;
    constructor(scope: Construct, id: string, props?: StackProps){
        super(scope, id, props);
        this.serviceCode = Code.fromCfnParameters();

        const lambda = new Function(this, 'ServiceLambda', {
            runtime: Runtime.NODEJS_18_X,
            handler: 'src/lambda.handler',
            code: this.serviceCode,
            functionName: 'ServiceLambda'
        });

        new HttpApi(this, 'ServiceApi', {
            defaultIntegration: new LambdaProxyIntegration({
                handler: lambda
            }),
            apiName: 'ServiceApi'
        });

    }
}