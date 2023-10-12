import { keccak256Hash } from '@requestnetwork/utils';
const circomlibjs = require('circomlibjs');

/**
 * Compute the payment reference
 *
 * @param requestId The requestId
 * @param salt The salt for the request
 * @param address Payment or refund address
 */

function calculate(requestId: string, salt: string, address: string): string {
  if (!requestId || !salt || !address) {
    throw new Error('RequestId, salt and address are mandatory to calculate the payment reference');
  }

  console.log("!!!!!!!!!!!!!!!!!!!!")
  // "The value is the last 8 bytes of a salted hash of the requestId: `last8Bytes(hash(requestId + salt + address))`"
  /* eslint-disable no-magic-numbers */
  return keccak256Hash((requestId + salt + address).toLowerCase()).slice(-16);
}

async function calculatePoseidon(requestId: string, salt: string, address: string): Promise<string> {  
    const poseidon = await circomlibjs.buildPoseidon();

    if (!requestId || !salt || !address) {
      throw new Error('RequestId, salt and address are mandatory to calculate the payment reference');
    }

    

    const hashBuff = await poseidon([
        poseidon.F.toObject(Buffer.from(requestId, 'hex')),
        BigInt('0x'+salt),
        BigInt(address),
    ]);

    return Buffer.from(hashBuff).toString('hex');
  }
  


export default { calculate, calculatePoseidon };
