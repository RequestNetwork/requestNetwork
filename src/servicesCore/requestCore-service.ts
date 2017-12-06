import config from '../config';
import BigNumber from 'bignumber.js';

import * as Types from '../types';
import Artifacts from '../artifacts';
import * as ServicesContracts from '../servicesContracts';
import * as ServiceExtensions from '../servicesExtensions';

const requestEthereum_Artifact = Artifacts.RequestEthereumArtifact;
const requestCore_Artifact = Artifacts.RequestCoreArtifact;

import { Web3Single } from '../servicesExternal/web3-single';
import Ipfs from '../servicesExternal/ipfs-service';

export default class RequestCoreService {
    private web3Single: Web3Single;
    protected ipfs: any;

    // RequestEthereum on blockchain
    protected abiRequestCore: any;
    protected addressRequestCore: string;
    protected instanceRequestCore: any;

    constructor(web3Provider ? : any) {
        this.web3Single = new Web3Single(web3Provider);
        this.ipfs = Ipfs.getInstance();

        this.abiRequestCore = requestCore_Artifact.abi;
        this.addressRequestCore = config.ethereum.contracts.requestCore;
        this.instanceRequestCore = new this.web3Single.web3.eth.Contract(this.abiRequestCore, this.addressRequestCore);
    }

    public getCurrentNumRequest(_callback: Types.CallbackGetRequest): void {
      this.instanceRequestCore.methods.numRequests().call(async(err: Error, data: any) => {
          return _callback(err,data);
      });
    }

    public getCurrentNumRequestAsync(): Promise < number > {
        return new Promise((resolve, reject) => {
            this.instanceRequestCore.methods.numRequests().call(async(err: Error, data: any) => {
                if (err) return reject(err);
                return resolve(data);
            });
        });
    }

    public getVersion(_callback: Types.CallbackGetRequest): void {
      this.instanceRequestCore.methods.VERSION().call(async(err: Error, data: any) => {
          return _callback(err,data);
      });
    }

    public getVersionAsync(): Promise < number > {
        return new Promise((resolve, reject) => {
            this.instanceRequestCore.methods.VERSION().call(async(err: Error, data: any) => {
                if (err) return reject(err);
                return resolve(data);
            });
        });
    }

    public getCollectEstimationAsync(
        _expectedAmount:any, 
        _currencyContract:string, 
        _extension:string): Promise < any > {
        _expectedAmount = new BigNumber(_expectedAmount);

        return new Promise((resolve, reject) => {
            if (!this.web3Single.isAddressNoChecksum(_currencyContract)) return reject(Error('_currencyContract must be a valid eth address'));
            if (_extension && _extension != '' && !this.web3Single.isAddressNoChecksum(_extension)) return reject(Error('_extension must be a valid eth address'));

            this.instanceRequestCore.methods.getCollectEstimation(_expectedAmount,_currencyContract,_extension).call(async(err: Error, data: any) => {
                if (err) return reject(err);
                return resolve(data);
            });
        });
    }

    public getCollectEstimation(
        _expectedAmount:any, 
        _currencyContract:string, 
        _extension:string,
        _callback: Types.CallbackGetRequest): void {
        _expectedAmount = new BigNumber(_expectedAmount);
            if (!this.web3Single.isAddressNoChecksum(_currencyContract)) return _callback(Error('_currencyContract must be a valid eth address'),null);
            if (_extension && _extension != '' && !this.web3Single.isAddressNoChecksum(_extension)) return _callback(Error('_extension must be a valid eth address'),null);

            this.instanceRequestCore.methods.getCollectEstimation(_expectedAmount,_currencyContract,_extension).call(async(err: Error, data: any) => {
                return _callback(err,data);
            });
    }

    public getRequestAsync(
        _requestId: string): Promise < any > {
        return new Promise((resolve, reject) => {
            if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

            this.instanceRequestCore.methods.requests(_requestId).call(async(err: Error, data: any) => {
                if (err) return reject(err);

                try {
                    if(data.creator == '0x0000000000000000000000000000000000000000') 
                    {
                        return reject(Error('request not found'));
                    }

                    let dataResult: any = {
                        requestId: _requestId,
                        creator: data.creator,
                        payee: data.payee,
                        payer: data.payer,
                        expectedAmount: new BigNumber(data.expectedAmount),
                        currencyContract: data.currencyContract,
                        balance: new BigNumber(data.balance),
                        state: data.state,
                        extension: data.extension!="0x0000000000000000000000000000000000000000"?data.extension:undefined,
                        data: data.data,
                    };

                    if (ServicesContracts.getServiceFromAddress(data.currencyContract)) {
                        let currencyContractDetails = await ServicesContracts.getServiceFromAddress(data.currencyContract,this.web3Single.web3.currentProvider).getRequestCurrencyContractInfoAsync(_requestId);
                        dataResult.currencyContract = Object.assign(currencyContractDetails, { address: dataResult.currencyContract });
                    }

                    if (data.extension && data.extension != '' && ServiceExtensions.getServiceFromAddress(data.extension)) {
                        let extensionDetails = await ServiceExtensions.getServiceFromAddress(data.extension,this.web3Single.web3.currentProvider).getRequestExtensionInfoAsync(_requestId);
                        dataResult.extension = Object.assign(extensionDetails, { address: dataResult.extension });
                    }

                    if (dataResult.data && dataResult.data != '') {
                        dataResult.data = {hash:dataResult.data, data:JSON.parse(await this.ipfs.getFileAsync(dataResult.data))};
                    } else {
                        dataResult.data = undefined;
                    }
                    return resolve(dataResult);
                } catch (e) {
                    return reject(e);
                }
            });
        });
    }

    public getRequest(
        _requestId: string,
        _callbackGetRequest: Types.CallbackGetRequest) {
        if (!this.web3Single.isHexStrictBytes32(_requestId)) return _callbackGetRequest(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''),undefined);

        this.instanceRequestCore.methods.requests(_requestId).call(async(err: Error, data: any) => {
            if (err) return _callbackGetRequest(err, data);

            try {
                if(data.creator == '0x0000000000000000000000000000000000000000') 
                {
                    return _callbackGetRequest(Error('request not found'),data);
                }

                let dataResult: any = {
                    requestId: _requestId,
                    creator: data.creator,
                    payee: data.payee,
                    payer: data.payer,
                    expectedAmount: new BigNumber(data.expectedAmount),
                    currencyContract: data.currencyContract,
                    balance: new BigNumber(data.balance),
                    state: data.state,
                    extension: data.extension!="0x0000000000000000000000000000000000000000"?data.extension:undefined,
                    data: data.data,
                };

                if (ServiceExtensions.getServiceFromAddress(data.extension)) {
                    let extensionDetails = await ServiceExtensions.getServiceFromAddress(data.extension,this.web3Single.web3.currentProvider).getRequestExtensionInfoAsync(_requestId);
                    dataResult.extension = Object.assign(extensionDetails, { address: dataResult.extension });
                }

                if (ServicesContracts.getServiceFromAddress(data.currencyContract)) {
                    let currencyContractDetails = await ServicesContracts.getServiceFromAddress(data.currencyContract,this.web3Single.web3.currentProvider).getRequestCurrencyContractInfoAsync(_requestId);
                    dataResult.currencyContract = Object.assign(currencyContractDetails, { address: dataResult.extension });
                }

                if (dataResult.data && dataResult.data != '') {
                    // get IPFS data :
                    this.ipfs.getFile(dataResult.data, (err: Error, data: string) => {
                        if (err) return _callbackGetRequest(err, dataResult);
                        dataResult.data = {hash:dataResult, data:JSON.parse(data)};
                        return _callbackGetRequest(err, dataResult);
                    });
                } else {
                    return _callbackGetRequest(err, dataResult);
                }
            } catch (e) {
                return _callbackGetRequest(e,null);
            }
        });
    }        
}