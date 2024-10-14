#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from "../lib/pipeline-stack";
import { BillingStack } from "../lib/billing-stack";
import { ServiceStack } from '../lib/service-stack';
import { Environment } from 'aws-cdk-lib';

const usEast1Env: Environment = { account: '975550358131', region: 'us-east-1' };
const euWest1Env: Environment = { account: '975550358131', region: 'eu-west-1' };

const app = new cdk.App();
const pipelineStack=new PipelineStack(app, "PipelineStack", {
    env: usEast1Env
});
new BillingStack(app, "BillingStack", {
    env: usEast1Env,
    budgetAmount: 5,
    emailAddress: "davidnyaika2@gmail.com"
})

const serviceStackTest = new ServiceStack(app, "ServiceStackTest",{
    env: usEast1Env,
    stageName: 'Test',
});

const serviceStackProd = new ServiceStack(app, "ServiceStackProd",{
    env: usEast1Env,
    stageName: 'Prod',
});

const serviceStackProdBakup = new ServiceStack(app, "ServiceStackProdBackup",{
    env: euWest1Env,
    stageName: 'Prod',
} );

const stageTest = pipelineStack.addServiceStage(serviceStackTest, 'Test');
const prodStage=pipelineStack.addServiceStage(serviceStackProd, 'Prod');
pipelineStack.addServiceStage(serviceStackProdBakup, 'ProdBackup');
pipelineStack.addServiceIntegrationTestToStage(stageTest, serviceStackTest.serviceEndpointOutput.importValue);