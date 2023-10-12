pragma circom 2.0.0;

// circomlib includes
include "poseidon.circom";
include "comparators.circom";

// request includes
include "requestBaseCreate.circom";
include "requestMerkleTree.circom";

template checkBalanceErc20FeeProxy() {
    // Request inputs
    signal input requestInputs[7];
    // payee; // [0]
    // payer; // [1]
    // expectedAmount; // [2]
    // currency; // [3]
    // timestamp; // [4]
    // nonce; // [5]
    // content data // [6] merkle tree root or simple hash ?

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

    //  public
    signal input amountPaid;

    // Outputs
    signal output requestId; // TODO: or public input ????
    signal output isPaid;
    signal output paymentReference; // TODO public input or outup ?
    signal output paymentAddress;

    // compute payment network root
    component paymentNetworkMerkleTreeComp = requestMerkleTree();
    for (var i = 0; i<8; i++) {
        paymentNetworkMerkleTreeComp.inputs[i] <== paymentNetworkInputs[i];
    }

    component requestMerkleTreeComp = requestMerkleTree();
    for (var i = 0; i<7; i++) {
        requestMerkleTreeComp.inputs[i] <== requestInputs[i];
    }
    requestMerkleTreeComp.inputs[7] <== paymentNetworkMerkleTreeComp.root;

    requestId <== requestMerkleTreeComp.root;

    component checkBalance = GreaterEqThan(250);
    checkBalance.in[0] <== amountPaid;
    checkBalance.in[1] <== requestInputs[2];
    isPaid <== checkBalance.out;


    component paymentRefHasherCom = Poseidon(3);
    paymentRefHasherCom.inputs[0] <== requestId;
    paymentRefHasherCom.inputs[1] <== paymentNetworkInputs[0];
    paymentRefHasherCom.inputs[2] <== paymentNetworkInputs[4];

    paymentReference <== paymentRefHasherCom.out;
    paymentAddress <== paymentNetworkInputs[4];
}

component main {public [amountPaid] } = checkBalanceErc20FeeProxy();


