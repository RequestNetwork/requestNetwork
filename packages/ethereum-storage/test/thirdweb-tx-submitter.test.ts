import { ThirdwebTransactionSubmitter } from '../src/thirdweb/thirdweb-tx-submitter';
import { Engine } from '@thirdweb-dev/engine';
import { LogTypes } from '@requestnetwork/types';
import { requestHashSubmitterArtifact } from '@requestnetwork/smart-contracts';

// Mock the Thirdweb Engine
jest.mock('@thirdweb-dev/engine', () => {
  return {
    Engine: jest.fn().mockImplementation(() => ({
      getWallets: jest.fn().mockResolvedValue([{ address: '0x123' }]),
      sendTransaction: jest.fn().mockResolvedValue({
        transactionHash: '0xabcdef1234567890',
      }),
    })),
  };
});

// Mock the hash submitter artifact
jest.mock('@requestnetwork/smart-contracts', () => {
  return {
    requestHashSubmitterArtifact: {
      getAddress: jest.fn().mockReturnValue('0xf25186b5081ff5ce73482ad761db0eb0d25abfbf'),
      getInterface: jest.fn().mockReturnValue({
        encodeFunctionData: jest.fn().mockReturnValue('0x1234abcd'),
      }),
    },
  };
});

describe('ThirdwebTransactionSubmitter', () => {
  const mockLogger: LogTypes.ILogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const submitterOptions = {
    engineUrl: 'https://engine.thirdweb.com',
    accessToken: 'test-token',
    backendWalletAddress: '0xbackendWalletAddress',
    network: 'mainnet',
    logger: mockLogger,
  };

  let txSubmitter: ThirdwebTransactionSubmitter;

  beforeEach(() => {
    jest.clearAllMocks();
    txSubmitter = new ThirdwebTransactionSubmitter(submitterOptions);
  });

  it('can initialize', async () => {
    await txSubmitter.initialize();
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Initializing ThirdwebTransactionSubmitter for network mainnet (chainId: 1)',
    );
    expect(mockLogger.info).toHaveBeenCalledWith('Successfully connected to Thirdweb Engine');
  });

  it('can prepare submit', async () => {
    const result = await txSubmitter.prepareSubmit('ipfshash', 100);

    expect(result).toEqual({
      to: '0xf25186b5081ff5ce73482ad761db0eb0d25abfbf',
      data: '0x1234abcd',
      value: expect.any(Object),
    });

    expect(requestHashSubmitterArtifact.getInterface).toHaveBeenCalled();
    expect(requestHashSubmitterArtifact.getInterface().encodeFunctionData).toHaveBeenCalledWith(
      'submitHash',
      ['ipfshash', expect.any(String)],
    );
  });

  it('can submit', async () => {
    const result = await txSubmitter.submit('ipfshash', 100);

    expect(result).toEqual({
      hash: '0xabcdef1234567890',
      wait: expect.any(Function),
    });

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Submitting hash ipfshash with size 100 via Thirdweb Engine',
    );

    const engineInstance = (Engine as jest.Mock).mock.results[0].value;
    expect(engineInstance.sendTransaction).toHaveBeenCalledWith({
      chainId: 1,
      fromAddress: '0xbackendWalletAddress',
      toAddress: '0xf25186b5081ff5ce73482ad761db0eb0d25abfbf',
      data: '0x1234abcd',
      value: '0',
    });
  });

  it('should handle errors during submission', async () => {
    const engineInstance = (Engine as jest.Mock).mock.results[0].value;
    engineInstance.sendTransaction.mockRejectedValueOnce(new Error('Transaction failed'));

    await expect(txSubmitter.submit('ipfshash', 100)).rejects.toThrow('Transaction failed');
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to submit transaction through Thirdweb Engine',
      expect.any(Error),
    );
  });
});
