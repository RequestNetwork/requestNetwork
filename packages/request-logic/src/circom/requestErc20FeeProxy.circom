pragma circom 2.0.0;

// circomlib includes
include "poseidon.circom";
include "smthash_poseidon.circom";
include "eddsaposeidon.circom";
include "comparators.circom";

// request includes
include "requestBaseCreate.circom";
include "requestMerkleTree.circom";

template requestErc20FeeProxy() {
    // Request inputs
    signal input requestInputs[6];
    // payer; // [0]
    // expectedAmount; // [1]
    // currency; // [2]
    // timestamp; // [3]
    // nonce; // [4]
    // content data // [5] merkle tree root or simple hash ?

    // Payment network erc20 with fees inputs
    signal input paymentNetworkInputs[8];
    // salt [0]
    // chainId [1]
    // feeAddress [2]
    // feeAmount [3]
    // paymentAddress [4]
    // refundAddress [5]
    // paymentInfo [6]
    // refundInfo [7]
    // NOT implemented: payeeDelegate [8]
    // NOT implemented: payerDelegate [9] 


    // Signature Stuff
    signal input Ax;
    signal input Ay;
    signal input S;
    signal input R8x;
    signal input R8y;

    // tree root
    signal output requestId;

    // compute payment network root
    component paymentNetworkMerkleTreeComp = requestMerkleTree();
    for (var i = 0; i<8; i++) {
        paymentNetworkMerkleTreeComp.inputs[i] <== paymentNetworkInputs[i];
    }
    // TODO DIDNT WORK initialised empty leaves 
    // for (var k = 5; k<8; k++) {
    //     paymentNetworkMerkleTreeComp.inputs[k] <== 0;
    // // }

    // compute and constraint request
    component requestBaseCreateComp = requestBaseCreate();
    for (var j = 0; j<6; j++) {
        requestBaseCreateComp.requestInputs[j] <== requestInputs[j];
    }
    requestBaseCreateComp.requestInputs[6] <== paymentNetworkMerkleTreeComp.root;

    requestBaseCreateComp.Ax <== Ax;
    requestBaseCreateComp.Ay <== Ay;
    requestBaseCreateComp.S <== S;
    requestBaseCreateComp.R8x <== R8x;
    requestBaseCreateComp.R8y <== R8y;

    requestId <== requestBaseCreateComp.requestId;
}

component main = requestErc20FeeProxy();


