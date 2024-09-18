#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const cdk = require("aws-cdk-lib");
const pipeline_stack_1 = require("../lib/pipeline-stack");
const billing_stack_1 = require("../lib/billing-stack");
const app = new cdk.App();
new pipeline_stack_1.PipelineStack(app, "PipelineStack", {});
new billing_stack_1.BillingStack(app, "BillingStack", {
    budgetAmount: 5,
    emailAddress: "davidnyaika2@gmail.com"
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwaWxpbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaXBpbGluZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSx1Q0FBcUM7QUFDckMsbUNBQW1DO0FBQ25DLDBEQUFzRDtBQUN0RCx3REFBb0Q7QUFFcEQsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDMUIsSUFBSSw4QkFBYSxDQUFDLEdBQUcsRUFBRSxlQUFlLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDNUMsSUFBSSw0QkFBWSxDQUFDLEdBQUcsRUFBRSxjQUFjLEVBQUU7SUFDbEMsWUFBWSxFQUFFLENBQUM7SUFDZixZQUFZLEVBQUUsd0JBQXdCO0NBQ3pDLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBQaXBlbGluZVN0YWNrIH0gZnJvbSBcIi4uL2xpYi9waXBlbGluZS1zdGFja1wiO1xuaW1wb3J0IHsgQmlsbGluZ1N0YWNrIH0gZnJvbSBcIi4uL2xpYi9iaWxsaW5nLXN0YWNrXCI7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5uZXcgUGlwZWxpbmVTdGFjayhhcHAsIFwiUGlwZWxpbmVTdGFja1wiLCB7fSk7XG5uZXcgQmlsbGluZ1N0YWNrKGFwcCwgXCJCaWxsaW5nU3RhY2tcIiwge1xuICAgIGJ1ZGdldEFtb3VudDogNSxcbiAgICBlbWFpbEFkZHJlc3M6IFwiZGF2aWRueWFpa2EyQGdtYWlsLmNvbVwiXG59KSJdfQ==