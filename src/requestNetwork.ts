import { Web3Single } from './servicesExternal/web3-single';
import Ipfs from './servicesExternal/ipfs-service';

// Core -------------------------------------
import RequestCoreService from "../src/servicesCore/requestCore-service";

// Contract ---------------------------------
import RequestEthereumService from "../src/servicesContracts/requestEthereum-service";

// Synchrone Extension ----------------------
import RequestSynchroneExtensionEscrowService from "../src/servicesExtensions/requestSynchroneExtensionEscrow-service";

export default class RequestNetwork {
    public requestEthereumService: RequestEthereumService;
    public requestSynchroneExtensionEscrowService: RequestSynchroneExtensionEscrowService;
    public requestCoreService: RequestCoreService;

    constructor(provider? : any, networkId ? : number, useIpfsPublic : boolean = true) {
    	if(provider && !networkId)
    	{
    		throw Error('if you give provider you have to give the networkId too');
    	}
    	Web3Single.init(provider,networkId);
        Ipfs.init(useIpfsPublic);
    	this.requestCoreService = new RequestCoreService();
        this.requestEthereumService = new RequestEthereumService();
        this.requestSynchroneExtensionEscrowService = new RequestSynchroneExtensionEscrowService();
    }
}