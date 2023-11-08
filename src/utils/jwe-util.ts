import * as jose from 'node-jose';

export const dataEncryption = async (payload: any) => {
    try {
        const keystore = jose.JWK.createKeyStore();

        const publicKey = JSON.stringify({
            "kty": "EC",
            "kid": "ASDsL-Jx2XOkRnFtqW-QblWY-mDnQW2LgapadFx75tA",
            "crv": "P-256",
            "x": "UbInEqNbZZZ9SJptBwKTKO6qslSyuWvMkVK44Bx_d8U",
            "y": "PUxeHMNVL0VRxOYJrkHcpe6sap7IG-Are0QborZDngI",
        });

        const fields = {
            "alg": "ECDH-ES",
            "enc": "A256GCM",
        };

        const ecPublicJWK = await keystore.add(publicKey, 'json');
        const encryptedData = await jose.JWE.createEncrypt({ format: "compact", fields }, ecPublicJWK).update(JSON.stringify(payload)).final();

        return encryptedData;
    } catch (error) {
        console.error(error);
        return null;
    }
}


export const dataDecryption = async (jwe: string) => {
    //const jwe = "eyJhbGciOiJFQ0RILUVTIiwiZW5jIjoiQTI1NkdDTSIsImtpZCI6IkFTRHNMLUp4MlhPa1JuRnRxVy1RYmxXWS1tRG5RVzJMZ2FwYWRGeDc1dEEiLCJlcGsiOnsia3R5IjoiRUMiLCJjcnYiOiJQLTI1NiIsIngiOiJoWGpLdmNWa3d2ZHR4M19sdnJqTmJtQkZfZW9BZjNMeGJCblBNVFJxY2JvIiwieSI6IlJHOEN5WDV5bW9oTGV0cTFhVzgzVG96UU1EaEdQbTNHNXlwZERmVy1mSlUifX0..6L__CO5yA3g4tkLY.HysY-036kmszNeXDdgP375x0NfFlobYYGoL51A5PQ4Js9y287qZZ.QFYcZCfC6JAo1-snZ6O5Cw";
    const privateKey = "-----BEGIN EC PRIVATE KEY-----\r\nMHcCAQEEIFUvax1cOkuRkKFmypV7FtN5GR+1PjSXJ3yS0yGcn0R7oAoGCCqGSM49\r\nAwEHoUQDQgAEUbInEqNbZZZ9SJptBwKTKO6qslSyuWvMkVK44Bx/d8U9TF4cw1Uv\r\nRVHE5gmuQdyl7qxqnsgb4Ct7RBuitkOeAg==\r\n-----END EC PRIVATE KEY-----";

    const keystore = jose.JWK.createKeyStore();

    const ecJWK = await keystore.add(privateKey, "pem");
    const result = await jose.JWE.createDecrypt(ecJWK).decrypt(jwe);
    console.log("Decryption result:", result.plaintext.toString());
}