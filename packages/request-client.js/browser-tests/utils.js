export const setup = async () => {
  if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.enable();
    } catch (error) {
      // User denied account access...
      console.log(error);
    }
  }
  // Legacy dapp browsers...
  else if (window.web3) {
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
  }
};

export const getMockData = signer => {
  return {
    signatureInfo: {
      method: RequestNetwork.Types.Signature.METHOD.ECDSA,
      privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
    },
    decryptionParameters: {
      key: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
      method: RequestNetwork.Types.Encryption.METHOD.ECIES,
    },
    encryptionParameters: {
      key:
        'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
      method: RequestNetwork.Types.Encryption.METHOD.ECIES,
    },

    requestCreationHash: {
      currency: {
        type: RequestNetwork.Types.RequestLogic.CURRENCY.ISO4217,
        value: 'EUR',
      },
      expectedAmount: '100000000000',
      payee: {
        type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
        value: signer || '0x627306090abab3a6e1400e9345bc60c78a8bef57',
      },
      payer: {
        type: RequestNetwork.Types.Identity.TYPE.ETHEREUM_ADDRESS,
        value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
      },
    },
    paymentNetwork: {
      id: RequestNetwork.Types.Payment.PAYMENT_NETWORK_ID.DECLARATIVE,
      parameters: {},
    },
    contentData: {
      it: 'is',
      some: 'content',
      true: true,
    },
  };
};
