import { Duration, Stack } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Role } from 'aws-cdk-lib/aws-iam';
import path = require('path');
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';


export function createFnVerifyCard(
    stack: Stack,
    environment: any,
    role: Role
): NodejsFunction {
    return new NodejsFunction(stack, `verify_card`, {
        functionName: `${stack.stackName}-verify_card`,
        environment,
        role,
        memorySize: 1024,
        handler: 'handler',
        entry: path.join(__dirname, `/../src/functions/verify_card/verify_card.ts`),
        bundling: {
            minify: false,
            externalModules: ["aws-sdk"],
        },
        timeout: Duration.seconds(2.5),
        runtime: Runtime.NODEJS_18_X,
        tracing: Tracing.ACTIVE,
        logRetention: 14
    });
}
