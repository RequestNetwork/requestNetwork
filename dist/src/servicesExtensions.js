"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("./config");
var requestSynchroneExtensionEscrow_service_1 = require("./servicesExtensions/requestSynchroneExtensionEscrow-service");
exports.services = {
    RequestSynchroneExtensionEscrowService: requestSynchroneExtensionEscrow_service_1.default,
};
exports.getServiceFromAddress = function (address) {
    switch (address.toLowerCase()) {
        case config_1.default.ethereum.contracts.requestSynchroneExtensionEscrow.toLowerCase():
            return exports.services.RequestSynchroneExtensionEscrowService;
        default:
            return undefined;
    }
};
//# sourceMappingURL=servicesExtensions.js.map