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

    const envFnConsumerInfo = {
      CONSUMER_TABLE: consumerTable.tableName,
    };
    const consumerInfoRole = createRole(this);
    const consumerInfoFn = createFnConsumerInfo(this, envFnConsumerInfo, consumerInfoRole, this.nodejsFunctionProps());


    const verifyCardFn = createFnVerifyCard(this, envFnConsumerInfo, consumerInfoRole, this.nodejsFunctionProps());

    const lambdaPolicy = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [consumerInfoFn.functionArn],
    });

    consumerInfoFn.addToRolePolicy(lambdaPolicy);
    consumerTable.grantReadData(consumerInfoFn);

    //verifyCardFn.addToRolePolicy(lambdaPolicy);
    cardTcTable.grantWriteData(verifyCardFn);
    cardTdTable.grantWriteData(verifyCardFn);
    consumerTable.grantWriteData(verifyCardFn);

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

    const consumerInfoIntegration = new apigateway.LambdaIntegration(consumerInfoFn);

    const verifyCardIntegration = new apigateway.LambdaIntegration(verifyCardFn);
    //Definir el recurso /cms/api/v1/issuers/{issuerId}/cards/credentials
    const veridyCardResource = api.root
      //.addResource('cms')
      //.addResource('api')
      //.addResource('v1')
      .addResource('issuers')
      .addResource('{issuerId}')
      .addResource('cards')
      .addResource('credentials');

    // Definir el recurso /cms/api/v1/issuers/{issuerId}/cards/{cardId}/credentials
    const credentialsResource = api.root
      .addResource('issuers')
      .addResource('{issuerId}')
      .addResource('cards')
      .addResource('{cardId}')
      .addResource('credentials');


    const consumerInfoResource = api.root
      .addResource('issuers')
      .addResource('{issuerId}')
      .addResource('consumers/{consumerId}');


    veridyCardResource.addMethod('POST', verifyCardIntegration, authorizerWithAuth);

    consumerInfoResource.addMethod('GET', consumerInfoIntegration, authorizerWithAuth);

    consumerInfoResource.addMethod('GET', consumerInfoIntegration, authorizerWithAuth);
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