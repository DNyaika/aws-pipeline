"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("aws-cdk-lib");
const assertions_1 = require("aws-cdk-lib/assertions");
const pipeline_stack_1 = require("../lib/pipeline-stack");
test('Pipeline Stack', () => {
    const app = new cdk.App();
    const stack = new pipeline_stack_1.PipelineStack(app, 'TestStack');
    const template = assertions_1.Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
});
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwaWxpbmUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBpcGlsaW5lLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBbUM7QUFDbkMsdURBQWtEO0FBRWxELDBEQUFzRDtBQUt0RCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO0lBQ3hCLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQzFCLE1BQU0sS0FBSyxHQUFHLElBQUksOEJBQWEsQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDbEQsTUFBTSxRQUFRLEdBQUcscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0MsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQ2hELENBQUMsQ0FBQyxDQUFDO0FBQ0g7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFtQkU7QUFDRjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQWtDRyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gJ2F3cy1jZGstbGliL2Fzc2VydGlvbnMnO1xuaW1wb3J0IHsgYXJyYXlXaXRoLCBleHBlY3QgYXMgZXhwZWN0Q0RLLCBoYXZlUmVzb3VyY2VMaWtlLCBvYmplY3RMaWtlIH0gZnJvbSAnQGF3cy1jZGsvYXNzZXJ0JztcbmltcG9ydCB7IFBpcGVsaW5lU3RhY2sgfSBmcm9tICcuLi9saWIvcGlwZWxpbmUtc3RhY2snO1xuaW1wb3J0IHsgU2VydmljZVN0YWNrIH0gZnJvbSAnLi4vbGliL3NlcnZpY2Utc3RhY2snO1xuaW1wb3J0IHsgQmlsbGluZ1N0YWNrIH0gZnJvbSAnLi4vbGliL2JpbGxpbmctc3RhY2snO1xuXG5cbnRlc3QoJ1BpcGVsaW5lIFN0YWNrJywgKCkgPT4ge1xuICAgIGNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG4gICAgY29uc3Qgc3RhY2sgPSBuZXcgUGlwZWxpbmVTdGFjayhhcHAsICdUZXN0U3RhY2snKTtcbiAgICBjb25zdCB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayhzdGFjayk7XG4gICAgZXhwZWN0KHRlbXBsYXRlLnRvSlNPTigpKS50b01hdGNoU25hcHNob3QoKTtcbn0pO1xuLyoqIFxudGVzdCgnQWRkaW5nIHNlcnZpY2Ugc3RhZ2UnLCAoKSA9PiB7XG4gICAgLy8gR0lWRU5cbiAgICBjb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuICAgIGNvbnN0IHBpcGVsaW5lU3RhY2sgPSBuZXcgUGlwZWxpbmVTdGFjayhhcHAsICdQaXBlbGluZVN0YWNrJyk7XG4gICAgY29uc3Qgc2VydmljZVN0YWNrID0gbmV3IFNlcnZpY2VTdGFjayhhcHAsICdTZXJ2aWNlU3RhY2snLHtcbiAgICAgICAgc3RhZ2VOYW1lOiAnVGVzdCcsXG4gICAgfSk7XG4gICAgLy8gV0hFTlxuICAgIGNvbnN0IHN0YWdlID0gcGlwZWxpbmVTdGFjay5hZGRTZXJ2aWNlU3RhZ2Uoc2VydmljZVN0YWNrLCAnVGVzdCcpO1xuICAgIC8vIFRIRU5cbiAgICBleHBlY3RDREsocGlwZWxpbmVTdGFjaykudG8oaGF2ZVJlc291cmNlTGlrZSgnQVdTOjpDb2RlUGlwZWxpbmU6OlBpcGVsaW5lJywge1xuICAgICAgICBTdGFnZXM6IGFycmF5V2l0aChcbiAgICAgICAgICAgIG9iamVjdExpa2Uoe1xuICAgICAgICAgICAgICAgIE5hbWU6IFwiVGVzdFwiXG4gICAgICAgICAgICB9KVxuICAgICAgICApLFxuICAgIH0pKTtcbn0pO1xuKi9cbi8qKlxuXG50ZXN0KCdBZGRpbmcgYmlsbGluZyBzdGFjayB0byBzdGFnZScsICgpID0+IHtcbiAgICAvLyBHSVZFTlxuICAgIGNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG4gICAgY29uc3Qgc2VydmljZVN0YWNrID0gbmV3IFNlcnZpY2VTdGFjayhhcHAsICdTZXJ2aWNlU3RhY2snKTtcbiAgICBjb25zdCBwaXBlbGluZVN0YWNrID0gbmV3IFBpcGVsaW5lU3RhY2soYXBwLCAnUGlwZWxpbmVTdGFjaycpO1xuICAgIGNvbnN0IGJpbGxpbmdTdGFjayA9IG5ldyBCaWxsaW5nU3RhY2soYXBwLCAnQmlsbGluZ1N0YWNrJywge1xuICAgICAgICBidWRnZXRBbW91bnQ6IDUsXG4gICAgICAgIGVtYWlsQWRkcmVzczogJ3Rlc3RAZXhhbXBsZS5jb20nXG4gICAgfSk7XG4gICAgY29uc3Qgc3RhZ2UgPSBwaXBlbGluZVN0YWNrLmFkZFNlcnZpY2VTdGFnZShzZXJ2aWNlU3RhY2ssICdUZXN0Jyk7XG5cbiAgICBjb25zb2xlLmxvZyhgQWRkaW5nIGJpbGxpbmcgc3RhY2sgJHtiaWxsaW5nU3RhY2suc3RhY2tOYW1lfSB0byBzdGFnZSAke3N0YWdlPy5zdGFnZU5hbWV9YCk7XG5cbiAgICBjb25zb2xlLmxvZyhPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhPYmplY3QuZ2V0UHJvdG90eXBlT2YocGlwZWxpbmVTdGFjaykpKTtcblxuICAgIC8vIFdIRU5cbiAgICBwaXBlbGluZVN0YWNrLmFkZEJpbGxpbmdTdGFnZShiaWxsaW5nU3RhY2ssIHN0YWdlKTtcblxuICAgIC8vIFRIRU5cbiAgICBleHBlY3RDREsocGlwZWxpbmVTdGFjaykudG8oaGF2ZVJlc291cmNlTGlrZSgnQVdTOjpDb2RlUGlwZWxpbmU6OlBpcGVsaW5lJywge1xuICAgICAgICBTdGFnZXM6IGFycmF5V2l0aChcbiAgICAgICAgICAgIG9iamVjdExpa2Uoe1xuICAgICAgICAgICAgICAgIE5hbWU6IFwiVGVzdFwiLFxuICAgICAgICAgICAgICAgIEFjdGlvbnM6IGFycmF5V2l0aChcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0TGlrZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBOYW1lOiBcIkJpbGxpbmdfVXBkYXRlXCJcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9KVxuICAgICAgICApXG4gICAgfSkpO1xufSk7XG4gKi8iXX0=