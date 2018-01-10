"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var ETH_ABI = require('ethereumjs-abi');
var ETH_UTIL = require('ethereumjs-util');
var WEB3 = require('web3');
var BN = WEB3.utils.BN;
exports.getHashRequest = function (coreVersion, num) {
    return ETH_UTIL.bufferToHex(ETH_ABI.soliditySHA3(['uint256', 'uint32'], [num, coreVersion]));
};
exports.expectEqualsObject = function (obj1, obj2, msg) {
    chai_1.expect(JSON.stringify(obj1), msg).to.be.equal(JSON.stringify(obj2));
};
exports.expectEqualsBN = function (obj1, obj2, msg) {
    chai_1.expect(new BN(obj1).eq(new BN(obj2)), msg).to.be.true;
};
//# sourceMappingURL=utils.js.map