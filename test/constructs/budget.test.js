"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_cdk_lib_1 = require("aws-cdk-lib");
const Budget_1 = require("../../lib/constructs/Budget");
const assert_1 = require("@aws-cdk/assert");
test('Budget Construct', () => {
    const app = new aws_cdk_lib_1.App();
    const stack = new aws_cdk_lib_1.Stack(app, 'TestStack');
    new Budget_1.Budget(stack, 'Budget', {
        budgetAmount: 1,
        emailAddress: "test@example.com",
    });
    (0, assert_1.expect)(stack).to((0, assert_1.haveResourceLike)('AWS::Budgets::Budget', {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVkZ2V0LnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJidWRnZXQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDZDQUF5QztBQUN6Qyx3REFBcUQ7QUFDckQsNENBQXNGO0FBRXRGLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7SUFDMUIsTUFBTSxHQUFHLEdBQUcsSUFBSSxpQkFBRyxFQUFFLENBQUM7SUFDdEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxtQkFBSyxDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUMxQyxJQUFJLGVBQU0sQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFO1FBQ3hCLFlBQVksRUFBRSxDQUFDO1FBQ2YsWUFBWSxFQUFFLGtCQUFrQjtLQUNuQyxDQUFDLENBQUM7SUFDSCxJQUFBLGVBQVMsRUFBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBQSx5QkFBZ0IsRUFBQyxzQkFBc0IsRUFBRTtRQUN6RCxNQUFNLEVBQUU7WUFDSixXQUFXLEVBQUU7Z0JBQ1QsTUFBTSxFQUFFLENBQUM7YUFDWjtTQUNKO1FBQ0QsNEJBQTRCLEVBQUU7WUFDMUI7Z0JBRUksV0FBVyxFQUFFO29CQUNUO3dCQUNJLE9BQU8sRUFBRSxrQkFBa0I7cUJBQzlCO2lCQUNKO2FBQ0o7U0FDSjtLQUNKLENBQUMsQ0FBQyxDQUFDO0FBQ1IsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHAsIFN0YWNrIH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQnVkZ2V0IH0gZnJvbSAnLi4vLi4vbGliL2NvbnN0cnVjdHMvQnVkZ2V0JztcbmltcG9ydCB7IGV4cGVjdCBhcyBleHBlY3RDREssIGhhdmVSZXNvdXJjZSwgaGF2ZVJlc291cmNlTGlrZSB9IGZyb20gJ0Bhd3MtY2RrL2Fzc2VydCc7XG5cbnRlc3QoJ0J1ZGdldCBDb25zdHJ1Y3QnLCAoKSA9PiB7XG4gICAgY29uc3QgYXBwID0gbmV3IEFwcCgpO1xuICAgIGNvbnN0IHN0YWNrID0gbmV3IFN0YWNrKGFwcCwgJ1Rlc3RTdGFjaycpO1xuICAgIG5ldyBCdWRnZXQoc3RhY2ssICdCdWRnZXQnLCB7XG4gICAgICAgIGJ1ZGdldEFtb3VudDogMSxcbiAgICAgICAgZW1haWxBZGRyZXNzOiBcInRlc3RAZXhhbXBsZS5jb21cIixcbiAgICB9KTtcbiAgICBleHBlY3RDREsoc3RhY2spLnRvKGhhdmVSZXNvdXJjZUxpa2UoJ0FXUzo6QnVkZ2V0czo6QnVkZ2V0Jywge1xuICAgICAgICBCdWRnZXQ6IHtcbiAgICAgICAgICAgIEJ1ZGdldExpbWl0OiB7XG4gICAgICAgICAgICAgICAgQW1vdW50OiAxLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTm90aWZpY2F0aW9uc1dpdGhTdWJzY3JpYmVyczogW1xuICAgICAgICAgICAge1xuXG4gICAgICAgICAgICAgICAgU3Vic2NyaWJlcnM6IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgQWRkcmVzczogXCJ0ZXN0QGV4YW1wbGUuY29tXCIsXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9KSk7XG59KTsiXX0=