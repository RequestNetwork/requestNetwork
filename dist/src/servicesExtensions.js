"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("./config");
var requestSynchroneExtensionEscrow_service_1 = require("./servicesExtensions/requestSynchroneExtensionEscrow-service");
exports.getServiceFromAddress = function (address, web3Provider) {
    if (!address)
        return undefined;
    switch (address.toLowerCase()) {
        case config_1.default.ethereum.contracts.requestSynchroneExtensionEscrow.toLowerCase():
            return new requestSynchroneExtensionEscrow_service_1.default(web3Provider);
        default:
            return undefined;
    }
};
//# sourceMappingURL=servicesExtensions.js.map