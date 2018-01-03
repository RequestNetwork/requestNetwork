"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var web3_single_1 = require("./servicesExternal/web3-single");
var ipfs_service_1 = require("./servicesExternal/ipfs-service");
// Core -------------------------------------
var requestCore_service_1 = require("../src/servicesCore/requestCore-service");
// Contract ---------------------------------
var requestEthereum_service_1 = require("../src/servicesContracts/requestEthereum-service");
// Synchrone Extension ----------------------
var requestSynchroneExtensionEscrow_service_1 = require("../src/servicesExtensions/requestSynchroneExtensionEscrow-service");
/**
 * The RequestNetwork class is the single entry-point into the requestNetwork.js library. It contains all of the library's functionality
 * and all calls to the library should be made through a RequestNetwork instance.
 */
var RequestNetwork = /** @class */ (function () {
    /**
     * Instantiates a new RequestNetwork instance that provides the public interface to the requestNetwork.js library.
     * @param   provider        The Web3.js Provider instance you would like the requestNetwork.js library to use for interacting with
     *                          the Ethereum network.
     * @param   networkId       the Ethereum network ID.
     * @param   useIpfsPublic   use public ipfs node if true, private one otherwise (default: true)
     * @return  An instance of the requestNetwork.js RequestNetwork class.
     */
    function RequestNetwork(provider, networkId, useIpfsPublic) {
        if (useIpfsPublic === void 0) { useIpfsPublic = true; }
        if (provider && !networkId) {
            throw Error('if you give provider you have to give the networkId too');
        }
        // init web3 wrapper singleton
        web3_single_1.Web3Single.init(provider, networkId);
        // init ipfs wrapper singleton
        ipfs_service_1.default.init(useIpfsPublic);
        // init interface services
        this.requestCoreService = new requestCore_service_1.default();
        this.requestEthereumService = new requestEthereum_service_1.default();
        this.requestSynchroneExtensionEscrowService = new requestSynchroneExtensionEscrow_service_1.default();
    }
    return RequestNetwork;
}());
exports.default = RequestNetwork;
//# sourceMappingURL=requestNetwork.js.map