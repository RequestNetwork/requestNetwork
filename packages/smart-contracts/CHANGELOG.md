# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.29.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/smart-contracts@0.21.0...@requestnetwork/smart-contracts@0.29.0) (2022-11-04)

### Bug Fixes

- getPaymentNetworkFrom conversion request ([#976](https://github.com/RequestNetwork/requestNetwork/issues/976)) ([03eaa6d](https://github.com/RequestNetwork/requestNetwork/commit/03eaa6dce6a4d05ba6f07d4c910c87147c0b7c54))
- **smart-contract:** batch conversion - add xdai and fuse proxy addresses ([#919](https://github.com/RequestNetwork/requestNetwork/issues/919)) ([97ee435](https://github.com/RequestNetwork/requestNetwork/commit/97ee4354aac4b9f9583deec27505581b97e0799e))
- **smart-contracts:** deploy and verify batch contract ([#868](https://github.com/RequestNetwork/requestNetwork/issues/868)) ([a71eb58](https://github.com/RequestNetwork/requestNetwork/commit/a71eb581de2199892ee44fcb8b162a9ae0c44a10))
- **smart-contracts:** missing gnosisscan api key ([#972](https://github.com/RequestNetwork/requestNetwork/issues/972)) ([35cf7fb](https://github.com/RequestNetwork/requestNetwork/commit/35cf7fb3a37e16366059f6c86d9139bc250e39d4))
- **smart-contracts:** update batch fees ([#873](https://github.com/RequestNetwork/requestNetwork/issues/873)) ([15c55bc](https://github.com/RequestNetwork/requestNetwork/commit/15c55bc5d57eaff74cd23358754dc29b6ccd47f4))
- artifact ABI for ChainlinkConversionPath ([#700](https://github.com/RequestNetwork/requestNetwork/issues/700)) ([91619f9](https://github.com/RequestNetwork/requestNetwork/commit/91619f960f713066e2812f7d57a77198d04cfb7d))
- avalanche addresses ([#799](https://github.com/RequestNetwork/requestNetwork/issues/799)) ([06a1fa2](https://github.com/RequestNetwork/requestNetwork/commit/06a1fa29cd00045f8d915da189912cb84979496d))
- Chainlink contracts updates ([#481](https://github.com/RequestNetwork/requestNetwork/issues/481)) ([0aaf65b](https://github.com/RequestNetwork/requestNetwork/commit/0aaf65b59c14dddaa6ae0260b06006244e4bf852))
- deployment script with ERC20Conversion v2 and Swap ([#751](https://github.com/RequestNetwork/requestNetwork/issues/751)) ([3b97506](https://github.com/RequestNetwork/requestNetwork/commit/3b975067706cd6201fc0cf065b0e33c6bab494ac))
- disable matic ETH proxy artifact ([#552](https://github.com/RequestNetwork/requestNetwork/issues/552)) ([a66f54c](https://github.com/RequestNetwork/requestNetwork/commit/a66f54c00079c5b4ea7cd434caaf5e930d1f48bc))
- escrow audit fix 1 ([#874](https://github.com/RequestNetwork/requestNetwork/issues/874)) ([82ab698](https://github.com/RequestNetwork/requestNetwork/commit/82ab6980ba5d9ed3d0bba12249e59351851a3403))
- escrow audit fix 2 ([#878](https://github.com/RequestNetwork/requestNetwork/issues/878)) ([53d244b](https://github.com/RequestNetwork/requestNetwork/commit/53d244b9be344c64cfb2f13b62c54065e935792b))
- eth-input-data for fuse ([#759](https://github.com/RequestNetwork/requestNetwork/issues/759)) ([4de0951](https://github.com/RequestNetwork/requestNetwork/commit/4de0951e72777480ebdf420b8a5ed78b8a992fba))
- ethereum proxy ([#807](https://github.com/RequestNetwork/requestNetwork/issues/807)) ([bcda36d](https://github.com/RequestNetwork/requestNetwork/commit/bcda36dee054504310aaaa98f9d870682893efcc))
- invoice total types + upgrade ethers ([#514](https://github.com/RequestNetwork/requestNetwork/issues/514)) ([c2b98b2](https://github.com/RequestNetwork/requestNetwork/commit/c2b98b2bd3c93f063f340d58c6b95ad026fd9519))
- missing eth-proxy on BSC ([#791](https://github.com/RequestNetwork/requestNetwork/issues/791)) ([b1a73c0](https://github.com/RequestNetwork/requestNetwork/commit/b1a73c051b792b7944e33be589031a7353793f1e))
- naming ([#750](https://github.com/RequestNetwork/requestNetwork/issues/750)) ([b59806d](https://github.com/RequestNetwork/requestNetwork/commit/b59806d00cf88714fae6bd1fd6201554ba8ef0d9))
- smart-contract batch xdeployment ([#850](https://github.com/RequestNetwork/requestNetwork/issues/850)) ([0893859](https://github.com/RequestNetwork/requestNetwork/commit/0893859bdfcd2d311de7bb21f06ab5289958949b))
- swap to conversion ([#826](https://github.com/RequestNetwork/requestNetwork/issues/826)) ([cdb4b99](https://github.com/RequestNetwork/requestNetwork/commit/cdb4b999a059c86e5b9ff59d144fb7236060460a))
- tslib dependency in smart-contracts ([#721](https://github.com/RequestNetwork/requestNetwork/issues/721)) ([85091c3](https://github.com/RequestNetwork/requestNetwork/commit/85091c340f13bed37c1ddf7468e6659e8473c5e9))
- typescript lint for test files ([#778](https://github.com/RequestNetwork/requestNetwork/issues/778)) ([048e876](https://github.com/RequestNetwork/requestNetwork/commit/048e876a905516be0de8a31d446e4572eb74eccb))
- **contract:** ETH conversion native hashes per chain ([#743](https://github.com/RequestNetwork/requestNetwork/issues/743)) ([005e4b1](https://github.com/RequestNetwork/requestNetwork/commit/005e4b1a9a983fc16d469b39c5e967494918936e))
- this undefined for fee-proxy-contract ([#510](https://github.com/RequestNetwork/requestNetwork/issues/510)) ([67898bb](https://github.com/RequestNetwork/requestNetwork/commit/67898bb0136a03a9107b0bc41d79cfc5acd2b139))
- upgrade ethers to 5.2.0 ([#532](https://github.com/RequestNetwork/requestNetwork/issues/532)) ([6c7cf35](https://github.com/RequestNetwork/requestNetwork/commit/6c7cf350a04e280b77ce6fd758b6f065f28fd1cc))
- yarn hardhat clean with broken dependencies ([#547](https://github.com/RequestNetwork/requestNetwork/issues/547)) ([edebec6](https://github.com/RequestNetwork/requestNetwork/commit/edebec6cc05a6c0a2b7d05b487a835586c85fd56))

### Features

- **ronin:** Ethereum Fee Proxy ([#974](https://github.com/RequestNetwork/requestNetwork/issues/974)) ([87ef11c](https://github.com/RequestNetwork/requestNetwork/commit/87ef11c0c5464534b3aea1b6f18e12a7489012c5))
- ronin ([#971](https://github.com/RequestNetwork/requestNetwork/issues/971)) ([8d5c91c](https://github.com/RequestNetwork/requestNetwork/commit/8d5c91cb1b2f13c2e1e80286c46bc98ef17964d3))
- **payment-processor:** batch conversion - erc20 ([#903](https://github.com/RequestNetwork/requestNetwork/issues/903)) ([715bfd6](https://github.com/RequestNetwork/requestNetwork/commit/715bfd605fa002c47b9769493727a98fd5413cd3)), closes [#880](https://github.com/RequestNetwork/requestNetwork/issues/880) [#878](https://github.com/RequestNetwork/requestNetwork/issues/878) [#873](https://github.com/RequestNetwork/requestNetwork/issues/873) [#884](https://github.com/RequestNetwork/requestNetwork/issues/884) [#888](https://github.com/RequestNetwork/requestNetwork/issues/888) [#878](https://github.com/RequestNetwork/requestNetwork/issues/878) [#873](https://github.com/RequestNetwork/requestNetwork/issues/873) [#884](https://github.com/RequestNetwork/requestNetwork/issues/884) [#888](https://github.com/RequestNetwork/requestNetwork/issues/888) [#890](https://github.com/RequestNetwork/requestNetwork/issues/890) [#886](https://github.com/RequestNetwork/requestNetwork/issues/886) [#892](https://github.com/RequestNetwork/requestNetwork/issues/892) [#893](https://github.com/RequestNetwork/requestNetwork/issues/893) [#895](https://github.com/RequestNetwork/requestNetwork/issues/895)
- **smart-contracts:** batch conversion ([#877](https://github.com/RequestNetwork/requestNetwork/issues/877)) ([2000058](https://github.com/RequestNetwork/requestNetwork/commit/20000587318107e97742688f69ba561868e39f8f))
- Add payment-processor for any to erc20 payment network ([#433](https://github.com/RequestNetwork/requestNetwork/issues/433)) ([7134310](https://github.com/RequestNetwork/requestNetwork/commit/7134310828f9440bac33f75719c7937872243ab6))
- add smartcontract to swap before payment with any to erc20 conversion ([#472](https://github.com/RequestNetwork/requestNetwork/issues/472)) ([a60f0b6](https://github.com/RequestNetwork/requestNetwork/commit/a60f0b6255e976808348ec62d0c2f0d0b3ff9617))
- adding BSC support ([#594](https://github.com/RequestNetwork/requestNetwork/issues/594)) ([0a923a2](https://github.com/RequestNetwork/requestNetwork/commit/0a923a2d7403fa7a280ff8f74fd9f998d56cee23))
- arbitrum-one deployment ([#754](https://github.com/RequestNetwork/requestNetwork/issues/754)) ([942a134](https://github.com/RequestNetwork/requestNetwork/commit/942a134fb5e7c95f6b96f57c5c16bd59d86b9ec8))
- arbitrum-testnet-update ([#728](https://github.com/RequestNetwork/requestNetwork/issues/728)) ([803159e](https://github.com/RequestNetwork/requestNetwork/commit/803159e30f9ea7c3a97e5f808701013b5639735e))
- bsc payments except swap ([#619](https://github.com/RequestNetwork/requestNetwork/issues/619)) ([cd8493e](https://github.com/RequestNetwork/requestNetwork/commit/cd8493e8c9d218f9c16d8b8b9020059ba669294b))
- create2 deployer ([#806](https://github.com/RequestNetwork/requestNetwork/issues/806)) ([453f5b5](https://github.com/RequestNetwork/requestNetwork/commit/453f5b5ec74cdd216fd6b872e3cf105113447dde))
- Currency Manager ([#571](https://github.com/RequestNetwork/requestNetwork/issues/571)) ([3a68ad3](https://github.com/RequestNetwork/requestNetwork/commit/3a68ad31fc049e13f0f6dac4759b08c06b33416b))
- deployment for arbitrum testnet ([#734](https://github.com/RequestNetwork/requestNetwork/issues/734)) ([34c9c87](https://github.com/RequestNetwork/requestNetwork/commit/34c9c8710154a4dd824f6dc7f04ca91f9d47ea4b))
- deployment for mainnet up to EthConversionProxy ([#698](https://github.com/RequestNetwork/requestNetwork/issues/698)) ([5fbc0b4](https://github.com/RequestNetwork/requestNetwork/commit/5fbc0b411e4de248d66f91eadae4d6bb109fef18))
- deployment information for Avalanche ([#795](https://github.com/RequestNetwork/requestNetwork/issues/795)) ([80b4a7c](https://github.com/RequestNetwork/requestNetwork/commit/80b4a7cb9e78f990d32c5c9461841e1141f1e89f))
- deployments on bsc aggregator ([#815](https://github.com/RequestNetwork/requestNetwork/issues/815)) ([b38f14b](https://github.com/RequestNetwork/requestNetwork/commit/b38f14b6c78e836b5c91d7370ce17cc33181b42b))
- Erc20 escrow payment processor (complete w/tests). ([#693](https://github.com/RequestNetwork/requestNetwork/issues/693)) ([328debd](https://github.com/RequestNetwork/requestNetwork/commit/328debd11e6035db117b17af1dd1c0b0db531178))
- ERC20 Fee Proxy on Celo and Fuse ([#518](https://github.com/RequestNetwork/requestNetwork/issues/518)) ([8b759c3](https://github.com/RequestNetwork/requestNetwork/commit/8b759c3e2e264fe3887f29edf1ab162c4d49be54))
- ERC20 Fee Proxy on Matic ([#495](https://github.com/RequestNetwork/requestNetwork/issues/495)) ([ac003d5](https://github.com/RequestNetwork/requestNetwork/commit/ac003d538715c18dc158ccc84249da10dc9a984f))
- ERC20FeeProxy contract deployment on Celo ([#520](https://github.com/RequestNetwork/requestNetwork/issues/520)) ([6c5b5c4](https://github.com/RequestNetwork/requestNetwork/commit/6c5b5c4a175a1ab5b8a8450111e1224d7b113f4b))
- ether to smart wallet payment ([#780](https://github.com/RequestNetwork/requestNetwork/issues/780)) ([ee3436e](https://github.com/RequestNetwork/requestNetwork/commit/ee3436ef2de923e6b4f4686a63099ecd875338c3))
- ethereum fee proxy smart contract ([#583](https://github.com/RequestNetwork/requestNetwork/issues/583)) ([99eb560](https://github.com/RequestNetwork/requestNetwork/commit/99eb560a231370e09fee55b72221914fa2e31591))
- flexible escrow contract ([#825](https://github.com/RequestNetwork/requestNetwork/issues/825)) ([c80b48f](https://github.com/RequestNetwork/requestNetwork/commit/c80b48fcbc99605b2054a352feb21dc028d0c604))
- flexible escrow contract ([#831](https://github.com/RequestNetwork/requestNetwork/issues/831)) ([6326dd6](https://github.com/RequestNetwork/requestNetwork/commit/6326dd61d1724cf6811b21fffa8e429ab52964be))
- goerli payment ([#892](https://github.com/RequestNetwork/requestNetwork/issues/892)) ([2495d00](https://github.com/RequestNetwork/requestNetwork/commit/2495d00ba7edd32b5aeba4bca3d555e910e00941))
- **artifacts:** ETHConversionProxy v2 on Fantom ([#745](https://github.com/RequestNetwork/requestNetwork/issues/745)) ([f4ad4f0](https://github.com/RequestNetwork/requestNetwork/commit/f4ad4f0d7e1a2b8b4c8d617135eccad66cd3bee1))
- **artifacts:** ETHConversionProxy v2 on Rinkeby ([#744](https://github.com/RequestNetwork/requestNetwork/issues/744)) ([1a2d73c](https://github.com/RequestNetwork/requestNetwork/commit/1a2d73ce18a401d4a27fd5d571ef5239a953a7dd))
- **smart-contracts:** batch smart contract no delegatecall ([#830](https://github.com/RequestNetwork/requestNetwork/issues/830)) ([3cfa885](https://github.com/RequestNetwork/requestNetwork/commit/3cfa885efdcaf8f04888f7f6067409ee978cb585))
- ethereum fee proxy with transfer exact eth amount ([#591](https://github.com/RequestNetwork/requestNetwork/issues/591)) ([eb08b85](https://github.com/RequestNetwork/requestNetwork/commit/eb08b857dd80e345c8799190fa1211fe0560a5e2))
- Fantom deployments ([#654](https://github.com/RequestNetwork/requestNetwork/issues/654)) ([06e92b4](https://github.com/RequestNetwork/requestNetwork/commit/06e92b459c8822ea20989068bcd9212f48171db3))
- get all addresses for an artifact ([#554](https://github.com/RequestNetwork/requestNetwork/issues/554)) ([ff96a1e](https://github.com/RequestNetwork/requestNetwork/commit/ff96a1ef60d18adfc077a8c19ee7b2181c14ab4c))
- mainnet conversion contract and aggregators ([#477](https://github.com/RequestNetwork/requestNetwork/issues/477)) ([d5ddd6a](https://github.com/RequestNetwork/requestNetwork/commit/d5ddd6ae5d394801de7d0febca9e3f99b3d1cee5))
- matic deployments Proxies and Conversion ([#549](https://github.com/RequestNetwork/requestNetwork/issues/549)) ([332973f](https://github.com/RequestNetwork/requestNetwork/commit/332973fbc84153c0ef45bd8df2131cba40a7e724))
- MATIC deployments up to EthConversionProxy ([#658](https://github.com/RequestNetwork/requestNetwork/issues/658)) ([e749605](https://github.com/RequestNetwork/requestNetwork/commit/e74960575bac0fd3818c182f4b8a7650b6408c6a))
- payment detection for ethereum fee proxy ([#585](https://github.com/RequestNetwork/requestNetwork/issues/585)) ([c78803f](https://github.com/RequestNetwork/requestNetwork/commit/c78803fb1333917b843db935df0114a50e294f5f))
- Payment detection for the any to erc20 payment network ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6f7338f](https://github.com/RequestNetwork/requestNetwork/commit/6f7338f42ddf793a733a31b434d6116beebefdf6))
- Payment network any-to-eth in the smartcontracts ([#602](https://github.com/RequestNetwork/requestNetwork/issues/602)) ([e712e52](https://github.com/RequestNetwork/requestNetwork/commit/e712e526d3d426f7388ea56f4924c17ac9c8b638))
- Payment network any-to-eth rinkeby deployment ([#627](https://github.com/RequestNetwork/requestNetwork/issues/627)) ([1805446](https://github.com/RequestNetwork/requestNetwork/commit/1805446396af9e486d3d8d5533a95dc16ea3c915))
- pn to smart-contract version mapping ([#649](https://github.com/RequestNetwork/requestNetwork/issues/649)) ([d45ab85](https://github.com/RequestNetwork/requestNetwork/commit/d45ab85c2c47b8d7325fef78965ad94272250598))
- standard deployments on celo ([#690](https://github.com/RequestNetwork/requestNetwork/issues/690)) ([f224545](https://github.com/RequestNetwork/requestNetwork/commit/f224545a3dc723230e404fdb13a14da7f63001ed))
- start SF payments processing ([#821](https://github.com/RequestNetwork/requestNetwork/issues/821)) ([53e5879](https://github.com/RequestNetwork/requestNetwork/commit/53e587916e336057935c3d54655de0dc539a59a3))
- support submitter and storage deployed on xDai ([#459](https://github.com/RequestNetwork/requestNetwork/issues/459)) ([dde976d](https://github.com/RequestNetwork/requestNetwork/commit/dde976da214420f732b439257fc2e82d1260a3ee))
- xdai artifacts for auto deployments ([#596](https://github.com/RequestNetwork/requestNetwork/issues/596)) ([5491d38](https://github.com/RequestNetwork/requestNetwork/commit/5491d38ce4b0938c4f2ea71640bf903fa8c1ceaa))

# 0.34.0 (2021-03-03)

### Features

- payment network any to erc20 smartcontracts ([#408](https://github.com/RequestNetwork/requestNetwork/issues/408)) ([a2f30a8](https://github.com/RequestNetwork/requestNetwork/commit/a2f30a84689eaea0994e72944c417718c7aad20e))

# [0.28.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/smart-contracts@0.21.0...@requestnetwork/smart-contracts@0.28.0) (2021-06-22)

### Bug Fixes

- Chainlink contracts updates ([#481](https://github.com/RequestNetwork/requestNetwork/issues/481)) ([0aaf65b](https://github.com/RequestNetwork/requestNetwork/commit/0aaf65b59c14dddaa6ae0260b06006244e4bf852))
- invoice total types + upgrade ethers ([#514](https://github.com/RequestNetwork/requestNetwork/issues/514)) ([c2b98b2](https://github.com/RequestNetwork/requestNetwork/commit/c2b98b2bd3c93f063f340d58c6b95ad026fd9519))
- this undefined for fee-proxy-contract ([#510](https://github.com/RequestNetwork/requestNetwork/issues/510)) ([67898bb](https://github.com/RequestNetwork/requestNetwork/commit/67898bb0136a03a9107b0bc41d79cfc5acd2b139))

### Features

- Add payment-processor for any to erc20 payment network ([#433](https://github.com/RequestNetwork/requestNetwork/issues/433)) ([7134310](https://github.com/RequestNetwork/requestNetwork/commit/7134310828f9440bac33f75719c7937872243ab6))
- add smartcontract to swap before payment with any to erc20 conversion ([#472](https://github.com/RequestNetwork/requestNetwork/issues/472)) ([a60f0b6](https://github.com/RequestNetwork/requestNetwork/commit/a60f0b6255e976808348ec62d0c2f0d0b3ff9617))
- ERC20 Fee Proxy on Celo and Fuse ([#518](https://github.com/RequestNetwork/requestNetwork/issues/518)) ([8b759c3](https://github.com/RequestNetwork/requestNetwork/commit/8b759c3e2e264fe3887f29edf1ab162c4d49be54))
- ERC20 Fee Proxy on Matic ([#495](https://github.com/RequestNetwork/requestNetwork/issues/495)) ([ac003d5](https://github.com/RequestNetwork/requestNetwork/commit/ac003d538715c18dc158ccc84249da10dc9a984f))
- ERC20FeeProxy contract deployment on Celo ([#520](https://github.com/RequestNetwork/requestNetwork/issues/520)) ([6c5b5c4](https://github.com/RequestNetwork/requestNetwork/commit/6c5b5c4a175a1ab5b8a8450111e1224d7b113f4b))
- mainnet conversion contract and aggregators ([#477](https://github.com/RequestNetwork/requestNetwork/issues/477)) ([d5ddd6a](https://github.com/RequestNetwork/requestNetwork/commit/d5ddd6ae5d394801de7d0febca9e3f99b3d1cee5))
- Payment detection for the any to erc20 payment network ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6f7338f](https://github.com/RequestNetwork/requestNetwork/commit/6f7338f42ddf793a733a31b434d6116beebefdf6))
- support submitter and storage deployed on xDai ([#459](https://github.com/RequestNetwork/requestNetwork/issues/459)) ([dde976d](https://github.com/RequestNetwork/requestNetwork/commit/dde976da214420f732b439257fc2e82d1260a3ee))

# 0.34.0 (2021-03-03)

### Features

- payment network any to erc20 smartcontracts ([#408](https://github.com/RequestNetwork/requestNetwork/issues/408)) ([a2f30a8](https://github.com/RequestNetwork/requestNetwork/commit/a2f30a84689eaea0994e72944c417718c7aad20e))

# [0.27.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/smart-contracts@0.21.0...@requestnetwork/smart-contracts@0.27.0) (2021-05-12)

### Bug Fixes

- Chainlink contracts updates ([#481](https://github.com/RequestNetwork/requestNetwork/issues/481)) ([0aaf65b](https://github.com/RequestNetwork/requestNetwork/commit/0aaf65b59c14dddaa6ae0260b06006244e4bf852))
- this undefined for fee-proxy-contract ([#510](https://github.com/RequestNetwork/requestNetwork/issues/510)) ([67898bb](https://github.com/RequestNetwork/requestNetwork/commit/67898bb0136a03a9107b0bc41d79cfc5acd2b139))

### Features

- Add payment-processor for any to erc20 payment network ([#433](https://github.com/RequestNetwork/requestNetwork/issues/433)) ([7134310](https://github.com/RequestNetwork/requestNetwork/commit/7134310828f9440bac33f75719c7937872243ab6))
- add smartcontract to swap before payment with any to erc20 conversion ([#472](https://github.com/RequestNetwork/requestNetwork/issues/472)) ([a60f0b6](https://github.com/RequestNetwork/requestNetwork/commit/a60f0b6255e976808348ec62d0c2f0d0b3ff9617))
- ERC20 Fee Proxy on Matic ([#495](https://github.com/RequestNetwork/requestNetwork/issues/495)) ([ac003d5](https://github.com/RequestNetwork/requestNetwork/commit/ac003d538715c18dc158ccc84249da10dc9a984f))
- mainnet conversion contract and aggregators ([#477](https://github.com/RequestNetwork/requestNetwork/issues/477)) ([d5ddd6a](https://github.com/RequestNetwork/requestNetwork/commit/d5ddd6ae5d394801de7d0febca9e3f99b3d1cee5))
- Payment detection for the any to erc20 payment network ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6f7338f](https://github.com/RequestNetwork/requestNetwork/commit/6f7338f42ddf793a733a31b434d6116beebefdf6))
- support submitter and storage deployed on xDai ([#459](https://github.com/RequestNetwork/requestNetwork/issues/459)) ([dde976d](https://github.com/RequestNetwork/requestNetwork/commit/dde976da214420f732b439257fc2e82d1260a3ee))

# 0.34.0 (2021-03-03)

### Features

- payment network any to erc20 smartcontracts ([#408](https://github.com/RequestNetwork/requestNetwork/issues/408)) ([a2f30a8](https://github.com/RequestNetwork/requestNetwork/commit/a2f30a84689eaea0994e72944c417718c7aad20e))

# [0.26.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/smart-contracts@0.21.0...@requestnetwork/smart-contracts@0.26.0) (2021-04-19)

### Bug Fixes

- Chainlink contracts updates ([#481](https://github.com/RequestNetwork/requestNetwork/issues/481)) ([0aaf65b](https://github.com/RequestNetwork/requestNetwork/commit/0aaf65b59c14dddaa6ae0260b06006244e4bf852))

### Features

- Add payment-processor for any to erc20 payment network ([#433](https://github.com/RequestNetwork/requestNetwork/issues/433)) ([7134310](https://github.com/RequestNetwork/requestNetwork/commit/7134310828f9440bac33f75719c7937872243ab6))
- add smartcontract to swap before payment with any to erc20 conversion ([#472](https://github.com/RequestNetwork/requestNetwork/issues/472)) ([a60f0b6](https://github.com/RequestNetwork/requestNetwork/commit/a60f0b6255e976808348ec62d0c2f0d0b3ff9617))
- mainnet conversion contract and aggregators ([#477](https://github.com/RequestNetwork/requestNetwork/issues/477)) ([d5ddd6a](https://github.com/RequestNetwork/requestNetwork/commit/d5ddd6ae5d394801de7d0febca9e3f99b3d1cee5))
- Payment detection for the any to erc20 payment network ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6f7338f](https://github.com/RequestNetwork/requestNetwork/commit/6f7338f42ddf793a733a31b434d6116beebefdf6))
- support submitter and storage deployed on xDai ([#459](https://github.com/RequestNetwork/requestNetwork/issues/459)) ([dde976d](https://github.com/RequestNetwork/requestNetwork/commit/dde976da214420f732b439257fc2e82d1260a3ee))

# 0.34.0 (2021-03-03)

### Features

- payment network any to erc20 smartcontracts ([#408](https://github.com/RequestNetwork/requestNetwork/issues/408)) ([a2f30a8](https://github.com/RequestNetwork/requestNetwork/commit/a2f30a84689eaea0994e72944c417718c7aad20e))

# [0.25.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/smart-contracts@0.21.0...@requestnetwork/smart-contracts@0.25.0) (2021-03-25)

### Features

- Add payment-processor for any to erc20 payment network ([#433](https://github.com/RequestNetwork/requestNetwork/issues/433)) ([7134310](https://github.com/RequestNetwork/requestNetwork/commit/7134310828f9440bac33f75719c7937872243ab6))
- Payment detection for the any to erc20 payment network ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6f7338f](https://github.com/RequestNetwork/requestNetwork/commit/6f7338f42ddf793a733a31b434d6116beebefdf6))
- support submitter and storage deployed on xDai ([#459](https://github.com/RequestNetwork/requestNetwork/issues/459)) ([dde976d](https://github.com/RequestNetwork/requestNetwork/commit/dde976da214420f732b439257fc2e82d1260a3ee))

# 0.34.0 (2021-03-03)

### Features

- payment network any to erc20 smartcontracts ([#408](https://github.com/RequestNetwork/requestNetwork/issues/408)) ([a2f30a8](https://github.com/RequestNetwork/requestNetwork/commit/a2f30a84689eaea0994e72944c417718c7aad20e))

# [0.24.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/smart-contracts@0.21.0...@requestnetwork/smart-contracts@0.24.0) (2021-03-15)

### Features

- Add payment-processor for any to erc20 payment network ([#433](https://github.com/RequestNetwork/requestNetwork/issues/433)) ([7134310](https://github.com/RequestNetwork/requestNetwork/commit/7134310828f9440bac33f75719c7937872243ab6))
- Payment detection for the any to erc20 payment network ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6f7338f](https://github.com/RequestNetwork/requestNetwork/commit/6f7338f42ddf793a733a31b434d6116beebefdf6))

# 0.34.0 (2021-03-03)

### Features

- payment network any to erc20 smartcontracts ([#408](https://github.com/RequestNetwork/requestNetwork/issues/408)) ([a2f30a8](https://github.com/RequestNetwork/requestNetwork/commit/a2f30a84689eaea0994e72944c417718c7aad20e))

# [0.23.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/smart-contracts@0.21.0...@requestnetwork/smart-contracts@0.23.0) (2021-03-03)

### Features

- payment network any to erc20 smartcontracts ([#408](https://github.com/RequestNetwork/requestNetwork/issues/408)) ([a2f30a8](https://github.com/RequestNetwork/requestNetwork/commit/a2f30a84689eaea0994e72944c417718c7aad20e))

# [0.22.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/smart-contracts@0.21.0...@requestnetwork/smart-contracts@0.22.0) (2021-02-22)

### Features

- payment network any to erc20 smartcontracts ([#408](https://github.com/RequestNetwork/requestNetwork/issues/408)) ([a2f30a8](https://github.com/RequestNetwork/requestNetwork/commit/a2f30a84689eaea0994e72944c417718c7aad20e))

## [0.21.2](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/smart-contracts@0.21.0...@requestnetwork/smart-contracts@0.21.2) (2020-12-22)

**Note:** Version bump only for package @requestnetwork/smart-contracts

## [0.21.1](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/smart-contracts@0.21.0...@requestnetwork/smart-contracts@0.21.1) (2020-12-21)

**Note:** Version bump only for package @requestnetwork/smart-contracts

# 0.21.0 (2020-12-02)

# 0.27.0 (2020-10-21)

### Bug Fixes

- UDST.transfer ([#347](https://github.com/RequestNetwork/requestNetwork/issues/347)) ([acfdb0f](https://github.com/RequestNetwork/requestNetwork/commit/acfdb0f63deeb8219db7d57d8fa140fc39ae3379))

# 0.26.0 (2020-10-14)

### Bug Fixes

- swap methods for partial ERC20 approvals ([#341](https://github.com/RequestNetwork/requestNetwork/issues/341)) ([0ba0449](https://github.com/RequestNetwork/requestNetwork/commit/0ba044908d500a161f09c31636aa32f9d088cbbc))

# 0.25.0 (2020-10-13)

### Features

- payment processor support for swap-to-pay ([#323](https://github.com/RequestNetwork/requestNetwork/issues/323)) ([b1c9b5f](https://github.com/RequestNetwork/requestNetwork/commit/b1c9b5f84ad2d32abe3f2ba4d42adc0f76353e0d))
- swap to pay contract ([#269](https://github.com/RequestNetwork/requestNetwork/issues/269)) ([13968e7](https://github.com/RequestNetwork/requestNetwork/commit/13968e7e5db8f2ace70185d5f81cfb59310ed20b))

# 0.21.0 (2020-09-01)

### Bug Fixes

- revert failed token transfer ([#277](https://github.com/RequestNetwork/requestNetwork/issues/277)) ([7a22e4c](https://github.com/RequestNetwork/requestNetwork/commit/7a22e4cd79ba42d28974ad45d7e843d6fe870e83))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- create ERC20 fees smart contract ([#250](https://github.com/RequestNetwork/requestNetwork/issues/250)) ([d594736](https://github.com/RequestNetwork/requestNetwork/commit/d59473641c8ec1de420587676e4e9f1e93dfa53b))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- support non-standard ERC20 tokens ([#273](https://github.com/RequestNetwork/requestNetwork/issues/273)) ([0366b0d](https://github.com/RequestNetwork/requestNetwork/commit/0366b0dd73bd1f1af9b3bee64cf5476a5b383e3a))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

# 0.13.0 (2020-02-20)

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- custom docker ganache image ([#129](https://github.com/RequestNetwork/requestNetwork/issues/129)) ([9ab725d](https://github.com/RequestNetwork/requestNetwork/commit/9ab725dca826ba82152c9f7e0cedc8038c6a17b1))
- ethereum payment proxy contract ([#135](https://github.com/RequestNetwork/requestNetwork/issues/135)) ([f9bff97](https://github.com/RequestNetwork/requestNetwork/commit/f9bff97fbe47b8b7fc6ff4fe5048ccc260501ab2))

# 0.12.0 (2020-01-16)

### Bug Fixes

- **smart-contracts:** fix json require to work with webpack ([#105](https://github.com/RequestNetwork/requestNetwork/issues/105)) ([a465e83](https://github.com/RequestNetwork/requestNetwork/commit/a465e83a739a7648e71d8ebb4a3a4eb389e00f13))
- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))

### Features

- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))

# 0.20.0 (2020-11-12)

# 0.27.0 (2020-10-21)

### Bug Fixes

- UDST.transfer ([#347](https://github.com/RequestNetwork/requestNetwork/issues/347)) ([acfdb0f](https://github.com/RequestNetwork/requestNetwork/commit/acfdb0f63deeb8219db7d57d8fa140fc39ae3379))

# 0.26.0 (2020-10-14)

### Bug Fixes

- swap methods for partial ERC20 approvals ([#341](https://github.com/RequestNetwork/requestNetwork/issues/341)) ([0ba0449](https://github.com/RequestNetwork/requestNetwork/commit/0ba044908d500a161f09c31636aa32f9d088cbbc))

# 0.25.0 (2020-10-13)

### Features

- payment processor support for swap-to-pay ([#323](https://github.com/RequestNetwork/requestNetwork/issues/323)) ([b1c9b5f](https://github.com/RequestNetwork/requestNetwork/commit/b1c9b5f84ad2d32abe3f2ba4d42adc0f76353e0d))
- swap to pay contract ([#269](https://github.com/RequestNetwork/requestNetwork/issues/269)) ([13968e7](https://github.com/RequestNetwork/requestNetwork/commit/13968e7e5db8f2ace70185d5f81cfb59310ed20b))

# 0.21.0 (2020-09-01)

### Bug Fixes

- revert failed token transfer ([#277](https://github.com/RequestNetwork/requestNetwork/issues/277)) ([7a22e4c](https://github.com/RequestNetwork/requestNetwork/commit/7a22e4cd79ba42d28974ad45d7e843d6fe870e83))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- create ERC20 fees smart contract ([#250](https://github.com/RequestNetwork/requestNetwork/issues/250)) ([d594736](https://github.com/RequestNetwork/requestNetwork/commit/d59473641c8ec1de420587676e4e9f1e93dfa53b))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- support non-standard ERC20 tokens ([#273](https://github.com/RequestNetwork/requestNetwork/issues/273)) ([0366b0d](https://github.com/RequestNetwork/requestNetwork/commit/0366b0dd73bd1f1af9b3bee64cf5476a5b383e3a))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

# 0.13.0 (2020-02-20)

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- custom docker ganache image ([#129](https://github.com/RequestNetwork/requestNetwork/issues/129)) ([9ab725d](https://github.com/RequestNetwork/requestNetwork/commit/9ab725dca826ba82152c9f7e0cedc8038c6a17b1))
- ethereum payment proxy contract ([#135](https://github.com/RequestNetwork/requestNetwork/issues/135)) ([f9bff97](https://github.com/RequestNetwork/requestNetwork/commit/f9bff97fbe47b8b7fc6ff4fe5048ccc260501ab2))

# 0.12.0 (2020-01-16)

### Bug Fixes

- **smart-contracts:** fix json require to work with webpack ([#105](https://github.com/RequestNetwork/requestNetwork/issues/105)) ([a465e83](https://github.com/RequestNetwork/requestNetwork/commit/a465e83a739a7648e71d8ebb4a3a4eb389e00f13))
- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))

### Features

- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))

# 0.19.0 (2020-11-05)

# 0.27.0 (2020-10-21)

### Bug Fixes

- UDST.transfer ([#347](https://github.com/RequestNetwork/requestNetwork/issues/347)) ([acfdb0f](https://github.com/RequestNetwork/requestNetwork/commit/acfdb0f63deeb8219db7d57d8fa140fc39ae3379))

# 0.26.0 (2020-10-14)

### Bug Fixes

- swap methods for partial ERC20 approvals ([#341](https://github.com/RequestNetwork/requestNetwork/issues/341)) ([0ba0449](https://github.com/RequestNetwork/requestNetwork/commit/0ba044908d500a161f09c31636aa32f9d088cbbc))

# 0.25.0 (2020-10-13)

### Features

- payment processor support for swap-to-pay ([#323](https://github.com/RequestNetwork/requestNetwork/issues/323)) ([b1c9b5f](https://github.com/RequestNetwork/requestNetwork/commit/b1c9b5f84ad2d32abe3f2ba4d42adc0f76353e0d))
- swap to pay contract ([#269](https://github.com/RequestNetwork/requestNetwork/issues/269)) ([13968e7](https://github.com/RequestNetwork/requestNetwork/commit/13968e7e5db8f2ace70185d5f81cfb59310ed20b))

# 0.21.0 (2020-09-01)

### Bug Fixes

- revert failed token transfer ([#277](https://github.com/RequestNetwork/requestNetwork/issues/277)) ([7a22e4c](https://github.com/RequestNetwork/requestNetwork/commit/7a22e4cd79ba42d28974ad45d7e843d6fe870e83))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- create ERC20 fees smart contract ([#250](https://github.com/RequestNetwork/requestNetwork/issues/250)) ([d594736](https://github.com/RequestNetwork/requestNetwork/commit/d59473641c8ec1de420587676e4e9f1e93dfa53b))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- support non-standard ERC20 tokens ([#273](https://github.com/RequestNetwork/requestNetwork/issues/273)) ([0366b0d](https://github.com/RequestNetwork/requestNetwork/commit/0366b0dd73bd1f1af9b3bee64cf5476a5b383e3a))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

# 0.13.0 (2020-02-20)

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- custom docker ganache image ([#129](https://github.com/RequestNetwork/requestNetwork/issues/129)) ([9ab725d](https://github.com/RequestNetwork/requestNetwork/commit/9ab725dca826ba82152c9f7e0cedc8038c6a17b1))
- ethereum payment proxy contract ([#135](https://github.com/RequestNetwork/requestNetwork/issues/135)) ([f9bff97](https://github.com/RequestNetwork/requestNetwork/commit/f9bff97fbe47b8b7fc6ff4fe5048ccc260501ab2))

# 0.12.0 (2020-01-16)

### Bug Fixes

- **smart-contracts:** fix json require to work with webpack ([#105](https://github.com/RequestNetwork/requestNetwork/issues/105)) ([a465e83](https://github.com/RequestNetwork/requestNetwork/commit/a465e83a739a7648e71d8ebb4a3a4eb389e00f13))
- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))

### Features

- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))

# 0.18.0 (2020-10-21)

### Bug Fixes

- UDST.transfer ([#347](https://github.com/RequestNetwork/requestNetwork/issues/347)) ([acfdb0f](https://github.com/RequestNetwork/requestNetwork/commit/acfdb0f63deeb8219db7d57d8fa140fc39ae3379))

# 0.26.0 (2020-10-14)

### Bug Fixes

- swap methods for partial ERC20 approvals ([#341](https://github.com/RequestNetwork/requestNetwork/issues/341)) ([0ba0449](https://github.com/RequestNetwork/requestNetwork/commit/0ba044908d500a161f09c31636aa32f9d088cbbc))

# 0.25.0 (2020-10-13)

### Features

- payment processor support for swap-to-pay ([#323](https://github.com/RequestNetwork/requestNetwork/issues/323)) ([b1c9b5f](https://github.com/RequestNetwork/requestNetwork/commit/b1c9b5f84ad2d32abe3f2ba4d42adc0f76353e0d))
- swap to pay contract ([#269](https://github.com/RequestNetwork/requestNetwork/issues/269)) ([13968e7](https://github.com/RequestNetwork/requestNetwork/commit/13968e7e5db8f2ace70185d5f81cfb59310ed20b))

# 0.21.0 (2020-09-01)

### Bug Fixes

- revert failed token transfer ([#277](https://github.com/RequestNetwork/requestNetwork/issues/277)) ([7a22e4c](https://github.com/RequestNetwork/requestNetwork/commit/7a22e4cd79ba42d28974ad45d7e843d6fe870e83))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- create ERC20 fees smart contract ([#250](https://github.com/RequestNetwork/requestNetwork/issues/250)) ([d594736](https://github.com/RequestNetwork/requestNetwork/commit/d59473641c8ec1de420587676e4e9f1e93dfa53b))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- support non-standard ERC20 tokens ([#273](https://github.com/RequestNetwork/requestNetwork/issues/273)) ([0366b0d](https://github.com/RequestNetwork/requestNetwork/commit/0366b0dd73bd1f1af9b3bee64cf5476a5b383e3a))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

# 0.13.0 (2020-02-20)

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- custom docker ganache image ([#129](https://github.com/RequestNetwork/requestNetwork/issues/129)) ([9ab725d](https://github.com/RequestNetwork/requestNetwork/commit/9ab725dca826ba82152c9f7e0cedc8038c6a17b1))
- ethereum payment proxy contract ([#135](https://github.com/RequestNetwork/requestNetwork/issues/135)) ([f9bff97](https://github.com/RequestNetwork/requestNetwork/commit/f9bff97fbe47b8b7fc6ff4fe5048ccc260501ab2))

# 0.12.0 (2020-01-16)

### Bug Fixes

- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))
- **smart-contracts:** fix json require to work with webpack ([#105](https://github.com/RequestNetwork/requestNetwork/issues/105)) ([a465e83](https://github.com/RequestNetwork/requestNetwork/commit/a465e83a739a7648e71d8ebb4a3a4eb389e00f13))

### Features

- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))

# 0.17.0 (2020-10-14)

### Bug Fixes

- swap methods for partial ERC20 approvals ([#341](https://github.com/RequestNetwork/requestNetwork/issues/341)) ([0ba0449](https://github.com/RequestNetwork/requestNetwork/commit/0ba044908d500a161f09c31636aa32f9d088cbbc))

# 0.25.0 (2020-10-13)

### Features

- payment processor support for swap-to-pay ([#323](https://github.com/RequestNetwork/requestNetwork/issues/323)) ([b1c9b5f](https://github.com/RequestNetwork/requestNetwork/commit/b1c9b5f84ad2d32abe3f2ba4d42adc0f76353e0d))
- swap to pay contract ([#269](https://github.com/RequestNetwork/requestNetwork/issues/269)) ([13968e7](https://github.com/RequestNetwork/requestNetwork/commit/13968e7e5db8f2ace70185d5f81cfb59310ed20b))

# 0.21.0 (2020-09-01)

### Bug Fixes

- revert failed token transfer ([#277](https://github.com/RequestNetwork/requestNetwork/issues/277)) ([7a22e4c](https://github.com/RequestNetwork/requestNetwork/commit/7a22e4cd79ba42d28974ad45d7e843d6fe870e83))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- create ERC20 fees smart contract ([#250](https://github.com/RequestNetwork/requestNetwork/issues/250)) ([d594736](https://github.com/RequestNetwork/requestNetwork/commit/d59473641c8ec1de420587676e4e9f1e93dfa53b))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- support non-standard ERC20 tokens ([#273](https://github.com/RequestNetwork/requestNetwork/issues/273)) ([0366b0d](https://github.com/RequestNetwork/requestNetwork/commit/0366b0dd73bd1f1af9b3bee64cf5476a5b383e3a))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

# 0.13.0 (2020-02-20)

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- custom docker ganache image ([#129](https://github.com/RequestNetwork/requestNetwork/issues/129)) ([9ab725d](https://github.com/RequestNetwork/requestNetwork/commit/9ab725dca826ba82152c9f7e0cedc8038c6a17b1))
- ethereum payment proxy contract ([#135](https://github.com/RequestNetwork/requestNetwork/issues/135)) ([f9bff97](https://github.com/RequestNetwork/requestNetwork/commit/f9bff97fbe47b8b7fc6ff4fe5048ccc260501ab2))

# 0.12.0 (2020-01-16)

### Bug Fixes

- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))
- **smart-contracts:** fix json require to work with webpack ([#105](https://github.com/RequestNetwork/requestNetwork/issues/105)) ([a465e83](https://github.com/RequestNetwork/requestNetwork/commit/a465e83a739a7648e71d8ebb4a3a4eb389e00f13))

### Features

- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))

# 0.16.0 (2020-10-13)

### Features

- payment processor support for swap-to-pay ([#323](https://github.com/RequestNetwork/requestNetwork/issues/323)) ([b1c9b5f](https://github.com/RequestNetwork/requestNetwork/commit/b1c9b5f84ad2d32abe3f2ba4d42adc0f76353e0d))
- swap to pay contract ([#269](https://github.com/RequestNetwork/requestNetwork/issues/269)) ([13968e7](https://github.com/RequestNetwork/requestNetwork/commit/13968e7e5db8f2ace70185d5f81cfb59310ed20b))

# 0.21.0 (2020-09-01)

### Bug Fixes

- revert failed token transfer ([#277](https://github.com/RequestNetwork/requestNetwork/issues/277)) ([7a22e4c](https://github.com/RequestNetwork/requestNetwork/commit/7a22e4cd79ba42d28974ad45d7e843d6fe870e83))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- create ERC20 fees smart contract ([#250](https://github.com/RequestNetwork/requestNetwork/issues/250)) ([d594736](https://github.com/RequestNetwork/requestNetwork/commit/d59473641c8ec1de420587676e4e9f1e93dfa53b))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- support non-standard ERC20 tokens ([#273](https://github.com/RequestNetwork/requestNetwork/issues/273)) ([0366b0d](https://github.com/RequestNetwork/requestNetwork/commit/0366b0dd73bd1f1af9b3bee64cf5476a5b383e3a))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

# 0.13.0 (2020-02-20)

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- custom docker ganache image ([#129](https://github.com/RequestNetwork/requestNetwork/issues/129)) ([9ab725d](https://github.com/RequestNetwork/requestNetwork/commit/9ab725dca826ba82152c9f7e0cedc8038c6a17b1))
- ethereum payment proxy contract ([#135](https://github.com/RequestNetwork/requestNetwork/issues/135)) ([f9bff97](https://github.com/RequestNetwork/requestNetwork/commit/f9bff97fbe47b8b7fc6ff4fe5048ccc260501ab2))

# 0.12.0 (2020-01-16)

### Bug Fixes

- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))
- **smart-contracts:** fix json require to work with webpack ([#105](https://github.com/RequestNetwork/requestNetwork/issues/105)) ([a465e83](https://github.com/RequestNetwork/requestNetwork/commit/a465e83a739a7648e71d8ebb4a3a4eb389e00f13))

### Features

- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))

# 0.15.0 (2020-10-09)

### Features

- payment processor support for swap-to-pay ([#323](https://github.com/RequestNetwork/requestNetwork/issues/323)) ([b1c9b5f](https://github.com/RequestNetwork/requestNetwork/commit/b1c9b5f84ad2d32abe3f2ba4d42adc0f76353e0d))
- swap to pay contract ([#269](https://github.com/RequestNetwork/requestNetwork/issues/269)) ([13968e7](https://github.com/RequestNetwork/requestNetwork/commit/13968e7e5db8f2ace70185d5f81cfb59310ed20b))

# 0.21.0 (2020-09-01)

### Bug Fixes

- revert failed token transfer ([#277](https://github.com/RequestNetwork/requestNetwork/issues/277)) ([7a22e4c](https://github.com/RequestNetwork/requestNetwork/commit/7a22e4cd79ba42d28974ad45d7e843d6fe870e83))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- create ERC20 fees smart contract ([#250](https://github.com/RequestNetwork/requestNetwork/issues/250)) ([d594736](https://github.com/RequestNetwork/requestNetwork/commit/d59473641c8ec1de420587676e4e9f1e93dfa53b))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- support non-standard ERC20 tokens ([#273](https://github.com/RequestNetwork/requestNetwork/issues/273)) ([0366b0d](https://github.com/RequestNetwork/requestNetwork/commit/0366b0dd73bd1f1af9b3bee64cf5476a5b383e3a))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

# 0.13.0 (2020-02-20)

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- custom docker ganache image ([#129](https://github.com/RequestNetwork/requestNetwork/issues/129)) ([9ab725d](https://github.com/RequestNetwork/requestNetwork/commit/9ab725dca826ba82152c9f7e0cedc8038c6a17b1))
- ethereum payment proxy contract ([#135](https://github.com/RequestNetwork/requestNetwork/issues/135)) ([f9bff97](https://github.com/RequestNetwork/requestNetwork/commit/f9bff97fbe47b8b7fc6ff4fe5048ccc260501ab2))

# 0.12.0 (2020-01-16)

### Bug Fixes

- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))
- **smart-contracts:** fix json require to work with webpack ([#105](https://github.com/RequestNetwork/requestNetwork/issues/105)) ([a465e83](https://github.com/RequestNetwork/requestNetwork/commit/a465e83a739a7648e71d8ebb4a3a4eb389e00f13))

### Features

- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))

# 0.14.0 (2020-09-28)

# 0.21.0 (2020-09-01)

### Bug Fixes

- revert failed token transfer ([#277](https://github.com/RequestNetwork/requestNetwork/issues/277)) ([7a22e4c](https://github.com/RequestNetwork/requestNetwork/commit/7a22e4cd79ba42d28974ad45d7e843d6fe870e83))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- create ERC20 fees smart contract ([#250](https://github.com/RequestNetwork/requestNetwork/issues/250)) ([d594736](https://github.com/RequestNetwork/requestNetwork/commit/d59473641c8ec1de420587676e4e9f1e93dfa53b))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- support non-standard ERC20 tokens ([#273](https://github.com/RequestNetwork/requestNetwork/issues/273)) ([0366b0d](https://github.com/RequestNetwork/requestNetwork/commit/0366b0dd73bd1f1af9b3bee64cf5476a5b383e3a))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

# 0.13.0 (2020-02-20)

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- custom docker ganache image ([#129](https://github.com/RequestNetwork/requestNetwork/issues/129)) ([9ab725d](https://github.com/RequestNetwork/requestNetwork/commit/9ab725dca826ba82152c9f7e0cedc8038c6a17b1))
- ethereum payment proxy contract ([#135](https://github.com/RequestNetwork/requestNetwork/issues/135)) ([f9bff97](https://github.com/RequestNetwork/requestNetwork/commit/f9bff97fbe47b8b7fc6ff4fe5048ccc260501ab2))

# 0.12.0 (2020-01-16)

### Bug Fixes

- **smart-contracts:** fix json require to work with webpack ([#105](https://github.com/RequestNetwork/requestNetwork/issues/105)) ([a465e83](https://github.com/RequestNetwork/requestNetwork/commit/a465e83a739a7648e71d8ebb4a3a4eb389e00f13))
- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))

### Features

- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))

# 0.13.0 (2020-09-18)

# 0.21.0 (2020-09-01)

### Bug Fixes

- revert failed token transfer ([#277](https://github.com/RequestNetwork/requestNetwork/issues/277)) ([7a22e4c](https://github.com/RequestNetwork/requestNetwork/commit/7a22e4cd79ba42d28974ad45d7e843d6fe870e83))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- create ERC20 fees smart contract ([#250](https://github.com/RequestNetwork/requestNetwork/issues/250)) ([d594736](https://github.com/RequestNetwork/requestNetwork/commit/d59473641c8ec1de420587676e4e9f1e93dfa53b))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- support non-standard ERC20 tokens ([#273](https://github.com/RequestNetwork/requestNetwork/issues/273)) ([0366b0d](https://github.com/RequestNetwork/requestNetwork/commit/0366b0dd73bd1f1af9b3bee64cf5476a5b383e3a))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

# 0.13.0 (2020-02-20)

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- custom docker ganache image ([#129](https://github.com/RequestNetwork/requestNetwork/issues/129)) ([9ab725d](https://github.com/RequestNetwork/requestNetwork/commit/9ab725dca826ba82152c9f7e0cedc8038c6a17b1))
- ethereum payment proxy contract ([#135](https://github.com/RequestNetwork/requestNetwork/issues/135)) ([f9bff97](https://github.com/RequestNetwork/requestNetwork/commit/f9bff97fbe47b8b7fc6ff4fe5048ccc260501ab2))

# 0.12.0 (2020-01-16)

### Bug Fixes

- **smart-contracts:** fix json require to work with webpack ([#105](https://github.com/RequestNetwork/requestNetwork/issues/105)) ([a465e83](https://github.com/RequestNetwork/requestNetwork/commit/a465e83a739a7648e71d8ebb4a3a4eb389e00f13))
- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))

### Features

- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))

# 0.12.0 (2020-09-01)

### Bug Fixes

- revert failed token transfer ([#277](https://github.com/RequestNetwork/requestNetwork/issues/277)) ([7a22e4c](https://github.com/RequestNetwork/requestNetwork/commit/7a22e4cd79ba42d28974ad45d7e843d6fe870e83))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- create ERC20 fees smart contract ([#250](https://github.com/RequestNetwork/requestNetwork/issues/250)) ([d594736](https://github.com/RequestNetwork/requestNetwork/commit/d59473641c8ec1de420587676e4e9f1e93dfa53b))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- support non-standard ERC20 tokens ([#273](https://github.com/RequestNetwork/requestNetwork/issues/273)) ([0366b0d](https://github.com/RequestNetwork/requestNetwork/commit/0366b0dd73bd1f1af9b3bee64cf5476a5b383e3a))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

# 0.13.0 (2020-02-20)

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- custom docker ganache image ([#129](https://github.com/RequestNetwork/requestNetwork/issues/129)) ([9ab725d](https://github.com/RequestNetwork/requestNetwork/commit/9ab725dca826ba82152c9f7e0cedc8038c6a17b1))
- ethereum payment proxy contract ([#135](https://github.com/RequestNetwork/requestNetwork/issues/135)) ([f9bff97](https://github.com/RequestNetwork/requestNetwork/commit/f9bff97fbe47b8b7fc6ff4fe5048ccc260501ab2))

# 0.12.0 (2020-01-16)

### Bug Fixes

- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))
- **smart-contracts:** fix json require to work with webpack ([#105](https://github.com/RequestNetwork/requestNetwork/issues/105)) ([a465e83](https://github.com/RequestNetwork/requestNetwork/commit/a465e83a739a7648e71d8ebb4a3a4eb389e00f13))

### Features

- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))

# 0.11.0 (2020-08-27)

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- create ERC20 fees smart contract ([#250](https://github.com/RequestNetwork/requestNetwork/issues/250)) ([d594736](https://github.com/RequestNetwork/requestNetwork/commit/d59473641c8ec1de420587676e4e9f1e93dfa53b))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- support non-standard ERC20 tokens ([#273](https://github.com/RequestNetwork/requestNetwork/issues/273)) ([0366b0d](https://github.com/RequestNetwork/requestNetwork/commit/0366b0dd73bd1f1af9b3bee64cf5476a5b383e3a))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

# 0.13.0 (2020-02-20)

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- custom docker ganache image ([#129](https://github.com/RequestNetwork/requestNetwork/issues/129)) ([9ab725d](https://github.com/RequestNetwork/requestNetwork/commit/9ab725dca826ba82152c9f7e0cedc8038c6a17b1))
- ethereum payment proxy contract ([#135](https://github.com/RequestNetwork/requestNetwork/issues/135)) ([f9bff97](https://github.com/RequestNetwork/requestNetwork/commit/f9bff97fbe47b8b7fc6ff4fe5048ccc260501ab2))

# 0.12.0 (2020-01-16)

### Bug Fixes

- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))
- **smart-contracts:** fix json require to work with webpack ([#105](https://github.com/RequestNetwork/requestNetwork/issues/105)) ([a465e83](https://github.com/RequestNetwork/requestNetwork/commit/a465e83a739a7648e71d8ebb4a3a4eb389e00f13))

### Features

- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))

# 0.10.0 (2020-08-13)

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- create ERC20 fees smart contract ([#250](https://github.com/RequestNetwork/requestNetwork/issues/250)) ([d594736](https://github.com/RequestNetwork/requestNetwork/commit/d59473641c8ec1de420587676e4e9f1e93dfa53b))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

# 0.13.0 (2020-02-20)

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- custom docker ganache image ([#129](https://github.com/RequestNetwork/requestNetwork/issues/129)) ([9ab725d](https://github.com/RequestNetwork/requestNetwork/commit/9ab725dca826ba82152c9f7e0cedc8038c6a17b1))
- ethereum payment proxy contract ([#135](https://github.com/RequestNetwork/requestNetwork/issues/135)) ([f9bff97](https://github.com/RequestNetwork/requestNetwork/commit/f9bff97fbe47b8b7fc6ff4fe5048ccc260501ab2))

# 0.12.0 (2020-01-16)

### Bug Fixes

- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))
- **smart-contracts:** fix json require to work with webpack ([#105](https://github.com/RequestNetwork/requestNetwork/issues/105)) ([a465e83](https://github.com/RequestNetwork/requestNetwork/commit/a465e83a739a7648e71d8ebb4a3a4eb389e00f13))

### Features

- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))

# 0.9.0 (2020-06-29)

### Features

- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

# 0.13.0 (2020-02-20)

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- custom docker ganache image ([#129](https://github.com/RequestNetwork/requestNetwork/issues/129)) ([9ab725d](https://github.com/RequestNetwork/requestNetwork/commit/9ab725dca826ba82152c9f7e0cedc8038c6a17b1))
- ethereum payment proxy contract ([#135](https://github.com/RequestNetwork/requestNetwork/issues/135)) ([f9bff97](https://github.com/RequestNetwork/requestNetwork/commit/f9bff97fbe47b8b7fc6ff4fe5048ccc260501ab2))

# 0.12.0 (2020-01-16)

### Bug Fixes

- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))
- **smart-contracts:** fix json require to work with webpack ([#105](https://github.com/RequestNetwork/requestNetwork/issues/105)) ([a465e83](https://github.com/RequestNetwork/requestNetwork/commit/a465e83a739a7648e71d8ebb4a3a4eb389e00f13))

### Features

- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))

# 0.8.0 (2020-05-04)

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

# 0.13.0 (2020-02-20)

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- custom docker ganache image ([#129](https://github.com/RequestNetwork/requestNetwork/issues/129)) ([9ab725d](https://github.com/RequestNetwork/requestNetwork/commit/9ab725dca826ba82152c9f7e0cedc8038c6a17b1))
- ethereum payment proxy contract ([#135](https://github.com/RequestNetwork/requestNetwork/issues/135)) ([f9bff97](https://github.com/RequestNetwork/requestNetwork/commit/f9bff97fbe47b8b7fc6ff4fe5048ccc260501ab2))

# 0.12.0 (2020-01-16)

### Bug Fixes

- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))
- **smart-contracts:** fix json require to work with webpack ([#105](https://github.com/RequestNetwork/requestNetwork/issues/105)) ([a465e83](https://github.com/RequestNetwork/requestNetwork/commit/a465e83a739a7648e71d8ebb4a3a4eb389e00f13))

### Features

- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))

# 0.7.0 (2020-04-21)

# 0.15.0 (2020-04-06)

# 0.13.0 (2020-02-20)

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- custom docker ganache image ([#129](https://github.com/RequestNetwork/requestNetwork/issues/129)) ([9ab725d](https://github.com/RequestNetwork/requestNetwork/commit/9ab725dca826ba82152c9f7e0cedc8038c6a17b1))
- ethereum payment proxy contract ([#135](https://github.com/RequestNetwork/requestNetwork/issues/135)) ([f9bff97](https://github.com/RequestNetwork/requestNetwork/commit/f9bff97fbe47b8b7fc6ff4fe5048ccc260501ab2))

# 0.12.0 (2020-01-16)

### Bug Fixes

- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))
- **smart-contracts:** fix json require to work with webpack ([#105](https://github.com/RequestNetwork/requestNetwork/issues/105)) ([a465e83](https://github.com/RequestNetwork/requestNetwork/commit/a465e83a739a7648e71d8ebb4a3a4eb389e00f13))

### Features

- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))

# 0.6.0 (2020-04-06)

# 0.13.0 (2020-02-20)

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- custom docker ganache image ([#129](https://github.com/RequestNetwork/requestNetwork/issues/129)) ([9ab725d](https://github.com/RequestNetwork/requestNetwork/commit/9ab725dca826ba82152c9f7e0cedc8038c6a17b1))
- ethereum payment proxy contract ([#135](https://github.com/RequestNetwork/requestNetwork/issues/135)) ([f9bff97](https://github.com/RequestNetwork/requestNetwork/commit/f9bff97fbe47b8b7fc6ff4fe5048ccc260501ab2))

# 0.12.0 (2020-01-16)

### Bug Fixes

- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))
- **smart-contracts:** fix json require to work with webpack ([#105](https://github.com/RequestNetwork/requestNetwork/issues/105)) ([a465e83](https://github.com/RequestNetwork/requestNetwork/commit/a465e83a739a7648e71d8ebb4a3a4eb389e00f13))

### Features

- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))

# 0.5.0 (2020-03-23)

# 0.13.0 (2020-02-20)

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- custom docker ganache image ([#129](https://github.com/RequestNetwork/requestNetwork/issues/129)) ([9ab725d](https://github.com/RequestNetwork/requestNetwork/commit/9ab725dca826ba82152c9f7e0cedc8038c6a17b1))
- ethereum payment proxy contract ([#135](https://github.com/RequestNetwork/requestNetwork/issues/135)) ([f9bff97](https://github.com/RequestNetwork/requestNetwork/commit/f9bff97fbe47b8b7fc6ff4fe5048ccc260501ab2))

# 0.12.0 (2020-01-16)

### Bug Fixes

- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))
- **smart-contracts:** fix json require to work with webpack ([#105](https://github.com/RequestNetwork/requestNetwork/issues/105)) ([a465e83](https://github.com/RequestNetwork/requestNetwork/commit/a465e83a739a7648e71d8ebb4a3a4eb389e00f13))

### Features

- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))

# 0.4.0 (2020-02-20)

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- custom docker ganache image ([#129](https://github.com/RequestNetwork/requestNetwork/issues/129)) ([9ab725d](https://github.com/RequestNetwork/requestNetwork/commit/9ab725dca826ba82152c9f7e0cedc8038c6a17b1))
- ethereum payment proxy contract ([#135](https://github.com/RequestNetwork/requestNetwork/issues/135)) ([f9bff97](https://github.com/RequestNetwork/requestNetwork/commit/f9bff97fbe47b8b7fc6ff4fe5048ccc260501ab2))

# 0.12.0 (2020-01-16)

### Bug Fixes

- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))
- **smart-contracts:** fix json require to work with webpack ([#105](https://github.com/RequestNetwork/requestNetwork/issues/105)) ([a465e83](https://github.com/RequestNetwork/requestNetwork/commit/a465e83a739a7648e71d8ebb4a3a4eb389e00f13))

### Features

- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))

# 0.3.0 (2020-01-16)

### Bug Fixes

- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))
- **smart-contracts:** fix json require to work with webpack ([#105](https://github.com/RequestNetwork/requestNetwork/issues/105)) ([a465e83](https://github.com/RequestNetwork/requestNetwork/commit/a465e83a739a7648e71d8ebb4a3a4eb389e00f13))

### Features

- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))

# 0.2.0 (2019-12-18)

### Bug Fixes

- add payable to the ERC20 proxy contract fallback ([#96](https://github.com/RequestNetwork/requestNetwork/issues/96)) ([1237b64](https://github.com/RequestNetwork/requestNetwork/commit/1237b6431f3d6e141e3bae1690ac59c553ed49f2))

### Features

- deploy ERC20 proxy smart contract to mainnet ([#97](https://github.com/RequestNetwork/requestNetwork/issues/97)) ([84a7d2a](https://github.com/RequestNetwork/requestNetwork/commit/84a7d2ae9c06a3c6e457c8583e44e8df01676b2a))
- deploy ERC20 proxy smart contract to Rinkeby ([#95](https://github.com/RequestNetwork/requestNetwork/issues/95)) ([39e6a6a](https://github.com/RequestNetwork/requestNetwork/commit/39e6a6a0ea62fd4ee9e6343d03770711638b698b))
- **request-client.js:** get balance from request ERC20 with proxy contract ([#94](https://github.com/RequestNetwork/requestNetwork/issues/94)) ([08758ae](https://github.com/RequestNetwork/requestNetwork/commit/08758ae83e3834db06c0f1441e51bc6c2b897669))
- **smart-contracts:** add the erc20 proxy contract PN's smart contract ([#92](https://github.com/RequestNetwork/requestNetwork/issues/92)) ([30f7937](https://github.com/RequestNetwork/requestNetwork/commit/30f79374a78f1a060a91bc7e53e6dc44c2fbad2c))
