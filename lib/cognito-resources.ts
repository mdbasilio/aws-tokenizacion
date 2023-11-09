import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { UserPool, ResourceServerScope, OAuthScope, UserPoolResourceServer } from 'aws-cdk-lib/aws-cognito';


/**
 * Crea recursos de Cognito, incluyendo un grupo de usuarios, servidor de recursos y cliente de usuario, en la pila actual.
 * @param stack - La pila en la que se crearán los recursos de Cognito.
 * @returns La instancia del grupo de usuarios (UserPool) creada.
 */
export function createCognitoResources(stack: Stack): UserPool {
  const group = `${stack.stackName}-gpo`;
  const userPool = new UserPool(stack, group, {
    userPoolName: group,
    signInAliases: {
      username: true,
      email: true,
    },
    autoVerify: { email: true },
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const scopeName = `${stack.stackName}-scope`;
  const apiReadScope = new ResourceServerScope({
    scopeName,
    scopeDescription: 'ms-tokenizacion-thales scope',
  });

  const srvName = `${stack.stackName}-srv`;
  const resourceServer = new UserPoolResourceServer(stack, srvName, {
    identifier: srvName,
    userPool,
    scopes: [apiReadScope],
  });

  userPool.addClient(`${stack.stackName}-cli`, {
    userPoolClientName: `${stack.stackName}-cli`,
    generateSecret: true,
    oAuth: {
      flows: {
        clientCredentials: true,
        authorizationCodeGrant: false,
        implicitCodeGrant: false,
      },
      scopes: [OAuthScope.resourceServer(resourceServer, apiReadScope)],
    },
    accessTokenValidity: Duration.minutes(60),
  });

  userPool.addDomain('cognito-domain', {
    cognitoDomain: {
      domainPrefix: `${stack.stackName}`,
    },
  });

  return userPool;
}
