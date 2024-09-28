"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("aws-cdk-lib");
const assertions_1 = require("aws-cdk-lib/assertions");
const assert_1 = require("@aws-cdk/assert");
const pipeline_stack_1 = require("../lib/pipeline-stack");
const service_stack_1 = require("../lib/service-stack");
test('Pipeline Stack', () => {
    const app = new cdk.App();
    const stack = new pipeline_stack_1.PipelineStack(app, 'TestStack');
    const template = assertions_1.Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
});
test('Adding service stage', () => {
    // GIVEN
    const app = new cdk.App();
    const pipelineStack = new pipeline_stack_1.PipelineStack(app, 'PipelineStack');
    const serviceStack = new service_stack_1.ServiceStack(app, 'ServiceStack', {
        stageName: 'Test',
    });
    // WHEN
    const stage = pipelineStack.addServiceStage(serviceStack, 'Test');
    // THEN
    (0, assert_1.expect)(pipelineStack).to((0, assert_1.haveResourceLike)('AWS::CodePipeline::Pipeline', {
        Stages: (0, assert_1.arrayWith)((0, assert_1.objectLike)({
            Name: "Test"
        })),
    }));
});
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwaWxpbmUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBpcGlsaW5lLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBbUM7QUFDbkMsdURBQWtEO0FBQ2xELDRDQUErRjtBQUMvRiwwREFBc0Q7QUFDdEQsd0RBQW9EO0FBR3BELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7SUFDeEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDMUIsTUFBTSxLQUFLLEdBQUcsSUFBSSw4QkFBYSxDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNsRCxNQUFNLFFBQVEsR0FBRyxxQkFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDaEQsQ0FBQyxDQUFDLENBQUM7QUFFSCxJQUFJLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO0lBQzlCLFFBQVE7SUFDUixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUMxQixNQUFNLGFBQWEsR0FBRyxJQUFJLDhCQUFhLENBQUMsR0FBRyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQzlELE1BQU0sWUFBWSxHQUFHLElBQUksNEJBQVksQ0FBQyxHQUFHLEVBQUUsY0FBYyxFQUFDO1FBQ3RELFNBQVMsRUFBRSxNQUFNO0tBQ3BCLENBQUMsQ0FBQztJQUNILE9BQU87SUFDUCxNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNsRSxPQUFPO0lBQ1AsSUFBQSxlQUFTLEVBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUEseUJBQWdCLEVBQUMsNkJBQTZCLEVBQUU7UUFDeEUsTUFBTSxFQUFFLElBQUEsa0JBQVMsRUFDYixJQUFBLG1CQUFVLEVBQUM7WUFDUCxJQUFJLEVBQUUsTUFBTTtTQUNmLENBQUMsQ0FDTDtLQUNKLENBQUMsQ0FBQyxDQUFDO0FBQ1IsQ0FBQyxDQUFDLENBQUM7QUFDSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQWtDRyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gJ2F3cy1jZGstbGliL2Fzc2VydGlvbnMnO1xuaW1wb3J0IHsgYXJyYXlXaXRoLCBleHBlY3QgYXMgZXhwZWN0Q0RLLCBoYXZlUmVzb3VyY2VMaWtlLCBvYmplY3RMaWtlIH0gZnJvbSAnQGF3cy1jZGsvYXNzZXJ0JztcbmltcG9ydCB7IFBpcGVsaW5lU3RhY2sgfSBmcm9tICcuLi9saWIvcGlwZWxpbmUtc3RhY2snO1xuaW1wb3J0IHsgU2VydmljZVN0YWNrIH0gZnJvbSAnLi4vbGliL3NlcnZpY2Utc3RhY2snO1xuaW1wb3J0IHsgQmlsbGluZ1N0YWNrIH0gZnJvbSAnLi4vbGliL2JpbGxpbmctc3RhY2snO1xuXG50ZXN0KCdQaXBlbGluZSBTdGFjaycsICgpID0+IHtcbiAgICBjb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuICAgIGNvbnN0IHN0YWNrID0gbmV3IFBpcGVsaW5lU3RhY2soYXBwLCAnVGVzdFN0YWNrJyk7XG4gICAgY29uc3QgdGVtcGxhdGUgPSBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spO1xuICAgIGV4cGVjdCh0ZW1wbGF0ZS50b0pTT04oKSkudG9NYXRjaFNuYXBzaG90KCk7XG59KTtcblxudGVzdCgnQWRkaW5nIHNlcnZpY2Ugc3RhZ2UnLCAoKSA9PiB7XG4gICAgLy8gR0lWRU5cbiAgICBjb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuICAgIGNvbnN0IHBpcGVsaW5lU3RhY2sgPSBuZXcgUGlwZWxpbmVTdGFjayhhcHAsICdQaXBlbGluZVN0YWNrJyk7XG4gICAgY29uc3Qgc2VydmljZVN0YWNrID0gbmV3IFNlcnZpY2VTdGFjayhhcHAsICdTZXJ2aWNlU3RhY2snLHtcbiAgICAgICAgc3RhZ2VOYW1lOiAnVGVzdCcsXG4gICAgfSk7XG4gICAgLy8gV0hFTlxuICAgIGNvbnN0IHN0YWdlID0gcGlwZWxpbmVTdGFjay5hZGRTZXJ2aWNlU3RhZ2Uoc2VydmljZVN0YWNrLCAnVGVzdCcpO1xuICAgIC8vIFRIRU5cbiAgICBleHBlY3RDREsocGlwZWxpbmVTdGFjaykudG8oaGF2ZVJlc291cmNlTGlrZSgnQVdTOjpDb2RlUGlwZWxpbmU6OlBpcGVsaW5lJywge1xuICAgICAgICBTdGFnZXM6IGFycmF5V2l0aChcbiAgICAgICAgICAgIG9iamVjdExpa2Uoe1xuICAgICAgICAgICAgICAgIE5hbWU6IFwiVGVzdFwiXG4gICAgICAgICAgICB9KVxuICAgICAgICApLFxuICAgIH0pKTtcbn0pO1xuLyoqXG5cbnRlc3QoJ0FkZGluZyBiaWxsaW5nIHN0YWNrIHRvIHN0YWdlJywgKCkgPT4ge1xuICAgIC8vIEdJVkVOXG4gICAgY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbiAgICBjb25zdCBzZXJ2aWNlU3RhY2sgPSBuZXcgU2VydmljZVN0YWNrKGFwcCwgJ1NlcnZpY2VTdGFjaycpO1xuICAgIGNvbnN0IHBpcGVsaW5lU3RhY2sgPSBuZXcgUGlwZWxpbmVTdGFjayhhcHAsICdQaXBlbGluZVN0YWNrJyk7XG4gICAgY29uc3QgYmlsbGluZ1N0YWNrID0gbmV3IEJpbGxpbmdTdGFjayhhcHAsICdCaWxsaW5nU3RhY2snLCB7XG4gICAgICAgIGJ1ZGdldEFtb3VudDogNSxcbiAgICAgICAgZW1haWxBZGRyZXNzOiAndGVzdEBleGFtcGxlLmNvbSdcbiAgICB9KTtcbiAgICBjb25zdCBzdGFnZSA9IHBpcGVsaW5lU3RhY2suYWRkU2VydmljZVN0YWdlKHNlcnZpY2VTdGFjaywgJ1Rlc3QnKTtcblxuICAgIGNvbnNvbGUubG9nKGBBZGRpbmcgYmlsbGluZyBzdGFjayAke2JpbGxpbmdTdGFjay5zdGFja05hbWV9IHRvIHN0YWdlICR7c3RhZ2U/LnN0YWdlTmFtZX1gKTtcblxuICAgIGNvbnNvbGUubG9nKE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKE9iamVjdC5nZXRQcm90b3R5cGVPZihwaXBlbGluZVN0YWNrKSkpO1xuXG4gICAgLy8gV0hFTlxuICAgIHBpcGVsaW5lU3RhY2suYWRkQmlsbGluZ1N0YWdlKGJpbGxpbmdTdGFjaywgc3RhZ2UpO1xuXG4gICAgLy8gVEhFTlxuICAgIGV4cGVjdENESyhwaXBlbGluZVN0YWNrKS50byhoYXZlUmVzb3VyY2VMaWtlKCdBV1M6OkNvZGVQaXBlbGluZTo6UGlwZWxpbmUnLCB7XG4gICAgICAgIFN0YWdlczogYXJyYXlXaXRoKFxuICAgICAgICAgICAgb2JqZWN0TGlrZSh7XG4gICAgICAgICAgICAgICAgTmFtZTogXCJUZXN0XCIsXG4gICAgICAgICAgICAgICAgQWN0aW9uczogYXJyYXlXaXRoKFxuICAgICAgICAgICAgICAgICAgICBvYmplY3RMaWtlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE5hbWU6IFwiQmlsbGluZ19VcGRhdGVcIlxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIClcbiAgICB9KSk7XG59KTtcbiAqLyJdfQ==