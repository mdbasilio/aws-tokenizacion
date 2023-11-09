import { Stack } from 'aws-cdk-lib';
import { Role, ServicePrincipal, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';


/**
 * Crea un rol de IAM para ser utilizado por funciones Lambda en la pila actual.
 * @param stack - La pila en la que se creará el rol.
 * @returns El rol de IAM creado con las políticas especificadas.
 */
export function createRole(stack: Stack): Role {
    const roleStack = new Role(stack, 'MyRole', {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    const cloudwatchPolicy = new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['logs:*'],
        resources: ['*'],
    });

    const secretsManagerPolicy = new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['secretsmanager:*'],
        resources: ['*'],
    });

    const networkingInterfaceLambda = new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ec2:*'],
        resources: ['*'],
    });

    roleStack.addToPolicy(cloudwatchPolicy);
    roleStack.addToPolicy(secretsManagerPolicy);
    roleStack.addToPolicy(networkingInterfaceLambda);

    return roleStack;
}
