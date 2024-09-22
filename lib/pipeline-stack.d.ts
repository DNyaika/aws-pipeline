import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServiceStack } from './service-stack';
export declare class PipelineStack extends cdk.Stack {
    private readonly pipeline;
    private readonly cdkBuildOutput;
    private readonly serviceBuildOutput;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
    addServiceStage(serviceStack: ServiceStack, stageName: string): void;
}
