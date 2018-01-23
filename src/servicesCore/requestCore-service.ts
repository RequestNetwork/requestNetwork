import config from '../config';
import * as ServicesContracts from '../servicesContracts';
import * as ServicesExtensions from '../servicesExtensions';
import * as Types from '../types';

import Artifacts from '../artifacts';
import Ipfs from '../servicesExternal/ipfs-service';

import { Web3Single } from '../servicesExternal/web3-single';

const requestCoreArtifact = Artifacts.requestCoreArtifact;

const BN = Web3Single.BN();
const EMPTY_BYTES_32 = '0x0000000000000000000000000000000000000000';

/**
 * The RequestCoreService class is the interface for the Request Core contract
 */
export default class RequestCoreService {
    protected web3Single: Web3Single;
    protected ipfs: any;

    // RequestCore on blockchain
    /**
     * RequestCore contract's abi
     */
    protected abiRequestCore: any;
    /**
     * RequestCore contract's address
     */
    protected addressRequestCore: string;
    /**
     * RequestCore contract's web3 instance
     */
    protected instanceRequestCore: any;

    /**
     * constructor to Instantiates a new RequestCoreService
     */
    constructor() {
        this.web3Single = Web3Single.getInstance();
        this.ipfs = Ipfs.getInstance();

        this.abiRequestCore = requestCoreArtifact.abi;
        if (!requestCoreArtifact.networks[this.web3Single.networkName]) {
            throw Error('RequestCore Artifact does not have configuration for network: ' + this.web3Single.networkName);
        }
        this.addressRequestCore = requestCoreArtifact.networks[this.web3Single.networkName].address;
        this.instanceRequestCore = new this.web3Single.web3.eth.Contract(this.abiRequestCore, this.addressRequestCore);
    }

    /**
     * get the number of the last request (N.B: number !== id)
     * @return  promise of the number of the last request
     */
    public getCurrentNumRequest(): Promise < number > {
        return new Promise((resolve, reject) => {
            this.instanceRequestCore.methods.numRequests().call(async (err: Error, data: any) => {
                if (err) return reject(err);
                return resolve(data);
            });
        });
    }

    /**
     * get the version of the contract
     * @return  promise of the version of the contract
     */
    public getVersion(): Promise < number > {
        return new Promise((resolve, reject) => {
            this.instanceRequestCore.methods.VERSION().call(async (err: Error, data: any) => {
                if (err) return reject(err);
                return resolve(data);
            });
        });
    }

    /**
     * get the estimation of ether (in wei) needed to create a request
     * @param   _expectedAmount    amount expected of the request
     * @param   _currencyContract  address of the currency contract of the request
     * @param   _extension         address of the extension contract of the request
     * @return  promise of the number of wei needed to create the request
     */
    public getCollectEstimation(
        _expectedAmount: any,
        _currencyContract: string,
        _extension: string): Promise < any > {
        _expectedAmount = new BN(_expectedAmount);

        return new Promise((resolve, reject) => {
            if (!this.web3Single.isAddressNoChecksum(_currencyContract)) {
                return reject(Error('_currencyContract must be a valid eth address'));
            }
            if (_extension && _extension !== '' && !this.web3Single.isAddressNoChecksum(_extension)) {
                return reject(Error('_extension must be a valid eth address'));
            }

            this.instanceRequestCore.methods.getCollectEstimation(_expectedAmount, _currencyContract, _extension)
              .call(async (err: Error, data: any) => {
                if (err) return reject(err);
                return resolve(data);
            });
        });
    }

    /**
     * get a request by its requestId
     * @param   _requestId    requestId of the request
     * @return  promise of the object containing the request
     */
    public getRequest(_requestId: string): Promise < any > {
        return new Promise((resolve, reject) => {
            if (!this.web3Single.isHexStrictBytes32(_requestId)) {
                return reject(Error('_requestId must be a 32 bytes hex string'));
            }
            // get information from the core
            this.instanceRequestCore.methods.requests(_requestId).call(async (err: Error, data: any) => {
                if (err) return reject(err);

                try {
                    if (data.creator === EMPTY_BYTES_32) {
                        return reject(Error('request not found'));
                    }

                    const dataResult: any = {
                        balance: new BN(data.balance),
                        creator: data.creator,
                        currencyContract: data.currencyContract,
                        data: data.data,
                        expectedAmount: new BN(data.expectedAmount),
                        extension: data.extension !== EMPTY_BYTES_32 ? data.extension : undefined,
                        payee: data.payee,
                        payer: data.payer,
                        requestId: _requestId,
                        state: parseInt(data.state, 10)};

                    // get information from the currency contract
                    if (ServicesContracts.getServiceFromAddress(data.currencyContract)) {
                        const ccyContractDetails = await ServicesContracts.getServiceFromAddress(data.currencyContract)
                                                                            .getRequestCurrencyContractInfo(_requestId);
                        dataResult.currencyContract = Object.assign(ccyContractDetails,
                                                                    {address: dataResult.currencyContract});
                    }

                    // get information from the extension contract
                    if (data.extension
                            && data.extension !== ''
                            && ServicesExtensions.getServiceFromAddress(data.extension)) {
                        const extensionDetails = await ServicesExtensions.getServiceFromAddress(data.extension)
                                                                        .getRequestExtensionInfo(_requestId);
                        dataResult.extension = Object.assign(extensionDetails, { address: dataResult.extension });
                    }

                    // get ipfs data if needed
                    if (dataResult.data && dataResult.data !== '') {
                        dataResult.data = {data: JSON.parse(await this.ipfs.getFile(dataResult.data)),
                                            hash: dataResult.data};
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

    /**
     * get a request and method called by the hash of a transaction
     * @param   _hash    hash of the ethereum transaction
     * @return  promise of the object containing the request and the transaction
     */
    public getRequestByTransactionHash(_hash: string): Promise < any > {
        return new Promise(async (resolve, reject) => {
            try {
                let errors: any[] | undefined = [];
                let warnings: any[] | undefined = [];
                const transaction = await this.web3Single.getTransaction(_hash);

                if (!transaction) {
                    return reject(Error('transaction not found'));
                }

                const ccyContract = transaction.to;

                const ccyContractservice = await ServicesContracts.getServiceFromAddress(ccyContract);
                // get information from the currency contract
                if (!ccyContractservice) {
                    return reject(Error('Contract is not supported by request'));
                }

                const method = ccyContractservice.decodeInputData(transaction.input);

                if ( ! method.name) {
                    return reject(Error('transaction data not parsable'));
                }
                transaction.method = method;

                let request: any;

                const txReceipt = await this.web3Single.getTransactionReceipt(_hash);

                // if already mined
                if (txReceipt) {
                    if (txReceipt.status !== '0x1' && txReceipt.status !== 1) {
                        errors.push('transaction has failed');
                    } else if (transaction.method
                        && transaction.method.parameters
                        && transaction.method.parameters._requestId) {
                        // simple action
                        request = await this.getRequest(transaction.method.parameters._requestId);
                    } else if (txReceipt.logs
                                && txReceipt.logs[0]
                                && this.web3Single.areSameAddressesNoChecksum(txReceipt.logs[0].address,
                                                                                this.addressRequestCore)) {
                        // maybe a creation
                        const event = this.web3Single.decodeTransactionLog(this.abiRequestCore,
                                                                            'Created',
                                                                            txReceipt.logs[0]);
                        if (event) {
                            request = await this.getRequest(event.requestId);
                        }
                    }
                } else {
                    // if not mined, let's try to call it
                    const methodGenerated = ccyContractservice.generateWeb3Method(transaction.method.name,
                                                        this.web3Single.resultToArray(transaction.method.parameters));
                    const options = {
                        from: transaction.from,
                        gas: new BN(transaction.gas),
                        value: transaction.value};

                    try {
                        const test = await this.web3Single.callMethod(methodGenerated, options);
                    } catch (e) {
                        warnings.push('transaction may failed: "' + e.message + '"');
                    }

                    if (transaction.gasPrice < config.ethereum.gasPriceMinimumCriticalInWei) {
                        warnings.push('transaction gasPrice is low');
                    }
                }

                errors = errors.length === 0 ? undefined : errors;
                warnings = warnings.length === 0 ? undefined : warnings;

                return resolve({request, transaction, errors, warnings});
            } catch (e) {
                return reject(e);
            }
        });
    }

    /**
     * get a request's events
     * @param   _requestId    requestId of the request
     * @param   _fromBlock    search events from this block (optional)
     * @param   _toBlock    search events until this block (optional)
     * @return  promise of the array of events about the request
     */
    public getRequestEvents(
        _requestId: string,
        _fromBlock ?: number,
        _toBlock ?: number): Promise < any > {
        return new Promise(async (resolve, reject) => {
            this.instanceRequestCore.methods.requests(_requestId).call(async (err: Error, data: any) => {
                if (err) return reject(err);

                try {
                    const currencyContract = data.currencyContract;
                    const extension = data.extension !== EMPTY_BYTES_32 ? data.extension : undefined;

                    // let eventsCoreRaw = await this.instanceRequestCore.getPastEvents('allEvents', {
                    //     // allEvents and filter don't work together so far. issues created on web3 github
                    //     // filter: {requestId: _requestId},
                    //     fromBlock: requestCoreArtifact.networks[this.web3Single.networkName].blockNumber,
                    //     toBlock: 'latest'
                    // });

                    // events by event waiting for a patch of web3
                    const networkName = this.web3Single.networkName;
                    const optionFilters = {
                        filter: { requestId: _requestId },
                        fromBlock: _fromBlock ? _fromBlock : requestCoreArtifact.networks[networkName].blockNumber,
                        toBlock: _toBlock ? _toBlock : 'latest'};

                    let eventsCoreRaw: any[] = [];

                    /* tslint:disable:max-line-length */
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
                    /* tslint:enable:max-line-length */

                        // waiting for filter working (see above)
                    let eventsCore = [];
                    eventsCore = await Promise.all(eventsCoreRaw.map(async (e) => {
                                        return new Promise(async (resolveEvent, rejectEvent) => {
                                            resolveEvent({
                                                _meta: {
                                                    blockNumber: e.blockNumber,
                                                    logIndex: e.logIndex,
                                                    timestamp: await this.web3Single.getBlockTimestamp(e.blockNumber)},
                                                data: e.returnValues,
                                                name: e.event});
                                        });
                                    }));

                    let eventsExtensions = [];
                    if (ServicesExtensions.getServiceFromAddress(extension)) {
                        eventsExtensions = await ServicesExtensions
                                                    .getServiceFromAddress(extension)
                                                    .getRequestEventsExtensionInfo(_requestId, _fromBlock, _toBlock);
                    }

                    let eventsCurrencyContract = [];
                    if (ServicesContracts.getServiceFromAddress(currencyContract)) {
                        eventsCurrencyContract = await ServicesContracts
                                                .getServiceFromAddress(currencyContract)
                                                .getRequestEventsCurrencyContractInfo(_requestId, _fromBlock, _toBlock);
                    }

                    return resolve(eventsCore
                                    .concat(eventsExtensions)
                                    .concat(eventsCurrencyContract)
                                    .sort( (a: any, b: any) => {
                                      const diffBlockNum = a._meta.blockNumber - b._meta.blockNumber;
                                      return diffBlockNum !== 0 ? diffBlockNum : a._meta.logIndex - b._meta.logIndex;
                                    }));
                } catch (e) {
                    return reject(e);
                }
            });
        });
    }

    /**
     * get the list of requests connected to an address
     * @param   _address        address to get the requests
     * @param   _fromBlock      search requests from this block (optional)
     * @param   _toBlock        search requests until this block (optional)
     * @return  promise of the object of requests as {asPayer:[],asPayee[]}
     */
    public getRequestsByAddress(
        _address: string,
        _fromBlock ?: number,
        _toBlock ?: number): Promise < any > {
        return new Promise(async (resolve, reject) => {
            try {
                const networkName = this.web3Single.networkName;
                // get events Created with payee === address
                let eventsCorePayee = await this.instanceRequestCore.getPastEvents('Created', {
                    filter: { payee: _address },
                    fromBlock: _fromBlock ? _fromBlock : requestCoreArtifact.networks[networkName].blockNumber,
                    toBlock: _toBlock ? _toBlock : 'latest'});

                // get events Created with payer === address
                let eventsCorePayer = await this.instanceRequestCore.getPastEvents('Created', {
                    filter: { payer: _address },
                    fromBlock: _fromBlock ? _fromBlock : requestCoreArtifact.networks[networkName].blockNumber,
                    toBlock: _toBlock ? _toBlock : 'latest'});

                // clean the data and get timestamp for request as payee
                eventsCorePayee = await Promise.all(eventsCorePayee.map((e: any) => {
                                    return new Promise(async (resolveEvent, rejectEvent) => {
                                        return resolveEvent({
                                                _meta: {
                                                    blockNumber: e.blockNumber,
                                                    timestamp: await this.web3Single.getBlockTimestamp(e.blockNumber)},
                                                requestId: e.returnValues.requestId});
                                    });
                                }));

                // clean the data and get timestamp for request as payer
                eventsCorePayer = await Promise.all(eventsCorePayer.map((e: any) => {
                                    return new Promise(async (resolveEvent, rejectEvent) => {
                                        return resolveEvent({
                                                _meta: {
                                                    blockNumber: e.blockNumber,
                                                    timestamp: await this.web3Single.getBlockTimestamp(e.blockNumber)},
                                                requestId: e.returnValues.requestId});
                                    });
                                }));

                return resolve({asPayee : eventsCorePayee,
                                asPayer : eventsCorePayer});
            } catch (e) {
                return reject(e);
            }
        });
    }

    /**
     * Get the file content from ipfs
     * @param   _hash        hash of the file
     * @return  promise of the content's file
     */
    public getIpfsFile(_hash: string): Promise < any > {
        return this.ipfs.getFile(_hash);
    }
}
