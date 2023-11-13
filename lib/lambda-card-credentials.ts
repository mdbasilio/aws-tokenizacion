import { Duration, Stack } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Role } from 'aws-cdk-lib/aws-iam';
import path = require('path');
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';


export function createFnCardCredentials(
    stack: Stack,
    environment: any,
    role: Role
): NodejsFunction {
    return new NodejsFunction(stack, `card_credentials`, {
        functionName: `${stack.stackName}-card_credentials`,
        environment,
        role,
        memorySize: 1024,
        handler: 'handler',
        entry: path.join(__dirname, `/../src/functions/card_credentials/card_credentials.ts`),
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
