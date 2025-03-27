import { ClientTypes } from '@requestnetwork/types';
import { retry } from '@requestnetwork/utils';
import httpConfigDefaults from './http-config-defaults';
import { stringify } from 'qs';
import fetch from 'node-fetch';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json');
export type NodeConnectionConfig = {
  baseURL: string;
  headers: Record<string, string>;
};

export class HttpDataAccessConfig {
  /**
   * Configuration that overrides http-config-defaults,
   * @see httpConfigDefaults for the default configuration.
   */
  public httpConfig: ClientTypes.IHttpDataAccessConfig;

  /**
   * Configuration that will be sent at each request.
   */
  public nodeConnectionConfig: NodeConnectionConfig;

  constructor(
    {
      httpConfig,
      nodeConnectionConfig,
    }: {
      httpConfig?: Partial<ClientTypes.IHttpDataAccessConfig>;
      nodeConnectionConfig?: Partial<NodeConnectionConfig>;
    } = {
      httpConfig: {},
      nodeConnectionConfig: {},
    },
  ) {
    const requestClientVersion = packageJson.version;
    this.httpConfig = {
      ...httpConfigDefaults,
      ...httpConfig,
    };
    this.nodeConnectionConfig = {
      baseURL: 'http://localhost:3000',
      headers: {
        [this.httpConfig.requestClientVersionHeader]: requestClientVersion,
      },
      ...nodeConnectionConfig,
    };
  }

  /**
   * Sends an HTTP GET request to the node and retries until it succeeds.
   * Throws when the retry count reaches a maximum.
   *
   * @param url HTTP GET request url
   * @param params HTTP GET request parameters
   * @param retryConfig Maximum retry count, delay between retries, exponential backoff delay, and maximum exponential backoff delay
   */
  public async fetchAndRetry<T = unknown>(
    path: string,
    params: Record<string, unknown>,
    retryConfig: {
      maxRetries?: number;
      retryDelay?: number;
      exponentialBackoffDelay?: number;
      maxExponentialBackoffDelay?: number;
    } = {},
  ): Promise<T> {
    retryConfig.maxRetries = retryConfig.maxRetries ?? this.httpConfig.httpRequestMaxRetry;
    retryConfig.retryDelay = retryConfig.retryDelay ?? this.httpConfig.httpRequestRetryDelay;
    retryConfig.exponentialBackoffDelay =
      retryConfig.exponentialBackoffDelay ?? this.httpConfig.httpRequestExponentialBackoffDelay;
    retryConfig.maxExponentialBackoffDelay =
      retryConfig.maxExponentialBackoffDelay ??
      this.httpConfig.httpRequestMaxExponentialBackoffDelay;
    return await retry(async () => await this.fetch<T>('GET', path, params), retryConfig)();
  }

  public async fetch<T = unknown>(
    method: 'GET' | 'POST',
    path: string,
    params: Record<string, unknown> | undefined,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const { baseURL, headers, ...options } = this.nodeConnectionConfig;
    const url = new URL(path, baseURL);
    if (params) {
      // qs.parse doesn't handle well mixes of string and object params
      for (const [key, value] of Object.entries(params)) {
        if (typeof value === 'object') {
          params[key] = JSON.stringify(value);
        }
      }
      url.search = stringify(params);
    }

    const r = await fetch(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },

      ...options,
    });

    if (r.ok) {
      return (await r.json()) as T;
    }

    const errorBody = await r.text();
    console.error('Request failed:', {
      url: url.toString(),
      method,
      params,
      body,
      status: r.status,
      statusText: r.statusText,
      errorBody,
    });

    throw Object.assign(new Error(`${r.statusText}`), {
      status: r.status,
      statusText: r.statusText,
    });
  }
}
