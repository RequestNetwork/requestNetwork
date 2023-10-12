pragma circom 2.0.0;

include "smthash_poseidon.circom";

template requestMerkleTree() {
    // Request inputs
    signal input inputs[8];

    // tree root
    signal output root;

    // Compute treeRoot
    var leaves[8];
    var level2[4];
    var level1[2];

    component leavesHasher[8];
    component level2Hasher[4];
    component level1Hasher[2];

    // Compute hashes of leaves
    for (var i = 0; i<8; i++) {
        leavesHasher[i] = SMTHash1();
        leavesHasher[i].key <== i;
        leavesHasher[i].value <== inputs[i];
        leaves[i] = leavesHasher[i].out;
    }

    // Compute hashes of level 2
    for (var j = 0; j<4; j++) {
        level2Hasher[j] = SMTHash2();
        level2Hasher[j].L <== leaves[j*2];
        level2Hasher[j].R <== leaves[j*2+1];
        level2[j] = level2Hasher[j].out;
    }

    // Compute hashes of level 1
    for (var k = 0; k<2; k++) {
        level1Hasher[k] = SMTHash2();
        level1Hasher[k].L <== level2[k*2];
        level1Hasher[k].R <== level2[k*2+1];
        level1[k] = level1Hasher[k].out;
    }

    // compute tree root
    component rootHasher = SMTHash2();
    rootHasher.L <== level1[0];
    rootHasher.R <== level1[1];

    // return tree root (requestId)
    root <== rootHasher.out;
}

