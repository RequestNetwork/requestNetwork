import * as Types from '../types';
import {artifacts} from '../artifacts';
import config from '../config';

import * as Web3Sgl from './web3-Single';
import Ipfs from "./ipfs-service";

export default class requestEthereumService {
	protected web3Single: any;
	protected ipfs: any;

	// RequestEthereum on blockchain
	protected abiRequestRequestCore: string;
	protected addressRequestCore: string;
	protected instanceRequestCore: any;

	protected abiRequestEthereum: string;
	protected addressRequestEthereum: string;
	protected instanceRequestEthereum: any;


	protected abiRequestSyncEscrow: string;
	protected addressRequestSyncEscrow: string;
	protected instanceRequestSyncEscrow: any;
	

	constructor() {
		this.web3Single = Web3Sgl.Web3Single.getInstance();
		this.ipfs = Ipfs.getInstance();

		this.abiRequestRequestCore = artifacts.RequestCoreArtifact.abi;
		this.addressRequestCore = config.ethereum.contracts.requestCore;
		this.instanceRequestCore = new this.web3Single.web3.eth.Contract(this.abiRequestRequestCore, this.addressRequestCore);

		this.abiRequestEthereum = artifacts.RequestEthereumArtifact.abi;
		this.addressRequestEthereum = config.ethereum.contracts.requestEthereum;
		this.instanceRequestEthereum = new this.web3Single.web3.eth.Contract(this.abiRequestEthereum, this.addressRequestEthereum);

		this.abiRequestSyncEscrow = artifacts.RequestSynchroneExtensionEscrowArtifact.abi;
		this.addressRequestSyncEscrow = config.ethereum.contracts.requestSyncEscrow;
		this.instanceRequestSyncEscrow = new this.web3Single.web3.eth.Contract(this.abiRequestSyncEscrow, this.addressRequestSyncEscrow);
	}

	public createRequestAsPayee = function( 
		_payer:							string,
		_amountInitial:			any,
		_extension:					string,
		_extensionParams:		Array<any>,
		_details:						string,
		_callbackTransactionHash:Types.CallbackTransactionHash,
		_callbackTransactionReceipt:Types.CallbackTransactionReceipt,
		_callbackTransactionConfirmation:Types.CallbackTransactionConfirmation,
		_callbackTransactionError:Types.CallbackTransactionError)
			: void
	{
		if(_amountInitial < 0 /*|| !_amountInitial.isInteger()*/) throw Error("_amountInitial must a positive integer");
		if(!this.web3Single.isAddressNoChecksum(_payer)) throw Error("_payer must be a valid eth address");
		if(!this.web3Single.isAddressNoChecksum(_extension)) throw Error("_extension must be a valid eth address");
		if(_extensionParams.length > 9) throw Error("_extensionParams length must be less than 9");

		this.ipfs.addFile(JSON.parse(_details), (err:Error,hash:string) => {
			if(err) return _callbackTransactionError(err);

			var method = this.instanceRequestEthereum.methods.createRequestAsPayee(
					_payer, 
					_amountInitial, 
					_extension,
					this.web3Single.arrayToBytes32(_extensionParams,9),
					hash);

			this.web3Single.broadcastMethod( 
								method,
								_callbackTransactionHash,
								_callbackTransactionReceipt,
								_callbackTransactionConfirmation,
								_callbackTransactionError);
		});
	}


	public accept = function( 
		_requestId:		string,
		_callbackTransactionHash:Types.CallbackTransactionHash,
		_callbackTransactionReceipt:Types.CallbackTransactionReceipt,
		_callbackTransactionConfirmation:Types.CallbackTransactionConfirmation,
		_callbackTransactionError:Types.CallbackTransactionError)
			: void
	{
		// TODO check from == payer ?
		// TODO check if this is possible ? (quid if other tx pending)
		if(!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');

		var method = this.instanceRequestEthereum.methods.accept(_requestId);

		this.web3Single.broadcastMethod( 
							method,
							_callbackTransactionHash,
							_callbackTransactionReceipt,
							_callbackTransactionConfirmation,
							_callbackTransactionError);
	}

	public decline = function( 
		_requestId:		string,
		_callbackTransactionHash:Types.CallbackTransactionHash,
		_callbackTransactionReceipt:Types.CallbackTransactionReceipt,
		_callbackTransactionConfirmation:Types.CallbackTransactionConfirmation,
		_callbackTransactionError:Types.CallbackTransactionError)
			: void
	{
		// TODO check from == payer ?
		// TODO check if this is possible ? (quid if other tx pending)
		if(!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');

		var method = this.instanceRequestEthereum.methods.decline(_requestId);

		this.web3Single.broadcastMethod( 
							method,
							_callbackTransactionHash,
							_callbackTransactionReceipt,
							_callbackTransactionConfirmation,
							_callbackTransactionError);
	}

	public cancel = function( 
		_requestId:		string,
		_callbackTransactionHash:Types.CallbackTransactionHash,
		_callbackTransactionReceipt:Types.CallbackTransactionReceipt,
		_callbackTransactionConfirmation:Types.CallbackTransactionConfirmation,
		_callbackTransactionError:Types.CallbackTransactionError)
			: void
	{
		// TODO check from == payee ?
		// TODO check if this is possible ? (quid if other tx pending)
		if(!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');

		var method = this.instanceRequestEthereum.methods.cancel(_requestId);

		this.web3Single.broadcastMethod( 
							method,
							_callbackTransactionHash,
							_callbackTransactionReceipt,
							_callbackTransactionConfirmation,
							_callbackTransactionError);
	}

	public pay = function( 
		_requestId:		string,
		_amount: any,
		_tips: any,
		_callbackTransactionHash:Types.CallbackTransactionHash,
		_callbackTransactionReceipt:Types.CallbackTransactionReceipt,
		_callbackTransactionConfirmation:Types.CallbackTransactionConfirmation,
		_callbackTransactionError:Types.CallbackTransactionError)
			: void
	{
		// TODO check from == payer ?
		// TODO check if this is possible ? (quid if other tx pending)
		if(!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
		// TODO use bigNumber
		if(_amount < 0 /* || !_amount.isInteger()*/) throw Error("_amount must a positive integer");
		// TODO use bigNumber
		if(_tips < 0 /* || !_tips.isInteger()*/) throw Error("_tips must a positive integer");

		var method = this.instanceRequestEthereum.methods.pay(_requestId, _tips);

		this.web3Single.broadcastMethod( 
							method,
							_callbackTransactionHash,
							_callbackTransactionReceipt,
							_callbackTransactionConfirmation,
							_callbackTransactionError,
							_amount);
	}

	public payback = function( 
		_requestId:		string,
		_amount: any,
		_callbackTransactionHash:Types.CallbackTransactionHash,
		_callbackTransactionReceipt:Types.CallbackTransactionReceipt,
		_callbackTransactionConfirmation:Types.CallbackTransactionConfirmation,
		_callbackTransactionError:Types.CallbackTransactionError)
			: void
	{
		// TODO check from == payee ?
		// TODO check if this is possible ? (quid if other tx pending)
		if(!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
		// TODO use bigNumber
		if(_amount < 0 /*|| !_amount.isInteger()*/) throw Error("_amount must a positive integer");

		var method = this.instanceRequestEthereum.methods.payback(_requestId);

		this.web3Single.broadcastMethod( 
							method,
							_callbackTransactionHash,
							_callbackTransactionReceipt,
							_callbackTransactionConfirmation,
							_callbackTransactionError,
							_amount);
	}


	public discount = function( 
		_requestId:		string,
		_amount: any,
		_callbackTransactionHash:Types.CallbackTransactionHash,
		_callbackTransactionReceipt:Types.CallbackTransactionReceipt,
		_callbackTransactionConfirmation:Types.CallbackTransactionConfirmation,
		_callbackTransactionError:Types.CallbackTransactionError)
			: void
	{
		// TODO check from == payee ?
		// TODO check if this is possible ? (quid if other tx pending)
		if(!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
		// TODO use bigNumber
		if(_amount < 0 /*|| !_amount.isInteger()*/) throw Error("_amount must a positive integer");

		var method = this.instanceRequestEthereum.methods.payback(_requestId, _amount);

		this.web3Single.broadcastMethod( 
							method,
							_callbackTransactionHash,
							_callbackTransactionReceipt,
							_callbackTransactionConfirmation,
							_callbackTransactionError);
	}

	public withdraw = function(
		_callbackTransactionHash:Types.CallbackTransactionHash,
		_callbackTransactionReceipt:Types.CallbackTransactionReceipt,
		_callbackTransactionConfirmation:Types.CallbackTransactionConfirmation,
		_callbackTransactionError:Types.CallbackTransactionError)
			: void
	{
		var method = this.instanceRequestEthereum.methods.withdraw();

		this.web3Single.broadcastMethod( 
							method,
							_callbackTransactionHash,
							_callbackTransactionReceipt,
							_callbackTransactionConfirmation,
							_callbackTransactionError);
	}

	public getRequest = /*async*/ function( 
		_requestId:		string,
		_callbackGetRequest:Types.CallbackGetRequest)
	{
		// TODO check from == payer ?
		// TODO check if this is possible ? (quid if other tx pending)
		if(!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');


		// var method = await this.instanceRequestCore.methods.requests(_requestId);
		// console.log(await this.web3Single.callMethod(method));

		// console.log(this.instanceRequestCore);
		this.instanceRequestCore.methods.requests(_requestId).call( (err:Error,data:any) => {
			if(err) return _callbackGetRequest(err, data);

			let dataResult:any = {
					creator: data.creator,
					payee: data.payee,
					payer: data.payer,
					amountInitial: data.amountInitial,
					subContract: data.subContract,
					amountPaid: data.amountPaid,
					amountAdditional: data.amountAdditional,
					amountSubtract: data.amountSubtract,
					state: data.state,
					extension: data.extension,
					details: data.details,
				};

			if(data.extension == this.addressRequestSyncEscrow) {

			}
			instanceRequestSyncEscrow.escrows

			if(dataResult.details)
			{
				// get IPFS data :
				this.ipfs.getFile(dataResult.details, (err:Error, data:string) => {
					if(err) return _callbackGetRequest(err, dataResult);
					dataResult.details = JSON.parse(data);
					return _callbackGetRequest(err, dataResult);
				});	
			} 
			else 
			{
				return _callbackGetRequest(err, dataResult);
			}
		});

	}

}

