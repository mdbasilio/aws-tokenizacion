import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from 'aws-cdk-lib/aws-iam';
import { ISubnet, IVpc, SecurityGroup, Subnet, Vpc } from 'aws-cdk-lib/aws-ec2';
import { createCustomTable } from './custom-table';
import { createCognitoResources } from './cognito-resources';
import { createRole } from './iam-role';
import createFnVerifyCard from './lambda-verify-card';
import createFnConsumerInfo from './lambda-consumer-info';
import createFnCardCredentials from './lambda-card-credentials';
import createFnNotifyCard from './lambda-notify-card';
import createFnDeliverOtp from './lambda-deliver-otp';

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

    const vpc = this.createVpcLambda(config);
    const subnets = this.createExistingSubnet(config);

    const securityGroup = SecurityGroup.fromSecurityGroupId(
      this, 'securityGroupLambda_1', config.SECURITY_GROUP_DEFAULT
    );

    const envFnVerifyCard = {
      CARD_TC_TABLE: cardTcTable.tableName,
      CARD_TD_TABLE: cardTdTable.tableName,
      CONSUMER_TABLE: consumerTable.tableName,
      VERIFY_URL: config.VERIFY_URL,
      VERIFY_CONTEXT: config.VERIFY_CONTEXT,
      VERIFY_VERSION: config.VERIFY_VERSION,
      VERIFY_METHOD: config.VERIFY_METHOD
    };
    const verifyCardFn = createFnVerifyCard(this, envFnVerifyCard, roleStack, vpc, subnets, securityGroup);

    const envFnConsumerInfo = {
      CONSUMER_TABLE: consumerTable.tableName,
    };
    const consumerInfoFn = createFnConsumerInfo(this, envFnConsumerInfo, roleStack);

    const envFnCardCredentials = {
      CARD_TC_TABLE: cardTcTable.tableName,
      CARD_TD_TABLE: cardTdTable.tableName,
      CREDENTIALS_URL: config.CREDENTIALS_URL,
      CREDENTIALS_CONTEXT: config.CREDENTIALS_CONTEXT,
      CREDENTIALS_VERSION: config.CREDENTIALS_VERSION,
      CREDENTIALS_METHOD: config.CREDENTIALS_METHOD
    };
    const cardCredentialsFn = createFnCardCredentials(this, envFnCardCredentials, roleStack, vpc, subnets, securityGroup);

    const lambdaPolicy = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [consumerInfoFn.functionArn],
    });

    const envFnNotifyCard = {
      CONSUMER_TABLE: consumerTable.tableName,
    };
    const notifyCardFn = createFnNotifyCard(this, envFnNotifyCard, roleStack);


    const envFnDeliverOtp = {
      MEDIOS_URL: config.MEDIOS_URL,
      LATINIA_SECRET: config.LATINIA_SECRET,
      LATINIA_URL: config.LATINIA_URL,
      NEMONICO: config.NEMONICO,
      COMPANY: config.COMPANY,
      CANAL: config.CANAL,
      MSG_LABEL: config.MSG_LABEL
    };
    const deliverOtpFn = createFnDeliverOtp(this, envFnDeliverOtp, roleStack, vpc, subnets, securityGroup);

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

    const delverOtpIntegration = new apigateway.LambdaIntegration(deliverOtpFn);

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

    // Definir el recurso /issuers/{issuerId}/consumers/{consumerId}/otp
    const deliverResource = api.root
      .addResource('issuers')
      .addResource('{issuerId}')
      .addResource('consumers')
      .addResource('{consumerId}')
      .addResource('otp');

    deliverResource.addMethod('POST', delverOtpIntegration, authorizerWithAuth);

  }


  private createVpcLambda(config: any): IVpc {
    return Vpc.fromVpcAttributes(this, "ExistingVpcLambda", {
      vpcId: config.VPC_ID,
      availabilityZones: ["us-east-1a", "us-east-1b", "us-east-1c"],
    });
  }

  private createExistingSubnet(config: any): ISubnet[] {
    const subnetIdsLambdas = [config.SUBNET_1a, config.SUBNET_1b, config.SUBNET_1c];
    return subnetIdsLambdas.map((subnetId) => Subnet.fromSubnetId(this, subnetId, subnetId));
  }
}