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

export class MsTokenizacionThalesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const config: any = props?.tags;
    console.log('#### config props', config);

    const cardTcTable = createCustomTable(this, 'tcr_m_cards', 'cardId');
    const cardTdTable = createCustomTable(this, 'tde_m_cards', 'cardId');
    const operationTcTable = createCustomTable(this, 'tcr_t_operacion', 'op_operationId');
    const operationTdTable = createCustomTable(this, 'tde_t_operacion', 'op_operationId');
    const consumerTable = createCustomTable(this, 'tcd_t_consumidor', 'consumerId');

    const userPool = createCognitoResources(this);

    const envFnConsumerInfo = {
      CONSUMER_TABLE: consumerTable.tableName,
    };
    const consumerInfoRole = createRole(this);
    const consumerInfoFn = createFnConsumerInfo(this, envFnConsumerInfo, consumerInfoRole, this.nodejsFunctionProps());

    const lambdaPolicy = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [consumerInfoFn.functionArn],
    });

    consumerInfoFn.addToRolePolicy(lambdaPolicy);
    consumerTable.grantReadData(consumerInfoFn);

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

    const issuersResource = api.root.addResource('issuers');
    const consumersResource = issuersResource.addResource('{issuerId}');
    const consumerInfoResource = consumersResource.addResource('consumers/{consumerId}');
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