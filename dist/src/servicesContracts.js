"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var artifacts_1 = require("./artifacts");
var requestEthereum_service_1 = require("./servicesContracts/requestEthereum-service");
exports.getServiceFromAddress = function (address) {
    if (!address)
        return undefined;
    if (isThisArtifact(artifacts_1.default.RequestEthereumArtifact, address)) {
        return new requestEthereum_service_1.default();
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
//# sourceMappingURL=servicesContracts.js.map