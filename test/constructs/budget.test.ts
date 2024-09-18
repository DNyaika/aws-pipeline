import { App, Stack } from 'aws-cdk-lib';
import { Budget } from '../../lib/constructs/Budget';
import { expect as expectCDK, haveResource, haveResourceLike } from '@aws-cdk/assert';

test('Budget Construct', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    new Budget(stack, 'Budget', {
        budgetAmount: 1,
        emailAddress: "test@example.com",
    });
    expectCDK(stack).to(haveResourceLike('AWS::Budgets::Budget', {
        Budget: {
            BudgetLimit: {
                Amount: 1,
            },
        },
        NotificationsWithSubscribers: [
            {

                Subscribers: [
                    {
                        Address: "test@example.com",
                    }
                ]
            }
        ]
    }));
});