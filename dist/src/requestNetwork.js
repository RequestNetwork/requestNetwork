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
var RequestNetwork = /** @class */ (function () {
    function RequestNetwork(provider, networkId, useIpfsPublic) {
        if (useIpfsPublic === void 0) { useIpfsPublic = true; }
        if (provider && !networkId) {
            throw Error('if you give provider you have to give the networkId too');
        }
        web3_single_1.Web3Single.init(provider, networkId);
        ipfs_service_1.default.init(useIpfsPublic);
        this.requestCoreService = new requestCore_service_1.default();
        this.requestEthereumService = new requestEthereum_service_1.default();
        this.requestSynchroneExtensionEscrowService = new requestSynchroneExtensionEscrow_service_1.default();
    }
    return RequestNetwork;
}());
exports.default = RequestNetwork;
//# sourceMappingURL=requestNetwork.js.map