import { Construct } from 'constructs';
import { CfnOutput, Duration } from 'aws-cdk-lib';
import { Canary, Runtime, Schedule, Test, Code } from 'aws-cdk-lib/aws-synthetics';
import * as fs from 'fs';
import * as path from 'path';
import { TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';

interface ServiceHealthCanaryProps {
    apiEndpoint: string;
    canaryName: string;
    alarmTopic:Topic;
}

export class ServiceHealthCanary extends Construct {
    constructor(scope: Construct, id: string, props: ServiceHealthCanaryProps) {
        super(scope, id);

        const canary = new Canary(this, props.canaryName, {
            runtime: Runtime.SYNTHETICS_NODEJS_PUPPETEER_6_2, // Updated to a non-deprecated runtime version
            canaryName: props.canaryName,
            schedule: Schedule.rate(Duration.minutes(1)),
            environmentVariables: {
                API_ENDPOINT: props.apiEndpoint,
                DEPLOYMENT_TRIGGER: Date.now().toString(),
            },
            test: Test.custom({
                code: Code.fromInline(
                    fs.readFileSync(path.join(__dirname, "../../canary/canary.ts"), { encoding: 'utf-8' })
                ),
                handler: 'index.handler',
            }),
            timeToLive: Duration.minutes(5),
        });

        const canaryFailedAlarm = canary.metricFailed().createAlarm(this, `${props.canaryName} + FailedAlarm`, {
            threshold: 1,
            alarmDescription: `Canary ${props.canaryName} has failed`,
            evaluationPeriods: 1,
            treatMissingData: TreatMissingData.NOT_BREACHING,
            alarmName: `${props.canaryName} + FailedAlarm`,
        });

        canaryFailedAlarm.addAlarmAction(new SnsAction(props.alarmTopic));
    }
}
