import { Stack } from 'aws-cdk-lib';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Role } from 'aws-cdk-lib/aws-iam';
import path = require('path');


export function createFnCardCredentials(
    stack: Stack,
    environment: any,
    role: Role,
    props: NodejsFunctionProps
): NodejsFunction {
    return new NodejsFunction(stack, `card_credentials`, {
        functionName: `${stack.stackName}-card_credentials`,
        environment,
        role,
        memorySize: 1024,
        handler: 'handler',
        entry: path.join(__dirname, `/../src/functions/card_credentials/card_credentials.ts`),
        ...props,
    });
}
