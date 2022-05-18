import crypto from 'crypto'
const algorithm = 'aes-256-ctr'

const encryptRSA = (publicKey, data) =>
    crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        // We convert the data string to a buffer using `Buffer.from`
        Buffer.from(data)
    );

const decryptRSA = (privateKey, encryptedData) =>
    crypto.privateDecrypt(
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        encryptedData
    );
const encryptAES = (buffer, password) => {
    var cipher = crypto.createCipher(algorithm, password)
    var crypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return crypted;
}

const decryptAES = (buffer, password) => {
    var decipher = crypto.createDecipher(algorithm, password)
    var dec = Buffer.concat([decipher.update(buffer), decipher.final()]);
    return dec;
}
export { encryptRSA, decryptRSA, encryptAES, decryptAES }