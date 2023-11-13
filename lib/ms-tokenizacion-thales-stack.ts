import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { createCustomTable } from './custom-table';
import { createCognitoResources } from './cognito-resources';
import { createRole } from './iam-role';
import { createFnConsumerInfo } from './lambda-consumer-info';
import { createFnVerifyCard } from './lambda-verify-card';

export class MsTokenizacionThalesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const config: any = props?.tags;
    console.log('#### config props', config);

    const cardTcTable = createCustomTable(this, 'tcr_m_cards', 'cardId');
    const cardTdTable = createCustomTable(this, 'tde_m_cards', 'cardId');
    const operationTcTable = createCustomTable(this, 'tcr_t_operacion', 'operationId');
    const operationTdTable = createCustomTable(this, 'tde_t_operacion', 'operationId');
    const consumerTable = createCustomTable(this, 'tcd_t_consumidor', 'consumerId');

    const userPool = createCognitoResources(this);
    
    const roleStack = createRole(this);

    const envFnVerifyCard = {
      CARD_TC_TABLE: cardTcTable.tableName,
      CARD_TD_TABLE: cardTdTable.tableName,
      CONSUMER_TABLE: consumerTable.tableName,
      VERIFY_URL: config.VERIFY_URL,
      VERIFY_CONTEXT: config.VERIFY_CONTEXT,
      VERIFY_VERSION: config.VERIFY_VERSION,
      VERIFY_METHOD: config.VERIFY_METHOD
    };
    const verifyCardFn = createFnVerifyCard(this, envFnVerifyCard, roleStack, this.nodejsFunctionProps());

    const envFnConsumerInfo = {
      CONSUMER_TABLE: consumerTable.tableName,
    };
    const consumerInfoFn = createFnConsumerInfo(this, envFnConsumerInfo, roleStack, this.nodejsFunctionProps());

    const envFnCardCredentials = {
      CARD_TC_TABLE: cardTcTable.tableName,
      CARD_TD_TABLE: cardTdTable.tableName,
      CREDENTIALS_URL: config.CREDENTIALS_URL,
      CREDENTIALS_CONTEXT: config.CREDENTIALS_CONTEXT,
      CREDENTIALS_VERSION: config.CREDENTIALS_VERSION,
      CREDENTIALS_METHOD: config.CREDENTIALS_METHOD
    };
    const cardCredentialsFn = createFnVerifyCard(this, envFnCardCredentials, roleStack, this.nodejsFunctionProps());
    
    const lambdaPolicy = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [consumerInfoFn.functionArn],
    });


    const envFnNotifyCard = {
      CONSUMER_TABLE: consumerTable.tableName,
    };
    const notifyCardFn = createFnVerifyCard(this, envFnNotifyCard, roleStack, this.nodejsFunctionProps());


    consumerInfoFn.addToRolePolicy(lambdaPolicy);
    consumerTable.grantReadData(consumerInfoFn);


    cardTcTable.grantWriteData(verifyCardFn);
    cardTdTable.grantWriteData(verifyCardFn);
    consumerTable.grantWriteData(verifyCardFn);

    cardTcTable.grantReadData(cardCredentialsFn);
    cardTdTable.grantReadData(cardCredentialsFn);

    operationTcTable.grantWriteData(notifyCardFn);
    operationTdTable.grantWriteData(notifyCardFn);

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

    authorizer._attachToApi(api);

    const authorizerWithAuth: apigateway.MethodOptions = {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.authorizerId,
      },
      authorizationScopes: [`${userPool.node.scope}`],
    };

    const verifyCardIntegration = new apigateway.LambdaIntegration(verifyCardFn);

    const consumerInfoIntegration = new apigateway.LambdaIntegration(consumerInfoFn);

    const cardCredentialsIntegration = new apigateway.LambdaIntegration(cardCredentialsFn);

    const notifyCardIntegration = new apigateway.LambdaIntegration(notifyCardFn);

    // Definir el recurso /issuers/{issuerId}/cards/credentials
    const veridyCardResource = api.root
      .addResource('issuers')
      .addResource('{issuerId}')
      .addResource('cards')
      .addResource('credentials');

    veridyCardResource.addMethod('POST', verifyCardIntegration, authorizerWithAuth);

    // Definir el recurso /issuers/{issuerId}/consumers/{consumerId}?cardId=<cardId>
    const consumerInfoResource = api.root
      .addResource('issuers')
      .addResource('{issuerId}')
      .addResource('consumers/{consumerId}');

    consumerInfoResource.addMethod('GET', consumerInfoIntegration, authorizerWithAuth);

    // Definir el recurso /issuers/{issuerId}/cards/{cardId}/credentials
    const credentialsResource = api.root
      .addResource('issuers')
      .addResource('{issuerId}')
      .addResource('cards')
      .addResource('{cardId}')
      .addResource('credentials');

    credentialsResource.addMethod('GET', cardCredentialsIntegration, authorizerWithAuth);

    // Definir el recurso /issuers/{issuerId}/cards/{cardId}/notifications
    const notifyResource = api.root
      .addResource('issuers')
      .addResource('{issuerId}')
      .addResource('cards')
      .addResource('{cardId}')
      .addResource('notifications');

    notifyResource.addMethod('POST', notifyCardIntegration, authorizerWithAuth);
  }


  private createVpcLambda(config: any): ec2.IVpc {
    return ec2.Vpc.fromVpcAttributes(this, "ExistingVpcLambda", {
      vpcId: config.VPC_ID,
      availabilityZones: ["us-east-1a", "us-east-1b", "us-east-1c"],
    });
  }

  private createExistingSubnet(config: any): ec2.ISubnet[] {
    const subnetIdsLambdas = [config.SUBNET_1a, config.SUBNET_1b, config.SUBNET_1c];
    return subnetIdsLambdas.map((subnetId) => ec2.Subnet.fromSubnetId(this, subnetId, subnetId));
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
}