import {expect} from 'chai';

const ETH_ABI = require('ethereumjs-abi');
const ETH_UTIL = require('ethereumjs-util');

const WEB3 = require('web3');
const BN = WEB3.utils.BN;

export const getHashRequest = (coreVersion: any, num: any): string => {
    return ETH_UTIL.bufferToHex(ETH_ABI.soliditySHA3(['uint256', 'uint32'], [num, coreVersion]));
};

export const expectEqualsObject = (obj1: any, obj2: any, msg: string): void => {
    expect(JSON.stringify(obj1), msg).to.be.equal(JSON.stringify(obj2));
};

export const expectEqualsBN = (obj1: any, obj2: any, msg: string): void => {
    expect(new BN(obj1).eq(new BN(obj2)), msg).to.be.true;
};
