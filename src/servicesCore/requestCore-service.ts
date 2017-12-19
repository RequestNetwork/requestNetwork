import * as Types from '../types';
import Artifacts from '../artifacts';
import * as ServicesContracts from '../servicesContracts';
import * as ServiceExtensions from '../servicesExtensions';

const requestCore_Artifact = Artifacts.RequestCoreArtifact;

import { Web3Single } from '../servicesExternal/web3-single';
import Ipfs from '../servicesExternal/ipfs-service';

const BN = Web3Single.BN();

export default class RequestCoreService {
    private web3Single: Web3Single;
    protected ipfs: any;

    // RequestEthereum on blockchain
    protected abiRequestCore: any;
    protected addressRequestCore: string;
    protected instanceRequestCore: any;

    constructor() {
        this.web3Single = Web3Single.getInstance();
        this.ipfs = Ipfs.getInstance();

        this.abiRequestCore = requestCore_Artifact.abi;
        if(!requestCore_Artifact.networks[this.web3Single.networkName]) {
            throw Error('RequestCore Artifact does not have configuration for network : "'+this.web3Single.networkName+'"');
        }
        this.addressRequestCore = requestCore_Artifact.networks[this.web3Single.networkName].address;
        this.instanceRequestCore = new this.web3Single.web3.eth.Contract(this.abiRequestCore, this.addressRequestCore);
    }

    public getCurrentNumRequest(): Promise < number > {
        return new Promise((resolve, reject) => {
            this.instanceRequestCore.methods.numRequests().call(async(err: Error, data: any) => {
                if (err) return reject(err);
                return resolve(data);
            });
        });
    }

    public getVersion(): Promise < number > {
        return new Promise((resolve, reject) => {
            this.instanceRequestCore.methods.VERSION().call(async(err: Error, data: any) => {
                if (err) return reject(err);
                return resolve(data);
            });
        });
    }

    public getCollectEstimation(
        _expectedAmount: any,
        _currencyContract: string,
        _extension: string): Promise < any > {
        _expectedAmount = new BN(_expectedAmount);

        return new Promise((resolve, reject) => {
            if (!this.web3Single.isAddressNoChecksum(_currencyContract)) return reject(Error('_currencyContract must be a valid eth address'));
            if (_extension && _extension != '' && !this.web3Single.isAddressNoChecksum(_extension)) return reject(Error('_extension must be a valid eth address'));

            this.instanceRequestCore.methods.getCollectEstimation(_expectedAmount,_currencyContract,_extension).call(async(err: Error, data: any) => {
                if (err) return reject(err);
                return resolve(data);
            });
        });
    }

    public getRequest(_requestId: string): Promise < any > {
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
                        expectedAmount: new BN(data.expectedAmount),
                        currencyContract: data.currencyContract,
                        balance: new BN(data.balance),
                        state: data.state,
                        extension: data.extension!="0x0000000000000000000000000000000000000000"?data.extension:undefined,
                        data: data.data,
                    };

                    if (ServicesContracts.getServiceFromAddress(data.currencyContract)) {
                        let currencyContractDetails = await ServicesContracts.getServiceFromAddress(data.currencyContract).getRequestCurrencyContractInfo(_requestId);
                        dataResult.currencyContract = Object.assign(currencyContractDetails, { address: dataResult.currencyContract });
                    }

                    if (data.extension && data.extension != '' && ServiceExtensions.getServiceFromAddress(data.extension)) {
                        let extensionDetails = await ServiceExtensions.getServiceFromAddress(data.extension).getRequestExtensionInfo(_requestId);
                        dataResult.extension = Object.assign(extensionDetails, { address: dataResult.extension });
                    }

                    if (dataResult.data && dataResult.data != '') {
                        dataResult.data = {hash:dataResult.data, data:JSON.parse(await this.ipfs.getFile(dataResult.data))};
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

    public getRequestByTransactionHash(
        _hash: string): Promise < any > {
        return new Promise(async (resolve, reject) => {
            try
            {
                let txReceipt = await this.web3Single.getTransactionReceipt(_hash);

                if(!txReceipt)
                {
                    let tx = await this.web3Single.getTransaction(_hash);
                    if(!tx)
                    {
                        return reject(Error('transaction not found'));
                    }
                    else if(!tx.blockNumber)
                    {
                        // TODO : check transaction input data
                        return reject(Error('transaction not mined'));
                    }
                }

                if(!txReceipt.logs || !txReceipt.logs[0] || !this.web3Single.areSameAddressesNoChecksum(txReceipt.logs[0].address,this.addressRequestCore))
                {
                    return reject(Error('transaction did not create a Request'));
                }

                let event = this.web3Single.decodeTransactionLog(this.abiRequestCore, 'Created', txReceipt.logs[0]);
                if(!event)
                {
                    return reject(Error('transaction did not create a Request'));
                }
                let request = await this.getRequest(event.requestId);

                return resolve(request);
            } catch(e) {
                return reject(e);
            }
        });
    }

    public getRequestHistory(
        _requestId: string,
        _fromBlock ?: number,
        _toBlock ?: number): Promise < any > {
        return new Promise(async (resolve, reject) => {
            this.instanceRequestCore.methods.requests(_requestId).call(async(err: Error, data: any) => {
                if (err) return reject(err);

                try {
                    let currencyContract = data.currencyContract;
                    let extension = data.extension!="0x0000000000000000000000000000000000000000"?data.extension:undefined;

                    // let eventsCoreRaw = await this.instanceRequestCore.getPastEvents('allEvents', {
                    //     // allEvents and filter don't work together so far. issues created on web3 github
                    //     // filter: {requestId: _requestId},
                    //     fromBlock: requestCore_Artifact.networks[this.web3Single.networkName].blockNumber,
                    //     toBlock: 'latest'
                    // });

                    // events by event waiting for a patch of web3
                    let optionFilters = {
                        filter: { requestId: _requestId },
                        fromBlock: _fromBlock?_fromBlock:requestCore_Artifact.networks[this.web3Single.networkName].blockNumber,
                        toBlock: _toBlock?_toBlock:'latest'
                    };

                    let eventsCoreRaw = [];
                    eventsCoreRaw = eventsCoreRaw.concat(await this.instanceRequestCore.getPastEvents('Created', optionFilters));
                    eventsCoreRaw = eventsCoreRaw.concat(await this.instanceRequestCore.getPastEvents('Accepted', optionFilters));
                    eventsCoreRaw = eventsCoreRaw.concat(await this.instanceRequestCore.getPastEvents('Canceled', optionFilters));
                    eventsCoreRaw = eventsCoreRaw.concat(await this.instanceRequestCore.getPastEvents('UpdateBalance', optionFilters));
                    eventsCoreRaw = eventsCoreRaw.concat(await this.instanceRequestCore.getPastEvents('UpdateExpectedAmount', optionFilters));
                    eventsCoreRaw = eventsCoreRaw.concat(await this.instanceRequestCore.getPastEvents('NewPayee', optionFilters));
                    eventsCoreRaw = eventsCoreRaw.concat(await this.instanceRequestCore.getPastEvents('NewPayer', optionFilters));
                    eventsCoreRaw = eventsCoreRaw.concat(await this.instanceRequestCore.getPastEvents('NewExpectedAmount', optionFilters));
                    eventsCoreRaw = eventsCoreRaw.concat(await this.instanceRequestCore.getPastEvents('NewExtension', optionFilters));
                    eventsCoreRaw = eventsCoreRaw.concat(await this.instanceRequestCore.getPastEvents('NewData', optionFilters));

                        // waiting for filter working (see above)
                    let eventsCore = []
                    eventsCore = await Promise.all(eventsCoreRaw.map(async e => {
                                                            return new Promise(async (resolve, reject) => {
                                                                resolve({
                                                                    _meta: {
                                                                        logIndex:e.logIndex,
                                                                        blockNumber:e.blockNumber,
                                                                        timestamp:await this.web3Single.getBlockTimestamp(e.blockNumber)
                                                                    },
                                                                    name:e.event,
                                                                    data: e.returnValues
                                                                });
                                                            });
                                                        }));

                    let eventsExtensions = [];
                    if (ServiceExtensions.getServiceFromAddress(extension)) {
                        eventsExtensions = await ServiceExtensions.getServiceFromAddress(extension).getRequestHistoryExtensionInfo(_requestId,_fromBlock,_toBlock);
                    }

                    let eventsCurrencyContract = [];
                    if (ServicesContracts.getServiceFromAddress(currencyContract)) {
                        eventsCurrencyContract = await ServicesContracts.getServiceFromAddress(currencyContract).getRequestHistoryCurrencyContractInfo(_requestId,_fromBlock,_toBlock);
                    }

                    return resolve(eventsCore.concat(eventsExtensions).concat(eventsCurrencyContract).sort(function (a, b) {
                                                                                          let diffBlockNumber = a._meta.blockNumber - b._meta.blockNumber;
                                                                                          return diffBlockNumber != 0 ? diffBlockNumber : a._meta.logIndex - b._meta.logIndex;
                                                                                        }));
                } catch(e) {
                    return reject(e);
                }
            });
        });
    }

    public getRequestsByAddress(
        _address: string,
        _fromBlock ?: number,
        _toBlock ?: number): Promise < any > {
        return new Promise(async (resolve, reject) => {
            try {
                let eventsCorePayee = await this.instanceRequestCore.getPastEvents('Created', {
                    filter: { payee: _address },
                    fromBlock: _fromBlock?_fromBlock:requestCore_Artifact.networks[this.web3Single.networkName].blockNumber,
                    toBlock: _toBlock?_toBlock:'latest'
                });
                let eventsCorePayer = await this.instanceRequestCore.getPastEvents('Created', {
                    filter: { payer: _address },
                    fromBlock: _fromBlock?_fromBlock:requestCore_Artifact.networks[this.web3Single.networkName].blockNumber,
                    toBlock: _toBlock?_toBlock:'latest'
                });

                eventsCorePayee = await Promise.all(eventsCorePayee.map(e => {
                                                        return new Promise(async (resolve, reject) => {
                                                            return resolve({requestId:e.returnValues.requestId,
                                                                             _meta: {
                                                                                 blockNumber:e.blockNumber,
                                                                                 timestamp:await this.web3Single.getBlockTimestamp(e.blockNumber)
                                                                            }});
                                                        });
                                                    }));

                eventsCorePayer = await Promise.all(eventsCorePayer.map(e => {
                                                        return new Promise(async (resolve, reject) => {
                                                            return resolve({requestId:e.returnValues.requestId,
                                                                             _meta: {
                                                                                 blockNumber:e.blockNumber,
                                                                                 timestamp:await this.web3Single.getBlockTimestamp(e.blockNumber)
                                                                            }});
                                                        });
                                                    }));
                return resolve({asPayer : eventsCorePayer,
                                asPayee : eventsCorePayee});
            } catch(e) {
                return reject(e);
            }
        });
    }
}
