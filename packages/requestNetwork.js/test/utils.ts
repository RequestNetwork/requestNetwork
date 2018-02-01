import {expect} from 'chai';

const ETH_ABI = require('../src/lib/ethereumjs-abi-perso.js');
const ETH_UTIL = require('ethereumjs-util');

const WEB3 = require('web3');
const BN = WEB3.utils.BN;

export const getRequestId = function(addressCore: any, num: any) {
  let hex = num.toString(16);
  for(let i = 0; i < 24 - hex.length; i++) addressCore+='0';
  return addressCore + hex;
}

export const expectEqualsObject = (obj1: any, obj2: any, msg: string): void => {
    expect(JSON.stringify(obj1), msg).to.be.equal(JSON.stringify(obj2));
};

export const expectEqualsBN = (obj1: any, obj2: any, msg: string): void => {
    expect(new BN(obj1).eq(new BN(obj2)), msg).to.be.true;
};
