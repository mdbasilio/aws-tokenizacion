import { Duration, Stack } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { Role } from 'aws-cdk-lib/aws-iam';
import path = require('path');


export function createFnConsumerInfo(
    stack: Stack,
    environment: any,
    role: Role
): NodejsFunction {
    return new NodejsFunction(stack, `consumer_info`, {
        functionName: `${stack.stackName}-consumer_info`,
        environment,
        role,
        memorySize: 1024,
        handler: 'handler',
        entry: path.join(__dirname, `/../src/functions/consumer_info/consumer_information.ts`),
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
