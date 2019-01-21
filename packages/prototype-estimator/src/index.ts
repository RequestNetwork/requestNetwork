import getSizeOfRequest from './size';

const testCases = [
  {
    name: 'created',
    case: {
      create: true,
      accept: false,
      increase: false,
      reduce: false,
      content: '',
    },
  },
  {
    name: 'created + accepted',
    case: {
      create: true,
      accept: true,
      increase: false,
      reduce: false,
      content: '',
    },
  },
  {
    name: 'created + accepted + increase + reduce',
    case: {
      create: true,
      accept: true,
      increase: true,
      reduce: true,
      content: '',
    },
  },
];

// tslint:disable:no-floating-promises
// tslint:disable:no-console
Promise.all(
  testCases.map(testCase =>
    getSizeOfRequest(testCase.case).then(size => ({
      name: testCase.name,
      size,
    })),
  ),
).then(data => console.table(data));
