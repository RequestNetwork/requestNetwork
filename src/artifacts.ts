import config from './config';
import {Artifact} from './types';

const RequestCoreArtifact = require("./artifacts/RequestCore.json");
const RequestEthereumArtifact = require("./artifacts/RequestEthereum.json");
const RequestSynchroneExtensionEscrowArtifact = require("./artifacts/RequestSynchroneExtensionEscrow.json");

export default {
    RequestCoreArtifact: 		RequestCoreArtifact as any as Artifact,
    RequestEthereumArtifact: 	RequestEthereumArtifact as any as Artifact,
    RequestSynchroneExtensionEscrowArtifact: 	RequestSynchroneExtensionEscrowArtifact as any as Artifact,
};