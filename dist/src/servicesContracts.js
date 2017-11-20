"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("./config");
var requestEthereum_service_1 = require("./servicesContracts/requestEthereum-service");
exports.services = {
    RequestEthereumService: requestEthereum_service_1.default,
};
exports.getServiceFromAddress = function (address) {
    switch (address.toLowerCase()) {
        case config_1.default.ethereum.contracts.requestEthereum.toLowerCase():
            return exports.services.RequestEthereumService;
        default:
            return undefined;
    }
};
//# sourceMappingURL=servicesContracts.js.map