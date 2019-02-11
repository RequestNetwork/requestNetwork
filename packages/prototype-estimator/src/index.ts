import TestExecutor, { ITestCase } from './test-case-executor';
const longContent = require('./example-valid-0.0.2.json');

// tslint:disable:object-literal-sort-keys
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
    name: 'created + small content ({"reference":"OA7637DRGK"})',
    case: {
      create: true,
      accept: false,
      increase: false,
      reduce: false,
      content: '{"reference":"OA7637DRGK"}',
    },
    benchmarks: {
      size: true,
      speed: false,
    },
  },
  {
    name: 'created + long content (example-valid-0.0.2.json)',
    case: {
      create: true,
      accept: false,
      increase: false,
      reduce: false,
      content: longContent,
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
