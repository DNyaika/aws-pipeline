import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/pipeline-stack';
import { SynthUtils } from '@aws-cdk/assert';

test('Pipeline Stack', () => {
    const app = new cdk.App();
    const stack = new PipelineStack(app, 'TestStack');
    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
}   );
