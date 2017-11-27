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

    public getRequestAsync(
        _requestId: string): Promise < any > {
        return new Promise((resolve, reject) => {
            if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

            this.instanceRequestCore.methods.requests(_requestId).call(async(err: Error, data: any) => {
                if (err) return reject(err);

                let dataResult: any = {
                    requestId: _requestId,
                    creator: data.creator,
                    payee: data.payee,
                    payer: data.payer,
                    amountInitial: new BigNumber(data.amountInitial),
                    subContract: data.subContract,
                    amountPaid: new BigNumber(data.amountPaid),
                    amountAdditional: new BigNumber(data.amountAdditional),
                    amountSubtract: new BigNumber(data.amountSubtract),
                    state: data.state,
                    extension: data.extension,
                    details: data.details,
                };

                if (ServicesContracts.getServiceFromAddress(data.subContract)) {
                    let subContractDetails = await ServicesContracts.getServiceFromAddress(data.subContract,this.web3Single.web3.currentProvider).getRequestSubContractInfoAsync(_requestId);
                    dataResult.subContract = Object.assign(subContractDetails, { address: dataResult.extension });
                }

                if (data.extension && data.extension != '' && ServiceExtensions.getServiceFromAddress(data.extension)) {
                    let extensionDetails = await ServiceExtensions.getServiceFromAddress(data.extension,this.web3Single.web3.currentProvider).getRequestExtensionInfoAsync(_requestId);
                    dataResult.extension = Object.assign(extensionDetails, { address: dataResult.extension });
                }

                if (dataResult.details) {
                    try {
                        dataResult.details = {hash:dataResult.details, data:JSON.parse(await this.ipfs.getFileAsync(dataResult.details))};
                    } catch (e) {
                        return reject(e);
                    }
                }
                return resolve(dataResult);
            });
        });
    }

    public getRequest(
        _requestId: string,
        _callbackGetRequest: Types.CallbackGetRequest) {
        if (!this.web3Single.isHexStrictBytes32(_requestId)) return _callbackGetRequest(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''),undefined);

        this.instanceRequestCore.methods.requests(_requestId).call(async(err: Error, data: any) => {
            if (err) return _callbackGetRequest(err, data);

            let dataResult: any = {
                requestId: _requestId,
                creator: data.creator,
                payee: data.payee,
                payer: data.payer,
                amountInitial: new BigNumber(data.amountInitial),
                subContract: data.subContract,
                amountPaid: new BigNumber(data.amountPaid),
                amountAdditional: new BigNumber(data.amountAdditional),
                amountSubtract: new BigNumber(data.amountSubtract),
                state: data.state,
                extension: data.extension,
                details: data.details,
            };

            if (ServiceExtensions.getServiceFromAddress(data.extension)) {
                let extensionDetails = await ServiceExtensions.getServiceFromAddress(data.extension,this.web3Single.web3.currentProvider).getRequestExtensionInfoAsync(_requestId);
                dataResult.extension = Object.assign(extensionDetails, { address: dataResult.extension });
            }

            if (ServicesContracts.getServiceFromAddress(data.subContract)) {
                let subContractDetails = await ServicesContracts.getServiceFromAddress(data.subContract,this.web3Single.web3.currentProvider).getRequestSubContractInfoAsync(_requestId);
                dataResult.subContract = Object.assign(subContractDetails, { address: dataResult.extension });
            }

            if (dataResult.details) {
                // get IPFS data :
                this.ipfs.getFile(dataResult.details, (err: Error, data: string) => {
                    if (err) return _callbackGetRequest(err, dataResult);
                    dataResult.details = {hash:dataResult, data:JSON.parse(data)};
                    return _callbackGetRequest(err, dataResult);
                });
            } else {
                return _callbackGetRequest(err, dataResult);
            }
        });
    }        
}