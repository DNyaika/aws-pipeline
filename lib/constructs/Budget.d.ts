import { Construct } from 'constructs';
interface BudgetProps {
    budgetAmount: number;
    emailAddress: string;
}
export declare class Budget extends Construct {
    constructor(scope: Construct, id: string, props: BudgetProps);
}
export {};
