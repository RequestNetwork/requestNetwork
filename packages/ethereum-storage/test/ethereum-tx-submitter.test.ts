import { EthereumTransactionSubmitter } from '../src';
import { LogTypes } from '@requestnetwork/types';
import { mnemonicToAccount } from 'viem/accounts';
import { localhost } from 'viem/chains';
import { Chain, createWalletClient, http } from 'viem';

const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';
// const signer = Wallet.fromMnemonic(mnemonic).connect(new JsonRpcProvider('http://localhost:8545'));
const signer = createWalletClient({
  chain: localhost,
  transport: http(),
  account: mnemonicToAccount(mnemonic),
});

const privateChain: Chain = {
  ...localhost,
  contracts: {
    hashSubmitter: { address: '0xf25186b5081ff5ce73482ad761db0eb0d25abfbf', blockCreated: 0 },
  },
};

describe(EthereumTransactionSubmitter, () => {
  const txSubmitter = new EthereumTransactionSubmitter({ chain: privateChain, client: signer });

  it('can initialize', async () => {
    await txSubmitter.initialize();
  });

  it('can prepareSubmit', async () => {
    expect(await txSubmitter.prepareSubmit('hash', 1)).toMatchObject({
      address: '0xf25186b5081ff5ce73482ad761db0eb0d25abfbf',
      args: ['hash', '0x0000000000000000000000000000000000000000000000000000000000000001'],
      value: 0n,
    });
  });
  it('can submit', async () => {
    const tx = await txSubmitter.submit('hash', 1);
    expect(tx).toMatch(/^0x.+/);
  });
});
