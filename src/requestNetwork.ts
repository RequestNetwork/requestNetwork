// Core -------------------------------------
import RequestCoreService from "../src/servicesCore/requestCore-service";

// Contract ---------------------------------
import RequestEthereumService from "../src/servicesContracts/requestEthereum-service";

// Synchrone Extension ----------------------
import RequestSynchroneExtensionEscrowService from "../src/servicesExtensions/requestSynchroneExtensionEscrow-service";


// const config = require('./config.json');

export default class RequestNetwork {

    public requestEthereumService: RequestEthereumService;
    public requestSynchroneExtensionEscrowService: RequestSynchroneExtensionEscrowService;
    public requestCoreService: RequestCoreService;
    constructor(provider? : any) {
    	this.requestCoreService = new RequestCoreService(provider);
        this.requestEthereumService = new RequestEthereumService(provider);
        this.requestSynchroneExtensionEscrowService = new RequestSynchroneExtensionEscrowService(provider);
    }
}