import { SecretsManagerClient, GetSecretValueCommand, GetSecretValueCommandOutput } from "@aws-sdk/client-secrets-manager";

interface SecretResult {
    secretString?: string;
    secretBinary?: Uint8Array;
}

const getSecret = async (secretId: string): Promise<SecretResult> => {
    const client = new SecretsManagerClient();

    const input = {
        SecretId: secretId,
    };

    const command = new GetSecretValueCommand(input);

    try {
        const response: GetSecretValueCommandOutput = await client.send(command);

        if (response.SecretString) {
            return {
                secretString: response.SecretString,
            };
        } else if (response.SecretBinary) {
            return {
                secretBinary: response.SecretBinary,
            };
        } else {
            throw new Error("El secreto no tiene formato válido");
        }
    } catch (error) {
        console.error("Error al obtener el secreto:", error);
        throw error;
    }
}


export default getSecret;