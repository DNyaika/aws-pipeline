"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Budget = void 0;
const constructs_1 = require("constructs");
const aws_budgets_1 = require("aws-cdk-lib/aws-budgets");
class Budget extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        new aws_budgets_1.CfnBudget(this, "Budget", {
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
exports.Budget = Budget;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQnVkZ2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQnVkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDJDQUF1QztBQUN2Qyx5REFBb0Q7QUFPcEQsTUFBYSxNQUFPLFNBQVEsc0JBQVM7SUFDakMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUN4RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLElBQUksdUJBQVMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFO1lBQzFCLE1BQU0sRUFBRTtnQkFDSixXQUFXLEVBQUU7b0JBQ1QsTUFBTSxFQUFFLEtBQUssQ0FBQyxZQUFZO29CQUMxQixJQUFJLEVBQUUsS0FBSztpQkFDZDtnQkFDRCxVQUFVLEVBQUUsZ0JBQWdCO2dCQUM1QixRQUFRLEVBQUUsU0FBUztnQkFDbkIsVUFBVSxFQUFFLE1BQU07YUFDckI7WUFDRCw0QkFBNEIsRUFBRTtnQkFDMUI7b0JBQ0ksWUFBWSxFQUFFO3dCQUNWLGtCQUFrQixFQUFFLGNBQWM7d0JBQ2xDLGdCQUFnQixFQUFFLFFBQVE7d0JBQzFCLFNBQVMsRUFBRSxHQUFHO3FCQUNqQjtvQkFDRCxXQUFXLEVBQUU7d0JBQ1Q7NEJBQ0ksT0FBTyxFQUFFLEtBQUssQ0FBQyxZQUFZOzRCQUMzQixnQkFBZ0IsRUFBRSxPQUFPO3lCQUM1QjtxQkFDSjtpQkFDSjthQUNKO1NBQ0osQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBL0JELHdCQStCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgQ2ZuQnVkZ2V0IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWJ1ZGdldHMnO1xuXG5pbnRlcmZhY2UgQnVkZ2V0UHJvcHMge1xuICAgIGJ1ZGdldEFtb3VudDogbnVtYmVyO1xuICAgIGVtYWlsQWRkcmVzczogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQnVkZ2V0IGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQnVkZ2V0UHJvcHMpIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgICAgICBuZXcgQ2ZuQnVkZ2V0KHRoaXMsIFwiQnVkZ2V0XCIsIHtcbiAgICAgICAgICAgIGJ1ZGdldDoge1xuICAgICAgICAgICAgICAgIGJ1ZGdldExpbWl0OiB7XG4gICAgICAgICAgICAgICAgICAgIGFtb3VudDogcHJvcHMuYnVkZ2V0QW1vdW50LFxuICAgICAgICAgICAgICAgICAgICB1bml0OiAnVVNEJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYnVkZ2V0TmFtZTogXCJNb250aGx5IEJ1ZGdldFwiLFxuICAgICAgICAgICAgICAgIHRpbWVVbml0OiBcIk1PTlRITFlcIixcbiAgICAgICAgICAgICAgICBidWRnZXRUeXBlOiBcIkNPU1RcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbnNXaXRoU3Vic2NyaWJlcnM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiBcIkdSRUFURVJfVEhBTlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uVHlwZTogXCJBQ1RVQUxcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocmVzaG9sZDogMTAwXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJzOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkcmVzczogcHJvcHMuZW1haWxBZGRyZXNzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvblR5cGU6IFwiRU1BSUxcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9KTtcbiAgICB9XG59Il19