import { Duration, Stack } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Role } from 'aws-cdk-lib/aws-iam';
import path = require('path');
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { ISubnet, IVpc } from 'aws-cdk-lib/aws-ec2';


export function createFnDeliverOtp(
    stack: Stack,
    environment: any,
    role: Role,
    vpc: IVpc,
    subnets: ISubnet[],
    securityGroup: any
): NodejsFunction {
    return new NodejsFunction(stack, `card-credentials`, {
        functionName: `${stack.stackName}-card-credentials`,
        environment,
        role,
        memorySize: 1024,
        handler: 'handler',
        entry: path.join(__dirname, `/../src/functions/card-credentials/card-credentials.ts`),
        bundling: {
            minify: false,
            externalModules: ["aws-sdk"],
        },
        timeout: Duration.seconds(25),
        runtime: Runtime.NODEJS_18_X,
        tracing: Tracing.ACTIVE,
        logRetention: 14,
        vpc,
        vpcSubnets: { subnets },
        securityGroups: [securityGroup]
    });
}
