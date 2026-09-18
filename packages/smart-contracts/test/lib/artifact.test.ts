import { BigNumber, providers } from 'ethers';
import { RequestOpenHashSubmitter } from '../../src/types';
import {
  erc20FeeProxyArtifact,
  erc20ProxyArtifact,
  erc20RecurringPaymentProxyArtifact,
} from '../../src/lib';
import { CurrencyTypes } from '@requestnetwork/types';

describe('Artifact', () => {
  it('can get the contract info for latest version', () => {
    expect(erc20ProxyArtifact.getAddress('private')).toBe(
      '0x2c2b9c9a4a25e24b174f26114e8926a9f2128fe4',
    );
    expect(erc20ProxyArtifact.getCreationBlockNumber('rinkeby')).toBe(5628198);
    expect(erc20ProxyArtifact.getDeploymentInformation('mainnet')).toEqual({
      address: '0x5f821c20947ff9be22e823edc5b3c709b33121b3',
      creationBlockNumber: 9119380,
    });
  });

  it('can get the contract info for a specific version', () => {
    expect(erc20ProxyArtifact.getAddress('private', '0.1.0')).toBe(
      '0x2c2b9c9a4a25e24b174f26114e8926a9f2128fe4',
    );
    expect(erc20ProxyArtifact.getCreationBlockNumber('rinkeby', '0.1.0')).toBe(5628198);
    expect(erc20ProxyArtifact.getDeploymentInformation('mainnet', '0.1.0')).toEqual({
      address: '0x5f821c20947ff9be22e823edc5b3c709b33121b3',
      creationBlockNumber: 9119380,
    });
  });

  it('offers a strongly typed connect method', async () => {
    // @ts-expect-error wrong contract type
    erc20ProxyArtifact.connect(
      'private',
      new providers.JsonRpcProvider(),
    ) as RequestOpenHashSubmitter;

    const instance = erc20ProxyArtifact.connect('private', new providers.JsonRpcProvider());

    // @ts-expect-error wrong parameter type
    const p1 = instance.transferFromWithReference(BigNumber.from(0));
    // silence warnings
    await expect(p1).rejects.toThrow();

    // this causes no type error, parameters are right.
    const p2 = instance.transferFromWithReference('', '', BigNumber.from(0), '');
    // silence warnings (we're only interested in types in this test)
    await expect(p2).rejects.toThrow();
  });

  it('can get all addresses for a contract with multiple versions', () => {
    expect(erc20FeeProxyArtifact.getAllAddresses('matic')).toMatchObject(
      expect.arrayContaining([
        { version: '0.1.0', address: expect.stringMatching(/^0x.*$/) },
        { version: '0.2.0', address: expect.stringMatching(/^0x.*$/) },
      ]),
    );
  });

  it('uses 0.2.0 as the default recurring proxy ABI while keeping 0.1.0 available', () => {
    expect(
      erc20RecurringPaymentProxyArtifact
        .getContractAbi()
        .some(({ name }) => name === 'triggerRecurringPaymentBatch'),
    ).toBe(true);
    expect(
      erc20RecurringPaymentProxyArtifact
        .getContractAbi('0.1.0')
        .some(({ name }) => name === 'triggerRecurringPayment'),
    ).toBe(true);
    expect(
      erc20RecurringPaymentProxyArtifact.getOptionalDeploymentInformation('sepolia', '0.2.0'),
    ).toEqual({
      address: '0xF17B277E0E3FC584dA6f50E8C46B2E8F1c9b951b',
      creationBlockNumber: 11729088,
    });
    expect(
      erc20RecurringPaymentProxyArtifact.getOptionalDeploymentInformation('mainnet', '0.2.0'),
    ).toEqual({
      address: '0xbd43EDecA92d4c4721F6EecaD347516f9DeB0711',
      creationBlockNumber: 26002785,
    });
  });

  it('throws for a non-existing network', () => {
    expect(() =>
      erc20ProxyArtifact.getDeploymentInformation('fakenetwork' as CurrencyTypes.EvmChainName),
    ).toThrowError(`No deployment for network: fakenetwork`);
  });

  it('throws for a non-existing version', () => {
    expect(() => erc20ProxyArtifact.getDeploymentInformation('mainnet', 'fake')).toThrowError(
      `No deployment for version: fake`,
    );
  });

  it('allows to safely check for an existing artifact', () => {
    expect(erc20ProxyArtifact.getOptionalDeploymentInformation('mainnet', 'fake')).toBeNull();
  });
});
