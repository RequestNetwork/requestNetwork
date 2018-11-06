import EthCrypto from 'eth-crypto';

/**
 * Function to manage Elliptic-curve cryptography
 */
export default {
    getAddressFromPrivateKey,
    recover,
    sign,
};

/**
 * Function to derive the address from an EC private key
 *
 * @param string privateKey the private key to derive
 *
 * @returns string the address
 */
function getAddressFromPrivateKey(privateKey: string): string {
    const pubkey = EthCrypto.publicKeyByPrivateKey(privateKey);
    const address = EthCrypto.publicKey.toAddress(pubkey);
    return address;
}

/**
 * Function sign data with ECDSA
 *
 * @param string data the data to sign
 *
 * @returns string the signature
 */
function sign(privateKey: string, data: string): string {
    return EthCrypto.sign(privateKey, data);
}

/**
 * Function to recover address from a signature
 *
 * @param string signature the signature
 * @param string data the data signed
 *
 * @returns string
 */
function recover(signature: string, data: string): string {
    return EthCrypto.recover(signature, data);
}
