import { RequestNetwork } from '@requestnetwork/client-side';
import {
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
const Benchmark = require('benchmark');

const signatureInfo: SignatureTypes.ISignatureParameters = {
  method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
};

const requestCreationHash: RequestLogicTypes.IRequestLogicCreateParameters = {
  currency: RequestLogicTypes.REQUEST_LOGIC_CURRENCY.ETH,
  expectedAmount: '100000000000',
  payee: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  },
  payer: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
  },
};

const topics = [
  '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
];

// const requestFromId = requestNetwork.fromRequestId(request.requestId);
// const {
//   result: { request: requestData },
// } = await requestFromId.getData();
// console.log(requestData);

/**
 * Creates a request and returns the size in the storage
 *
 * @param {Boolean} actions.create Should it create a request?
 * @param {Boolean} actions.accept Should it accept a request?
 * @param {Boolean} actions.increase Should it increase the amount a request?
 * @param {Boolean} actions.reduce Should it reduce the amount a request?
 * @param {String} actions.content Content of the request
 * @returns
 */
function getCreateRequestThroughput(): Promise<IBenchmark> {
  // actions: any = {
  //   create: true,
  //   accept: false,
  //   increase: false,
  //   reduce: false,
  //   content: '',
  // },
  return new Promise(resolve => {
    const requestNetwork = new RequestNetwork({ useMockStorage: true });

    const suite = new Benchmark.Suite();

    // tslint:disable:no-floating-promises
    suite
      .add('create request', {
        defer: true,
        fn(deferred: any): void {
          requestNetwork
            .createRequest(requestCreationHash, signatureInfo, topics)
            .then(() => deferred.resolve());
        },
      })
      .on('complete', (results: any) => resolve(analyzeBenchmark(results.currentTarget[0])))
      .run();
  });
}

/**
 * Extracts and renames the results from Benchmark
 *
 * @param {*} benchmark
 * @returns
 */
function analyzeBenchmark(benchmark: any): IBenchmark {
  const {
    count,
    hz: countPerSec,
    stats: { mean, moe: marginOfError },
  } = benchmark;
  return { count, countPerSec: Math.round(countPerSec), mean, marginOfError };
}

/**
 * Readable results of a benchmark
 *
 * @export
 * @interface IBenchmark
 */
export interface IBenchmark {
  count: number;
  countPerSec: number;
  mean: number;
  marginOfError: number;
}

export default getCreateRequestThroughput;
