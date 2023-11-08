import * as cdk from 'aws-cdk-lib';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import path = require('path');

export class MsTokenizacionThalesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const config: any = props?.tags;
    console.log('#### config props', config);

    //Tabla DynamoDB registro de cardId tarjetas de credito
    const cardTcTable = this.createCustomTable('tcr_m_cards', 'cardId');

    //Tabla DynamoDB registro de cardId tarjetas de debito
    const cardTdTable = this.createCustomTable('tde_m_cards', 'cardId');

    //Tabla DynamoDB registro de Operaciones tarjetas de credito
    const operationTcTable = this.createCustomTable('tcr_t_operacion', 'op_operationId');

    //Tabla Dynamo registro de Operaciones tarjetas de debito
    const operationTdTable = this.createCustomTable('tcd_t_consumidor', 'op_operationId');

    //Tabla Dynamo registro de datos del cliente
    const consumerTable = this.createCustomTable('tcd_t_consumidor', 'consumerId');

    const userPool = this.createCognitoResources();

    const envFnConsumerInfo = {
      CONSUMER_TABLE: consumerTable.tableName
    }

    const consumerInfoFn = this.createFnConsumerInfo(envFnConsumerInfo);

    // Define una política IAM inline para la función Lambda
    const lambdaPolicy = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [consumerInfoFn.functionArn],
    });

    // Agrega la política a la función Lambda
    consumerInfoFn.addToRolePolicy(lambdaPolicy);

    consumerTable.grantReadData(consumerInfoFn);

    /*************************** API GATEWAY *********************************************/

    //Autorizador de Cognito para proteger la API Gateway
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'SpacesApiAuthorizer', {
      cognitoUserPools: [userPool],
      identitySource: 'method.request.header.Authorization',
      authorizerName: 'cognito-autorizer',
    });


    // API Gateway
    const api = new apigateway.RestApi(this, `ApiGateway`, {
      restApiName: `${this.stackName}`,
      deployOptions: {
        stageName: `${config.STAGE}`,
        tracingEnabled: true
      }
    });

    // Adjuntar el autorizador de Cognito a la API Gateway
    authorizer._attachToApi(api);


    const authorizerWithAuth: apigateway.MethodOptions = {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.authorizerId,
      },
      authorizationScopes: [`${userPool.node.scope}`]
    };

    const consumerInfoIntegration = new apigateway.LambdaIntegration(consumerInfoFn);

    // Define un recurso para los emisores (issuers)
    const issuersResource = api.root.addResource('issuers');

    // Define un recurso para los consumidores (Id Banco)
    const consumersResource = issuersResource.addResource('{issuerId}');

    // Define la ruta con parámetros dinámicos para Get Consumer Information 
    //https://YOUR_DOMAIN_NAME/banking/d1/v1/issuers/{issuerId}/consumers/{consumerId}?cardId=<cardId>
    const consumerInfoResource = consumersResource.addResource('consumers/{consumerId}');

    // Asocia el método HTTP y la función Lambda a la ruta
    consumerInfoResource.addMethod('GET', consumerInfoIntegration, authorizerWithAuth);
  }

  private createCustomTable(tableName: string, idName: string): Table {
    return new Table(this, tableName, {
      partitionKey: { name: idName, type: AttributeType.STRING },
      tableName: `${this.stackName}-${tableName}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }


  private createCognitoResources(): cognito.UserPool {
    const group = `${this.stackName}-gpo`;
    const userPool = new cognito.UserPool(this, group, {
      userPoolName: group,
      signInAliases: {
        username: true,
        email: true,
      },
      autoVerify: { email: true },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const scopeName = `${this.stackName}-scope`;
    const apiReadScope = new cognito.ResourceServerScope({
      scopeName,
      scopeDescription: 'ms-tokenizacion-thales scope',
    });

    const srvName = `${this.stackName}-srv`;
    const resourceServer = new cognito.UserPoolResourceServer(this, srvName, {
      identifier: srvName,
      userPool,
      scopes: [apiReadScope],
    });

    userPool.addClient(`${this.stackName}-cli`, {
      userPoolClientName: `${this.stackName}-cli`,
      generateSecret: true,
      oAuth: {
        flows: {
          clientCredentials: true,
          authorizationCodeGrant: false,
          implicitCodeGrant: false,
        },
        scopes: [cognito.OAuthScope.resourceServer(resourceServer, apiReadScope)],
      },
      accessTokenValidity: cdk.Duration.minutes(60),
    });

    userPool.addDomain('cognito-domain', {
      cognitoDomain: {
        domainPrefix: `${this.stackName}`,
      },
    });

    return userPool;
  }


  private nodejsFunctionProps(): NodejsFunctionProps {
    return {
      bundling: {
        minify: false,
        externalModules: ["aws-sdk"],
      },
      timeout: cdk.Duration.seconds(25),
      runtime: lambda.Runtime.NODEJS_18_X,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: 14,
    };
  }


  private createFnConsumerInfo(
    environment: any,
  ): NodejsFunction {
    return new NodejsFunction(this, `consumer_info`, {
      functionName: `${this.stackName}-consumer_info`,
      environment,
      memorySize: 1024,
      handler: 'handler',
      entry: path.join(__dirname, `/../src/functions/consumer_info/consumer_information.ts`),
      ...this.nodejsFunctionProps
    });
  }

  private createApiGateway(
    userPool: cognito.UserPool,
    config: any
  ): void {
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'SpacesApiAuthorizer', {
      cognitoUserPools: [userPool],
      identitySource: 'method.request.header.Authorization',
      authorizerName: 'cognito-autorizer',
    });

    const api = new apigateway.RestApi(this, `ApiGateway`, {
      restApiName: `${this.stackName}`,
      deployOptions: {
        stageName: `${config.STAGE}`,
        tracingEnabled: true,
      },
    });

    const authorizerWithAuth: apigateway.MethodOptions = {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.authorizerId,
      },
      authorizationScopes: [`${userPool.node.scope}`],
    };
  }
}