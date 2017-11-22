"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("./config");
var requestEthereum_service_1 = require("./servicesContracts/requestEthereum-service");
exports.getServiceFromAddress = function (address, web3Provider) {
    switch (address.toLowerCase()) {
        case config_1.default.ethereum.contracts.requestEthereum.toLowerCase():
            return new requestEthereum_service_1.default(web3Provider);
        default:
            return undefined;
    }
};
//# sourceMappingURL=servicesContracts.js.map