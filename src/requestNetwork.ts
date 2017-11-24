// Contract ---------------------------------
import RequestEthereumService from "../src/servicesContracts/requestEthereum-service";

// Synchrone Extension ----------------------
import RequestSynchroneExtensionEscrowService from "../src/servicesExtensions/requestSynchroneExtensionEscrow-service";


// const config = require('./config.json');

export default class RequestNetwork {

    public requestEthereumService: RequestEthereumService;
    public requestSynchroneExtensionEscrowService: RequestSynchroneExtensionEscrowService;

    constructor(provider? : any) {
        this.requestEthereumService = new RequestEthereumService(provider);
        this.requestSynchroneExtensionEscrowService = new RequestSynchroneExtensionEscrowService(provider);
    }
}