import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber, Wallet } from 'ethers';
import { EthereumTransactionSubmitter } from '../src';
import { LogTypes } from '@requestnetwork/types';

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
const signer = Wallet.fromMnemonic(mnemonic).connect(new JsonRpcProvider('http://localhost:8545'));

describe(EthereumTransactionSubmitter, () => {
  const txSubmitter = new EthereumTransactionSubmitter({ network: 'private', signer });

  it('can initialize', async () => {
    await txSubmitter.initialize();
  });

  it('can retrieve whether the provider supports eip-1559', () => {
    expect(txSubmitter.supportsEip1559()).toBe(true);
  });

  it('can prepareSubmit', async () => {
    expect(await txSubmitter.prepareSubmit('hash', 1)).toMatchObject({
      to: '0xf25186b5081ff5ce73482ad761db0eb0d25abfbf',
      data: /^0x.+/,
      value: BigNumber.from(0),
    });
  });

  it('can submit', async () => {
    const tx = await txSubmitter.submit('hash', 1);
    expect(tx.hash).toMatch(/^0x.+/);
  });

  it('can debug transactions', async () => {
    const debugMock = jest.fn();
    const logger = {
      debug: debugMock,
      warn: jest.fn(),
      error: jest.fn(),
    } as any as LogTypes.ILogger;
    const txSubmitter = new EthereumTransactionSubmitter({
      network: 'private',
      signer,
      logger,
      debugProvider: true,
    });
    await txSubmitter.submit('hash', 1);
    expect(debugMock).toHaveBeenCalledWith(
      'JsonRpcProvider debug event',
      expect.objectContaining({ action: 'request' }),
    );
  });
});
