"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var bignumber_js_1 = require("bignumber.js");
var ethABI = require('ethereumjs-abi');
var ethUtil = require('ethereumjs-util');
exports.getHashRequest = function (coreVersion, num) {
    return ethUtil.bufferToHex(ethABI.soliditySHA3(["uint256", "uint256"], [num, coreVersion]));
};
exports.expectEqualsObject = function (obj1, obj2, msg) {
    chai_1.expect(JSON.stringify(obj1), msg).to.be.equal(JSON.stringify(obj2));
};
exports.expectEqualsBN = function (obj1, obj2, msg) {
    chai_1.expect(new bignumber_js_1.default(obj1).equals(new bignumber_js_1.default(obj2)), msg).to.be.true;
};
//# sourceMappingURL=utils.js.map