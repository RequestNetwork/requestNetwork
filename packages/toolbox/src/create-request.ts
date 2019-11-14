import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import { Request, RequestNetwork, Types } from '@requestnetwork/request-client.js';
import { AxiosRequestConfig } from 'axios';

export default {
  createTestRequest,
};

/**
 * Creates a request with predefined values. Only the amount can be specified, to differentiate requests.
 * A node must be running
 *
 * @param expectedAmount The amount of the request
 * @param nodeConnectionConfig The configuration to connect to the node, localhost
 *
 * @returns The created request
 */
function createTestRequest(
  expectedAmount: string = '1000',
  nodeConnectionConfig: AxiosRequestConfig = {},
): Promise<Request> {
  const signatureProvider = new EthereumPrivateKeySignatureProvider({
    method: Types.Signature.METHOD.ECDSA,
    privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
  });

  const payeeIdentity: Types.Identity.IIdentity = {
    type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  };
  const payerIdentity: Types.Identity.IIdentity = {
    type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
    value: '0xf17f52151ebef6c7334fad080c5704d77216b732',
  };

  const requestCreationHash: Types.RequestLogic.ICreateParameters = {
    currency: {
      type: Types.RequestLogic.CURRENCY.BTC,
      value: 'BTC',
    },
    expectedAmount,
    payee: payeeIdentity,
    payer: payerIdentity,
  };

  const requestNetwork = new RequestNetwork({ nodeConnectionConfig, signatureProvider });

  return requestNetwork.createRequest({
    requestInfo: requestCreationHash,
    signer: payeeIdentity,
  });
}
