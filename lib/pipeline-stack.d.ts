import * as cdk from 'aws-cdk-lib';
import { IStage } from 'aws-cdk-lib/aws-codepipeline';
import { Construct } from 'constructs';
import { ServiceStack } from './service-stack';
import { BillingStack } from './billing-stack';
export declare class PipelineStack extends cdk.Stack {
    private readonly pipeline;
    private readonly cdkBuildOutput;
    private readonly serviceBuildOutput;
    private readonly serviceSourceOutput;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
    addServiceStage(serviceStack: ServiceStack, stageName: string): IStage;
    addBillingStage(billingStack: BillingStack, stage: IStage): void;
    addServiceIntegrationTestToStage(stage: IStage, serviceEndPoint: string): void;
}
