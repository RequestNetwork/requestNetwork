import {
  AdvancedLogicTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import ETHFeeProxyDetector from '../../src/eth/fee-proxy-detector';

let ethFeeProxyDetector: ETHFeeProxyDetector;

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {},
};

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/eth/fee-proxy-contract', () => {
  beforeEach(() => {
    ethFeeProxyDetector = new ETHFeeProxyDetector({
      advancedLogic: mockAdvancedLogic,
    });
  });

  it('should not throw when getBalance fail', async () => {
    expect(
      await ethFeeProxyDetector.getBalance({ currency: {network: 'private'}, extensions: {} } as RequestLogicTypes.IRequest),
    ).toEqual({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
        message: 'The request does not have the extension: pn-eth-fee-proxy-contract',
      },
      events: [],
    });
  });
});
