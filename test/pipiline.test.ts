import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/pipeline-stack';
import { Template } from 'aws-cdk-lib/assertions';
import { arrayWith, expect as expectCDK, haveResourceLike, objectLike } from '@aws-cdk/assert';
import { ServiceStack } from '../lib/service-stack'; // Add this line to import ServiceStack

test('Pipeline Stack', () => {
    const app = new cdk.App();
    const stack = new PipelineStack(app, 'TestStack');
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
});

test('Pipeline Stack', () => {
    //GIVEN
    const app = new cdk.App();
    const pipelineStack = new PipelineStack(app, 'PipelineStack');
    const serviceStack = new ServiceStack(app, 'ServiceStack');
    //WHEN
      pipelineStack.addServiceStage(serviceStack, 'Test');
    //THEN
    expectCDK(pipelineStack).to(haveResourceLike('AWS::CodePipeline::Pipeline', {
        Stages: arrayWith(
            objectLike({
                Name: "Test"
            })
        ),
    }));
});