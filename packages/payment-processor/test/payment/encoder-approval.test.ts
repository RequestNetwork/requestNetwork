import { BigNumber, providers, utils, Wallet } from 'ethers';
import {
  ClientTypes,
  CurrencyTypes,
  ExtensionTypes,
  IdentityTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { encodeRequestErc20ApprovalIfNeeded, IPreparedTransaction } from '../../src';
import { getProxyAddress, MAX_ALLOWANCE, revokeErc20Approval } from '../../src/payment/utils';
import { AnyToERC20PaymentDetector, Erc20PaymentNetwork } from '@requestnetwork/payment-detection';
import { currencyManager } from './shared';
import {
  erc20SwapConversionArtifact,
  erc20SwapToPayArtifact,
} from '@requestnetwork/smart-contracts';
import { IConversionSettings } from '../../src/types';

/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/await-thenable */
// eslint-disable-next-line no-magic-numbers
jest.setTimeout(10000);

const erc20ContractAddress = '0x9FBDa871d559710256a2502A2517b794B482Db40';
const feeAddress = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';

// Cf. ERC20Alpha in TestERC20.sol
const alphaContractAddress = '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35';
const alphaConversionSettings: IConversionSettings = {
  currency: {
    type: RequestLogicTypes.CURRENCY.ERC20,
    value: alphaContractAddress,
    network: 'private',
  },
  maxToSpend: MAX_ALLOWANCE,
  currencyManager,
};
const alphaSwapSettings = {
  deadline: 2599732187000, // This test will fail in 2052
  maxInputAmount: 204,
  path: [alphaContractAddress, erc20ContractAddress],
};
const alphaSwapConversionSettings = {
  deadline: 2599732187000, // This test will fail in 2052
  maxInputAmount: 204,
  path: [erc20ContractAddress, alphaContractAddress],
};

// Amount to be approved
const arbitraryApprovalValue = BigNumber.from('100000000');
const approvalSettings = {
  amount: arbitraryApprovalValue,
};

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const mnemonicPath = `m/44'/60'/0'/0/19`;
const paymentAddress = '0x821aEa9a577a9b44299B9c15c88cf3087F3b5544';
const otherPaymentAddress = '0x821aEa9a577a9b44299B9c15c88cf3087F3b5545';
const provider = new providers.JsonRpcProvider('http://localhost:8545');
let wallet = Wallet.fromMnemonic(mnemonic, mnemonicPath).connect(provider);
const erc20ApprovalData = (proxy: string, approvedHexValue?: BigNumber) => {
  return `0x095ea7b3000000000000000000000000${proxy.slice(2).toLowerCase()}${
    approvedHexValue
      ? utils.hexZeroPad(arbitraryApprovalValue.toHexString(), 32).slice(2)
      : 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
  }`;
};

let proxyERC20: string;
let proxyERC20Fee: string;
let proxyERC20Conv: string;
let proxyERC20Swap: string;
let proxyERC20SwapConv: string;

const baseValidRequest: ClientTypes.IRequestData = {
  balance: {
    balance: '0',
    events: [],
  },
  contentData: {},
  creator: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: wallet.address,
  },
  currency: 'DAI',
  currencyInfo: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.ERC20,
    value: erc20ContractAddress,
  },

  events: [],
  expectedAmount: '100',
  extensions: {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        paymentAddress,
        salt: 'salt',
      },
      version: '0.1.0',
    },
  },
  extensionsData: [],
  meta: {
    transactionManagerMeta: {},
  },
  pending: null,
  requestId: 'abcd',
  state: RequestLogicTypes.STATE.CREATED,
  timestamp: 0,
  version: '1.0',
};

const validRequestERC20FeeProxy: ClientTypes.IRequestData = {
  ...baseValidRequest,
  extensions: {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress,
        feeAmount: '2',
        paymentAddress,
        salt: 'salt',
      },
      version: '0.1.0',
    },
  },
};

const validRequestERC20ConversionProxy: ClientTypes.IRequestData = {
  ...baseValidRequest,
  currency: 'EUR',
  currencyInfo: {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'EUR',
  },
  extensions: {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: {
      events: [],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress,
        feeAmount: '2',
        paymentAddress,
        salt: 'salt',
        network: 'private',
        acceptedTokens: [alphaContractAddress],
      },
      version: '0.1.0',
    },
  },
};

const validRequestEthProxy: ClientTypes.IRequestData = {
  ...baseValidRequest,
  currency: 'ETH-private',
  currencyInfo: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.ETH,
    value: RequestLogicTypes.CURRENCY.ETH,
  },
  extensions: {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA]: {
      events: [],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        paymentAddress,
        salt: 'salt',
      },
      version: '0.1.0',
    },
  },
  version: '2.0.3',
};

const validRequestEthFeeProxy: ClientTypes.IRequestData = {
  ...baseValidRequest,
  currency: 'ETH-private',
  currencyInfo: {
    network: 'private',
    type: RequestLogicTypes.CURRENCY.ETH,
    value: RequestLogicTypes.CURRENCY.ETH,
  },
  extensions: {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT]: {
      events: [],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ETH_FEE_PROXY_CONTRACT,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress,
        feeAmount: '2',
        paymentAddress,
        salt: 'salt',
      },
      version: '0.1.0',
    },
  },
  version: '2.0.3',
};

const validRequestEthConversionProxy: ClientTypes.IRequestData = {
  ...baseValidRequest,
  currency: 'EUR',
  currencyInfo: {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'EUR',
  },
  extensions: {
    [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY]: {
      events: [],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        feeAddress,
        feeAmount: '2',
        paymentAddress,
        salt: 'salt',
        network: 'private',
      },
      version: '0.1.0',
    },
  },
};

export const validMetaRequest: ClientTypes.IRequestData = {
  ...validRequestEthConversionProxy,
  extensions: {
    [ExtensionTypes.PAYMENT_NETWORK_ID.META]: {
      events: [],
      id: ExtensionTypes.PAYMENT_NETWORK_ID.META,
      type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
      values: {
        salt1: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {
            feeAddress,
            feeAmount: '2',
            paymentAddress,
            salt: 'salt1',
            network: 'private',
            acceptedTokens: [erc20ContractAddress],
          },
          version: '0.1.0',
        },
        salt2: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {
            feeAddress,
            feeAmount: '2',
            paymentAddress: otherPaymentAddress,
            salt: 'salt2',
            network: 'private',
          },
          version: '0.1.0',
        },
        salt3: {
          events: [],
          id: ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {
            feeAddress,
            feeAmount: '2',
            paymentAddress: otherPaymentAddress,
            salt: 'salt3',
            network: 'mainnet',
            acceptedTokens: [erc20ContractAddress],
          },
          version: '0.1.0',
        },
      },
      version: '0.1.0',
    },
  },
};

beforeAll(async () => {
  const mainAddress = wallet.address;
  wallet = Wallet.fromMnemonic(mnemonic).connect(provider);
  await wallet.sendTransaction({
    to: mainAddress,
    value: BigNumber.from('1000000000000000000'),
  });
  wallet = Wallet.fromMnemonic(mnemonic, mnemonicPath).connect(provider);

  // reset approvals
  proxyERC20 = getProxyAddress(
    baseValidRequest,
    Erc20PaymentNetwork.ERC20ProxyPaymentDetector.getDeploymentInformation,
  );
  await revokeErc20Approval(proxyERC20, erc20ContractAddress, wallet);

  proxyERC20Fee = getProxyAddress(
    validRequestERC20FeeProxy,
    Erc20PaymentNetwork.ERC20FeeProxyPaymentDetector.getDeploymentInformation,
  );
  await revokeErc20Approval(proxyERC20Fee, erc20ContractAddress, wallet);

  proxyERC20Conv = getProxyAddress(
    validRequestERC20ConversionProxy,
    AnyToERC20PaymentDetector.getDeploymentInformation,
  );
  await revokeErc20Approval(proxyERC20Conv, alphaContractAddress, wallet);

  proxyERC20Swap = erc20SwapToPayArtifact.getAddress(
    validRequestERC20FeeProxy.currencyInfo.network! as CurrencyTypes.EvmChainName,
  );
  await revokeErc20Approval(proxyERC20Swap, alphaContractAddress, wallet);

  proxyERC20SwapConv = erc20SwapConversionArtifact.getAddress(
    validRequestERC20FeeProxy.currencyInfo.network! as CurrencyTypes.EvmChainName,
  );
  await revokeErc20Approval(proxyERC20SwapConv, alphaContractAddress, wallet);
});

describe('Approval encoder handles ERC20 Proxy', () => {
  it('Should return a valid transaction', async () => {
    const approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      baseValidRequest,
      provider,
      wallet.address,
    );

    expect(approvalTransaction).toEqual({
      data: erc20ApprovalData(proxyERC20),
      to: erc20ContractAddress,
      value: 0,
    });
  });
  it('Should return a valid transaction with specific approval value', async () => {
    const approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      baseValidRequest,
      provider,
      wallet.address,
      {
        approval: approvalSettings,
      },
    );

    expect(approvalTransaction).toEqual({
      data: erc20ApprovalData(proxyERC20, arbitraryApprovalValue),
      to: erc20ContractAddress,
      value: 0,
    });
  });
  it('Should not return anything', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      baseValidRequest,
      provider,
      wallet.address,
    );
    await wallet.sendTransaction(approvalTransaction as IPreparedTransaction);

    approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      baseValidRequest,
      provider,
      wallet.address,
    );
    expect(approvalTransaction).toBeUndefined();
  });
});

describe('Approval encoder handles ERC20 Fee Proxy', () => {
  it('Should return a valid transaction', async () => {
    const approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20FeeProxy,
      provider,
      wallet.address,
    );

    expect(approvalTransaction).toEqual({
      data: erc20ApprovalData(proxyERC20Fee),
      to: erc20ContractAddress,
      value: 0,
    });
  });
  it('Should return a valid transaction with specific approved value', async () => {
    const approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20FeeProxy,
      provider,
      wallet.address,
      {
        approval: approvalSettings,
      },
    );

    expect(approvalTransaction).toEqual({
      data: erc20ApprovalData(proxyERC20Fee, arbitraryApprovalValue),
      to: erc20ContractAddress,
      value: 0,
    });
  });
  it('Should not return anything', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20FeeProxy,
      provider,
      wallet.address,
    );
    await wallet.sendTransaction(approvalTransaction as IPreparedTransaction);

    approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20FeeProxy,
      provider,
      wallet.address,
    );
    expect(approvalTransaction).toBeUndefined();
  });
});

describe('Approval encoder handles ERC20 Conversion Proxy', () => {
  it('Should return a valid transaction', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20ConversionProxy,
      provider,
      wallet.address,
      {
        conversion: alphaConversionSettings,
      },
    );

    expect(approvalTransaction).toEqual({
      data: erc20ApprovalData(proxyERC20Conv),
      to: alphaContractAddress,
      value: 0,
    });
  });
  it('Should return a valid transaction with specific approval value', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20ConversionProxy,
      provider,
      wallet.address,
      {
        conversion: alphaConversionSettings,
        approval: approvalSettings,
      },
    );

    expect(approvalTransaction).toEqual({
      data: erc20ApprovalData(proxyERC20Conv, arbitraryApprovalValue),
      to: alphaContractAddress,
      value: 0,
    });
  });
  it('Should not return anything', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20ConversionProxy,
      provider,
      wallet.address,
      {
        conversion: alphaConversionSettings,
      },
    );
    await wallet.sendTransaction(approvalTransaction as IPreparedTransaction);

    approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20ConversionProxy,
      provider,
      wallet.address,
      {
        conversion: alphaConversionSettings,
      },
    );
    expect(approvalTransaction).toBeUndefined();
  });

  it('Should not be possible to encode a conversion transaction without passing options', async () => {
    await expect(
      encodeRequestErc20ApprovalIfNeeded(
        validRequestERC20ConversionProxy,
        provider,
        wallet.address,
      ),
    ).rejects.toThrowError('Conversion settings missing');
  });
});

describe('Approval encoder handles ERC20 Swap Proxy', () => {
  it('Should return a valid transaction', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20FeeProxy,
      provider,
      wallet.address,
      {
        swap: alphaSwapSettings,
      },
    );

    expect(approvalTransaction).toEqual({
      data: erc20ApprovalData(proxyERC20Swap),
      to: alphaContractAddress,
      value: 0,
    });
  });
  it('Should return a valid transaction with specific approval value', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20FeeProxy,
      provider,
      wallet.address,
      {
        swap: alphaSwapSettings,
        approval: approvalSettings,
      },
    );

    expect(approvalTransaction).toEqual({
      data: erc20ApprovalData(proxyERC20Swap, arbitraryApprovalValue),
      to: alphaContractAddress,
      value: 0,
    });
  });
  it('Should not return anything', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20FeeProxy,
      provider,
      wallet.address,
      {
        swap: alphaSwapSettings,
      },
    );
    await wallet.sendTransaction(approvalTransaction as IPreparedTransaction);

    approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20FeeProxy,
      provider,
      wallet.address,
      {
        swap: alphaSwapSettings,
      },
    );
    expect(approvalTransaction).toBeUndefined();
  });
});

describe('Approval encoder handles ERC20 Swap & Conversion Proxy', () => {
  it('Should return a valid transaction', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20ConversionProxy,
      provider,
      wallet.address,
      {
        swap: alphaSwapConversionSettings,
        conversion: alphaConversionSettings,
      },
    );

    expect(approvalTransaction).toEqual({
      data: erc20ApprovalData(proxyERC20SwapConv),
      to: erc20ContractAddress,
      value: 0,
    });
  });
  it('Should return a valid transaction with specififc approval value', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20ConversionProxy,
      provider,
      wallet.address,
      {
        swap: alphaSwapConversionSettings,
        conversion: alphaConversionSettings,
        approval: approvalSettings,
      },
    );

    expect(approvalTransaction).toEqual({
      data: erc20ApprovalData(proxyERC20SwapConv, arbitraryApprovalValue),
      to: erc20ContractAddress,
      value: 0,
    });
  });
  it('Should not return anything', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20ConversionProxy,
      provider,
      wallet.address,
      {
        swap: alphaSwapSettings,
        conversion: alphaConversionSettings,
      },
    );
    await wallet.sendTransaction(approvalTransaction as IPreparedTransaction);

    approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestERC20ConversionProxy,
      provider,
      wallet.address,
      {
        swap: alphaSwapSettings,
        conversion: alphaConversionSettings,
      },
    );
    expect(approvalTransaction).toBeUndefined();
  });

  it('Should not be possible to encode a conversion transaction without passing options', async () => {
    await expect(
      encodeRequestErc20ApprovalIfNeeded(
        validRequestERC20ConversionProxy,
        provider,
        wallet.address,
      ),
    ).rejects.toThrowError();
  });

  it('Should not be possible to encode a conversion transaction without passing conversion options', async () => {
    await expect(
      encodeRequestErc20ApprovalIfNeeded(
        validRequestERC20ConversionProxy,
        provider,
        wallet.address,
        {
          swap: alphaSwapSettings,
        },
      ),
    ).rejects.toThrowError();
  });
});

describe('Approval encoder handles Eth Requests', () => {
  it('Should not return anything for Eth Proxy', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestEthProxy,
      provider,
      wallet.address,
    );
    expect(approvalTransaction).toBeUndefined();
  });
  it('Should not return anything for Eth Fee Proxy', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestEthFeeProxy,
      provider,
      wallet.address,
    );
    expect(approvalTransaction).toBeUndefined();
  });
  it('Should not return anything for Eth Conversion Proxy', async () => {
    let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
      validRequestEthConversionProxy,
      provider,
      wallet.address,
    );
    expect(approvalTransaction).toBeUndefined();
  });
});

describe('Approval encoder handles Meta PN', () => {
  describe('Error cases', () => {
    it('Should not be possible to encode a transaction when passing an invalid pn identifier', async () => {
      await expect(
        encodeRequestErc20ApprovalIfNeeded(validMetaRequest, provider, wallet.address, {
          conversion: alphaConversionSettings,
          pnIdentifier: 'unknown',
        }),
      ).rejects.toThrowError('Invalid pn identifier');
    });

    it('Should not be possible to encode a transaction without passing a pn identifier', async () => {
      await expect(
        encodeRequestErc20ApprovalIfNeeded(validMetaRequest, provider, wallet.address, {
          conversion: alphaConversionSettings,
        }),
      ).rejects.toThrowError('Missing pn identifier');
    });

    it('Should not be possible to encode a conversion transaction without passing conversion options', async () => {
      await expect(
        encodeRequestErc20ApprovalIfNeeded(
          validRequestERC20ConversionProxy,
          provider,
          wallet.address,
          {
            pnIdentifier: 'salt1',
          },
        ),
      ).rejects.toThrowError('Conversion settings missing');
    });
  });

  describe('Approval encoder handles Sub pn for ERC20 Conversion Proxy', () => {
    beforeEach(async () => {
      proxyERC20Conv = getProxyAddress(
        validRequestERC20ConversionProxy,
        AnyToERC20PaymentDetector.getDeploymentInformation,
      );
      await revokeErc20Approval(proxyERC20Conv, alphaContractAddress, wallet);

      proxyERC20SwapConv = erc20SwapConversionArtifact.getAddress(
        validRequestERC20FeeProxy.currencyInfo.network! as CurrencyTypes.EvmChainName,
      );
      await revokeErc20Approval(proxyERC20SwapConv, alphaContractAddress, wallet);
    });

    it('Should return a valid transaction', async () => {
      let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
        validMetaRequest,
        provider,
        wallet.address,
        {
          conversion: alphaConversionSettings,
          pnIdentifier: 'salt1',
        },
      );

      expect(approvalTransaction).toEqual({
        data: erc20ApprovalData(proxyERC20Conv),
        to: alphaContractAddress,
        value: 0,
      });
    });
    it('Should return a valid transaction with specific approval value', async () => {
      let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
        validMetaRequest,
        provider,
        wallet.address,
        {
          conversion: alphaConversionSettings,
          approval: approvalSettings,
          pnIdentifier: 'salt1',
        },
      );

      expect(approvalTransaction).toEqual({
        data: erc20ApprovalData(proxyERC20Conv, arbitraryApprovalValue),
        to: alphaContractAddress,
        value: 0,
      });
    });
    it('Should return undefined - approval already made', async () => {
      let approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
        validMetaRequest,
        provider,
        wallet.address,
        {
          conversion: alphaConversionSettings,
          pnIdentifier: 'salt1',
        },
      );
      await wallet.sendTransaction(approvalTransaction as IPreparedTransaction);

      approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
        validMetaRequest,
        provider,
        wallet.address,
        {
          conversion: alphaConversionSettings,
          pnIdentifier: 'salt1',
        },
      );
      expect(approvalTransaction).toBeUndefined();
    });

    it('Should not return anything - native pn', async () => {
      const approvalTransaction = await encodeRequestErc20ApprovalIfNeeded(
        validMetaRequest,
        provider,
        wallet.address,
        {
          pnIdentifier: 'salt2',
        },
      );
      expect(approvalTransaction).toBeUndefined();
    });
  });
});
