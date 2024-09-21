import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/pipeline-stack';
import { Template } from 'aws-cdk-lib/assertions';

test('Pipeline Stack', () => {
    const app = new cdk.App();
    const stack = new PipelineStack(app, 'TestStack');
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
});
