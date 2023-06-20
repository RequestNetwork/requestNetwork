import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import { EthereumPrivateKeyDecryptionProvider } from '@requestnetwork/epk-decryption';
import { Request, RequestNetwork, Types } from '@requestnetwork/request-client.js';

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
function createTestRequest(expectedAmount = '1000', nodeConnectionConfig = {}): Promise<Request> {
  const signatureProvider = new EthereumPrivateKeySignatureProvider({
    method: Types.Signature.METHOD.ECDSA,
    privateKey: wallet.privateKey,
  });
  const decryptionProvider = new EthereumPrivateKeyDecryptionProvider({
    method: Types.Encryption.METHOD.ECIES,
    key: wallet.privateKey,
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
      type: Types.RequestLogic.CURRENCY.ISO4217,
      value: 'EUR',
    },
    expectedAmount,
    payee: payeeIdentity,
    payer: payerIdentity,
  };

  const requestNetwork = new RequestNetwork({
    nodeConnectionConfig,
    signatureProvider,
    decryptionProvider,
    useMockStorage: true,
  });

  return requestNetwork._createEncryptedRequest(
    {
      requestInfo: requestCreationHash,
      signer: payeeIdentity,
    },
    [
      {
        method: Types.Encryption.METHOD.ECIES,
        key: wallet.publicKey,
      },
    ],
    {
      skipRefresh: true,
    },
  );
}
