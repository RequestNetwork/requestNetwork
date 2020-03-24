---
title: Currencies
sidebar_label: Currencies

description: How currencies are represented on the Request Network.
---

:::important
An important note about currencies mentioned in this page:
The currencies referenced here can be used for the creation of a request, but they are **not** necessarilly supported by the automated payment detection methods.

Read more about payment detection [here](2-payment-detection/1-introduction).
:::

## Currencies in Request

We currently support 4 types of currencies in requests:

- BTC
- ETH
- ERC20
- Fiat currencies \(we call them [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217)\)

For the ISO 4217 currencies, we support the entire subset of currencies defined by the standard.

For the ERC20 currencies, we have a list of supported tokens, currently imported from the [metamask list of tokens](https://github.com/MetaMask/eth-contract-metadata). You can also create requests with ERC20 tokens that are not on the supported list, but it's a more advanced usage and you should read on [how we represent currencies internally](#how-we-represent-currencies-internally).

## Interacting with the request-client.js

There are two ways to declare a currency at the request-client library.

### Simple

The simple way to declare a currency is using the string representation of that currency.

:::info
For the entire list of supported string representations, check the list at the bottom of this page.
:::

Here is an example of a request declaration with a REQ ERC20 token as currency:

```typescript
const request = await requestNetwork.createRequest({
  paymentNetwork,
  requestInfo: {
    currency: 'REQ',
    expectedAmount: '1000000000000000000',
    payee: payeeIdentity,
    payer: payerIdentity,
  },
  signer: payeeIdentity,
});
```

To declare a currency in a different network than mainnet, you can declare them like the following:

```text
<currency>-<network>

Examples:
BTC-mainnet
ETH-rinkeby
CTBK-rinkeby
```

### Advanced

If you want to declare a currency that is not currently supported by the protocol, mainly unsupported **ERC20 tokens** or **custom testnets**, you will have to declare the currency object directly, like the following:

```typescript
const request = await requestNetwork.createRequest({
  paymentNetwork,
  requestInfo: {
    currency: {
      network: 'ropsten',
      type: RequestLogicTypes.CURRENCY.ERC20,
      value: '0x123421aFbB33998d8584A2B05749bA73c37a7890',
    },
    expectedAmount: '1000',
    payee: payeeIdentity,
    payer: payerIdentity,
  },
  signer: payeeIdentity,
});
```

Read more about [how we represent currencies internally](#how-we-represent-currencies-internally) to better understand advanced usecases.

## How we represent currencies internally

On the Request protocol, we represent currencies as objects. There are a multitude of types of currencies available, and to better represent them, in a safe and future-proof way, we have to keep more information about them.

The interface used to represent currencies on requests is the following:

```typescript
/** Currency interface */
export interface ICurrency {
  /** The main currency name (e.g.: 'ERC20', 'FIAT', 'ETH') */
  type: CURRENCY;
  /** The currency value (e.g.: '0x123...789', 'EUR', 'ETH') */
  value: string;
  /** The currency network (e.g.: 'mainnet', 'rinkeby', 'bank_sandbox') */
  network?: string;
}

/** Supported currencies */
export enum CURRENCY {
  ETH = 'ETH',
  BTC = 'BTC',
  ISO4217 = 'ISO4217',
  ERC20 = 'ERC20',
}
```

{% endcode %}

Some important details about this implementation are:

- Value:
  - For **ETH** and **BTC**, the value is currently the same as the type.
  - For **ERC20** the value is the smart contract address.
  - For **ISO4217** the value is the currency symbol.
- Network:
  - The network is an **optional** value. If left empty it will default to the main currency network.
  - For **ETH** and **ERC20** the network can be `mainnet` or any testnet \(`rinkeby` is the only network currently supported by payment detection\). The `private` payment network can also be used, meaning the currency is at a private network \(mainly useful for local testing of payment detection\)
  - For **BTC** `mainnet` and `testnet` are supported.
  - For **ISO4217**, you would usually not need to declare a network \(although it can be useful in case of payment sandboxes\).

Some currency object examples:

```typescript
// Mainnet bitcoin currency
{
  type: RequestLogicTypes.CURRENCY.BTC,
  value: 'BTC',
}

// Rinkeby ETH currency
{
  network: 'rinkeby',
  type: RequestLogicTypes.CURRENCY.ETH,
  value: 'ETH',
},

// REQ ERC20 currency
{
  type: RequestLogicTypes.CURRENCY.ERC20,
  value: '0x8f8221aFbB33998d8584A2B05749bA73c37a938a',
}

// Fiat EUR currency
{
  type: RequestLogicTypes.CURRENCY.ISO4217,
  value: 'EUR',
},
```

## Supported currencies

- BTC
- BTC-mainnet
- ETH
- ETH-rinkeby
- For fiat currencies, you can use any of the official [ISO4217](https://en.wikipedia.org/wiki/ISO_4217): [the official ISO list](https://www.currency-iso.org/en/home/tables/table-a1.html) or [this npm package](https://www.npmjs.com/package/currency-codes) \(the one we use\)
- ERC20 currencies:
  - 0xBTC
  - 1ST
  - ADX
  - AE
  - AION
  - AMLT
  - ANT
  - APPC
  - ART
  - AST
  - BAT
  - BBK
  - BCAP
  - BCPT
  - BEE
  - BETHER
  - BMX
  - BNB
  - BNT
  - BOB
  - BOOTY
  - BOX
  - BTU
  - C20
  - CAG
  - CAN
  - CAT
  - CEL
  - CELR
  - CLN
  - CPLO
  - CRO
  - CVL
  - DAI
  - DANK
  - DATA
  - DAY
  - DGD
  - DGS
  - DIVX
  - DNT
  - DSCP
  - DTH
  - EDG
  - EDU
  - EGO
  - ELF
  - ELY
  - ENJ
  - ENQ
  - ENTRP
  - EOS
  - EURS
  - FKX
  - FOAM
  - FUN
  - GEE
  - GEN
  - GLA
  - GNO
  - GNT
  - GOLD
  - GOLDX
  - GROO
  - GUP
  - GUSD
  - HAK
  - HERC
  - HGT
  - HOT
  - HUNT
  - HYDRO
  - ICN
  - ICX
  - IMP
  - IND
  - IOST
  - IOTX
  - IQN
  - J8T
  - JET
  - JOY
  - KCS
  - KNC
  - KODA
  - LEND
  - LGO
  - LIKE
  - LINK
  - LOOM
  - LPT
  - LRC
  - LTO
  - LUN
  - MANA
  - MAS
  - MATIC
  - META
  - METM
  - MFT
  - MINDS
  - MITH
  - MKR
  - MLN
  - MOD
  - MYB
  - NANJ
  - NCT
  - NDC
  - NDX
  - NEEO
  - NEU
  - NFC
  - NMR
  - NUSD
  - OGN
  - OGO
  - OMG
  - ONE
  - ONL
  - OST
  - PARETO
  - PAX
  - PKT
  - PLA
  - PLAT
  - PLAY
  - PLU
  - PNK
  - POA20
  - POP
  - POWR
  - PPT
  - PROPS
  - QNT
  - QSP
  - QTUM
  - RDN
  - REDC
  - REMI
  - REN
  - REP
  - REQ
  - RFR
  - RHOC
  - RLC
  - RMESH
  - ROCK2
  - RVT
  - SAI
  - SAN
  - SIG
  - SNGLS
  - SNT
  - SNX
  - SOUL
  - SPANK
  - SPN
  - SPND
  - STAR
  - STORJ
  - SUSD
  - SWM
  - SWT
  - TAAS
  - TIME
  - TKN
  - TPT
  - TRL
  - TRST
  - TUSD
  - UPX
  - USDC
  - VDOC
  - VEN
  - VIDT
  - VIEW
  - VSL
  - WAX
  - WBTC
  - WED
  - WETH
  - WIB
  - WINGS
  - WTC
  - WYV
  - XAUR
  - XBP
  - XNK
  - XSC
  - YEED
  - ZEON
  - ZIL
  - ZRX
  - cBAT
  - cDAI
  - cETH
  - cREP
  - cUSDC
  - cZRX
- ERC20 rinkeby currencies \(for testing\):
  - CTBK-rinkeby \(you can get some at the [CTBK faucet](https://centra.request.network)\)
  - FAU-rinkeby \(you can get some at the [FAU faucet](https://erc20faucet.com/)\)
