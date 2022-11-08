# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.38.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-processor@0.30.0...@requestnetwork/payment-processor@0.38.0) (2022-11-04)

### Bug Fixes

- NEAR Conversion version and processor ([#935](https://github.com/RequestNetwork/requestNetwork/issues/935)) ([f063864](https://github.com/RequestNetwork/requestNetwork/commit/f063864c62cb4ab79ce097a26f7c061674e36cac))
- **payment-processor:** add reset approvals to run twice tests ([#894](https://github.com/RequestNetwork/requestNetwork/issues/894)) ([2f1a9ec](https://github.com/RequestNetwork/requestNetwork/commit/2f1a9ec7d7cfd09c782649e426cf96b6ec0c6d03))
- **payment-processor:** missing NEAR conversion import ([#934](https://github.com/RequestNetwork/requestNetwork/issues/934)) ([8180cd2](https://github.com/RequestNetwork/requestNetwork/commit/8180cd296390a1c9f01980b086aad3c2a2a05d38))
- **payment-processor:** within tests - revoke some approvals and use equalTo instead of eq ([#907](https://github.com/RequestNetwork/requestNetwork/issues/907)) ([9a69bce](https://github.com/RequestNetwork/requestNetwork/commit/9a69bcec38b52e57f4986a2f80831a77ba878e71))
- Add prefix in userData ([#846](https://github.com/RequestNetwork/requestNetwork/issues/846)) ([520d348](https://github.com/RequestNetwork/requestNetwork/commit/520d3487278f811fdc65267d3c9320413b69d2fb))
- Add Signer as provider for the erc20 approval ([#406](https://github.com/RequestNetwork/requestNetwork/issues/406)) ([28708ac](https://github.com/RequestNetwork/requestNetwork/commit/28708ac3adb0e1db2032a53649db936d8b24799c))
- amount padding for conversion of crypto amounts ([#527](https://github.com/RequestNetwork/requestNetwork/issues/527)) ([439e345](https://github.com/RequestNetwork/requestNetwork/commit/439e3450da8d6bbd76192b4af68b5a00c27fb7e6))
- don't check ETH solvency for a Gnosis provider ([#590](https://github.com/RequestNetwork/requestNetwork/issues/590)) ([8607627](https://github.com/RequestNetwork/requestNetwork/commit/8607627fabbf55543c178e5fda68bfa43abc3580))
- ETH mainnet hash on any chain for conversion ([#741](https://github.com/RequestNetwork/requestNetwork/issues/741)) ([6938754](https://github.com/RequestNetwork/requestNetwork/commit/6938754e5fc175ddf3914250422ee7879c2374b8))
- invoice total types + upgrade ethers ([#514](https://github.com/RequestNetwork/requestNetwork/issues/514)) ([c2b98b2](https://github.com/RequestNetwork/requestNetwork/commit/c2b98b2bd3c93f063f340d58c6b95ad026fd9519))
- Near processing and detection ([#578](https://github.com/RequestNetwork/requestNetwork/issues/578)) ([27362f0](https://github.com/RequestNetwork/requestNetwork/commit/27362f06970005aefd226b785a358a3afc153c37))
- revert eth mainnet for conversion ([#747](https://github.com/RequestNetwork/requestNetwork/issues/747)) ([0895f8f](https://github.com/RequestNetwork/requestNetwork/commit/0895f8f0e7bbd17a361b70abd2b84ab41fc59ffa))
- swap to conversion ([#826](https://github.com/RequestNetwork/requestNetwork/issues/826)) ([cdb4b99](https://github.com/RequestNetwork/requestNetwork/commit/cdb4b999a059c86e5b9ff59d144fb7236060460a))
- the currency checks should ignore the case ([#526](https://github.com/RequestNetwork/requestNetwork/issues/526)) ([9462683](https://github.com/RequestNetwork/requestNetwork/commit/9462683f7900821fd58b4ee9e738b95b65c22687))
- typescript lint for test files ([#778](https://github.com/RequestNetwork/requestNetwork/issues/778)) ([048e876](https://github.com/RequestNetwork/requestNetwork/commit/048e876a905516be0de8a31d446e4572eb74eccb))
- unpad amounts from chainlink in payment-detection ([#529](https://github.com/RequestNetwork/requestNetwork/issues/529)) ([d67027f](https://github.com/RequestNetwork/requestNetwork/commit/d67027ff4590b5f1369257ebdce78b6a1296ee9b))
- updated Near payment detection + gas increase ([#589](https://github.com/RequestNetwork/requestNetwork/issues/589)) ([1ae8468](https://github.com/RequestNetwork/requestNetwork/commit/1ae8468104aa316b7072e73dafd8e4bd382487c8))
- upgrade ethers to 5.2.0 ([#532](https://github.com/RequestNetwork/requestNetwork/issues/532)) ([6c7cf35](https://github.com/RequestNetwork/requestNetwork/commit/6c7cf350a04e280b77ce6fd758b6f065f28fd1cc))
- use ICurrency import from request-logic-types instead of dist ([#435](https://github.com/RequestNetwork/requestNetwork/issues/435)) ([1e050ec](https://github.com/RequestNetwork/requestNetwork/commit/1e050ecae39e2bbc92d413d21d19dc252d98da97))
- use proxy address based on pn version ([#556](https://github.com/RequestNetwork/requestNetwork/issues/556)) ([c978849](https://github.com/RequestNetwork/requestNetwork/commit/c978849edebefcab90028a39c1712a3fc591beaa))

### Features

- add cancel stream function ([#884](https://github.com/RequestNetwork/requestNetwork/issues/884)) ([37ba397](https://github.com/RequestNetwork/requestNetwork/commit/37ba397037992d6031949b824d5e9e1be202798c))
- Add payment-processor for any to erc20 payment network ([#433](https://github.com/RequestNetwork/requestNetwork/issues/433)) ([7134310](https://github.com/RequestNetwork/requestNetwork/commit/7134310828f9440bac33f75719c7937872243ab6))
- add prepare and encode functions for SuperFluid ([#896](https://github.com/RequestNetwork/requestNetwork/issues/896)) ([895c498](https://github.com/RequestNetwork/requestNetwork/commit/895c49806a811d8ca3c720d523e5090e62e28128))
- always return approval and payment transactions ([#911](https://github.com/RequestNetwork/requestNetwork/issues/911)) ([f0b1087](https://github.com/RequestNetwork/requestNetwork/commit/f0b10878d218925a7ae32eb7511b2a17ced12adf))
- approval amount for escrow ([#973](https://github.com/RequestNetwork/requestNetwork/issues/973)) ([d08158c](https://github.com/RequestNetwork/requestNetwork/commit/d08158c86588ccbf7c840387fe7abc970777502f))
- Currency Manager ([#571](https://github.com/RequestNetwork/requestNetwork/issues/571)) ([3a68ad3](https://github.com/RequestNetwork/requestNetwork/commit/3a68ad31fc049e13f0f6dac4759b08c06b33416b))
- currencyManager manages conversion paths ([#699](https://github.com/RequestNetwork/requestNetwork/issues/699)) ([7f6e1d1](https://github.com/RequestNetwork/requestNetwork/commit/7f6e1d1a6a06e5666ad7c784e5ab14a7b6f400a1))
- defaultProvider ([#497](https://github.com/RequestNetwork/requestNetwork/issues/497)) ([96e9486](https://github.com/RequestNetwork/requestNetwork/commit/96e94866a888b621001f56299b8484f576622ad5))
- enable specific approval amount ([#953](https://github.com/RequestNetwork/requestNetwork/issues/953)) ([3de8a78](https://github.com/RequestNetwork/requestNetwork/commit/3de8a782f0487b7bda792c13b2cb160807d4b7aa))
- Erc20 escrow payment processor (complete w/tests). ([#693](https://github.com/RequestNetwork/requestNetwork/issues/693)) ([328debd](https://github.com/RequestNetwork/requestNetwork/commit/328debd11e6035db117b17af1dd1c0b0db531178))
- erc777 balance computation ([#918](https://github.com/RequestNetwork/requestNetwork/issues/918)) ([a9b91c9](https://github.com/RequestNetwork/requestNetwork/commit/a9b91c9a40ef6f96c7f554eab833ef34790c1311))
- erc777 helpers ([#944](https://github.com/RequestNetwork/requestNetwork/issues/944)) ([e25862d](https://github.com/RequestNetwork/requestNetwork/commit/e25862dcac822cf7e8d03b02ba4b4b97b90a6653))
- escrow detector class ([#773](https://github.com/RequestNetwork/requestNetwork/issues/773)) ([c4c2276](https://github.com/RequestNetwork/requestNetwork/commit/c4c22765df68a6438e4a0e9bc3d6255e844da791))
- eth-input-data optional proxy ([#738](https://github.com/RequestNetwork/requestNetwork/issues/738)) ([2353d36](https://github.com/RequestNetwork/requestNetwork/commit/2353d361c96524bcf2e2b456877756c3a214026a))
- ethereum fee proxy smart contract ([#583](https://github.com/RequestNetwork/requestNetwork/issues/583)) ([99eb560](https://github.com/RequestNetwork/requestNetwork/commit/99eb560a231370e09fee55b72221914fa2e31591))
- flexible escrow contract ([#825](https://github.com/RequestNetwork/requestNetwork/issues/825)) ([c80b48f](https://github.com/RequestNetwork/requestNetwork/commit/c80b48fcbc99605b2054a352feb21dc028d0c604))
- near conversion payment processor ([#921](https://github.com/RequestNetwork/requestNetwork/issues/921)) ([af836c2](https://github.com/RequestNetwork/requestNetwork/commit/af836c29405adbeb994af24e324e83b57a07997f))
- Near detection with autobahn ([#576](https://github.com/RequestNetwork/requestNetwork/issues/576)) ([86e0145](https://github.com/RequestNetwork/requestNetwork/commit/86e01459a6b32dacfa778434226f374f7668786c))
- payment processing for ethereum fee proxy ([#587](https://github.com/RequestNetwork/requestNetwork/issues/587)) ([2b1c04c](https://github.com/RequestNetwork/requestNetwork/commit/2b1c04c112b732431fdfd342da8c60f233ef0819))
- start SF payments processing ([#821](https://github.com/RequestNetwork/requestNetwork/issues/821)) ([53e5879](https://github.com/RequestNetwork/requestNetwork/commit/53e587916e336057935c3d54655de0dc539a59a3))
- superfluid one off payment processor ([#968](https://github.com/RequestNetwork/requestNetwork/issues/968)) ([3893007](https://github.com/RequestNetwork/requestNetwork/commit/38930072d37ab7c151db8a799096f5a2795dfa14))
- **payment-processor:** batch conversion - erc20 ([#903](https://github.com/RequestNetwork/requestNetwork/issues/903)) ([715bfd6](https://github.com/RequestNetwork/requestNetwork/commit/715bfd605fa002c47b9769493727a98fd5413cd3)), closes [#880](https://github.com/RequestNetwork/requestNetwork/issues/880) [#878](https://github.com/RequestNetwork/requestNetwork/issues/878) [#873](https://github.com/RequestNetwork/requestNetwork/issues/873) [#884](https://github.com/RequestNetwork/requestNetwork/issues/884) [#888](https://github.com/RequestNetwork/requestNetwork/issues/888) [#878](https://github.com/RequestNetwork/requestNetwork/issues/878) [#873](https://github.com/RequestNetwork/requestNetwork/issues/873) [#884](https://github.com/RequestNetwork/requestNetwork/issues/884) [#888](https://github.com/RequestNetwork/requestNetwork/issues/888) [#890](https://github.com/RequestNetwork/requestNetwork/issues/890) [#886](https://github.com/RequestNetwork/requestNetwork/issues/886) [#892](https://github.com/RequestNetwork/requestNetwork/issues/892) [#893](https://github.com/RequestNetwork/requestNetwork/issues/893) [#895](https://github.com/RequestNetwork/requestNetwork/issues/895)
- **smart-contracts:** batch conversion ([#877](https://github.com/RequestNetwork/requestNetwork/issues/877)) ([2000058](https://github.com/RequestNetwork/requestNetwork/commit/20000587318107e97742688f69ba561868e39f8f))
- escrow deployment info ([#847](https://github.com/RequestNetwork/requestNetwork/issues/847)) ([aea1187](https://github.com/RequestNetwork/requestNetwork/commit/aea1187bf8ef62d88d9c7c5838f8848e75114a99))
- goerli payment ([#892](https://github.com/RequestNetwork/requestNetwork/issues/892)) ([2495d00](https://github.com/RequestNetwork/requestNetwork/commit/2495d00ba7edd32b5aeba4bca3d555e910e00941))
- payment detection for ethereum fee proxy ([#585](https://github.com/RequestNetwork/requestNetwork/issues/585)) ([c78803f](https://github.com/RequestNetwork/requestNetwork/commit/c78803fb1333917b843db935df0114a50e294f5f))
- payment network any to erc20 smartcontracts ([#408](https://github.com/RequestNetwork/requestNetwork/issues/408)) ([a2f30a8](https://github.com/RequestNetwork/requestNetwork/commit/a2f30a84689eaea0994e72944c417718c7aad20e))
- payment reference utils ([#906](https://github.com/RequestNetwork/requestNetwork/issues/906)) ([f0ee19f](https://github.com/RequestNetwork/requestNetwork/commit/f0ee19f1fc9b2fd2ae36bc2c8d4305fade06771b))
- **payment-processor:** Batch p processor ([#823](https://github.com/RequestNetwork/requestNetwork/issues/823)) ([eaca7f8](https://github.com/RequestNetwork/requestNetwork/commit/eaca7f8269de2f0a32faa8506cbe8f4d6b61a850))
- **smart-contracts:** batch smart contract no delegatecall ([#830](https://github.com/RequestNetwork/requestNetwork/issues/830)) ([3cfa885](https://github.com/RequestNetwork/requestNetwork/commit/3cfa885efdcaf8f04888f7f6067409ee978cb585))
- Payment network any-to-eth in the payment processor ([#610](https://github.com/RequestNetwork/requestNetwork/issues/610)) ([a7c12ac](https://github.com/RequestNetwork/requestNetwork/commit/a7c12ac3c28dd6b4f144f10bad1223ed5c48d02e))
- pn to smart-contract version mapping ([#649](https://github.com/RequestNetwork/requestNetwork/issues/649)) ([d45ab85](https://github.com/RequestNetwork/requestNetwork/commit/d45ab85c2c47b8d7325fef78965ad94272250598))
- process near payments ([#565](https://github.com/RequestNetwork/requestNetwork/issues/565)) ([82c485b](https://github.com/RequestNetwork/requestNetwork/commit/82c485b01240d0be05d46e1488c0cf917e57cd20))
- SAND aggregator support for conversion ([#487](https://github.com/RequestNetwork/requestNetwork/issues/487)) ([46cbe1b](https://github.com/RequestNetwork/requestNetwork/commit/46cbe1bef7b703addb34d7f1d810fea4ff233f5b))
- transaction encoding ([#786](https://github.com/RequestNetwork/requestNetwork/issues/786)) ([2b68bd6](https://github.com/RequestNetwork/requestNetwork/commit/2b68bd68b6baf0f36405c0e89a60fcdcdf65c3e2))
- upgrade near references to 0.2.0 ([#580](https://github.com/RequestNetwork/requestNetwork/issues/580)) ([2f0507d](https://github.com/RequestNetwork/requestNetwork/commit/2f0507df3d98b2ee9e15d21818b0ac639ee4cca3))

# [0.37.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-processor@0.30.0...@requestnetwork/payment-processor@0.37.0) (2021-06-22)

### Bug Fixes

- Add Signer as provider for the erc20 approval ([#406](https://github.com/RequestNetwork/requestNetwork/issues/406)) ([28708ac](https://github.com/RequestNetwork/requestNetwork/commit/28708ac3adb0e1db2032a53649db936d8b24799c))
- invoice total types + upgrade ethers ([#514](https://github.com/RequestNetwork/requestNetwork/issues/514)) ([c2b98b2](https://github.com/RequestNetwork/requestNetwork/commit/c2b98b2bd3c93f063f340d58c6b95ad026fd9519))
- use ICurrency import from request-logic-types instead of dist ([#435](https://github.com/RequestNetwork/requestNetwork/issues/435)) ([1e050ec](https://github.com/RequestNetwork/requestNetwork/commit/1e050ecae39e2bbc92d413d21d19dc252d98da97))

### Features

- Add payment-processor for any to erc20 payment network ([#433](https://github.com/RequestNetwork/requestNetwork/issues/433)) ([7134310](https://github.com/RequestNetwork/requestNetwork/commit/7134310828f9440bac33f75719c7937872243ab6))
- defaultProvider ([#497](https://github.com/RequestNetwork/requestNetwork/issues/497)) ([96e9486](https://github.com/RequestNetwork/requestNetwork/commit/96e94866a888b621001f56299b8484f576622ad5))
- payment network any to erc20 smartcontracts ([#408](https://github.com/RequestNetwork/requestNetwork/issues/408)) ([a2f30a8](https://github.com/RequestNetwork/requestNetwork/commit/a2f30a84689eaea0994e72944c417718c7aad20e))
- SAND aggregator support for conversion ([#487](https://github.com/RequestNetwork/requestNetwork/issues/487)) ([46cbe1b](https://github.com/RequestNetwork/requestNetwork/commit/46cbe1bef7b703addb34d7f1d810fea4ff233f5b))

# [0.36.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-processor@0.30.0...@requestnetwork/payment-processor@0.36.0) (2021-05-12)

### Bug Fixes

- Add Signer as provider for the erc20 approval ([#406](https://github.com/RequestNetwork/requestNetwork/issues/406)) ([28708ac](https://github.com/RequestNetwork/requestNetwork/commit/28708ac3adb0e1db2032a53649db936d8b24799c))
- use ICurrency import from request-logic-types instead of dist ([#435](https://github.com/RequestNetwork/requestNetwork/issues/435)) ([1e050ec](https://github.com/RequestNetwork/requestNetwork/commit/1e050ecae39e2bbc92d413d21d19dc252d98da97))

### Features

- Add payment-processor for any to erc20 payment network ([#433](https://github.com/RequestNetwork/requestNetwork/issues/433)) ([7134310](https://github.com/RequestNetwork/requestNetwork/commit/7134310828f9440bac33f75719c7937872243ab6))
- defaultProvider ([#497](https://github.com/RequestNetwork/requestNetwork/issues/497)) ([96e9486](https://github.com/RequestNetwork/requestNetwork/commit/96e94866a888b621001f56299b8484f576622ad5))
- payment network any to erc20 smartcontracts ([#408](https://github.com/RequestNetwork/requestNetwork/issues/408)) ([a2f30a8](https://github.com/RequestNetwork/requestNetwork/commit/a2f30a84689eaea0994e72944c417718c7aad20e))
- SAND aggregator support for conversion ([#487](https://github.com/RequestNetwork/requestNetwork/issues/487)) ([46cbe1b](https://github.com/RequestNetwork/requestNetwork/commit/46cbe1bef7b703addb34d7f1d810fea4ff233f5b))

# [0.35.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-processor@0.30.0...@requestnetwork/payment-processor@0.35.0) (2021-04-19)

### Bug Fixes

- Add Signer as provider for the erc20 approval ([#406](https://github.com/RequestNetwork/requestNetwork/issues/406)) ([28708ac](https://github.com/RequestNetwork/requestNetwork/commit/28708ac3adb0e1db2032a53649db936d8b24799c))
- use ICurrency import from request-logic-types instead of dist ([#435](https://github.com/RequestNetwork/requestNetwork/issues/435)) ([1e050ec](https://github.com/RequestNetwork/requestNetwork/commit/1e050ecae39e2bbc92d413d21d19dc252d98da97))

### Features

- Add payment-processor for any to erc20 payment network ([#433](https://github.com/RequestNetwork/requestNetwork/issues/433)) ([7134310](https://github.com/RequestNetwork/requestNetwork/commit/7134310828f9440bac33f75719c7937872243ab6))
- payment network any to erc20 smartcontracts ([#408](https://github.com/RequestNetwork/requestNetwork/issues/408)) ([a2f30a8](https://github.com/RequestNetwork/requestNetwork/commit/a2f30a84689eaea0994e72944c417718c7aad20e))
- SAND aggregator support for conversion ([#487](https://github.com/RequestNetwork/requestNetwork/issues/487)) ([46cbe1b](https://github.com/RequestNetwork/requestNetwork/commit/46cbe1bef7b703addb34d7f1d810fea4ff233f5b))

# [0.34.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-processor@0.30.0...@requestnetwork/payment-processor@0.34.0) (2021-03-25)

### Bug Fixes

- Add Signer as provider for the erc20 approval ([#406](https://github.com/RequestNetwork/requestNetwork/issues/406)) ([28708ac](https://github.com/RequestNetwork/requestNetwork/commit/28708ac3adb0e1db2032a53649db936d8b24799c))
- use ICurrency import from request-logic-types instead of dist ([#435](https://github.com/RequestNetwork/requestNetwork/issues/435)) ([1e050ec](https://github.com/RequestNetwork/requestNetwork/commit/1e050ecae39e2bbc92d413d21d19dc252d98da97))

### Features

- Add payment-processor for any to erc20 payment network ([#433](https://github.com/RequestNetwork/requestNetwork/issues/433)) ([7134310](https://github.com/RequestNetwork/requestNetwork/commit/7134310828f9440bac33f75719c7937872243ab6))
- payment network any to erc20 smartcontracts ([#408](https://github.com/RequestNetwork/requestNetwork/issues/408)) ([a2f30a8](https://github.com/RequestNetwork/requestNetwork/commit/a2f30a84689eaea0994e72944c417718c7aad20e))

# [0.33.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-processor@0.30.0...@requestnetwork/payment-processor@0.33.0) (2021-03-15)

### Bug Fixes

- Add Signer as provider for the erc20 approval ([#406](https://github.com/RequestNetwork/requestNetwork/issues/406)) ([28708ac](https://github.com/RequestNetwork/requestNetwork/commit/28708ac3adb0e1db2032a53649db936d8b24799c))
- use ICurrency import from request-logic-types instead of dist ([#435](https://github.com/RequestNetwork/requestNetwork/issues/435)) ([1e050ec](https://github.com/RequestNetwork/requestNetwork/commit/1e050ecae39e2bbc92d413d21d19dc252d98da97))

### Features

- Add payment-processor for any to erc20 payment network ([#433](https://github.com/RequestNetwork/requestNetwork/issues/433)) ([7134310](https://github.com/RequestNetwork/requestNetwork/commit/7134310828f9440bac33f75719c7937872243ab6))
- payment network any to erc20 smartcontracts ([#408](https://github.com/RequestNetwork/requestNetwork/issues/408)) ([a2f30a8](https://github.com/RequestNetwork/requestNetwork/commit/a2f30a84689eaea0994e72944c417718c7aad20e))

# [0.32.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-processor@0.30.0...@requestnetwork/payment-processor@0.32.0) (2021-03-03)

### Bug Fixes

- Add Signer as provider for the erc20 approval ([#406](https://github.com/RequestNetwork/requestNetwork/issues/406)) ([28708ac](https://github.com/RequestNetwork/requestNetwork/commit/28708ac3adb0e1db2032a53649db936d8b24799c))

### Features

- payment network any to erc20 smartcontracts ([#408](https://github.com/RequestNetwork/requestNetwork/issues/408)) ([a2f30a8](https://github.com/RequestNetwork/requestNetwork/commit/a2f30a84689eaea0994e72944c417718c7aad20e))

# [0.31.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-processor@0.30.0...@requestnetwork/payment-processor@0.31.0) (2021-02-22)

### Bug Fixes

- Add Signer as provider for the erc20 approval ([#406](https://github.com/RequestNetwork/requestNetwork/issues/406)) ([28708ac](https://github.com/RequestNetwork/requestNetwork/commit/28708ac3adb0e1db2032a53649db936d8b24799c))

### Features

- payment network any to erc20 smartcontracts ([#408](https://github.com/RequestNetwork/requestNetwork/issues/408)) ([a2f30a8](https://github.com/RequestNetwork/requestNetwork/commit/a2f30a84689eaea0994e72944c417718c7aad20e))

## [0.30.2](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-processor@0.30.0...@requestnetwork/payment-processor@0.30.2) (2020-12-22)

**Note:** Version bump only for package @requestnetwork/payment-processor

## [0.30.1](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-processor@0.30.0...@requestnetwork/payment-processor@0.30.1) (2020-12-21)

**Note:** Version bump only for package @requestnetwork/payment-processor

# 0.30.0 (2020-12-02)

### Bug Fixes

- erc20 approval ([#352](https://github.com/RequestNetwork/requestNetwork/issues/352)) ([ab406ed](https://github.com/RequestNetwork/requestNetwork/commit/ab406ed3893eb8d7ba859604832ff0d3abaa5b91))
- Gnosis multisig has a new name ([#368](https://github.com/RequestNetwork/requestNetwork/issues/368)) ([3f15489](https://github.com/RequestNetwork/requestNetwork/commit/3f15489aeb249776788a3b763809cae8a6bcf4b1))

### Features

- smart contract wallets do not need eth to pay gas ([#364](https://github.com/RequestNetwork/requestNetwork/issues/364)) ([c16bf43](https://github.com/RequestNetwork/requestNetwork/commit/c16bf43dda5cd1d0e9f91b60f020410062573610))

# 0.26.0 (2020-10-14)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))
- payment processor should use swap allowance method ([#336](https://github.com/RequestNetwork/requestNetwork/issues/336)) ([ac3be59](https://github.com/RequestNetwork/requestNetwork/commit/ac3be59e2679efcc983ddae212338b1a355ca50f))

### Features

- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add payment processing for eth proxy contract ([#220](https://github.com/RequestNetwork/requestNetwork/issues/220)) ([5859c89](https://github.com/RequestNetwork/requestNetwork/commit/5859c899434465e401e7993ffa22a6c1b0823a8a))
- payment processor support for swap-to-pay ([#323](https://github.com/RequestNetwork/requestNetwork/issues/323)) ([b1c9b5f](https://github.com/RequestNetwork/requestNetwork/commit/b1c9b5f84ad2d32abe3f2ba4d42adc0f76353e0d))
- unify ERC20 payment processing API ([#279](https://github.com/RequestNetwork/requestNetwork/issues/279)) ([8b3756b](https://github.com/RequestNetwork/requestNetwork/commit/8b3756b05bd3afa034e91d72410b5a43cc565541))

# 0.16.0 (2020-04-21)

### Features

- payment-processor transaction overrides ([#198](https://github.com/RequestNetwork/requestNetwork/issues/198)) ([92a52aa](https://github.com/RequestNetwork/requestNetwork/commit/92a52aa7de88269e6869995444829ecdda15ede1))

# 0.15.0 (2020-04-06)

### Bug Fixes

- **payment-processor:** remove instanceof usage ([#159](https://github.com/RequestNetwork/requestNetwork/issues/159)) ([48efc12](https://github.com/RequestNetwork/requestNetwork/commit/48efc1232a68782a6a8d6610d0883e241685574e))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Features

- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.29.0 (2020-11-12)

### Bug Fixes

- erc20 approval ([#352](https://github.com/RequestNetwork/requestNetwork/issues/352)) ([ab406ed](https://github.com/RequestNetwork/requestNetwork/commit/ab406ed3893eb8d7ba859604832ff0d3abaa5b91))

# 0.26.0 (2020-10-14)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))
- payment processor should use swap allowance method ([#336](https://github.com/RequestNetwork/requestNetwork/issues/336)) ([ac3be59](https://github.com/RequestNetwork/requestNetwork/commit/ac3be59e2679efcc983ddae212338b1a355ca50f))

### Features

- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add payment processing for eth proxy contract ([#220](https://github.com/RequestNetwork/requestNetwork/issues/220)) ([5859c89](https://github.com/RequestNetwork/requestNetwork/commit/5859c899434465e401e7993ffa22a6c1b0823a8a))
- payment processor support for swap-to-pay ([#323](https://github.com/RequestNetwork/requestNetwork/issues/323)) ([b1c9b5f](https://github.com/RequestNetwork/requestNetwork/commit/b1c9b5f84ad2d32abe3f2ba4d42adc0f76353e0d))
- unify ERC20 payment processing API ([#279](https://github.com/RequestNetwork/requestNetwork/issues/279)) ([8b3756b](https://github.com/RequestNetwork/requestNetwork/commit/8b3756b05bd3afa034e91d72410b5a43cc565541))

# 0.16.0 (2020-04-21)

### Features

- payment-processor transaction overrides ([#198](https://github.com/RequestNetwork/requestNetwork/issues/198)) ([92a52aa](https://github.com/RequestNetwork/requestNetwork/commit/92a52aa7de88269e6869995444829ecdda15ede1))

# 0.15.0 (2020-04-06)

### Bug Fixes

- **payment-processor:** remove instanceof usage ([#159](https://github.com/RequestNetwork/requestNetwork/issues/159)) ([48efc12](https://github.com/RequestNetwork/requestNetwork/commit/48efc1232a68782a6a8d6610d0883e241685574e))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Features

- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.28.0 (2020-11-05)

### Bug Fixes

- erc20 approval ([#352](https://github.com/RequestNetwork/requestNetwork/issues/352)) ([ab406ed](https://github.com/RequestNetwork/requestNetwork/commit/ab406ed3893eb8d7ba859604832ff0d3abaa5b91))

# 0.26.0 (2020-10-14)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))
- payment processor should use swap allowance method ([#336](https://github.com/RequestNetwork/requestNetwork/issues/336)) ([ac3be59](https://github.com/RequestNetwork/requestNetwork/commit/ac3be59e2679efcc983ddae212338b1a355ca50f))

### Features

- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add payment processing for eth proxy contract ([#220](https://github.com/RequestNetwork/requestNetwork/issues/220)) ([5859c89](https://github.com/RequestNetwork/requestNetwork/commit/5859c899434465e401e7993ffa22a6c1b0823a8a))
- payment processor support for swap-to-pay ([#323](https://github.com/RequestNetwork/requestNetwork/issues/323)) ([b1c9b5f](https://github.com/RequestNetwork/requestNetwork/commit/b1c9b5f84ad2d32abe3f2ba4d42adc0f76353e0d))
- unify ERC20 payment processing API ([#279](https://github.com/RequestNetwork/requestNetwork/issues/279)) ([8b3756b](https://github.com/RequestNetwork/requestNetwork/commit/8b3756b05bd3afa034e91d72410b5a43cc565541))

# 0.16.0 (2020-04-21)

### Features

- payment-processor transaction overrides ([#198](https://github.com/RequestNetwork/requestNetwork/issues/198)) ([92a52aa](https://github.com/RequestNetwork/requestNetwork/commit/92a52aa7de88269e6869995444829ecdda15ede1))

# 0.15.0 (2020-04-06)

### Bug Fixes

- **payment-processor:** remove instanceof usage ([#159](https://github.com/RequestNetwork/requestNetwork/issues/159)) ([48efc12](https://github.com/RequestNetwork/requestNetwork/commit/48efc1232a68782a6a8d6610d0883e241685574e))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Features

- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.27.0 (2020-10-21)

# 0.26.0 (2020-10-14)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))
- payment processor should use swap allowance method ([#336](https://github.com/RequestNetwork/requestNetwork/issues/336)) ([ac3be59](https://github.com/RequestNetwork/requestNetwork/commit/ac3be59e2679efcc983ddae212338b1a355ca50f))

### Features

- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add payment processing for eth proxy contract ([#220](https://github.com/RequestNetwork/requestNetwork/issues/220)) ([5859c89](https://github.com/RequestNetwork/requestNetwork/commit/5859c899434465e401e7993ffa22a6c1b0823a8a))
- payment processor support for swap-to-pay ([#323](https://github.com/RequestNetwork/requestNetwork/issues/323)) ([b1c9b5f](https://github.com/RequestNetwork/requestNetwork/commit/b1c9b5f84ad2d32abe3f2ba4d42adc0f76353e0d))
- unify ERC20 payment processing API ([#279](https://github.com/RequestNetwork/requestNetwork/issues/279)) ([8b3756b](https://github.com/RequestNetwork/requestNetwork/commit/8b3756b05bd3afa034e91d72410b5a43cc565541))

# 0.16.0 (2020-04-21)

### Features

- payment-processor transaction overrides ([#198](https://github.com/RequestNetwork/requestNetwork/issues/198)) ([92a52aa](https://github.com/RequestNetwork/requestNetwork/commit/92a52aa7de88269e6869995444829ecdda15ede1))

# 0.15.0 (2020-04-06)

### Bug Fixes

- **payment-processor:** remove instanceof usage ([#159](https://github.com/RequestNetwork/requestNetwork/issues/159)) ([48efc12](https://github.com/RequestNetwork/requestNetwork/commit/48efc1232a68782a6a8d6610d0883e241685574e))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Features

- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.26.0 (2020-10-14)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))
- payment processor should use swap allowance method ([#336](https://github.com/RequestNetwork/requestNetwork/issues/336)) ([ac3be59](https://github.com/RequestNetwork/requestNetwork/commit/ac3be59e2679efcc983ddae212338b1a355ca50f))

### Features

- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add payment processing for eth proxy contract ([#220](https://github.com/RequestNetwork/requestNetwork/issues/220)) ([5859c89](https://github.com/RequestNetwork/requestNetwork/commit/5859c899434465e401e7993ffa22a6c1b0823a8a))
- payment processor support for swap-to-pay ([#323](https://github.com/RequestNetwork/requestNetwork/issues/323)) ([b1c9b5f](https://github.com/RequestNetwork/requestNetwork/commit/b1c9b5f84ad2d32abe3f2ba4d42adc0f76353e0d))
- unify ERC20 payment processing API ([#279](https://github.com/RequestNetwork/requestNetwork/issues/279)) ([8b3756b](https://github.com/RequestNetwork/requestNetwork/commit/8b3756b05bd3afa034e91d72410b5a43cc565541))

# 0.16.0 (2020-04-21)

### Features

- payment-processor transaction overrides ([#198](https://github.com/RequestNetwork/requestNetwork/issues/198)) ([92a52aa](https://github.com/RequestNetwork/requestNetwork/commit/92a52aa7de88269e6869995444829ecdda15ede1))

# 0.15.0 (2020-04-06)

### Bug Fixes

- **payment-processor:** remove instanceof usage ([#159](https://github.com/RequestNetwork/requestNetwork/issues/159)) ([48efc12](https://github.com/RequestNetwork/requestNetwork/commit/48efc1232a68782a6a8d6610d0883e241685574e))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Features

- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.25.0 (2020-10-13)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))
- payment processor should use swap allowance method ([#336](https://github.com/RequestNetwork/requestNetwork/issues/336)) ([ac3be59](https://github.com/RequestNetwork/requestNetwork/commit/ac3be59e2679efcc983ddae212338b1a355ca50f))

### Features

- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add payment processing for eth proxy contract ([#220](https://github.com/RequestNetwork/requestNetwork/issues/220)) ([5859c89](https://github.com/RequestNetwork/requestNetwork/commit/5859c899434465e401e7993ffa22a6c1b0823a8a))
- payment processor support for swap-to-pay ([#323](https://github.com/RequestNetwork/requestNetwork/issues/323)) ([b1c9b5f](https://github.com/RequestNetwork/requestNetwork/commit/b1c9b5f84ad2d32abe3f2ba4d42adc0f76353e0d))
- unify ERC20 payment processing API ([#279](https://github.com/RequestNetwork/requestNetwork/issues/279)) ([8b3756b](https://github.com/RequestNetwork/requestNetwork/commit/8b3756b05bd3afa034e91d72410b5a43cc565541))

# 0.16.0 (2020-04-21)

### Features

- payment-processor transaction overrides ([#198](https://github.com/RequestNetwork/requestNetwork/issues/198)) ([92a52aa](https://github.com/RequestNetwork/requestNetwork/commit/92a52aa7de88269e6869995444829ecdda15ede1))

# 0.15.0 (2020-04-06)

### Bug Fixes

- **payment-processor:** remove instanceof usage ([#159](https://github.com/RequestNetwork/requestNetwork/issues/159)) ([48efc12](https://github.com/RequestNetwork/requestNetwork/commit/48efc1232a68782a6a8d6610d0883e241685574e))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Features

- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.24.0 (2020-10-09)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))

### Features

- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add payment processing for eth proxy contract ([#220](https://github.com/RequestNetwork/requestNetwork/issues/220)) ([5859c89](https://github.com/RequestNetwork/requestNetwork/commit/5859c899434465e401e7993ffa22a6c1b0823a8a))
- payment processor support for swap-to-pay ([#323](https://github.com/RequestNetwork/requestNetwork/issues/323)) ([b1c9b5f](https://github.com/RequestNetwork/requestNetwork/commit/b1c9b5f84ad2d32abe3f2ba4d42adc0f76353e0d))
- unify ERC20 payment processing API ([#279](https://github.com/RequestNetwork/requestNetwork/issues/279)) ([8b3756b](https://github.com/RequestNetwork/requestNetwork/commit/8b3756b05bd3afa034e91d72410b5a43cc565541))

# 0.16.0 (2020-04-21)

### Features

- payment-processor transaction overrides ([#198](https://github.com/RequestNetwork/requestNetwork/issues/198)) ([92a52aa](https://github.com/RequestNetwork/requestNetwork/commit/92a52aa7de88269e6869995444829ecdda15ede1))

# 0.15.0 (2020-04-06)

### Bug Fixes

- **payment-processor:** remove instanceof usage ([#159](https://github.com/RequestNetwork/requestNetwork/issues/159)) ([48efc12](https://github.com/RequestNetwork/requestNetwork/commit/48efc1232a68782a6a8d6610d0883e241685574e))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Features

- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.23.0 (2020-09-28)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))

### Features

- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add payment processing for eth proxy contract ([#220](https://github.com/RequestNetwork/requestNetwork/issues/220)) ([5859c89](https://github.com/RequestNetwork/requestNetwork/commit/5859c899434465e401e7993ffa22a6c1b0823a8a))
- unify ERC20 payment processing API ([#279](https://github.com/RequestNetwork/requestNetwork/issues/279)) ([8b3756b](https://github.com/RequestNetwork/requestNetwork/commit/8b3756b05bd3afa034e91d72410b5a43cc565541))

# 0.16.0 (2020-04-21)

### Features

- payment-processor transaction overrides ([#198](https://github.com/RequestNetwork/requestNetwork/issues/198)) ([92a52aa](https://github.com/RequestNetwork/requestNetwork/commit/92a52aa7de88269e6869995444829ecdda15ede1))

# 0.15.0 (2020-04-06)

### Bug Fixes

- **payment-processor:** remove instanceof usage ([#159](https://github.com/RequestNetwork/requestNetwork/issues/159)) ([48efc12](https://github.com/RequestNetwork/requestNetwork/commit/48efc1232a68782a6a8d6610d0883e241685574e))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Features

- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.22.0 (2020-09-18)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))

### Features

- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add payment processing for eth proxy contract ([#220](https://github.com/RequestNetwork/requestNetwork/issues/220)) ([5859c89](https://github.com/RequestNetwork/requestNetwork/commit/5859c899434465e401e7993ffa22a6c1b0823a8a))
- unify ERC20 payment processing API ([#279](https://github.com/RequestNetwork/requestNetwork/issues/279)) ([8b3756b](https://github.com/RequestNetwork/requestNetwork/commit/8b3756b05bd3afa034e91d72410b5a43cc565541))

# 0.16.0 (2020-04-21)

### Features

- payment-processor transaction overrides ([#198](https://github.com/RequestNetwork/requestNetwork/issues/198)) ([92a52aa](https://github.com/RequestNetwork/requestNetwork/commit/92a52aa7de88269e6869995444829ecdda15ede1))

# 0.15.0 (2020-04-06)

### Bug Fixes

- **payment-processor:** remove instanceof usage ([#159](https://github.com/RequestNetwork/requestNetwork/issues/159)) ([48efc12](https://github.com/RequestNetwork/requestNetwork/commit/48efc1232a68782a6a8d6610d0883e241685574e))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Features

- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.21.0 (2020-09-01)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))

### Features

- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add payment processing for eth proxy contract ([#220](https://github.com/RequestNetwork/requestNetwork/issues/220)) ([5859c89](https://github.com/RequestNetwork/requestNetwork/commit/5859c899434465e401e7993ffa22a6c1b0823a8a))

# 0.16.0 (2020-04-21)

### Features

- payment-processor transaction overrides ([#198](https://github.com/RequestNetwork/requestNetwork/issues/198)) ([92a52aa](https://github.com/RequestNetwork/requestNetwork/commit/92a52aa7de88269e6869995444829ecdda15ede1))

# 0.15.0 (2020-04-06)

### Bug Fixes

- **payment-processor:** remove instanceof usage ([#159](https://github.com/RequestNetwork/requestNetwork/issues/159)) ([48efc12](https://github.com/RequestNetwork/requestNetwork/commit/48efc1232a68782a6a8d6610d0883e241685574e))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Features

- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.20.0 (2020-08-27)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))

### Features

- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add payment processing for eth proxy contract ([#220](https://github.com/RequestNetwork/requestNetwork/issues/220)) ([5859c89](https://github.com/RequestNetwork/requestNetwork/commit/5859c899434465e401e7993ffa22a6c1b0823a8a))

# 0.16.0 (2020-04-21)

### Features

- payment-processor transaction overrides ([#198](https://github.com/RequestNetwork/requestNetwork/issues/198)) ([92a52aa](https://github.com/RequestNetwork/requestNetwork/commit/92a52aa7de88269e6869995444829ecdda15ede1))

# 0.15.0 (2020-04-06)

### Bug Fixes

- **payment-processor:** remove instanceof usage ([#159](https://github.com/RequestNetwork/requestNetwork/issues/159)) ([48efc12](https://github.com/RequestNetwork/requestNetwork/commit/48efc1232a68782a6a8d6610d0883e241685574e))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Features

- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.19.0 (2020-08-13)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))

### Features

- add erc20 proxy with fee payment processor ([#253](https://github.com/RequestNetwork/requestNetwork/issues/253)) ([3727d89](https://github.com/RequestNetwork/requestNetwork/commit/3727d8935a5041c2a922bd1618ee84df3e1c9ebf))
- add payment processing for eth proxy contract ([#220](https://github.com/RequestNetwork/requestNetwork/issues/220)) ([5859c89](https://github.com/RequestNetwork/requestNetwork/commit/5859c899434465e401e7993ffa22a6c1b0823a8a))

# 0.16.0 (2020-04-21)

### Features

- payment-processor transaction overrides ([#198](https://github.com/RequestNetwork/requestNetwork/issues/198)) ([92a52aa](https://github.com/RequestNetwork/requestNetwork/commit/92a52aa7de88269e6869995444829ecdda15ede1))

# 0.15.0 (2020-04-06)

### Bug Fixes

- **payment-processor:** remove instanceof usage ([#159](https://github.com/RequestNetwork/requestNetwork/issues/159)) ([48efc12](https://github.com/RequestNetwork/requestNetwork/commit/48efc1232a68782a6a8d6610d0883e241685574e))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Features

- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.18.0 (2020-06-29)

### Features

- add payment processing for eth proxy contract ([#220](https://github.com/RequestNetwork/requestNetwork/issues/220)) ([5859c89](https://github.com/RequestNetwork/requestNetwork/commit/5859c899434465e401e7993ffa22a6c1b0823a8a))

# 0.16.0 (2020-04-21)

### Features

- payment-processor transaction overrides ([#198](https://github.com/RequestNetwork/requestNetwork/issues/198)) ([92a52aa](https://github.com/RequestNetwork/requestNetwork/commit/92a52aa7de88269e6869995444829ecdda15ede1))

# 0.15.0 (2020-04-06)

### Bug Fixes

- **payment-processor:** remove instanceof usage ([#159](https://github.com/RequestNetwork/requestNetwork/issues/159)) ([48efc12](https://github.com/RequestNetwork/requestNetwork/commit/48efc1232a68782a6a8d6610d0883e241685574e))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Features

- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.17.0 (2020-05-04)

# 0.16.0 (2020-04-21)

### Features

- payment-processor transaction overrides ([#198](https://github.com/RequestNetwork/requestNetwork/issues/198)) ([92a52aa](https://github.com/RequestNetwork/requestNetwork/commit/92a52aa7de88269e6869995444829ecdda15ede1))

# 0.15.0 (2020-04-06)

### Bug Fixes

- **payment-processor:** remove instanceof usage ([#159](https://github.com/RequestNetwork/requestNetwork/issues/159)) ([48efc12](https://github.com/RequestNetwork/requestNetwork/commit/48efc1232a68782a6a8d6610d0883e241685574e))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Features

- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.16.0 (2020-04-21)

### Features

- payment-processor transaction overrides ([#198](https://github.com/RequestNetwork/requestNetwork/issues/198)) ([92a52aa](https://github.com/RequestNetwork/requestNetwork/commit/92a52aa7de88269e6869995444829ecdda15ede1))

# 0.15.0 (2020-04-06)

### Bug Fixes

- **payment-processor:** remove instanceof usage ([#159](https://github.com/RequestNetwork/requestNetwork/issues/159)) ([48efc12](https://github.com/RequestNetwork/requestNetwork/commit/48efc1232a68782a6a8d6610d0883e241685574e))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Features

- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.15.0 (2020-04-06)

### Bug Fixes

- **payment-processor:** remove instanceof usage ([#159](https://github.com/RequestNetwork/requestNetwork/issues/159)) ([48efc12](https://github.com/RequestNetwork/requestNetwork/commit/48efc1232a68782a6a8d6610d0883e241685574e))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Features

- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.14.0 (2020-03-23)

### Bug Fixes

- **payment-processor:** remove instanceof usage ([#159](https://github.com/RequestNetwork/requestNetwork/issues/159)) ([48efc12](https://github.com/RequestNetwork/requestNetwork/commit/48efc1232a68782a6a8d6610d0883e241685574e))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Features

- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.13.0 (2020-02-20)

### Features

- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))
