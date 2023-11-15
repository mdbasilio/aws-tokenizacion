import { Duration, Stack } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { ISubnet, IVpc } from 'aws-cdk-lib/aws-ec2';
import path = require('path');
import { VerifyCard } from './../config/config.json';

const nameFn = VerifyCard.nombre;

const createFnVerifyCard = (
    stack: Stack,
    environment: any,
    role: Role,
    vpc: IVpc,
    subnets: ISubnet[],
    securityGroup: any
): NodejsFunction => {
    return new NodejsFunction(stack, `${nameFn}`, {
        functionName: `${stack.stackName}-${nameFn}`,
        environment,
        role,
        memorySize: 1024,
        handler: 'handler',
        entry: path.join(__dirname, `/../src/functions/verify-card/verify-card.ts`),
        bundling: {
            minify: false,
            externalModules: ["aws-sdk"],
        },
        timeout: Duration.seconds(2.5),
        runtime: Runtime.NODEJS_18_X,
        tracing: Tracing.ACTIVE,
        logRetention: 14,
        vpc,
        vpcSubnets: { subnets },
        securityGroups: [securityGroup]
    });
}

export default createFnVerifyCard;