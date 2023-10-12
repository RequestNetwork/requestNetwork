pragma circom 2.0.0;

// circomlib includes
include "poseidon.circom";
include "smthash_poseidon.circom";
include "eddsaposeidon.circom";
include "comparators.circom";

// request includes
include "requestMerkleTree.circom";

template requestBaseCreate() {
    // Request inputs
    signal input requestInputs[7];
    // payer; // [0]
    // expectedAmount; // [1]
    // currency; // [2]
    // timestamp; // [3]
    // nonce; // [4]
    // content data // [5] merkle tree root or simple hash ?
    // payment network // [6] merkle tree root

    // Signature Stuff
    signal input Ax;
    signal input Ay;
    signal input S;
    signal input R8x;
    signal input R8y;

    // tree root
    signal output requestId;

    // Compute Hash of payee
    component payeeHasherCom = Poseidon(2);
    payeeHasherCom.inputs[0] <== Ax;
    payeeHasherCom.inputs[1] <== Ay;

    component requestMerkleTreeComp = requestMerkleTree();
    requestMerkleTreeComp.inputs[0] <== payeeHasherCom.out;
    // inputs payer, amount, paymentAddress
    for (var i = 0; i<7; i++) {
        requestMerkleTreeComp.inputs[i+1] <== requestInputs[i];
    }

    // Check Signature from Payee
    component signVerifier = EdDSAPoseidonVerifier();
    signVerifier.enabled <== 1;
    signVerifier.Ax <== Ax;
    signVerifier.Ay <== Ay;

    signVerifier.S <== S;
    signVerifier.R8x <== R8x;
    signVerifier.R8y <== R8y;

    signVerifier.M <== requestMerkleTreeComp.root;

    // check that payee != payer
    component arePayeePayerEquals = IsEqual();
    arePayeePayerEquals.in[0] <== payeeHasherCom.out;
    arePayeePayerEquals.in[1] <== requestInputs[0];
    arePayeePayerEquals.out === 0;

    requestId <== requestMerkleTreeComp.root;
}

// component main = requestCreate();


