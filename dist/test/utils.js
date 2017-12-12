"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var ethABI = require('ethereumjs-abi');
var ethUtil = require('ethereumjs-util');
var Web3 = require('web3');
var BN = Web3.utils.BN;
exports.getHashRequest = function (coreVersion, num) {
    return ethUtil.bufferToHex(ethABI.soliditySHA3(["uint256", "uint32"], [num, coreVersion]));
};
exports.expectEqualsObject = function (obj1, obj2, msg) {
    chai_1.expect(JSON.stringify(obj1), msg).to.be.equal(JSON.stringify(obj2));
};
exports.expectEqualsBN = function (obj1, obj2, msg) {
    chai_1.expect(new BN(obj1).eq(new BN(obj2)), msg).to.be.true;
};
//# sourceMappingURL=utils.js.map