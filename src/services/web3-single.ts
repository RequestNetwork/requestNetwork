import config from '../config';
import * as Types from '../types';

import Web3 = require("web3");
// import Web3 from 'web3'; 

declare var require:(moduleId:string) => any;
var ethABI = require('../lib/ethereumjs-abi-perso.js');


export class Web3Single {
	private static _instance:Web3Single = new Web3Single();

	public web3: any;

	private constructor() {
		this.web3 = new Web3(new Web3.providers.HttpProvider(config.ethereum.node_url));
	}

	public static getInstance()
	{
		return this._instance || (this._instance = new this());
	}

	public broadcastMethod(	_method:any,
							_callbackTransactionHash:Types.CallbackTransactionHash,
							_callbackTransactionReceipt:Types.CallbackTransactionReceipt,
							_callbackTransactionConfirmation:Types.CallbackTransactionConfirmation,
							_callbackTransactionError:Types.CallbackTransactionError,
							_value:any,
							_from:string,
							_gasPrice:number,
							_gasLimit:number ) 
	{
		_method.estimateGas((err:any,estimateGas:number) => {
			if(err) throw err;

			_method.send({
				from: 		_from ? _from : config.ethereum.from,
				gasPrice:	_gasPrice ? _gasPrice : this.web3.utils.toWei(config.ethereum.gasPriceDefault,config.ethereum.gasPriceDefaultUnit),
				gas: 		_gasLimit ? _gasLimit : estimateGas,
				value:		_value ? _value : 0
			})
			.on('transactionHash', _callbackTransactionHash)
			.on('receipt', _callbackTransactionReceipt)
			.on('confirmation', _callbackTransactionConfirmation)
			.on('error', _callbackTransactionError);
		});
	}

	public arrayToBytes32 (array:any[], length:number) : any[]
	{
		let ret:any[] = [];
		console.log("this")
		array.forEach(function(o:any) {
			ret.push(this.web3.utils.bytesToHex( ethABI.toSolidityBytes32("bytes32", o) ));
		}.bind(this));

		for(let i=array.length; i<length; i++)
		{
			ret.push(this.web3.utils.bytesToHex( ethABI.toSolidityBytes32("bytes32", 0) ));
		}

		return ret;
		// const requestParts = [
		// 	{value: extParams, type: "bytes32[9]"}
		// ];
		// let types: any[] = [];
		// let values: any[] = [];
		// requestParts.forEach(function(o,i) {
		// 	types.push(o.type);
		// 	values.push(o.value);
		// });
		// return ethABI.solidityPack(types, values);
	}

	public isAddressNoChecksum (address:string) : boolean 
	{
		return this.web3.utils.isAddress(address.toLowerCase());
	}

	public isHexStrictBytes32 (hex:string) : boolean
	{
		return this.web3.utils.isHexStrict(hex) && hex.length == 66; // "0x" + 32 bytes * 2 characters = 66
	}
}