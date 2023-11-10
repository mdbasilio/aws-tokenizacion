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
    const privateKey = "-----BEGIN EC PRIVATE KEY-----\r\nMHcCAQEEIFUvax1cOkuRkKFmypV7FtN5GR+1PjSXJ3yS0yGcn0R7oAoGCCqGSM49\r\nAwEHoUQDQgAEUbInEqNbZZZ9SJptBwKTKO6qslSyuWvMkVK44Bx/d8U9TF4cw1Uv\r\nRVHE5gmuQdyl7qxqnsgb4Ct7RBuitkOeAg==\r\n-----END EC PRIVATE KEY-----";

    const keystore = jose.JWK.createKeyStore();

    const ecJWK = await keystore.add(privateKey, "pem");
    const result = await jose.JWE.createDecrypt(ecJWK).decrypt(jwe);

    return JSON.parse(result.plaintext.toString());
}