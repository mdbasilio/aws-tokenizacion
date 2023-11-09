import { Stack } from 'aws-cdk-lib';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Role } from 'aws-cdk-lib/aws-iam';
import path = require('path');


export function createFnVerifyCard(
    stack: Stack,
    environment: any,
    role: Role,
    props: NodejsFunctionProps
): NodejsFunction {
    return new NodejsFunction(stack, `verify_card`, {
        functionName: `${stack.stackName}-verify_card`,
        environment,
        role,
        memorySize: 1024,
        handler: 'handler',
        entry: path.join(__dirname, `/../src/functions/verify_card/verify_card.ts`),
        ...props,
    });
}
