export {};
/**
test('Adding service stage', () => {
    // GIVEN
    const app = new cdk.App();
    const pipelineStack = new PipelineStack(app, 'PipelineStack');
    const serviceStack = new ServiceStack(app, 'ServiceStack',{
        stageName: 'Test',
    });
    // WHEN
    const stage = pipelineStack.addServiceStage(serviceStack, 'Test');
    // THEN
    expectCDK(pipelineStack).to(haveResourceLike('AWS::CodePipeline::Pipeline', {
        Stages: arrayWith(
            objectLike({
                Name: "Test"
            })
        ),
    }));
});
*/
/**

test('Adding billing stack to stage', () => {
    // GIVEN
    const app = new cdk.App();
    const serviceStack = new ServiceStack(app, 'ServiceStack');
    const pipelineStack = new PipelineStack(app, 'PipelineStack');
    const billingStack = new BillingStack(app, 'BillingStack', {
        budgetAmount: 5,
        emailAddress: 'test@example.com'
    });
    const stage = pipelineStack.addServiceStage(serviceStack, 'Test');

    console.log(`Adding billing stack ${billingStack.stackName} to stage ${stage?.stageName}`);

    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(pipelineStack)));

    // WHEN
    pipelineStack.addBillingStage(billingStack, stage);

    // THEN
    expectCDK(pipelineStack).to(haveResourceLike('AWS::CodePipeline::Pipeline', {
        Stages: arrayWith(
            objectLike({
                Name: "Test",
                Actions: arrayWith(
                    objectLike({
                        Name: "Billing_Update"
                    })
                )
            })
        )
    }));
});
 */ 
