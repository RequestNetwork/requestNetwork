import {expect} from 'chai';
import BigNumber from 'bignumber.js';

var ethABI = require('ethereumjs-abi');
var ethUtil = require('ethereumjs-util');

export const getHashRequest = function(coreVersion,num) : string {
	return ethUtil.bufferToHex(ethABI.soliditySHA3(["uint256","uint256"], [num,coreVersion]));
}


export const expectEqualsObject = function(obj1:any,obj2:any,msg:string) : void {
    expect(JSON.stringify(obj1),msg).to.be.equal(JSON.stringify(obj2));
}

export const expectEqualsBN = function(obj1:any,obj2:any,msg:string) : void {
    expect(new BigNumber(obj1).equals(new BigNumber(obj2)), msg).to.be.true; 
}