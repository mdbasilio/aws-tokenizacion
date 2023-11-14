import { Duration, Stack } from 'aws-cdk-lib';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Role } from 'aws-cdk-lib/aws-iam';
import path = require('path');


export function createFnNotifyCard(
    stack: Stack,
    environment: any,
    role: Role
): NodejsFunction {
    return new NodejsFunction(stack, `notify-operation`, {
        functionName: `${stack.stackName}-notify-operation`,
        environment,
        role,
        memorySize: 1024,
        handler: 'handler',
        entry: path.join(__dirname, `/../src/functions/notify-card-op/notify-operation.ts`),
        bundling: {
            minify: false,
            externalModules: ["aws-sdk"],
        },
        timeout: Duration.seconds(25),
        runtime: Runtime.NODEJS_18_X,
        tracing: Tracing.ACTIVE,
        logRetention: 14,
    });
}
