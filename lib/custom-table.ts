import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Table, AttributeType } from 'aws-cdk-lib/aws-dynamodb';

/**
 * Crea una tabla personalizada de DynamoDB en la pila actual.
 * @param stack - La pila en la que se creará la tabla.
 * @param tableName - El nombre de la tabla a crear.
 * @param idName - El nombre de la clave primaria de la tabla.
 * @returns La instancia de la tabla creada.
 */
export function createCustomTable(stack: Stack, tableName: string, idName: string): Table {
  return new Table(stack, tableName, {
    partitionKey: { name: idName, type: AttributeType.STRING },
    tableName: `${stack.stackName}-${tableName}`,
    removalPolicy: RemovalPolicy.DESTROY,
  });
}