import * as ETH_UTIL from 'ethereumjs-util';
import requestArtifacts from 'requestnetworkartifacts';
import config from '../config';
import * as ServicesContracts from '../servicesContracts';
import * as Types from '../types';

import Ipfs from '../servicesExternal/ipfs-service';
import Web3Single from '../servicesExternal/web3-single';

// @ts-ignore
const ETH_ABI = require('../lib/ethereumjs-abi-perso.js');

const BN = Web3Single.BN();
const EMPTY_BYTES_20 = '0x0000000000000000000000000000000000000000';

/**
 * The RequestCoreService class is the interface for the Request Core contract
 */
export default class RequestCoreService {
    /**
     * get the instance of RequestCoreService
     * @return  The instance of the RequestCoreService class.
     */
    public static getInstance() {
        if (!RequestCoreService._instance) {
            RequestCoreService._instance = new this();
        }
        return RequestCoreService._instance;
    }

    public static destroy() {
        RequestCoreService._instance = null;
    }

    private static _instance: RequestCoreService|null;

    public web3Single: Web3Single;
    public ipfs: any;

    // RequestCore on blockchain
    /**
     * RequestCore contract's abi
     */
    protected abiRequestCoreLast: any;
    /**
     * RequestCore contract's address
     */
    protected addressRequestCoreLast: string;
    /**
     * RequestCore contract's web3 instance
     */
    protected instanceRequestCoreLast: any;

    /**
     * constructor to Instantiates a new RequestCoreService
     */
    private constructor() {
        this.web3Single = Web3Single.getInstance();
        this.ipfs = Ipfs.getInstance();

        const requestCoreArtifact = this.web3Single.getContractInstance('last-RequestCore');
        if (!requestCoreArtifact) {
            throw Error('requestCore Artifact: no config for network : "' + this.web3Single.networkName + '"');
        }

        this.abiRequestCoreLast = requestCoreArtifact.abi;
        this.addressRequestCoreLast = requestCoreArtifact.address;
        this.instanceRequestCoreLast = requestCoreArtifact.instance;
    }

    /**
     * get the number of the last request (N.B: number !== id)
     * @return  promise of the number of the last request
     */
    public getCurrentNumRequest(): Promise < number > {
        return new Promise((resolve, reject) => {
            this.instanceRequestCoreLast.methods.numRequests().call(async (err: Error, data: any) => {
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
        return new Promise(async (resolve, reject) => {
            if (!this.web3Single.isHexStrictBytes32(_requestId)) {
                return reject(Error('_requestId must be a 32 bytes hex string'));
            }

            try {
                const coreContract = this.getCoreContractFromRequestId(_requestId);

                // get information from the core
                const dataRequest = await coreContract.instance.methods.getRequest(_requestId).call();
                if (dataRequest.creator === EMPTY_BYTES_20) {
                    return reject(Error('request not found'));
                }
                // get subPayees
                const subPayeesCount = await coreContract.instance.methods.getSubPayeesCount(_requestId).call();
                const subPayees: any[] = [];
                for (let i = 0; i < subPayeesCount; i++) {
                    const sub = await coreContract.instance.methods.subPayees(_requestId, i).call();
                    subPayees.push({address: sub.addr,
                                    balance: new BN(sub.balance),
                                    expectedAmount: new BN(sub.expectedAmount)});
                }

                // get creator and data
                const eventCoreRaw = await coreContract.instance.getPastEvents('Created', {
                    filter: {requestId: _requestId},
                    fromBlock: coreContract.blockNumber,
                    toBlock: 'latest'});

                // this is not supposed to happen
                if ( !eventCoreRaw || eventCoreRaw.length === 0 ) {
                    return reject(Error('Impossible to get the past events of the request!'));
                }

                const creator = eventCoreRaw[0].returnValues.creator;
                const data = eventCoreRaw[0].returnValues.data;

                // create payee object
                const payee = {address: dataRequest.payeeAddr,
                                balance: new BN(dataRequest.payeeBalance),
                                expectedAmount: new BN(dataRequest.payeeExpectedAmount)};

                let dataResult: any = {
                    creator,
                    currencyContract: dataRequest.currencyContract,
                    data,
                    payee,
                    payer: dataRequest.payer,
                    requestId: _requestId,
                    state: parseInt(dataRequest.state, 10),
                    subPayees};

                // get information from the currency contract
                const serviceContract = ServicesContracts.getServiceFromAddress(this.web3Single.networkName, dataRequest.currencyContract);
                if (serviceContract) {
                    dataResult = await serviceContract.getRequestCurrencyContractInfo(dataResult, coreContract);
                }

                // get ipfs data if needed
                if (dataResult.data && dataResult.data !== '') {
                    try {
                        const dataStr = dataResult.data;
                        dataResult.data = {hash: dataStr};
                        dataResult.data.data = JSON.parse(await this.ipfs.getFile(dataStr));
                    } catch (exception) {
                        dataResult.data.warning = exception.message;
                    }
                } else {
                    dataResult.data = undefined;
                }
                return resolve(dataResult);
            } catch (e) {
                return reject(e);
            }
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

                const ccyContractservice = await ServicesContracts.getServiceFromAddress(this.web3Single.networkName, ccyContract);
                // get information from the currency contract
                if (!ccyContractservice) {
                    return reject(Error('Contract is not supported by request'));
                }

                const method = ccyContractservice.decodeInputData(ccyContract, transaction.input);

                if ( ! method.name) {
                    return reject(Error('transaction data not parsable'));
                }
                transaction.method = method;

                let request: any;

                const txReceipt = await this.web3Single.getTransactionReceipt(_hash);

                // if already mined
                if (txReceipt) {
                    if (parseInt(txReceipt.status, 16) !== 1 && txReceipt.status !== 1 && txReceipt.status !== true) {
                        errors.push('transaction has failed');
                    } else if (transaction.method
                        && transaction.method.parameters
                        && transaction.method.parameters._requestId) {
                        // simple action
                        request = await this.getRequest(transaction.method.parameters._requestId);
                    } else if (txReceipt.logs && txReceipt.logs[0]) {

                        const coreContract = this.web3Single.getContractInstance(txReceipt.logs[0].address);

                        if (coreContract) {
                            // maybe a creation
                            const event = this.web3Single.decodeTransactionLog(coreContract.abi,
                                                                                'Created',
                                                                                txReceipt.logs[0]);
                            if (event) {
                                request = await this.getRequest(event.requestId);
                            }

                        }
                    }
                } else {
                    // if not mined, let's try to call it
                    const methodGenerated = this.generateWeb3Method(ccyContract, transaction.method.name,
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
            const coreContract = this.getCoreContractFromRequestId(_requestId);
            coreContract.instance.methods.getRequest(_requestId).call(async (err: Error, request: any) => {
                if (err) return reject(err);
                request.requestId = _requestId;

                try {
                    const currencyContract = request.currencyContract;
                    // const extension = request.extension !== EMPTY_BYTES_20 ? request.extension : undefined;

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
                        fromBlock: _fromBlock ? _fromBlock : coreContract.blockNumber,
                        toBlock: _toBlock ? _toBlock : 'latest'};

                    let eventsCoreRaw: any[] = [];

                    /* tslint:disable:max-line-length */
                    eventsCoreRaw = eventsCoreRaw.concat(await coreContract.instance.getPastEvents('Created', optionFilters));
                    eventsCoreRaw = eventsCoreRaw.concat(await coreContract.instance.getPastEvents('Accepted', optionFilters));
                    eventsCoreRaw = eventsCoreRaw.concat(await coreContract.instance.getPastEvents('Canceled', optionFilters));
                    eventsCoreRaw = eventsCoreRaw.concat(await coreContract.instance.getPastEvents('UpdateBalance', optionFilters));
                    eventsCoreRaw = eventsCoreRaw.concat(await coreContract.instance.getPastEvents('UpdateExpectedAmount', optionFilters));
                    eventsCoreRaw = eventsCoreRaw.concat(await coreContract.instance.getPastEvents('NewSubPayee', optionFilters));
                    /* tslint:enable:max-line-length */

                        // waiting for filter working (see above)
                    let eventsCore = [];
                    eventsCore = await Promise.all(eventsCoreRaw.map(async (e) => {
                                        return new Promise(async (resolveEvent, rejectEvent) => {
                                            const transaction = await this.web3Single.getTransaction(e.transactionHash);
                                            resolveEvent({
                                                _meta: {
                                                    blockNumber: e.blockNumber,
                                                    logIndex: e.logIndex,
                                                    timestamp: await this.web3Single.getBlockTimestamp(e.blockNumber)},
                                                data: e.returnValues,
                                                name: e.event,
                                                from: transaction.from});
                                        });
                                    }));

                    let eventsCurrencyContract = [];
                    const serviceContract = ServicesContracts.getServiceFromAddress(this.web3Single.networkName, currencyContract);
                    if (serviceContract) {
                        eventsCurrencyContract = await serviceContract
                                                .getRequestEventsCurrencyContractInfo(request, coreContract, _fromBlock, _toBlock);
                    }

                    return resolve(eventsCore
                                    .concat(eventsCurrencyContract)
                                    .sort( (a: any, b: any) => {

                                      const diffTimestamp = a._meta.timestamp - b._meta.timestamp;
                                      return diffTimestamp !== 0 ? diffTimestamp : a._meta.logIndex - b._meta.logIndex;
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
                const allCoreContracts = this.getAllCoreInstance();
                let allEventsCorePayee: any[] = [];
                let allEventsCorePayer: any[] = [];
                let allEventsCoreSubPayee: any[] = [];
                for ( const contract of allCoreContracts ) {
                    const oneResult = await this.getRequestsByAddressForOneContract(_address, contract, _fromBlock, _toBlock);
                    allEventsCorePayee = allEventsCorePayee.concat(oneResult.asPayee);
                    allEventsCorePayer = allEventsCorePayer.concat(oneResult.asPayer);
                    allEventsCoreSubPayee = allEventsCoreSubPayee.concat(oneResult.asSubPayee);
                }
                return resolve({asPayee : allEventsCorePayee,
                                asPayer : allEventsCorePayer,
                                asSubPayee : allEventsCoreSubPayee});
            } catch (e) {
                return reject(e);
            }
        });
    }

    public getAllCoreInstance(): any[] {
        const result: any[] = [];
        const allArtifacts = requestArtifacts.getAllArtifactsForNetwork(this.web3Single.networkName);
        for ( const key in allArtifacts ) {
            if (key.slice(0, 2) === '0x' && allArtifacts[key].split('/')[0] === 'RequestCore') {
                result.push( this.web3Single.getContractInstance(key) );
            }
        }
        return result;
    }

    /**
     * get the list of requests connected to an address
     * @param   _address        address to get the requests
     * @param   _fromBlock      search requests from this block (optional)
     * @param   _toBlock        search requests until this block (optional)
     * @return  promise of the object of requests as {asPayer:[],asPayee[]}
     */
    public getIpfsFile(_hash: string): Promise < any > {
        return this.ipfs.getFile(_hash);
    }

    /**
     * get the core contract instance of a request
     * @param   _requestId    requestId of the request
     * @return  the contract information of the request : { abi, address, instance, blockNumber, version }
     */
    public getCoreContractFromRequestId(_requestId: string): any {
        return this.web3Single.getContractInstance(_requestId.slice(0, 42));
    }

    /**
     * create a bytes request
     * @param   _payeesIdAddress           ID addresses of the payees (the position 0 will be the main payee, must be the broadcaster address)
     * @param   _expectedAmounts           amount initial expected per payees for the request
     * @param   _payer                     address of the payer
     * @param   _data                      hash of the data
     * @return  the request in bytes
     */
    public createBytesRequest(
                    payeesIdAddress: string[],
                    expectedAmounts: any[],
                    payer: string,
                    data: string): any {
        const requestParts = [
                {value: payeesIdAddress[0], type: 'address'},
                {value: payer, type: 'address'},
                {value: payeesIdAddress.length, type: 'uint8'}];

        for (const k in payeesIdAddress) {
            if (payeesIdAddress.hasOwnProperty(k)) {
                requestParts.push({value: payeesIdAddress[k], type: 'address'});
                requestParts.push({value: expectedAmounts[k], type: 'int256'});
            }
        }

        requestParts.push({value: data.length, type: 'uint8'});
        requestParts.push({value: data, type: 'string'});

        const types: string[] = [];
        const values: any[] = [];
        requestParts.forEach((o) => {
            types.push(o.type);
            values.push(o.value);
        });

        return this.web3Single.web3.utils.bytesToHex(ETH_ABI.solidityPack(types, values));
    }

   /**
    * Parse information from a request bytes
    * @param   _requestBytes     the request in bytes
    * @return  the request parsed as {creator, payer, mainPayee, subPayees, data}
    */
   public parseBytesRequest(_requestBytes: string): any {
       const INDEX_CREATOR = 2;
       const INDEX_PAYER = 21 * 2;
       const INDEX_PAYEES_COUNT = 41 * 2;
       const INDEX_PAYEES_ARRAY = 41 * 2 + 2;

       const SIZE_ADDRESS = 20 * 2;
       const SIZE_INT256 = 32 * 2;

       const creator = '0x' + _requestBytes.slice(INDEX_CREATOR, INDEX_CREATOR + SIZE_ADDRESS);
       const payer = '0x' + _requestBytes.slice(INDEX_PAYER, INDEX_PAYER + SIZE_ADDRESS);
       const payeesCount = parseInt(_requestBytes.slice(INDEX_PAYEES_COUNT, INDEX_PAYEES_COUNT + 2), 16);

       const mainPayee = {address: '0x' + _requestBytes.slice(INDEX_PAYEES_ARRAY, INDEX_PAYEES_ARRAY + SIZE_ADDRESS),
                       expectedAmount: new BN(_requestBytes.slice(INDEX_PAYEES_ARRAY + SIZE_ADDRESS, INDEX_PAYEES_ARRAY + SIZE_ADDRESS + SIZE_INT256), 16)};

       const subPayees: any[] = [];
       for (let i = 1; i < payeesCount; i++) {
           const indexSubPayee = INDEX_PAYEES_ARRAY + (SIZE_ADDRESS + SIZE_INT256) * i;
           subPayees.push({address: '0x' + _requestBytes.slice(indexSubPayee, indexSubPayee + SIZE_ADDRESS),
                            expectedAmount: new BN(_requestBytes.slice(indexSubPayee + SIZE_ADDRESS, indexSubPayee + SIZE_ADDRESS + SIZE_INT256), 16)});
       }

       const dataCountOffset = INDEX_PAYEES_ARRAY + (SIZE_ADDRESS + SIZE_INT256) * payeesCount;
       const dataCount = parseInt(_requestBytes.slice(dataCountOffset, dataCountOffset + 2), 16);
       const dataHex = _requestBytes.slice(dataCountOffset + 2, dataCountOffset + 2 + dataCount * 2);
       const data = this.web3Single.web3.utils.hexToUtf8('0x' + dataHex);

       return {
           creator,
           payer,
           mainPayee,
           subPayees,
           data};
   }

    /**
     * generate web3 method of the contract from name and parameters in array
     * @param   _data    requestId of the request
     * @return  return a web3 method object
     */
    public generateWeb3Method(_address: string, _name: string, _parameters: any[]): any {
        const contract = this.web3Single.getContractInstance(_address);
        return this.web3Single.generateWeb3Method(contract.instance, _name, _parameters);
    }

    /**
     * get the list of requests connected to an address for one contract
     * @param   _address                address to get the requests
     * @param   _requestCoreContract    contract to search in
     * @param   _fromBlock              search requests from this block (optional)
     * @param   _toBlock                search requests until this block (optional)
     * @return  promise of the object of requests as {asPayer:[],asPayee[]}
     */
    private getRequestsByAddressForOneContract(
        _address: string,
        _requestCoreContract: any,
        _fromBlock ?: number,
        _toBlock ?: number): Promise < any > {
        return new Promise(async (resolve, reject) => {
            try {
                const networkName = this.web3Single.networkName;
                // get events Created with payee === address
                let eventsCorePayee = await _requestCoreContract.instance.getPastEvents('Created', {
                    filter: { payee: _address },
                    fromBlock: _fromBlock ? _fromBlock : _requestCoreContract.blockNumber,
                    toBlock: _toBlock ? _toBlock : 'latest'});

                // get events Created with payer === address
                let eventsCorePayer = await _requestCoreContract.instance.getPastEvents('Created', {
                    filter: { payer: _address },
                    fromBlock: _fromBlock ? _fromBlock : _requestCoreContract.blockNumber,
                    toBlock: _toBlock ? _toBlock : 'latest'});

                // get events NewSubPayee with subPayee === address
                let eventsCoreSubPayee = await _requestCoreContract.instance.getPastEvents('NewSubPayee', {
                    filter: { payee: _address },
                    fromBlock: _fromBlock ? _fromBlock : _requestCoreContract.blockNumber,
                    toBlock: _toBlock ? _toBlock : 'latest'});

                // clean the data and get timestamp for requests as payee
                eventsCorePayee = await Promise.all(eventsCorePayee.map((e: any) => {
                                    return new Promise(async (resolveEvent, rejectEvent) => {
                                        return resolveEvent({
                                                _meta: {
                                                    blockNumber: e.blockNumber,
                                                    timestamp: await this.web3Single.getBlockTimestamp(e.blockNumber)},
                                                requestId: e.returnValues.requestId});
                                    });
                                }));

                // clean the data and get timestamp for requests as payer
                eventsCorePayer = await Promise.all(eventsCorePayer.map((e: any) => {
                                    return new Promise(async (resolveEvent, rejectEvent) => {
                                        return resolveEvent({
                                                _meta: {
                                                    blockNumber: e.blockNumber,
                                                    timestamp: await this.web3Single.getBlockTimestamp(e.blockNumber)},
                                                requestId: e.returnValues.requestId});
                                    });
                                }));
                // clean the data and get timestamp for requests as sub payee
                eventsCoreSubPayee = await Promise.all(eventsCoreSubPayee.map((e: any) => {
                                    return new Promise(async (resolveEvent, rejectEvent) => {
                                        return resolveEvent({
                                                _meta: {
                                                    blockNumber: e.blockNumber,
                                                    timestamp: await this.web3Single.getBlockTimestamp(e.blockNumber)},
                                                requestId: e.returnValues.requestId});
                                    });
                                }));

                return resolve({asPayee: eventsCorePayee,
                                asPayer: eventsCorePayer,
                                asSubPayee: eventsCoreSubPayee});
            } catch (e) {
                return reject(e);
            }
        });
    }
}
