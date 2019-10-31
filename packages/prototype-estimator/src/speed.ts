import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import { RequestNetwork, Types } from '@requestnetwork/request-client.js';

const benchmark = require('benchmark');

const signatureInfo: Types.Signature.ISignatureParameters = {
  method: Types.Signature.METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
};
const signerIdentity: Types.Identity.IIdentity = {
  type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
  value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
};

const requestCreationHash: Types.RequestLogic.ICreateParameters = {
  currency: {
    type: Types.RequestLogic.CURRENCY.BTC,
    value: 'BTC',
  },
  expectedAmount: '100000000000',
  payee: signerIdentity,
  payer: {
    type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
    value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
  },
};

const signatureProvider = new EthereumPrivateKeySignatureProvider(signatureInfo);

// nonce to avoid requestId collision
let nonce = 0;

/**
 * Creates several requests and returns how many requests have been created per second
 *
 * @param {String} actions.content Content of the request
 * @returns {Promise<IBenchmark>}
 */
function getCreateRequestThroughput(
  actions: any = {
    content: '',
  },
): Promise<IBenchmark> {
  return new Promise(
    (resolve): any => {
      const requestNetwork = new RequestNetwork({ signatureProvider });

      const suite = new benchmark.Suite();

      return suite
        .add('create request', {
          defer: true,
          fn(deferred: any): Promise<any> {
            // increment to avoid requestId collision
            requestCreationHash.nonce = nonce++;

            return requestNetwork
              .createRequest({
                contentData: actions.content,
                requestInfo: requestCreationHash,
                signer: signerIdentity,
              })
              .then(() => deferred.resolve());
          },
        })
        .on('complete', (results: any) => resolve(analyzeBenchmark(results.currentTarget[0])))
        .run();
    },
  );
}

/**
 * Extracts and renames the results from Benchmark
 *
 * @param {*} benchmark
 * @returns
 */
function analyzeBenchmark(benchmarkToAnalyze: any): IBenchmark {
  const {
    count,
    hz: countPerSec,
    stats: { mean, moe: marginOfError },
  } = benchmarkToAnalyze;
  return { count, countPerSec, mean, marginOfError };
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
