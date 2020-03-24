---
title: Bug bounty
sidebar_label: Bug bounty
---

The Bug Bounty currently targets the smart contracts listed below. The branch to audit is **master.**

- Bytes.sol
- ERC20Proxy.sol
- Migrations.sol
- RequestHashStorage.sol
- RequestOpenHashSubmitter.sol
- StorageFeeCollector.sol
- contracts/core/Burner.sol

The smart contracts can be found in [their dedicated package on Github](https://github.com/RequestNetwork/requestNetwork/tree/master/packages/smart-contracts/src/contracts) and the [burner contract in the v1 repository](https://github.com/RequestNetwork/requestNetwork-v1-archive/blob/development/packages/requestNetworkSmartContracts/contracts/core/Burner.sol).

:::info
Critical vulnerabilities will be rewarded up to $20 000, while major bugs will be rewarded up to $15 000.
:::

### Rules & Rewards

The rules of our bug bounty program are the same that apply to the Ethereum protocol: [https://bounty.ethereum.org](https://bounty.ethereum.org/)

- Issues that have already been submitted by another user or are already known to the Request team are not eligible for bounty rewards.
- Public disclosure of a vulnerability makes it ineligible for a bounty.
- The Request core development team, employees, and all other people paid by the Request Foundation, directly or indirectly, are not eligible for rewards.
- The Request bounty program considers a number of variables in determining rewards. Determinations of eligibility, score and all terms related to rewards are at the sole and final discretion of the Request Foundation bug bounty panel.

The value of rewards paid out will vary depending on severity. The severity is calculated according to the OWASP risk rating model based on Impact and Likelihood:

![](/img/severity.png)

Reward sizes are guided by the rules below, but are ultimately determined at the sole discretion of the Request Foundation bug bounty panel.

- Critical: up to \$20 000
- High: up to \$15 000
- Medium: up to \$10 000
- Low: up to \$2 000
- Note: up to \$500

All bounty will be paid in **ether \(ETH\).**

The bug bounty program has no end date until communicated otherwise. We encourage you to report the bugs as an issue [on the Github repository](https://github.com/RequestNetwork/requestNetwork). You can also email [security@request.network](mailto:security@request.network). Anonymous submissions are welcome.
