pragma circom 2.0.0;

include "poseidon.circom";
include "smthash_poseidon.circom";
include "eddsaposeidon.circom";

template accept() {
    // Request tree root inputs
    signal input h0;
    signal input hB;
    signal input hCD;

    // Signature Stuff
    signal input Ax;
    signal input Ay;
    signal input S;
    signal input R8x;
    signal input R8y;

    signal output requestId;

    // Compute Hash of payer
    component payerHash = Poseidon(2);
    payerHash.inputs[0] <== Ax;
    payerHash.inputs[1] <== Ay;

    // Compute H1, HA to get Tree Root
    component smtH1 = SMTHash1();
    smtH1.key <== 1;
    smtH1.value <== payerHash.out;

    component smtHA = SMTHash2();
    smtHA.L <== h0;
    smtHA.R <== smtH1.out;


    component smtHAB = SMTHash2();
    smtHAB.L <== smtHA.out;
    smtHAB.R <== hB;


    component smtRootTree = SMTHash2();
    smtRootTree.L <== smtHAB.out;
    smtRootTree.R <== hCD;


    // Check Signature from Payee
    component signVerifier = EdDSAPoseidonVerifier();
    signVerifier.enabled <== 1;
    signVerifier.Ax <== Ax;
    signVerifier.Ay <== Ay;

    signVerifier.S <== S;
    signVerifier.R8x <== R8x;
    signVerifier.R8y <== R8y;
    signVerifier.M <== smtRootTree.out;

    // return requestId
    requestId <== smtRootTree.out;
}

component main = accept();
