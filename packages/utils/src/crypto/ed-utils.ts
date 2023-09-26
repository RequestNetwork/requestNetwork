// import * as EcCrypto from 'eccrypto';
// import { publicKeyConvert, ecdsaRecover } from 'secp256k1';
// import { ethers } from 'ethers';

const circomlibjs = require('circomlibjs');

/**
 * Function to manage Elliptic-curve cryptography
 */
export {
  getAddressFromPrivateKey,
  getAddressFromPublicKey,
  getPublicKeyFromPrivateKey,
//   edRecover,
  edSign,
  edVerify,
  merkleTree8root,
  poseidonHash,
};

/**
 * Function to derive the address from an EC private key
 *
 * @param privateKey the private key to derive
 *
 * @returns the address
 */
async function getAddressFromPrivateKey(privateKey: string): Promise<string> {
  const poseidon = await circomlibjs.buildPoseidon();
    const eddsa = await circomlibjs.buildEddsa();
    const publicKey = eddsa.prv2pub(Buffer.from(privateKey, "hex"));
    const address = await poseidon(publicKey);
    
    return Buffer.from(address).toString('hex');
}

/**
 * Hashes with the poseidon algorithm
 *
 * @param data The string to hash
 * @returns The hashed data multi-formatted
 */
async function poseidonHash(data: string): Promise<string> {
  const poseidon = await circomlibjs.buildPoseidon();
  const hashBuff = await poseidon(Buffer.from(data));
  return Buffer.from(hashBuff).toString('hex');
}

/**
 * Function to derive the address from an EC public key
 *
 * @param publicKey the public key to derive
 *
 * @returns the address
 */
async function getPublicKeyFromPrivateKey(privateKey: string): Promise<string> {
  const eddsa = await circomlibjs.buildEddsa();

  const publicKey = eddsa.prv2pub(Buffer.from(privateKey, "hex"));

  const publicKeyHex = Buffer.from([...publicKey[0], ...publicKey[1]]).toString('hex');

  return publicKeyHex;
}


/**
 * Function to derive the address from an EC public key
 *
 * @param publicKey the public key to derive
 *
 * @returns the address
 */
async function getAddressFromPublicKey(publicKey: string): Promise<string> {
    const poseidon = await circomlibjs.buildPoseidon();

    const publicKeyLength = publicKey.length / 2;
    const Ax = Buffer.from(publicKey.slice(0,publicKeyLength), 'hex');
    const Ay = Buffer.from(publicKey.slice(publicKeyLength,publicKeyLength*2), 'hex');

    const address = await poseidon([Ax, Ay]);
    return Buffer.from(address).toString('hex');
}

/**
 * Function edSigndata with EDDSA
 *
 * @param data the data to sign
 *
 * @returns the signature
 */
async function edSign(privateKey: string, data: string): Promise<string> {
  const eddsa = await circomlibjs.buildEddsa();
  const payeePrivBuff = Buffer.from(privateKey, "hex");
  const dataBuff = Buffer.from(data.slice(2), "hex");

  const signature = await eddsa.signPoseidon(payeePrivBuff, dataBuff);
  
  return Buffer.from(eddsa.packSignature(signature)).toString('hex');
}

/**
 * Function to recover address from a signature
 *
 * @param signature the signature
 * @param data the data signed
 *
 * @returns the address
 */
// function edRecover(_signature: string, _data: string): string {
//     throw new Error('NOT IMPLEMENTED'); // TODO even possible?
// }


/**
 * Function ecSigndata with EDDSA
 *
 * @param data the data to sign
 *
 * @returns the signature
 */
async function edVerify(signature: string, data: string, publicKey: string): Promise<boolean> {
    const eddsa = await circomlibjs.buildEddsa();
    const unpackedSignatureBuff = eddsa.unpackSignature(Buffer.from(signature, 'hex'));

    const publicKeyLength = publicKey.length / 2;
    const Ax = Buffer.from(publicKey.slice(0,publicKeyLength), 'hex');
    const Ay = Buffer.from(publicKey.slice(publicKeyLength,publicKeyLength*2), 'hex');


    const dataBuff = Buffer.from(data.slice(2), "hex");

    return await eddsa.verifyPoseidon(dataBuff, unpackedSignatureBuff, [Ax, Ay])
  }


  async function merkleTree8root(array: unknown[]): Promise<string> {
    if(array.length > 8) {
      throw "This merkle tree can host only 8 values";
    }
    while (array.length<8) array.push(0);
    
    const poseidon = await circomlibjs.buildPoseidon();
    const F = poseidon.F;

    const leaves = await Promise.all(array.map(async (v,i) => poseidon([i, v, 1])));
    const level2 = await Promise.all([
        poseidon(leaves.slice(0,2)),
        poseidon(leaves.slice(2,4)),
        poseidon(leaves.slice(4,6)),
        poseidon(leaves.slice(6,8)),
    ]);
    const level1 = await Promise.all([
        poseidon(level2.slice(0,2)),
        poseidon(level2.slice(2,4)),
    ]);
    const root = await poseidon(level1);

    return F.toObject(root);
  }