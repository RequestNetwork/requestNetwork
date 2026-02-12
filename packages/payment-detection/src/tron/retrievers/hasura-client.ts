import { CurrencyTypes } from '@requestnetwork/types';

/**
 * Hasura payment response type matching the database schema.
 * Note: amount and fee_amount use NUMERIC in PostgreSQL, which Hasura may
 * return as JSON numbers (when they fit) or strings (for very large values).
 */
export interface HasuraPayment {
  id: string;
  chain: string;
  tx_hash: string;
  block_number: number;
  timestamp: number;
  contract_address: string;
  token_address: string;
  from_address: string;
  to_address: string;
  amount: string | number;
  fee_amount: string | number;
  fee_address: string;
  payment_reference: string;
  // TRON-specific resource fields
  energy_used?: string;
  energy_fee?: string;
  net_fee?: string;
}

export interface HasuraPaymentsResponse {
  payments: HasuraPayment[];
}

export interface HasuraClientOptions {
  /** Hasura GraphQL endpoint URL */
  url: string;
  /** Optional admin secret for authentication (x-hasura-admin-secret header) */
  adminSecret?: string;
  /** Optional JWT token for authentication (Authorization: Bearer header) */
  jwtToken?: string;
  /** Optional Hasura role to use with JWT auth (x-hasura-role header) */
  hasuraRole?: string;
  /** Optional custom headers */
  headers?: Record<string, string>;
}

/**
 * Client for querying payment data from Hasura GraphQL API
 */
export class HasuraClient {
  private readonly url: string;
  private readonly headers: Record<string, string>;

  constructor(options: HasuraClientOptions) {
    this.url = options.url;
    this.headers = {
      'Content-Type': 'application/json',
      ...(options.adminSecret && { 'x-hasura-admin-secret': options.adminSecret }),
      ...(options.jwtToken && { Authorization: `Bearer ${options.jwtToken}` }),
      ...(options.hasuraRole && { 'x-hasura-role': options.hasuraRole }),
      ...options.headers,
    };
  }

  /**
   * Query payments by payment reference
   */
  async getPaymentsByReference(params: {
    paymentReference: string;
    toAddress: string;
    chain?: string;
    tokenAddress?: string;
    contractAddress?: string;
  }): Promise<HasuraPayment[]> {
    const variableDefinitions: string[] = ['$paymentReference: String!', '$toAddress: String!'];
    const whereConditions: string[] = [
      'payment_reference: { _eq: $paymentReference }',
      'to_address: { _ilike: $toAddress }',
    ];
    const variables: Record<string, string> = {
      paymentReference: params.paymentReference,
      toAddress: params.toAddress,
    };

    if (params.chain) {
      variableDefinitions.push('$chain: String!');
      whereConditions.push('chain: { _eq: $chain }');
      variables.chain = params.chain;
    }

    if (params.tokenAddress) {
      variableDefinitions.push('$tokenAddress: String!');
      whereConditions.push('token_address: { _ilike: $tokenAddress }');
      variables.tokenAddress = params.tokenAddress;
    }

    if (params.contractAddress) {
      variableDefinitions.push('$contractAddress: String!');
      whereConditions.push('contract_address: { _ilike: $contractAddress }');
      variables.contractAddress = params.contractAddress;
    }

    const query = `
      query GetPayments(${variableDefinitions.join(', ')}) {
        payments(
          where: { ${whereConditions.join(', ')} }
          order_by: { block_number: asc }
        ) {
          id
          chain
          tx_hash
          block_number
          timestamp
          contract_address
          token_address
          from_address
          to_address
          amount
          fee_amount
          fee_address
          payment_reference
          energy_used
          energy_fee
          net_fee
        }
      }
    `;

    const response = await fetch(this.url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Hasura request failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`Hasura query error: ${JSON.stringify(result.errors)}`);
    }

    return result.data.payments;
  }
}

/** TRON network identifiers supported by the Hasura client */
const SUPPORTED_TRON_NETWORKS = ['tron', 'nile'];

/**
 * Factory function to create a Hasura client
 */
export function getHasuraClient(
  network: CurrencyTypes.ChainName,
  options?: Partial<HasuraClientOptions>,
): HasuraClient | undefined {
  // Only return a client for TRON networks (mainnet and Nile testnet)
  if (!SUPPORTED_TRON_NETWORKS.includes(network.toLowerCase())) {
    return undefined;
  }

  const defaultUrl = process.env.HASURA_GRAPHQL_URL || 'https://graphql.request.network/v1/graphql';
  const adminSecret = process.env.HASURA_ADMIN_SECRET;
  const jwtToken = process.env.HASURA_GRAPHQL_JWT_TOKEN;

  return new HasuraClient({
    url: options?.url || defaultUrl,
    adminSecret: options?.adminSecret || adminSecret,
    jwtToken: options?.jwtToken || jwtToken,
    hasuraRole: options?.hasuraRole,
    headers: options?.headers,
  });
}
