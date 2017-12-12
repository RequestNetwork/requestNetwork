import {expect} from 'chai';

var ethABI = require('ethereumjs-abi');
var ethUtil = require('ethereumjs-util');

var Web3 = require('web3');
const BN = Web3.utils.BN;

export const getHashRequest = function(coreVersion,num) : string {
	return ethUtil.bufferToHex(ethABI.soliditySHA3(["uint256","uint32"], [num,coreVersion]));
}

export const expectEqualsObject = function(obj1:any,obj2:any,msg:string) : void {
    expect(JSON.stringify(obj1),msg).to.be.equal(JSON.stringify(obj2));
}

export const expectEqualsBN = function(obj1:any,obj2:any,msg:string) : void {
    expect(new BN(obj1).eq(new BN(obj2)), msg).to.be.true; 
}