import { App } from 'aws-cdk-lib';
import { BillingStack } from '../lib/billing-stack';
import { Template } from 'aws-cdk-lib/assertions';

test("Billing Stack", () => {
    const app = new App();
    const stack = new BillingStack(app, 'TestStack', {
        budgetAmount: 1,
        emailAddress: "test@example.com",
    });
    
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
});