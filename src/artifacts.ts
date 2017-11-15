import config from './config';
import {Artifact} from './types';

var RequestCoreArtifact = require("./artifacts/RequestCore.json");
var RequestEthereumArtifact = require("./artifacts/RequestEthereum.json");
var RequestSynchroneExtensionEscrowArtifact = require("./artifacts/RequestSynchroneExtensionEscrow.json");

export default {
    RequestCoreArtifact: 		RequestCoreArtifact as any as Artifact,
    RequestEthereumArtifact: 	RequestEthereumArtifact as any as Artifact,
    RequestSynchroneExtensionEscrowArtifact: 	RequestSynchroneExtensionEscrowArtifact as any as Artifact,
};
