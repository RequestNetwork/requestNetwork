import { ethers } from 'ethers';

const aggregatorAbiFragment = [
  {
    inputs: [],
    name: 'latestTimestamp',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// tslint:disable:no-floating-promises
(async () => {
  const provider = ethers.getDefaultProvider('mainnet');
  const aggregatorsArray: any[] = [];
  const supportedCurrencies: Set<string> = new Set();

  // List of noticable aggregators
  const chainlinkAggs = [
    ['BTC', 'ETH', '0xdeb288F737066589598e9214E782fa5A8eD689e8'],
    ['BUSD', 'ETH', '0x614715d2Af89E6EC99A233818275142cE88d1Cfd'],
    ['DAI', 'ETH', '0x773616E4d11A78F511299002da57A0a94577F1f4'],
    ['SUSD', 'ETH', '0x8e0b7e6062272B5eF4524250bFFF8e5Bd3497757'],
    ['TUSD', 'ETH', '0x3886BA987236181D98F2401c507Fb8BeA7871dF2'],
    ['USDC', 'ETH', '0x986b5E1e1755e3C2440e960477f25201B0a8bbD4'],
    ['USDT', 'ETH', '0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46'],
    ['BCH', 'USD', '0x9F0F69428F923D6c95B781F89E165C9b2df9789D'],
    ['BTC', 'USD', '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c'],
    ['DAI', 'USD', '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9'],
    ['DASH', 'USD', '0xFb0cADFEa136E9E343cfb55B863a6Df8348ab912'],
    ['ETH', 'USD', '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'],
    ['USDK', 'USD', '0xfAC81Ea9Dd29D8E9b212acd6edBEb6dE38Cb43Af'],
    ['XMR', 'USD', '0xFA66458Cce7Dd15D8650015c4fce4D278271618F'],
    ['AUD', 'USD', '0x77F9710E7d0A19669A13c055F62cd80d313dF022'],
    ['CHF', 'USD', '0x449d117117838fFA61263B61dA6301AA2a88B13A'],
    ['EUR', 'USD', '0xb49f677943BC038e9857d61E7d053CaA2C1734C1'],
    ['GBP', 'USD', '0x5c0Ab2d9b5a7ed9f470386e82BB36A3613cDd4b5'],
    ['JPY', 'USD', '0xBcE206caE7f0ec07b545EddE332A47C2F75bbeb3'],
  ];

  // tslint:disable-next-line:no-magic-numbers
  const now = Math.floor(Date.now() / 1000);
  for (const agg of chainlinkAggs) {
    const ccyIn: string = agg[0];
    const ccyOut = agg[1];
    const address = agg[2];

    const contract = new ethers.Contract(address, aggregatorAbiFragment, provider);
    const timestampHex = await contract.latestTimestamp();
    const timestamp = timestampHex.toString();
    const diff = now - parseInt(timestamp, 10);
    aggregatorsArray.push({ ccyIn, ccyOut, address, diff, timestamp });

    // add the currencies
    supportedCurrencies.add(ccyIn);
    supportedCurrencies.add(ccyOut);
  }

  // Show aggregators, the older results first
  // tslint:disable:no-console
  console.log('Aggregators (older results first)');
  console.log(aggregatorsArray.sort((a, b) => b.diff - a.diff));
  console.log(`Supported currencies`);
  console.log(supportedCurrencies);
})();
