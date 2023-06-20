import { type PublicClient } from 'viem'
import { providers } from 'ethers'
import { type HttpTransport } from 'viem'
/**
 * Compatiblity method for ethers
 * From https://wagmi.sh/core/ethers-adapters
 */
export function publicClientToProvider(publicClient: PublicClient): providers.BaseProvider {
  const { chain, transport } = publicClient
  if (!chain) throw new Error("chain required")
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  if (transport.type === 'fallback')
    return new providers.FallbackProvider(
      (transport.transports as ReturnType<HttpTransport>[]).map(
        ({ value }) => new providers.JsonRpcProvider(value?.url, network),
      ),
    )
  return new providers.JsonRpcProvider(transport.url, network)
}

