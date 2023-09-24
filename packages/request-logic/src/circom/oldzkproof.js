const snarkjs = require("snarkjs");
const fs = require("fs");
const circomlibjs = require('circomlibjs');


async function generateProof(name, requestInputs, paymentNetworkInputs, signatureProvider) { 
    const inputs = await createInputs(requestInputs, paymentNetworkInputs);
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        inputs,
        `src/circom/${name}.wasm`,
        `src/circom/${name}_final.zkey`
    );
    return { proof, publicSignals };
}




async function createInputs(name, requestInputs, paymentNetworkInputs, signatureProvider) {
    const poseidon = await circomlibjs.buildPoseidon();
    const F = poseidon.F;
    const eddsa = await circomlibjs.buildEddsa();
    
    // Request base
    // const msg = F.e(1234);
    const expectedAmount ="666";
    const paymentAddress = "0x0000000000000000000000000000000000000004";
    const currencyHash = "0x1111111111111111111111111111111111111111"
    const timestamp = "1695227687";// Math.floor(Date.now() / 1000); console.log(timestamp)
    const nonce = 0
    const contentDataHash = "0x2222222222222222222222222222222222222222"

    // Payment network 
    const salt = "0x01234567"
    const chainId = "0x0a"
    const feeAddress = "0x0000000000000000000000000000000000000005" 
    const feeAmount = "66"

    const payeePriv = Buffer.from("0001020304050607080900010203040506070809000102030405060708090001", "hex");
    const payeePub = eddsa.prv2pub(payeePriv);
    const payeeAddress = await poseidon(payeePub);
    const payerPriv = Buffer.from("0000000304050607080900010203040506070809000102030405060708090001", "hex");
    const payerPub = eddsa.prv2pub(payerPriv);
    const payerAddress = await poseidon(payerPub);

    // const requestInputs =
    // [
    //     F.toObject(payerAddress),
    //     expectedAmount,
    //     currencyHash,
    //     timestamp,
    //     nonce,
    //     contentDataHash,
    // ];
    // const paymentNetworkInputs = 
    // [
    //     salt,
    //     chainId,
    //     feeAddress,
    //     feeAmount, 
    //     paymentAddress,
    //     0, 
    //     0,
    //     0,
    // ];


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

    const leavesRequest = await Promise.all([F.toObject(payeeAddress)].concat(requestInputs).concat(F.toObject(rootPN)).map(async (v,i) => poseidon([i, v, 1])));

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

    const signature = eddsa.signPoseidon(payeePriv, treeRoot);
    // console.log(eddsa.verifyPoseidon(treeRoot, signature, payeePub));

    const inputs = {
        requestInputs,
        paymentNetworkInputs,
        Ax: F.toObject(payeePub[0]),
        Ay: F.toObject(payeePub[1]),
        R8x: F.toObject(signature.R8[0]),
        R8y: F.toObject(signature.R8[1]),
        S: signature.S,
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

