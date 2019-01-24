import TestExecutor, { ITestCase } from './test-case-executor';

// The test cases to run
const testCases: ITestCase[] = [
  {
    name: 'created',
    case: {
      create: true,
      accept: false,
      increase: false,
      reduce: false,
      content: '',
    },
    benchmarks: {
      size: true,
      speed: true,
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
    benchmarks: {
      size: true,
      speed: false,
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
    benchmarks: {
      size: true,
      speed: false,
    },
  },
];

// tslint:disable:no-floating-promises
// tslint:disable:no-console
TestExecutor.executeTests(testCases).then(testCaseResult => console.table(testCaseResult));
