"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var artifacts_1 = require("./artifacts");
var requestSynchroneExtensionEscrow_service_1 = require("./servicesExtensions/requestSynchroneExtensionEscrow-service");
exports.getServiceFromAddress = function (address) {
    if (!address)
        return undefined;
    if (isThisArtifact(artifacts_1.default.RequestSynchroneExtensionEscrowArtifact, address)) {
        return new requestSynchroneExtensionEscrow_service_1.default();
    }
    else {
        return undefined;
    }
};
var isThisArtifact = function (artifact, address) {
    if (!address)
        return false;
    var found = false;
    Object.keys(artifact.networks).forEach(function (k) {
        found = found || (artifact.networks[k].address && artifact.networks[k].address.toLowerCase() == address.toLowerCase());
    });
    return found;
};
//# sourceMappingURL=servicesExtensions.js.map