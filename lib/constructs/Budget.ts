import { Construct } from 'constructs';
import { CfnBudget } from 'aws-cdk-lib/aws-budgets';

interface BudgetProps {
    budgetAmount: number;
    emailAddress: string;
}

export class Budget extends Construct {
    constructor(scope: Construct, id: string, props: BudgetProps) {
        super(scope, id);

        new CfnBudget(this, "Budget", {
            budget: {
                budgetLimit: {
                    amount: props.budgetAmount,
                    unit: 'USD'
                },
                budgetName: "Monthly Budget",
                timeUnit: "MONTHLY",
                budgetType: "COST"
            },
            notificationsWithSubscribers: [
                {
                    notification: {
                        comparisonOperator: "GREATER_THAN",
                        notificationType: "ACTUAL",
                        threshold: 100
                    },
                    subscribers: [
                        {
                            address: props.emailAddress,
                            subscriptionType: "EMAIL"
                        }
                    ]
                }
            ]
        });
    }
}