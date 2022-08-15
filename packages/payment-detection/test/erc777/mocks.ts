import { PaymentTypes } from '@requestnetwork/types';

const mockUntagged = [
  {
    transactionHash: '0x4e334bd4436ad812e30f74b358580cc3bed0407814133147edfb56ad6672bf75',
    blockNumber: '9806859',
    timestamp: '1639387673',
    sender: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
    flowRate: '0',
    oldFlowRate: '385802469135800',
    type: 2,
  },
  {
    transactionHash: '0x7fb5c94f9bf20420447576eca6d29c5096241e32bad9522b2b4bfd2d0f2c4134',
    blockNumber: '9807033',
    timestamp: '1639390285',
    sender: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
    flowRate: '0',
    oldFlowRate: '385802469135800',
    type: 2,
  },
  {
    transactionHash: '0xaccd30ecb52a3e73d5383a4814d2b284197eae7194127f7a9bf11e6602c65024',
    blockNumber: '9814376',
    timestamp: '1639500811',
    sender: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
    flowRate: '0',
    oldFlowRate: '385802469135800',
    type: 2,
  },
  {
    transactionHash: '0xa608d53c68dd9f65b3580b0567cb9f1aa9cb6f53f2ea8474afa81b4288f3056b',
    blockNumber: '9989333',
    timestamp: '1642161136',
    sender: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
    flowRate: '0',
    oldFlowRate: '385802469135800',
    type: 2,
  },
  {
    transactionHash: '0x09439c18b22dbc19542781ffb43c322023028f9243663ffdb20709b05b3b5933',
    blockNumber: '10014227',
    timestamp: '1642534760',
    sender: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
    flowRate: '0',
    oldFlowRate: '1666666666666666',
    type: 2,
  },
  {
    transactionHash: '0xe06f952a8938570c6cd885fadc85d88a156799a1b9caeb33ecc2e844eac33245',
    blockNumber: '10014270',
    timestamp: '1642535405',
    sender: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
    flowRate: '0',
    oldFlowRate: '1748842592592592',
    type: 2,
  },
  {
    transactionHash: '0x6ad94a65ce782dee743fa48981f1bfd53a63b8c3a5a9c4b82db4b05d1a051d07',
    blockNumber: '10663840',
    timestamp: '1652368813',
    sender: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
    flowRate: '0',
    oldFlowRate: '38026486208173',
    type: 2,
  },
];
const mockFlows = [
  [
    {
      transactionHash: '0xc331a269515c27836051cc4618097f5f1a1c37f79dcb975361022fe3ecfb5cbf',
      blockNumber: '9945527',
      timestamp: '1641495527',
      sender: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
      flowRate: '385802469135800',
      oldFlowRate: '0',
      type: 0,
    },
    {
      transactionHash: '0xe472ca1b52751b058fbdaeaffebd98c0cc43b45aa31794b3eb06834ede19f7be',
      blockNumber: 9945543,
      timestamp: '1641495767',
      sender: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
      flowRate: '0',
      oldFlowRate: '385802469135800',
      type: 2,
    },
    {
      transactionHash: '0x01b4afd22bbebb8f1d412e65eff38d6375b4802402dc8f42e4a7616507dd59ac',
      blockNumber: '9948966',
      timestamp: '1641547132',
      sender: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
      flowRate: '385802469135800',
      oldFlowRate: '0',
      type: 0,
    },
    {
      transactionHash: '0x8c6b3a5fbb91fc0d473958929e561d2f60093954fc208b4a63fb64f17ecba802',
      blockNumber: '9948972',
      timestamp: '1641547222',
      sender: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
      flowRate: '0',
      oldFlowRate: '385802469135800',
      type: 2,
    },
    {
      transactionHash: '0x48939ad7fc41180f0bfb0f6b0c24b4acfb6a4c94a5a9d9acf853b6292f029290',
      blockNumber: '9989326',
      timestamp: '1642161031',
      sender: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
      flowRate: '385802469135800',
      oldFlowRate: '0',
      type: 0,
    },
    {
      transactionHash: '0x477a848eb92acc640e4f361a6e6aaeaac405a1b18818d4654246621b06dc3cc9',
      blockNumber: '10052015',
      timestamp: '1643101943',
      sender: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
      flowRate: '385802469135800',
      oldFlowRate: '0',
      type: 0,
    },
    {
      transactionHash: '0xd2f15b75edba55cd47d7cfee1f2664e8b2ac085bf2f2b07640ab34d6a5b85ee1',
      blockNumber: '10052021',
      timestamp: '1643102033',
      sender: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
      flowRate: '0',
      oldFlowRate: '385802469135800',
      type: 2,
    },
    {
      transactionHash: '0x26b91a535858449cf41a9dd07a8195915f1ca96deccff6a5ccc74270db140ed2',
      blockNumber: '10185715',
      timestamp: '1645131298',
      sender: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
      flowRate: '385802469135800',
      oldFlowRate: '0',
      type: 0,
    },
    {
      transactionHash: '0xebbe717d09890e51f4f294ca329546e3d70e327a44c0cb2f9148c0e0b72d8c60',
      blockNumber: '10185738',
      timestamp: '1645131643',
      sender: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
      flowRate: '0',
      oldFlowRate: '385802469135800',
      type: 2,
    },
  ],
  [
    {
      transactionHash: '0xef22a2e12e75b0737c31cef697e2ba915b7e5ad4d3cb79d027ec823559a882a6',
      blockNumber: '10024755',
      timestamp: '1642692777',
      sender: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
      flowRate: '385802469135800',
      oldFlowRate: '3858024691358',
      type: 1,
    },
    {
      transactionHash: '0x0fefa02d90be46eb51a82f02b7a787084c35a895bd833a7c9f0560e315bb4061',
      blockNumber: '10024811',
      timestamp: '1642693617',
      sender: '0x9c040e2d6fd83a8b35069aa7154b69674961e0f7',
      flowRate: '0',
      oldFlowRate: '385802469135800',
      type: 2,
    },
  ],
  [
    {
      transactionHash: '0xdb44f35aa1490d2ddc8bbe7b82e0e3a370f3bf171a55da7a8a5886996e9c468d',
      blockNumber: '10047970',
      timestamp: '1643041225',
      sender: '0x165a26628ac843e97f657e648b004226fbb7f7c5',
      flowRate: '1',
      oldFlowRate: '0',
      type: 0,
    },
  ],
];
export const mockSuperfluidSubgraph = [
  {
    untagged: mockUntagged,
    flow: mockFlows[0],
  },
  {
    untagged: mockUntagged,
    flow: mockFlows[1],
  },
  {
    untagged: [],
    flow: mockFlows[2],
  },
];

export const genTransferEventsByMonth = (monthNumber: number, expectedAmount: number) => {
  const monthMultipliers: Record<number, number> = {
    1: 0.5,
    2: 1.5,
    3: 2.5,
    4: 3.5,
  };
  const paymentEvent = {
    amount: expectedAmount * monthMultipliers[monthNumber],
    name: PaymentTypes.EVENTS_NAMES.PAYMENT,
    parameters: {
      block: 1,
      feeAddress: '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef',
      feeAmount: '5',
      to: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
      txHash: '0xABCD',
    },
    timestamp: 11,
  };
  // @ts-ignore
  return (request: any) => {
    return Promise.resolve({
      paymentEvents: [paymentEvent],
      escrowEvents: [],
    });
  };
};
