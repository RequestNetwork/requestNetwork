const snarkjs = require("snarkjs");
const circomlibjs = require('circomlibjs');

import {
  IdentityTypes,
  ExtensionTypes,
  RequestLogicTypes,
  SignatureProviderTypes,
} from '@requestnetwork/types';

const PUBKEY_POSITION_FROM_END_IN_EDDSA_HEX = -128;

export default async function generateProof(
    name: string, 
    parameters: RequestLogicTypes.ICreateParameters | RequestLogicTypes.IAcceptParameters,
    signatureProvider: SignatureProviderTypes.ISignatureProvider,
    requestState: RequestLogicTypes.IRequest | null
) : Promise<any> { 
    let inputs;
    
    if(name === 'requestErc20FeeProxy') {
        inputs= await createInputs(parameters as RequestLogicTypes.ICreateParameters, signatureProvider);
    } else if (name === 'accept') {
        inputs= await acceptInputs(signatureProvider, requestState);
    } else {
        throw Error('Not implemented')
    }
    



    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        inputs,
        // TODO relative path
        `/home/vincent/Documents/request/requestNetwork/packages/request-logic/src/circom/${name}.wasm`,
        `/home/vincent/Documents/request/requestNetwork/packages/request-logic/src/circom/${name}_final.zkey`
    );
    return { proof, publicSignals };
}
    

async function createInputs(
    requestParameters: RequestLogicTypes.ICreateParameters,
    signatureProvider: SignatureProviderTypes.ISignatureProvider,
) : Promise<any> {
    const poseidon = await circomlibjs.buildPoseidon();
    const F = poseidon.F;
    const eddsa = await circomlibjs.buildEddsa();
    
    const pn = requestParameters.extensionsData?.find(e => e.id === ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
    if(!pn) {
        throw Error(`Implemented only for ${ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT}`);
    }
    // const contentData = requestParameters.extensionsData?.find(e => e.id === ExtensionTypes.OTHER_ID.CONTENT_DATA);
    // TODO
    const contentDataHash = 0;
    // if(contentData) {
    //     contentDataHash = await poseidon(contentData.)
    // }


    const salt = '0x'+pn.parameters.salt;
    const chainId = 1; // TODO FROM pn.version or currency
    const currencyHash = "0x6b175474e89094c44da98b954eedeac495271d0f"; // requestParameters.currency.value
    const nonce = requestParameters.nonce || 0;

    const requestInputs =
    [
        F.toObject(Buffer.from(requestParameters.payer!.value, 'hex')),
        requestParameters.expectedAmount,
        currencyHash, // TODO better
        requestParameters.timestamp,
        nonce,
        contentDataHash,
    ];
    const paymentNetworkInputs = 
    [
        salt,
        chainId,
        pn.parameters.feeAddress,
        pn.parameters.feeAmount,
        pn.parameters.paymentAddress,
        0, 
        0,
        0,
    ];
    
    // Compute tree root
    const leavesPN = await Promise.all(paymentNetworkInputs.map(async (v,i) => poseidon([i, v, 1])));
    const level2PN = await Promise.all([
        poseidon(leavesPN.slice(0,2)),
        poseidon(leavesPN.slice(2,4)),
        poseidon(leavesPN.slice(4,6)),
        poseidon(leavesPN.slice(6,8)),
    ]);
    const level1PN = await Promise.all([
        poseidon(level2PN.slice(0,2)),
        poseidon(level2PN.slice(2,4)),
    ]);
    const rootPN = await poseidon(level1PN);

    const leavesRequest = await Promise.all(
        [F.toObject(Buffer.from(requestParameters.payee!.value, 'hex'))]
            .concat(requestInputs)
            .concat(F.toObject(rootPN))
            .map(async (v,i) => poseidon([i, v, 1])));

    const level2Request = await Promise.all([
        poseidon(leavesRequest.slice(0,2)),
        poseidon(leavesRequest.slice(2,4)),
        poseidon(leavesRequest.slice(4,6)),
        poseidon(leavesRequest.slice(6,8)),
    ]);
    const level1Request = await Promise.all([
        poseidon(level2Request.slice(0,2)),
        poseidon(level2Request.slice(2,4)),
    ]);
    const treeRoot = await poseidon(level1Request);
    // console.log({treeRoot});
    //  const signature = eddsa.signPoseidon(payeePriv, treeRoot);
    // sign: (data: any, signer: Identity.IIdentity) => Promise<Signature.ISignedData>;
    if(!requestParameters.payee || requestParameters.payee.type !== IdentityTypes.TYPE.POSEIDON_ADDRESS) {
        throw Error("Payee must be given and POSEIDON itdentity"); // TODO
    }
    const signedData = await signatureProvider.sign('0x'+Buffer.from(treeRoot).toString('hex'), requestParameters.payee, true);
    
    const pubkeyHex = signedData.signature.value.slice(PUBKEY_POSITION_FROM_END_IN_EDDSA_HEX);
    const packedSignatureHex = signedData.signature.value.slice(0, PUBKEY_POSITION_FROM_END_IN_EDDSA_HEX);

    const publicKeyLength = pubkeyHex.length / 2;
    const Ax = Buffer.from(pubkeyHex.slice(0,publicKeyLength), 'hex');
    const Ay = Buffer.from(pubkeyHex.slice(publicKeyLength,publicKeyLength*2), 'hex');

    const signatureBuff = eddsa.unpackSignature(Buffer.from(packedSignatureHex, 'hex'));

    // console.log({signatureBuff});
    const inputs = {
        requestInputs,
        paymentNetworkInputs,
        Ax: F.toObject(Ax),
        Ay: F.toObject(Ay),
        R8x: F.toObject(signatureBuff.R8[0]),
        R8y: F.toObject(signatureBuff.R8[1]),
        S: signatureBuff.S,
    };


    // const inputsTest = {
    //     requestInputs: [
    //       "7830714765930193524542283960493871390289592027408961684949519142577988926867n",
    //       '123400000000000000',
    //       '0x6b175474e89094c44da98b954eedeac495271d0f',
    //       1544426030,
    //       0,
    //       0
    //     ],
    //     paymentNetworkInputs: [
    //       '0xea3bc7caf64110ca',
    //       1,
    //       '0x0000000000000000000000000000000000000001',
    //       '0',
    //       '0x0000000000000000000000000000000000000002',
    //       0,
    //       0,
    //       0
    //     ],
    //     Ax: "13277427435165878497778222415993513565335242147425444199013288855685581939618n",
    //     Ay: "13622229784656158136036771217484571176836296686641868549125388198837476602820n",
    //     R8x: "12365160791755433480669383766643952452358488273676453361236483640807675652990n",
    //     R8y: "11381633490844542073390207339032266293338633384819114863034395228984596574891n",
    //     S: "393646507736440823518012860391292632945297105686062001074563216898843335886n"
    //   }
      
      
    // console.log({inputsTest});
    // console.log({inputs});

    return inputs;
}


async function acceptInputs(
    signatureProvider: SignatureProviderTypes.ISignatureProvider,
    requestState: RequestLogicTypes.IRequest | null
) : Promise<any> {
    const poseidon = await circomlibjs.buildPoseidon();
    const F = poseidon.F;
    const eddsa = await circomlibjs.buildEddsa();

    if(!requestState) {
        throw Error('request must have a state');
    }

    if(!requestState.payee || requestState.payee.type !== IdentityTypes.TYPE.POSEIDON_ADDRESS) {
        throw Error("Payee must be given and POSEIDON itdentity"); // TODO
    }
    if(!requestState.payer || requestState.payer.type !== IdentityTypes.TYPE.POSEIDON_ADDRESS) {
        throw Error("Payer must be given and POSEIDON itdentity"); // TODO
    }


    const pn = requestState.extensionsData?.find(e => e.id === ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT);
    if(!pn) {
        throw Error(`Implemented only for ${ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT}`);
    }
        // const contentData = requestState.extensionsData?.find(e => e.id === ExtensionTypes.OTHER_ID.CONTENT_DATA);
    // TODO
    const contentDataHash = 0;
    // if(contentData) {
    //     contentDataHash = await poseidon(contentData.)
    // }


    const salt = '0x'+pn.parameters.salt;
    const chainId = 1; // TODO FROM pn.version or currency
    const currencyHash = "0x6b175474e89094c44da98b954eedeac495271d0f"; // requestParameters.currency.value
    const nonce = requestState.nonce || 0;

    const requestInputs =
    [
        F.toObject(Buffer.from(requestState.payee!.value, 'hex')),
        F.toObject(Buffer.from(requestState.payer!.value, 'hex')),
        requestState.expectedAmount,
        currencyHash, // TODO better
        requestState.timestamp,
        nonce,
        contentDataHash,
    ];
    const paymentNetworkInputs = 
    [
        salt,
        chainId,
        pn.parameters.feeAddress,
        pn.parameters.feeAmount,
        pn.parameters.paymentAddress,
        0, 
        0,
        0,
    ];
    
    // Compute tree root
    const leavesPN = await Promise.all(paymentNetworkInputs.map(async (v,i) => poseidon([i, v, 1])));
    const level2PN = await Promise.all([
        poseidon(leavesPN.slice(0,2)),
        poseidon(leavesPN.slice(2,4)),
        poseidon(leavesPN.slice(4,6)),
        poseidon(leavesPN.slice(6,8)),
    ]);
    const level1PN = await Promise.all([
        poseidon(level2PN.slice(0,2)),
        poseidon(level2PN.slice(2,4)),
    ]);
    const rootPN = await poseidon(level1PN);

    const leavesRequest = await Promise.all(requestInputs
            .concat(F.toObject(rootPN))
            .map(async (v,i) => poseidon([i, v, 1])));

    const level2Request = await Promise.all([
        poseidon(leavesRequest.slice(0,2)),
        poseidon(leavesRequest.slice(2,4)),
        poseidon(leavesRequest.slice(4,6)),
        poseidon(leavesRequest.slice(6,8)),
    ]);
    const level1Request = await Promise.all([
        poseidon(level2Request.slice(0,2)),
        poseidon(level2Request.slice(2,4)),
    ]);
    const treeRoot = await poseidon(level1Request);


    const h0 = leavesRequest[0];
    const hB = level2Request[1];
    const hCD = level1Request[1];

    //       root
    //    AB      CD
    //  A   B   C   D
    // 0 1 2 3 4 5 6 7 

    const signedData = await signatureProvider.sign('0x'+Buffer.from(treeRoot).toString('hex'), requestState.payer, true);
    
    const pubkeyHex = signedData.signature.value.slice(PUBKEY_POSITION_FROM_END_IN_EDDSA_HEX);
    const packedSignatureHex = signedData.signature.value.slice(0, PUBKEY_POSITION_FROM_END_IN_EDDSA_HEX);

    const publicKeyLength = pubkeyHex.length / 2;
    const Ax = Buffer.from(pubkeyHex.slice(0,publicKeyLength), 'hex');
    const Ay = Buffer.from(pubkeyHex.slice(publicKeyLength,publicKeyLength*2), 'hex');

    const signatureBuff = eddsa.unpackSignature(Buffer.from(packedSignatureHex, 'hex'));

    const inputs = {
        h0: F.toObject(h0),
        hB: F.toObject(hB),
        hCD: F.toObject(hCD),

        Ax: F.toObject(Ax),
        Ay: F.toObject(Ay),
        R8x: F.toObject(signatureBuff.R8[0]),
        R8y: F.toObject(signatureBuff.R8[1]),
        S: signatureBuff.S,
    };

    return inputs;
}






// async function run() {
//     const inputs = await createInputs();
//     console.log(inputs)
//     const { proof, publicSignals } = await snarkjs.groth16.fullProve(
//         inputs, // {a: 10, b: 21}, 
//         "build/requestErc20FeeProxy_js/requestErc20FeeProxy.wasm", 
//         "build/requestErc20FeeProxy_final.zkey"
//     );

    
//     console.log("Proof: ");
//     console.log(JSON.stringify(proof, null, 1));

//     const vKey = JSON.parse(fs.readFileSync("build/requestErc20FeeProxy_verification_key.json"));

//     const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

//     if (res === true) {
//         console.log("Verification OK");
//     } else {
//         console.log("Invalid proof");
//     }

// }

