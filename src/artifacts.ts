// import * as RequestEthereumArtifact from './artifacts/RequestEthereum.json';
var RequestEthereumArtifact = require("./artifacts/RequestEthereum.json");
import {Artifact} from './types';

export const artifacts = {
    RequestEthereumArtifact: RequestEthereumArtifact as any as Artifact
};