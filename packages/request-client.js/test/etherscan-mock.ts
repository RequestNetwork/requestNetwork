import { BigNumber } from 'ethers';
import { providers } from 'ethers';

/**
 * Mock etherscan calls
 */
export default class EtherscanProviderMock {
  async getHistory(
    addressOrName: string | Promise<string>,
  ): Promise<Array<providers.TransactionResponse>> {
    return ({
      '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB': [
        {
          hash: '0x644eda4f6663ff70089cbf10f39501157f8894c577bfe8fa83efa31ba7605f84',
          blockHash: '0x90e9cd0a8c0494c951fc80fce2d01f962af5004708b3f057997eb26d172871f5',
          blockNumber: 8894552,
          transactionIndex: 120,
          confirmations: 2106906,
          from: '0x47672c15A8328C83Fc6935A33BE8479C2c42433d',
          gasPrice: BigNumber.from('0x77359400'),
          gasLimit: BigNumber.from('0x5208'),
          to: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
          value: BigNumber.from('0x5c5edcbc290000'),
          nonce: 10,
          data: '0x',
          creates: null,
          networkId: 0,
          chainId: 0,
          timestamp: 1573193044,
        },
        {
          hash: '0x06d95c3889dcd974106e82fa27358549d9392d6fee6ea14fe1acedadc1013114',
          blockHash: '0x74705d798896a8dfefd3057170f95e6b3a5a05f735440c761cd6f17f4aabd422',
          blockNumber: 10013330,
          transactionIndex: 120,
          confirmations: 988128,
          from: '0x74Ef019C1E9F11366c5c8DC4Ab556C16fe13B51F',
          gasPrice: BigNumber.from('0x059682f000'),
          gasLimit: BigNumber.from('0x5428'),
          to: '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB',
          value: BigNumber.from('0x02dd231b00'),
          nonce: 205,
          data: '0xc19da4923539c37f',
          creates: null,
          networkId: 0,
          chainId: 0,
          timestamp: 1588776378,
        },
      ],
      '0x0000000000000000000000000000000000000002': [
        {
          hash: '0x7525522e8bfe96ffd8285f145801aee77c6ba3b290f8358bb67f55b835fadbd2',
          blockHash: '0x145de303511bc3383bfcfc260fd4aa07e3bdd09429216ca955535c327b13e36d',
          blockNumber: 4383481,
          transactionIndex: 112,
          confirmations: 6617977,
          from: '0x716A22779846078Df6B8c591F3ebEEE3Ad32e153',
          gasPrice: BigNumber.from('0x3b9aca00'),
          gasLimit: BigNumber.from('0x01d978'),
          to: '0x0000000000000000000000000000000000000002',
          value: BigNumber.from('0x00'),
          nonce: 0,
          data: '0xe5e1',
          creates: null,
          networkId: 0,
          chainId: 0,
          timestamp: 1508334278,
        },
      ],
    } as any)[await addressOrName];
  }
  public getNetwork(): any {
    return {
      chainId: 1,
      ensAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
      name: 'homestead',
    };
  }
}
