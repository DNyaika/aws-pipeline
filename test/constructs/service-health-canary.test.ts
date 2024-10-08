import { haveResourceLike, expect as expectCDK } from '@aws-cdk/assert';
import * as cdk from 'aws-cdk-lib';
import { ServiceHealthCanary } from '../../lib/constructs/service-health-canary'; // Adjust the import path as necessary

test("ServiceHealthCanary", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    new ServiceHealthCanary(stack, 'ServiceHealthCanary', {
        apiEndpoint: "api.example.com",
        canaryName: "test-canary"
    });

    expectCDK(stack).to(haveResourceLike('AWS::Synthetics::Canary', {
        RunConfig:{
            EnvironmentVariables: {
                API_ENDPOINT: "api.example.com"
            }
        }
    }));
});