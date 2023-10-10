# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.28.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.23.0...@requestnetwork/request-node@0.28.0) (2023-10-06)

### Bug Fixes

- **ethereum-storage:** OldNonce error, wait for 1 confirmation when submitting hashes ([#1078](https://github.com/RequestNetwork/requestNetwork/issues/1078)) ([35f2ede](https://github.com/RequestNetwork/requestNetwork/commit/35f2edee22fbc68c06abc7c455e8d58e9c7717b1))
- **graph node:** graphql query name ([#864](https://github.com/RequestNetwork/requestNetwork/issues/864)) ([5ea56a4](https://github.com/RequestNetwork/requestNetwork/commit/5ea56a4ddf0e0c68ce8043a4e0c39ddf31209876))
- **integration-tests:** unskip tests ([#1107](https://github.com/RequestNetwork/requestNetwork/issues/1107)) ([af5c902](https://github.com/RequestNetwork/requestNetwork/commit/af5c90292376a4c841d621e22b12c38d2c61efb6))
- **request node:** typo in config ([#999](https://github.com/RequestNetwork/requestNetwork/issues/999)) ([cd7666f](https://github.com/RequestNetwork/requestNetwork/commit/cd7666f6ce314034322e87306bedc5e38156a1a1))
- **request node:** wrong network name for mainnet ([#952](https://github.com/RequestNetwork/requestNetwork/issues/952)) ([ddab4e4](https://github.com/RequestNetwork/requestNetwork/commit/ddab4e492fdd2b8880981e844d250d7f39e3a606))
- **request-node:** log config ([#1125](https://github.com/RequestNetwork/requestNetwork/issues/1125)) ([9775de8](https://github.com/RequestNetwork/requestNetwork/commit/9775de8f0ef597d399506bcd3cac73f40d019e74))
- remove provider assertion ([#861](https://github.com/RequestNetwork/requestNetwork/issues/861)) ([5e12b74](https://github.com/RequestNetwork/requestNetwork/commit/5e12b74a7226b4060e29109bf9935a1c905a18dd))
- typescript lint for test files ([#778](https://github.com/RequestNetwork/requestNetwork/issues/778)) ([048e876](https://github.com/RequestNetwork/requestNetwork/commit/048e876a905516be0de8a31d446e4572eb74eccb))
- **request-node:** eth_feeHistory missing parameters ([#764](https://github.com/RequestNetwork/requestNetwork/issues/764)) ([b941252](https://github.com/RequestNetwork/requestNetwork/commit/b941252a1da0f3252cc5405be9a1fb19580790ee))
- **request-node:** maxFeePerGas calculation ([#766](https://github.com/RequestNetwork/requestNetwork/issues/766)) ([12b4227](https://github.com/RequestNetwork/requestNetwork/commit/12b4227cfd5b7b3dea64c1952e40d77d9e9ae8d6))
- **thegraph:** zero timestamp ([#757](https://github.com/RequestNetwork/requestNetwork/issues/757)) ([8246f6f](https://github.com/RequestNetwork/requestNetwork/commit/8246f6fd52478c3a80d2c1a740c3330eb840a1e7))
- getDataIdMeta heavy load ([#613](https://github.com/RequestNetwork/requestNetwork/issues/613)) ([fa8bf9e](https://github.com/RequestNetwork/requestNetwork/commit/fa8bf9e77a98d27ad6e21a8118995e6930a99407))

### Features

- **ethereum-storage:** add minimum gas price option ([#997](https://github.com/RequestNetwork/requestNetwork/issues/997)) ([121aeaa](https://github.com/RequestNetwork/requestNetwork/commit/121aeaaed4c8f65a57b9f20a1cf1e31d75e09d3f))
- **ipfs-manager:** adapt RPC usage with POST methods ([#871](https://github.com/RequestNetwork/requestNetwork/issues/871)) ([9b99d72](https://github.com/RequestNetwork/requestNetwork/commit/9b99d726512320999b94d8635772ceadc773f6ca))
- **request-node:** allow ws connection ([#691](https://github.com/RequestNetwork/requestNetwork/issues/691)) ([2c879a6](https://github.com/RequestNetwork/requestNetwork/commit/2c879a60c907e77accb4a99e0d1facaa46cd6001))
- **request-node:** TheGraph as data access ([#717](https://github.com/RequestNetwork/requestNetwork/issues/717)) ([651e77f](https://github.com/RequestNetwork/requestNetwork/commit/651e77f5fbb1f1c18d01381a8e439029e1d61f30))
- **toolbox:** troubleshooting utilities ([#995](https://github.com/RequestNetwork/requestNetwork/issues/995)) ([1818e08](https://github.com/RequestNetwork/requestNetwork/commit/1818e080fee237aec3ba411e15bc864e82adaf7c))
- graceful shutdown of request-node ([#463](https://github.com/RequestNetwork/requestNetwork/issues/463)) ([ba5b7c2](https://github.com/RequestNetwork/requestNetwork/commit/ba5b7c257d65996c971dedf71ac6fa1ea44ec891))
- split data-access read and write for TheGraph ([#875](https://github.com/RequestNetwork/requestNetwork/issues/875)) ([8fdf34d](https://github.com/RequestNetwork/requestNetwork/commit/8fdf34d280a5c277125fa431d74976be69768d38))

# [0.27.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.23.0...@requestnetwork/request-node@0.27.0) (2022-11-04)

### Bug Fixes

- **graph node:** graphql query name ([#864](https://github.com/RequestNetwork/requestNetwork/issues/864)) ([5ea56a4](https://github.com/RequestNetwork/requestNetwork/commit/5ea56a4ddf0e0c68ce8043a4e0c39ddf31209876))
- **request node:** wrong network name for mainnet ([#952](https://github.com/RequestNetwork/requestNetwork/issues/952)) ([ddab4e4](https://github.com/RequestNetwork/requestNetwork/commit/ddab4e492fdd2b8880981e844d250d7f39e3a606))
- getDataIdMeta heavy load ([#613](https://github.com/RequestNetwork/requestNetwork/issues/613)) ([fa8bf9e](https://github.com/RequestNetwork/requestNetwork/commit/fa8bf9e77a98d27ad6e21a8118995e6930a99407))
- remove provider assertion ([#861](https://github.com/RequestNetwork/requestNetwork/issues/861)) ([5e12b74](https://github.com/RequestNetwork/requestNetwork/commit/5e12b74a7226b4060e29109bf9935a1c905a18dd))
- typescript lint for test files ([#778](https://github.com/RequestNetwork/requestNetwork/issues/778)) ([048e876](https://github.com/RequestNetwork/requestNetwork/commit/048e876a905516be0de8a31d446e4572eb74eccb))
- **request-node:** eth_feeHistory missing parameters ([#764](https://github.com/RequestNetwork/requestNetwork/issues/764)) ([b941252](https://github.com/RequestNetwork/requestNetwork/commit/b941252a1da0f3252cc5405be9a1fb19580790ee))
- **request-node:** maxFeePerGas calculation ([#766](https://github.com/RequestNetwork/requestNetwork/issues/766)) ([12b4227](https://github.com/RequestNetwork/requestNetwork/commit/12b4227cfd5b7b3dea64c1952e40d77d9e9ae8d6))
- **thegraph:** zero timestamp ([#757](https://github.com/RequestNetwork/requestNetwork/issues/757)) ([8246f6f](https://github.com/RequestNetwork/requestNetwork/commit/8246f6fd52478c3a80d2c1a740c3330eb840a1e7))

### Features

- **ipfs-manager:** adapt RPC usage with POST methods ([#871](https://github.com/RequestNetwork/requestNetwork/issues/871)) ([9b99d72](https://github.com/RequestNetwork/requestNetwork/commit/9b99d726512320999b94d8635772ceadc773f6ca))
- split data-access read and write for TheGraph ([#875](https://github.com/RequestNetwork/requestNetwork/issues/875)) ([8fdf34d](https://github.com/RequestNetwork/requestNetwork/commit/8fdf34d280a5c277125fa431d74976be69768d38))
- **request-node:** allow ws connection ([#691](https://github.com/RequestNetwork/requestNetwork/issues/691)) ([2c879a6](https://github.com/RequestNetwork/requestNetwork/commit/2c879a60c907e77accb4a99e0d1facaa46cd6001))
- **request-node:** TheGraph as data access ([#717](https://github.com/RequestNetwork/requestNetwork/issues/717)) ([651e77f](https://github.com/RequestNetwork/requestNetwork/commit/651e77f5fbb1f1c18d01381a8e439029e1d61f30))
- graceful shutdown of request-node ([#463](https://github.com/RequestNetwork/requestNetwork/issues/463)) ([ba5b7c2](https://github.com/RequestNetwork/requestNetwork/commit/ba5b7c257d65996c971dedf71ac6fa1ea44ec891))

# [0.26.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.23.0...@requestnetwork/request-node@0.26.0) (2021-06-22)

### Features

- graceful shutdown of request-node ([#463](https://github.com/RequestNetwork/requestNetwork/issues/463)) ([ba5b7c2](https://github.com/RequestNetwork/requestNetwork/commit/ba5b7c257d65996c971dedf71ac6fa1ea44ec891))

# [0.25.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.23.0...@requestnetwork/request-node@0.25.0) (2021-05-12)

### Features

- graceful shutdown of request-node ([#463](https://github.com/RequestNetwork/requestNetwork/issues/463)) ([ba5b7c2](https://github.com/RequestNetwork/requestNetwork/commit/ba5b7c257d65996c971dedf71ac6fa1ea44ec891))

# [0.24.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.23.0...@requestnetwork/request-node@0.24.0) (2021-04-19)

### Features

- graceful shutdown of request-node ([#463](https://github.com/RequestNetwork/requestNetwork/issues/463)) ([ba5b7c2](https://github.com/RequestNetwork/requestNetwork/commit/ba5b7c257d65996c971dedf71ac6fa1ea44ec891))

## [0.23.6](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.23.0...@requestnetwork/request-node@0.23.6) (2021-03-25)

**Note:** Version bump only for package @requestnetwork/request-node

## [0.23.5](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.23.0...@requestnetwork/request-node@0.23.5) (2021-03-15)

**Note:** Version bump only for package @requestnetwork/request-node

## [0.23.4](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.23.0...@requestnetwork/request-node@0.23.4) (2021-03-03)

**Note:** Version bump only for package @requestnetwork/request-node

## [0.23.3](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.23.0...@requestnetwork/request-node@0.23.3) (2021-02-22)

**Note:** Version bump only for package @requestnetwork/request-node

## [0.23.2](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.23.0...@requestnetwork/request-node@0.23.2) (2020-12-22)

**Note:** Version bump only for package @requestnetwork/request-node

## [0.23.1](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.23.0...@requestnetwork/request-node@0.23.1) (2020-12-21)

**Note:** Version bump only for package @requestnetwork/request-node

# [0.23.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.23.0) (2020-12-02)

# 0.26.0 (2020-10-14)

### Bug Fixes

- high gas related fixes ([#270](https://github.com/RequestNetwork/requestNetwork/issues/270)) ([1471b54](https://github.com/RequestNetwork/requestNetwork/commit/1471b54ae703bc8c14b5bf3a91ad0b9fae661214))

# 0.18.0 (2020-06-29)

### Bug Fixes

- intercept error and log the missed transaction ([#230](https://github.com/RequestNetwork/requestNetwork/issues/230)) ([90f5fdc](https://github.com/RequestNetwork/requestNetwork/commit/90f5fdc814b1e53698be294e1b138e2ea7276794))

### Features

- resubmit stuck transaction with more gas ([#239](https://github.com/RequestNetwork/requestNetwork/issues/239)) ([cf7f92e](https://github.com/RequestNetwork/requestNetwork/commit/cf7f92eb6ee9f0c5da427f37fa5f12f56812a221))
- store confirmed transactions ([#235](https://github.com/RequestNetwork/requestNetwork/issues/235)) ([f2d10fc](https://github.com/RequestNetwork/requestNetwork/commit/f2d10fc6af098fec4b8585ffea5e101c256f6a35))

# 0.16.0 (2020-04-21)

### Bug Fixes

- hide infura token in the status ([#197](https://github.com/RequestNetwork/requestNetwork/issues/197)) ([4d154d7](https://github.com/RequestNetwork/requestNetwork/commit/4d154d717a37bd9212dfec5ee44ff1541453018a))

### Features

- **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

# 0.14.0 (2020-03-19)

### Bug Fixes

- block parsing with encrypted transaction ([#176](https://github.com/RequestNetwork/requestNetwork/issues/176)) ([de86f43](https://github.com/RequestNetwork/requestNetwork/commit/de86f43d7f2886673364bded70ab6a4f8acf4711))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

# 0.10.0 (2019-12-04)

# [0.22.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.22.0) (2020-11-12)

# 0.26.0 (2020-10-14)

### Bug Fixes

- high gas related fixes ([#270](https://github.com/RequestNetwork/requestNetwork/issues/270)) ([1471b54](https://github.com/RequestNetwork/requestNetwork/commit/1471b54ae703bc8c14b5bf3a91ad0b9fae661214))

# 0.18.0 (2020-06-29)

### Bug Fixes

- intercept error and log the missed transaction ([#230](https://github.com/RequestNetwork/requestNetwork/issues/230)) ([90f5fdc](https://github.com/RequestNetwork/requestNetwork/commit/90f5fdc814b1e53698be294e1b138e2ea7276794))

### Features

- resubmit stuck transaction with more gas ([#239](https://github.com/RequestNetwork/requestNetwork/issues/239)) ([cf7f92e](https://github.com/RequestNetwork/requestNetwork/commit/cf7f92eb6ee9f0c5da427f37fa5f12f56812a221))
- store confirmed transactions ([#235](https://github.com/RequestNetwork/requestNetwork/issues/235)) ([f2d10fc](https://github.com/RequestNetwork/requestNetwork/commit/f2d10fc6af098fec4b8585ffea5e101c256f6a35))

# 0.16.0 (2020-04-21)

### Bug Fixes

- hide infura token in the status ([#197](https://github.com/RequestNetwork/requestNetwork/issues/197)) ([4d154d7](https://github.com/RequestNetwork/requestNetwork/commit/4d154d717a37bd9212dfec5ee44ff1541453018a))

### Features

- **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

# 0.14.0 (2020-03-19)

### Bug Fixes

- block parsing with encrypted transaction ([#176](https://github.com/RequestNetwork/requestNetwork/issues/176)) ([de86f43](https://github.com/RequestNetwork/requestNetwork/commit/de86f43d7f2886673364bded70ab6a4f8acf4711))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

# 0.10.0 (2019-12-04)

# [0.21.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.21.0) (2020-11-05)

# 0.26.0 (2020-10-14)

### Bug Fixes

- high gas related fixes ([#270](https://github.com/RequestNetwork/requestNetwork/issues/270)) ([1471b54](https://github.com/RequestNetwork/requestNetwork/commit/1471b54ae703bc8c14b5bf3a91ad0b9fae661214))

# 0.18.0 (2020-06-29)

### Bug Fixes

- intercept error and log the missed transaction ([#230](https://github.com/RequestNetwork/requestNetwork/issues/230)) ([90f5fdc](https://github.com/RequestNetwork/requestNetwork/commit/90f5fdc814b1e53698be294e1b138e2ea7276794))

### Features

- resubmit stuck transaction with more gas ([#239](https://github.com/RequestNetwork/requestNetwork/issues/239)) ([cf7f92e](https://github.com/RequestNetwork/requestNetwork/commit/cf7f92eb6ee9f0c5da427f37fa5f12f56812a221))
- store confirmed transactions ([#235](https://github.com/RequestNetwork/requestNetwork/issues/235)) ([f2d10fc](https://github.com/RequestNetwork/requestNetwork/commit/f2d10fc6af098fec4b8585ffea5e101c256f6a35))

# 0.16.0 (2020-04-21)

### Bug Fixes

- hide infura token in the status ([#197](https://github.com/RequestNetwork/requestNetwork/issues/197)) ([4d154d7](https://github.com/RequestNetwork/requestNetwork/commit/4d154d717a37bd9212dfec5ee44ff1541453018a))

### Features

- **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

# 0.14.0 (2020-03-19)

### Bug Fixes

- block parsing with encrypted transaction ([#176](https://github.com/RequestNetwork/requestNetwork/issues/176)) ([de86f43](https://github.com/RequestNetwork/requestNetwork/commit/de86f43d7f2886673364bded70ab6a4f8acf4711))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

# 0.10.0 (2019-12-04)

# [0.20.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.20.0) (2020-10-21)

# 0.26.0 (2020-10-14)

### Bug Fixes

- high gas related fixes ([#270](https://github.com/RequestNetwork/requestNetwork/issues/270)) ([1471b54](https://github.com/RequestNetwork/requestNetwork/commit/1471b54ae703bc8c14b5bf3a91ad0b9fae661214))

# 0.18.0 (2020-06-29)

### Bug Fixes

- intercept error and log the missed transaction ([#230](https://github.com/RequestNetwork/requestNetwork/issues/230)) ([90f5fdc](https://github.com/RequestNetwork/requestNetwork/commit/90f5fdc814b1e53698be294e1b138e2ea7276794))

### Features

- resubmit stuck transaction with more gas ([#239](https://github.com/RequestNetwork/requestNetwork/issues/239)) ([cf7f92e](https://github.com/RequestNetwork/requestNetwork/commit/cf7f92eb6ee9f0c5da427f37fa5f12f56812a221))
- store confirmed transactions ([#235](https://github.com/RequestNetwork/requestNetwork/issues/235)) ([f2d10fc](https://github.com/RequestNetwork/requestNetwork/commit/f2d10fc6af098fec4b8585ffea5e101c256f6a35))

# 0.16.0 (2020-04-21)

### Bug Fixes

- hide infura token in the status ([#197](https://github.com/RequestNetwork/requestNetwork/issues/197)) ([4d154d7](https://github.com/RequestNetwork/requestNetwork/commit/4d154d717a37bd9212dfec5ee44ff1541453018a))

### Features

- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))
- **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))

# 0.15.0 (2020-04-06)

# 0.14.0 (2020-03-19)

### Bug Fixes

- block parsing with encrypted transaction ([#176](https://github.com/RequestNetwork/requestNetwork/issues/176)) ([de86f43](https://github.com/RequestNetwork/requestNetwork/commit/de86f43d7f2886673364bded70ab6a4f8acf4711))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

# 0.10.0 (2019-12-04)

# [0.19.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.19.0) (2020-10-14)

### Bug Fixes

- high gas related fixes ([#270](https://github.com/RequestNetwork/requestNetwork/issues/270)) ([1471b54](https://github.com/RequestNetwork/requestNetwork/commit/1471b54ae703bc8c14b5bf3a91ad0b9fae661214))

# 0.18.0 (2020-06-29)

### Bug Fixes

- intercept error and log the missed transaction ([#230](https://github.com/RequestNetwork/requestNetwork/issues/230)) ([90f5fdc](https://github.com/RequestNetwork/requestNetwork/commit/90f5fdc814b1e53698be294e1b138e2ea7276794))

### Features

- resubmit stuck transaction with more gas ([#239](https://github.com/RequestNetwork/requestNetwork/issues/239)) ([cf7f92e](https://github.com/RequestNetwork/requestNetwork/commit/cf7f92eb6ee9f0c5da427f37fa5f12f56812a221))
- store confirmed transactions ([#235](https://github.com/RequestNetwork/requestNetwork/issues/235)) ([f2d10fc](https://github.com/RequestNetwork/requestNetwork/commit/f2d10fc6af098fec4b8585ffea5e101c256f6a35))

# 0.16.0 (2020-04-21)

### Bug Fixes

- hide infura token in the status ([#197](https://github.com/RequestNetwork/requestNetwork/issues/197)) ([4d154d7](https://github.com/RequestNetwork/requestNetwork/commit/4d154d717a37bd9212dfec5ee44ff1541453018a))

### Features

- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))
- **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))

# 0.15.0 (2020-04-06)

# 0.14.0 (2020-03-19)

### Bug Fixes

- block parsing with encrypted transaction ([#176](https://github.com/RequestNetwork/requestNetwork/issues/176)) ([de86f43](https://github.com/RequestNetwork/requestNetwork/commit/de86f43d7f2886673364bded70ab6a4f8acf4711))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

# 0.10.0 (2019-12-04)

# [0.18.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.18.0) (2020-10-13)

### Bug Fixes

- high gas related fixes ([#270](https://github.com/RequestNetwork/requestNetwork/issues/270)) ([1471b54](https://github.com/RequestNetwork/requestNetwork/commit/1471b54ae703bc8c14b5bf3a91ad0b9fae661214))

# 0.18.0 (2020-06-29)

### Bug Fixes

- intercept error and log the missed transaction ([#230](https://github.com/RequestNetwork/requestNetwork/issues/230)) ([90f5fdc](https://github.com/RequestNetwork/requestNetwork/commit/90f5fdc814b1e53698be294e1b138e2ea7276794))

### Features

- resubmit stuck transaction with more gas ([#239](https://github.com/RequestNetwork/requestNetwork/issues/239)) ([cf7f92e](https://github.com/RequestNetwork/requestNetwork/commit/cf7f92eb6ee9f0c5da427f37fa5f12f56812a221))
- store confirmed transactions ([#235](https://github.com/RequestNetwork/requestNetwork/issues/235)) ([f2d10fc](https://github.com/RequestNetwork/requestNetwork/commit/f2d10fc6af098fec4b8585ffea5e101c256f6a35))

# 0.16.0 (2020-04-21)

### Bug Fixes

- hide infura token in the status ([#197](https://github.com/RequestNetwork/requestNetwork/issues/197)) ([4d154d7](https://github.com/RequestNetwork/requestNetwork/commit/4d154d717a37bd9212dfec5ee44ff1541453018a))

### Features

- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))
- **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))

# 0.15.0 (2020-04-06)

# 0.14.0 (2020-03-19)

### Bug Fixes

- block parsing with encrypted transaction ([#176](https://github.com/RequestNetwork/requestNetwork/issues/176)) ([de86f43](https://github.com/RequestNetwork/requestNetwork/commit/de86f43d7f2886673364bded70ab6a4f8acf4711))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

# 0.10.0 (2019-12-04)

# [0.17.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.17.0) (2020-10-09)

### Bug Fixes

- high gas related fixes ([#270](https://github.com/RequestNetwork/requestNetwork/issues/270)) ([1471b54](https://github.com/RequestNetwork/requestNetwork/commit/1471b54ae703bc8c14b5bf3a91ad0b9fae661214))

# 0.18.0 (2020-06-29)

### Bug Fixes

- intercept error and log the missed transaction ([#230](https://github.com/RequestNetwork/requestNetwork/issues/230)) ([90f5fdc](https://github.com/RequestNetwork/requestNetwork/commit/90f5fdc814b1e53698be294e1b138e2ea7276794))

### Features

- resubmit stuck transaction with more gas ([#239](https://github.com/RequestNetwork/requestNetwork/issues/239)) ([cf7f92e](https://github.com/RequestNetwork/requestNetwork/commit/cf7f92eb6ee9f0c5da427f37fa5f12f56812a221))
- store confirmed transactions ([#235](https://github.com/RequestNetwork/requestNetwork/issues/235)) ([f2d10fc](https://github.com/RequestNetwork/requestNetwork/commit/f2d10fc6af098fec4b8585ffea5e101c256f6a35))

# 0.16.0 (2020-04-21)

### Bug Fixes

- hide infura token in the status ([#197](https://github.com/RequestNetwork/requestNetwork/issues/197)) ([4d154d7](https://github.com/RequestNetwork/requestNetwork/commit/4d154d717a37bd9212dfec5ee44ff1541453018a))

### Features

- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))
- **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))

# 0.15.0 (2020-04-06)

# 0.14.0 (2020-03-19)

### Bug Fixes

- block parsing with encrypted transaction ([#176](https://github.com/RequestNetwork/requestNetwork/issues/176)) ([de86f43](https://github.com/RequestNetwork/requestNetwork/commit/de86f43d7f2886673364bded70ab6a4f8acf4711))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

# 0.10.0 (2019-12-04)

# [0.16.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.16.0) (2020-09-28)

### Bug Fixes

- high gas related fixes ([#270](https://github.com/RequestNetwork/requestNetwork/issues/270)) ([1471b54](https://github.com/RequestNetwork/requestNetwork/commit/1471b54ae703bc8c14b5bf3a91ad0b9fae661214))

# 0.18.0 (2020-06-29)

### Bug Fixes

- intercept error and log the missed transaction ([#230](https://github.com/RequestNetwork/requestNetwork/issues/230)) ([90f5fdc](https://github.com/RequestNetwork/requestNetwork/commit/90f5fdc814b1e53698be294e1b138e2ea7276794))

### Features

- resubmit stuck transaction with more gas ([#239](https://github.com/RequestNetwork/requestNetwork/issues/239)) ([cf7f92e](https://github.com/RequestNetwork/requestNetwork/commit/cf7f92eb6ee9f0c5da427f37fa5f12f56812a221))
- store confirmed transactions ([#235](https://github.com/RequestNetwork/requestNetwork/issues/235)) ([f2d10fc](https://github.com/RequestNetwork/requestNetwork/commit/f2d10fc6af098fec4b8585ffea5e101c256f6a35))

# 0.16.0 (2020-04-21)

### Bug Fixes

- hide infura token in the status ([#197](https://github.com/RequestNetwork/requestNetwork/issues/197)) ([4d154d7](https://github.com/RequestNetwork/requestNetwork/commit/4d154d717a37bd9212dfec5ee44ff1541453018a))

### Features

- **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

# 0.14.0 (2020-03-19)

### Bug Fixes

- block parsing with encrypted transaction ([#176](https://github.com/RequestNetwork/requestNetwork/issues/176)) ([de86f43](https://github.com/RequestNetwork/requestNetwork/commit/de86f43d7f2886673364bded70ab6a4f8acf4711))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

# 0.10.0 (2019-12-04)

# [0.15.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.15.0) (2020-09-18)

### Bug Fixes

- high gas related fixes ([#270](https://github.com/RequestNetwork/requestNetwork/issues/270)) ([1471b54](https://github.com/RequestNetwork/requestNetwork/commit/1471b54ae703bc8c14b5bf3a91ad0b9fae661214))

# 0.18.0 (2020-06-29)

### Bug Fixes

- intercept error and log the missed transaction ([#230](https://github.com/RequestNetwork/requestNetwork/issues/230)) ([90f5fdc](https://github.com/RequestNetwork/requestNetwork/commit/90f5fdc814b1e53698be294e1b138e2ea7276794))

### Features

- resubmit stuck transaction with more gas ([#239](https://github.com/RequestNetwork/requestNetwork/issues/239)) ([cf7f92e](https://github.com/RequestNetwork/requestNetwork/commit/cf7f92eb6ee9f0c5da427f37fa5f12f56812a221))
- store confirmed transactions ([#235](https://github.com/RequestNetwork/requestNetwork/issues/235)) ([f2d10fc](https://github.com/RequestNetwork/requestNetwork/commit/f2d10fc6af098fec4b8585ffea5e101c256f6a35))

# 0.16.0 (2020-04-21)

### Bug Fixes

- hide infura token in the status ([#197](https://github.com/RequestNetwork/requestNetwork/issues/197)) ([4d154d7](https://github.com/RequestNetwork/requestNetwork/commit/4d154d717a37bd9212dfec5ee44ff1541453018a))

### Features

- **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

# 0.14.0 (2020-03-19)

### Bug Fixes

- block parsing with encrypted transaction ([#176](https://github.com/RequestNetwork/requestNetwork/issues/176)) ([de86f43](https://github.com/RequestNetwork/requestNetwork/commit/de86f43d7f2886673364bded70ab6a4f8acf4711))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

# 0.10.0 (2019-12-04)

# [0.14.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.14.0) (2020-09-01)

### Bug Fixes

- high gas related fixes ([#270](https://github.com/RequestNetwork/requestNetwork/issues/270)) ([1471b54](https://github.com/RequestNetwork/requestNetwork/commit/1471b54ae703bc8c14b5bf3a91ad0b9fae661214))

# 0.18.0 (2020-06-29)

### Bug Fixes

- intercept error and log the missed transaction ([#230](https://github.com/RequestNetwork/requestNetwork/issues/230)) ([90f5fdc](https://github.com/RequestNetwork/requestNetwork/commit/90f5fdc814b1e53698be294e1b138e2ea7276794))

### Features

- resubmit stuck transaction with more gas ([#239](https://github.com/RequestNetwork/requestNetwork/issues/239)) ([cf7f92e](https://github.com/RequestNetwork/requestNetwork/commit/cf7f92eb6ee9f0c5da427f37fa5f12f56812a221))
- store confirmed transactions ([#235](https://github.com/RequestNetwork/requestNetwork/issues/235)) ([f2d10fc](https://github.com/RequestNetwork/requestNetwork/commit/f2d10fc6af098fec4b8585ffea5e101c256f6a35))

# 0.16.0 (2020-04-21)

### Bug Fixes

- hide infura token in the status ([#197](https://github.com/RequestNetwork/requestNetwork/issues/197)) ([4d154d7](https://github.com/RequestNetwork/requestNetwork/commit/4d154d717a37bd9212dfec5ee44ff1541453018a))

### Features

- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))
- **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))

# 0.15.0 (2020-04-06)

# 0.14.0 (2020-03-19)

### Bug Fixes

- block parsing with encrypted transaction ([#176](https://github.com/RequestNetwork/requestNetwork/issues/176)) ([de86f43](https://github.com/RequestNetwork/requestNetwork/commit/de86f43d7f2886673364bded70ab6a4f8acf4711))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

# 0.10.0 (2019-12-04)

# [0.13.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.13.0) (2020-08-27)

### Bug Fixes

- high gas related fixes ([#270](https://github.com/RequestNetwork/requestNetwork/issues/270)) ([1471b54](https://github.com/RequestNetwork/requestNetwork/commit/1471b54ae703bc8c14b5bf3a91ad0b9fae661214))

# 0.18.0 (2020-06-29)

### Bug Fixes

- intercept error and log the missed transaction ([#230](https://github.com/RequestNetwork/requestNetwork/issues/230)) ([90f5fdc](https://github.com/RequestNetwork/requestNetwork/commit/90f5fdc814b1e53698be294e1b138e2ea7276794))

### Features

- resubmit stuck transaction with more gas ([#239](https://github.com/RequestNetwork/requestNetwork/issues/239)) ([cf7f92e](https://github.com/RequestNetwork/requestNetwork/commit/cf7f92eb6ee9f0c5da427f37fa5f12f56812a221))
- store confirmed transactions ([#235](https://github.com/RequestNetwork/requestNetwork/issues/235)) ([f2d10fc](https://github.com/RequestNetwork/requestNetwork/commit/f2d10fc6af098fec4b8585ffea5e101c256f6a35))

# 0.16.0 (2020-04-21)

### Bug Fixes

- hide infura token in the status ([#197](https://github.com/RequestNetwork/requestNetwork/issues/197)) ([4d154d7](https://github.com/RequestNetwork/requestNetwork/commit/4d154d717a37bd9212dfec5ee44ff1541453018a))

### Features

- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))
- **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))

# 0.15.0 (2020-04-06)

# 0.14.0 (2020-03-19)

### Bug Fixes

- block parsing with encrypted transaction ([#176](https://github.com/RequestNetwork/requestNetwork/issues/176)) ([de86f43](https://github.com/RequestNetwork/requestNetwork/commit/de86f43d7f2886673364bded70ab6a4f8acf4711))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

# 0.10.0 (2019-12-04)

# [0.12.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.12.0) (2020-08-13)

# 0.18.0 (2020-06-29)

### Bug Fixes

- intercept error and log the missed transaction ([#230](https://github.com/RequestNetwork/requestNetwork/issues/230)) ([90f5fdc](https://github.com/RequestNetwork/requestNetwork/commit/90f5fdc814b1e53698be294e1b138e2ea7276794))

### Features

- resubmit stuck transaction with more gas ([#239](https://github.com/RequestNetwork/requestNetwork/issues/239)) ([cf7f92e](https://github.com/RequestNetwork/requestNetwork/commit/cf7f92eb6ee9f0c5da427f37fa5f12f56812a221))
- store confirmed transactions ([#235](https://github.com/RequestNetwork/requestNetwork/issues/235)) ([f2d10fc](https://github.com/RequestNetwork/requestNetwork/commit/f2d10fc6af098fec4b8585ffea5e101c256f6a35))

# 0.16.0 (2020-04-21)

### Bug Fixes

- hide infura token in the status ([#197](https://github.com/RequestNetwork/requestNetwork/issues/197)) ([4d154d7](https://github.com/RequestNetwork/requestNetwork/commit/4d154d717a37bd9212dfec5ee44ff1541453018a))

### Features

- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))
- **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))

# 0.15.0 (2020-04-06)

# 0.14.0 (2020-03-19)

### Bug Fixes

- block parsing with encrypted transaction ([#176](https://github.com/RequestNetwork/requestNetwork/issues/176)) ([de86f43](https://github.com/RequestNetwork/requestNetwork/commit/de86f43d7f2886673364bded70ab6a4f8acf4711))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

# 0.10.0 (2019-12-04)

# [0.11.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.11.0) (2020-06-29)

### Bug Fixes

- intercept error and log the missed transaction ([#230](https://github.com/RequestNetwork/requestNetwork/issues/230)) ([90f5fdc](https://github.com/RequestNetwork/requestNetwork/commit/90f5fdc814b1e53698be294e1b138e2ea7276794))

### Features

- resubmit stuck transaction with more gas ([#239](https://github.com/RequestNetwork/requestNetwork/issues/239)) ([cf7f92e](https://github.com/RequestNetwork/requestNetwork/commit/cf7f92eb6ee9f0c5da427f37fa5f12f56812a221))
- store confirmed transactions ([#235](https://github.com/RequestNetwork/requestNetwork/issues/235)) ([f2d10fc](https://github.com/RequestNetwork/requestNetwork/commit/f2d10fc6af098fec4b8585ffea5e101c256f6a35))

# 0.16.0 (2020-04-21)

### Bug Fixes

- hide infura token in the status ([#197](https://github.com/RequestNetwork/requestNetwork/issues/197)) ([4d154d7](https://github.com/RequestNetwork/requestNetwork/commit/4d154d717a37bd9212dfec5ee44ff1541453018a))

### Features

- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))
- **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))

# 0.15.0 (2020-04-06)

# 0.14.0 (2020-03-19)

### Bug Fixes

- block parsing with encrypted transaction ([#176](https://github.com/RequestNetwork/requestNetwork/issues/176)) ([de86f43](https://github.com/RequestNetwork/requestNetwork/commit/de86f43d7f2886673364bded70ab6a4f8acf4711))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

# 0.10.0 (2019-12-04)

# [0.10.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.10.0) (2020-05-04)

# 0.16.0 (2020-04-21)

### Bug Fixes

- hide infura token in the status ([#197](https://github.com/RequestNetwork/requestNetwork/issues/197)) ([4d154d7](https://github.com/RequestNetwork/requestNetwork/commit/4d154d717a37bd9212dfec5ee44ff1541453018a))

### Features

- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))
- **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))

# 0.15.0 (2020-04-06)

# 0.14.0 (2020-03-19)

### Bug Fixes

- block parsing with encrypted transaction ([#176](https://github.com/RequestNetwork/requestNetwork/issues/176)) ([de86f43](https://github.com/RequestNetwork/requestNetwork/commit/de86f43d7f2886673364bded70ab6a4f8acf4711))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

# 0.10.0 (2019-12-04)

# [0.9.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.9.0) (2020-04-21)

### Bug Fixes

- hide infura token in the status ([#197](https://github.com/RequestNetwork/requestNetwork/issues/197)) ([4d154d7](https://github.com/RequestNetwork/requestNetwork/commit/4d154d717a37bd9212dfec5ee44ff1541453018a))

### Features

- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))
- **request-node:** Add Request Node version and Request Client version to requests header ([#192](https://github.com/RequestNetwork/requestNetwork/issues/192)) ([20ad94b](https://github.com/RequestNetwork/requestNetwork/commit/20ad94b7679b5c08a3951329b1fa8a58c8a3e2df))

# 0.15.0 (2020-04-06)

# 0.14.0 (2020-03-19)

### Bug Fixes

- block parsing with encrypted transaction ([#176](https://github.com/RequestNetwork/requestNetwork/issues/176)) ([de86f43](https://github.com/RequestNetwork/requestNetwork/commit/de86f43d7f2886673364bded70ab6a4f8acf4711))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

# 0.10.0 (2019-12-04)

# [0.8.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.8.0) (2020-04-06)

# 0.14.0 (2020-03-19)

### Bug Fixes

- block parsing with encrypted transaction ([#176](https://github.com/RequestNetwork/requestNetwork/issues/176)) ([de86f43](https://github.com/RequestNetwork/requestNetwork/commit/de86f43d7f2886673364bded70ab6a4f8acf4711))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

# 0.10.0 (2019-12-04)

# [0.7.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.7.0) (2020-03-23)

### Bug Fixes

- block parsing with encrypted transaction ([#176](https://github.com/RequestNetwork/requestNetwork/issues/176)) ([de86f43](https://github.com/RequestNetwork/requestNetwork/commit/de86f43d7f2886673364bded70ab6a4f8acf4711))

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

# 0.10.0 (2019-12-04)

# [0.6.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.6.0) (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

# 0.10.0 (2019-12-04)

## [0.5.7](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.5.7) (2020-01-16)

# 0.10.0 (2019-12-04)

**Note:** Version bump only for package @requestnetwork/request-node

## [0.5.6](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.5.6) (2019-12-18)

# 0.10.0 (2019-12-04)

**Note:** Version bump only for package @requestnetwork/request-node

## [0.5.5](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.4...@requestnetwork/request-node@0.5.5) (2019-12-04)

**Note:** Version bump only for package @requestnetwork/request-node

## [0.5.4](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.3...@requestnetwork/request-node@0.5.4) (2019-11-20)

**Note:** Version bump only for package @requestnetwork/request-node

## [0.5.3](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.2...@requestnetwork/request-node@0.5.3) (2019-10-21)

**Note:** Version bump only for package @requestnetwork/request-node

## [0.5.2](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.1...@requestnetwork/request-node@0.5.2) (2019-09-16)

**Note:** Version bump only for package @requestnetwork/request-node

## [0.5.1](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.5.0...@requestnetwork/request-node@0.5.1) (2019-09-05)

**Note:** Version bump only for package @requestnetwork/request-node

# [0.5.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.4.0...@requestnetwork/request-node@0.5.0) (2019-08-19)

### Features

- add an option for the Node to define the timeout when calling persistTransaction ([#485](https://github.com/RequestNetwork/requestNetwork/issues/485)) ([176228c](https://github.com/RequestNetwork/requestNetwork/commit/176228c))

### Performance Improvements

- lower concurrency to 5 and disable DHT on IPFS ([#500](https://github.com/RequestNetwork/requestNetwork/issues/500)) ([cec31e3](https://github.com/RequestNetwork/requestNetwork/commit/cec31e3))

# [0.3.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.1.1-alpha.4...@requestnetwork/request-node@0.3.0) (2019-07-24)

### Bug Fixes

- Add a specific tsconfig for Dockerfile ([#286](https://github.com/RequestNetwork/requestNetwork/issues/286)) ([901c36c](https://github.com/RequestNetwork/requestNetwork/commit/901c36c))
- block not found error in function addHashAndSizeToEthereum of storage ([#349](https://github.com/RequestNetwork/requestNetwork/issues/349)) ([1fea138](https://github.com/RequestNetwork/requestNetwork/commit/1fea138))
- Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))
- Misc. minor fixes on the request node ([#334](https://github.com/RequestNetwork/requestNetwork/issues/334)) ([8fcf53d](https://github.com/RequestNetwork/requestNetwork/commit/8fcf53d))
- Node socket hangup error ([#293](https://github.com/RequestNetwork/requestNetwork/issues/293)) ([02777ea](https://github.com/RequestNetwork/requestNetwork/commit/02777ea))
- Rename providerHost to providerUrl ([#271](https://github.com/RequestNetwork/requestNetwork/issues/271)) ([fa5480c](https://github.com/RequestNetwork/requestNetwork/commit/fa5480c))
- use keyv to persist Ethereum metadata cache ([#431](https://github.com/RequestNetwork/requestNetwork/issues/431)) ([6a6788b](https://github.com/RequestNetwork/requestNetwork/commit/6a6788b))

### Features

- add .env support to the node ([#336](https://github.com/RequestNetwork/requestNetwork/issues/336)) ([e1ef0c6](https://github.com/RequestNetwork/requestNetwork/commit/e1ef0c6))
- add concurrent readMany to storage layer ([#363](https://github.com/RequestNetwork/requestNetwork/issues/363)) ([db3f484](https://github.com/RequestNetwork/requestNetwork/commit/db3f484))
- add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
- add logging interfaces and default logger ([#397](https://github.com/RequestNetwork/requestNetwork/issues/397)) ([f83a716](https://github.com/RequestNetwork/requestNetwork/commit/f83a716))
- add logs for request processing time ([#424](https://github.com/RequestNetwork/requestNetwork/issues/424)) ([3802f4e](https://github.com/RequestNetwork/requestNetwork/commit/3802f4e))
- add logs to calculate success rate of transaction creation ([#443](https://github.com/RequestNetwork/requestNetwork/issues/443)) ([738a98d](https://github.com/RequestNetwork/requestNetwork/commit/738a98d))
- add request node health check endpoints ([#449](https://github.com/RequestNetwork/requestNetwork/issues/449)) ([bef1a71](https://github.com/RequestNetwork/requestNetwork/commit/bef1a71))
- add request node logger ([#416](https://github.com/RequestNetwork/requestNetwork/issues/416)) ([8d56ade](https://github.com/RequestNetwork/requestNetwork/commit/8d56ade))
- add script to configure private IPFS network ([#458](https://github.com/RequestNetwork/requestNetwork/issues/458)) ([4490d2b](https://github.com/RequestNetwork/requestNetwork/commit/4490d2b))
- add time to start a Node in the logs ([#423](https://github.com/RequestNetwork/requestNetwork/issues/423)) ([f9a6972](https://github.com/RequestNetwork/requestNetwork/commit/f9a6972))
- additional node logs to show progress and logLevel option ([#338](https://github.com/RequestNetwork/requestNetwork/issues/338)) ([38559f4](https://github.com/RequestNetwork/requestNetwork/commit/38559f4))
- Create usable Dockerfile ([#278](https://github.com/RequestNetwork/requestNetwork/issues/278)) ([6c83f28](https://github.com/RequestNetwork/requestNetwork/commit/6c83f28))
- **data-access:** transaction index persisted for faster initialization ([#406](https://github.com/RequestNetwork/requestNetwork/issues/406)) ([d820036](https://github.com/RequestNetwork/requestNetwork/commit/d820036))
- getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
- implements cached-throttle utility ([#348](https://github.com/RequestNetwork/requestNetwork/issues/348)) ([01c9885](https://github.com/RequestNetwork/requestNetwork/commit/01c9885))
- introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
- Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
- Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))

### Performance Improvements

- faster initialization by factoring stat and read IPFS calls in one call ([#401](https://github.com/RequestNetwork/requestNetwork/issues/401)) ([184c14e](https://github.com/RequestNetwork/requestNetwork/commit/184c14e))

## [0.2.1-alpha.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.1.1-alpha.4...@requestnetwork/request-node@0.2.1-alpha.0) (2019-07-22)

### Bug Fixes

- Add a specific tsconfig for Dockerfile ([#286](https://github.com/RequestNetwork/requestNetwork/issues/286)) ([901c36c](https://github.com/RequestNetwork/requestNetwork/commit/901c36c))
- block not found error in function addHashAndSizeToEthereum of storage ([#349](https://github.com/RequestNetwork/requestNetwork/issues/349)) ([1fea138](https://github.com/RequestNetwork/requestNetwork/commit/1fea138))
- Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))
- Misc. minor fixes on the request node ([#334](https://github.com/RequestNetwork/requestNetwork/issues/334)) ([8fcf53d](https://github.com/RequestNetwork/requestNetwork/commit/8fcf53d))
- Node socket hangup error ([#293](https://github.com/RequestNetwork/requestNetwork/issues/293)) ([02777ea](https://github.com/RequestNetwork/requestNetwork/commit/02777ea))
- Rename providerHost to providerUrl ([#271](https://github.com/RequestNetwork/requestNetwork/issues/271)) ([fa5480c](https://github.com/RequestNetwork/requestNetwork/commit/fa5480c))
- use keyv to persist Ethereum metadata cache ([#431](https://github.com/RequestNetwork/requestNetwork/issues/431)) ([6a6788b](https://github.com/RequestNetwork/requestNetwork/commit/6a6788b))

### Features

- add .env support to the node ([#336](https://github.com/RequestNetwork/requestNetwork/issues/336)) ([e1ef0c6](https://github.com/RequestNetwork/requestNetwork/commit/e1ef0c6))
- add concurrent readMany to storage layer ([#363](https://github.com/RequestNetwork/requestNetwork/issues/363)) ([db3f484](https://github.com/RequestNetwork/requestNetwork/commit/db3f484))
- add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
- add logging interfaces and default logger ([#397](https://github.com/RequestNetwork/requestNetwork/issues/397)) ([f83a716](https://github.com/RequestNetwork/requestNetwork/commit/f83a716))
- add logs for request processing time ([#424](https://github.com/RequestNetwork/requestNetwork/issues/424)) ([3802f4e](https://github.com/RequestNetwork/requestNetwork/commit/3802f4e))
- add logs to calculate success rate of transaction creation ([#443](https://github.com/RequestNetwork/requestNetwork/issues/443)) ([738a98d](https://github.com/RequestNetwork/requestNetwork/commit/738a98d))
- add request node health check endpoints ([#449](https://github.com/RequestNetwork/requestNetwork/issues/449)) ([bef1a71](https://github.com/RequestNetwork/requestNetwork/commit/bef1a71))
- add request node logger ([#416](https://github.com/RequestNetwork/requestNetwork/issues/416)) ([8d56ade](https://github.com/RequestNetwork/requestNetwork/commit/8d56ade))
- add time to start a Node in the logs ([#423](https://github.com/RequestNetwork/requestNetwork/issues/423)) ([f9a6972](https://github.com/RequestNetwork/requestNetwork/commit/f9a6972))
- additional node logs to show progress and logLevel option ([#338](https://github.com/RequestNetwork/requestNetwork/issues/338)) ([38559f4](https://github.com/RequestNetwork/requestNetwork/commit/38559f4))
- Create usable Dockerfile ([#278](https://github.com/RequestNetwork/requestNetwork/issues/278)) ([6c83f28](https://github.com/RequestNetwork/requestNetwork/commit/6c83f28))
- **data-access:** transaction index persisted for faster initialization ([#406](https://github.com/RequestNetwork/requestNetwork/issues/406)) ([d820036](https://github.com/RequestNetwork/requestNetwork/commit/d820036))
- getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
- implements cached-throttle utility ([#348](https://github.com/RequestNetwork/requestNetwork/issues/348)) ([01c9885](https://github.com/RequestNetwork/requestNetwork/commit/01c9885))
- introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
- Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
- Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))

### Performance Improvements

- faster initialization by factoring stat and read IPFS calls in one call ([#401](https://github.com/RequestNetwork/requestNetwork/issues/401)) ([184c14e](https://github.com/RequestNetwork/requestNetwork/commit/184c14e))

# [0.2.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.1.1-alpha.4...@requestnetwork/request-node@0.2.0) (2019-06-06)

### Bug Fixes

- Add a specific tsconfig for Dockerfile ([#286](https://github.com/RequestNetwork/requestNetwork/issues/286)) ([901c36c](https://github.com/RequestNetwork/requestNetwork/commit/901c36c))
- block not found error in function addHashAndSizeToEthereum of storage ([#349](https://github.com/RequestNetwork/requestNetwork/issues/349)) ([1fea138](https://github.com/RequestNetwork/requestNetwork/commit/1fea138))
- Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))
- Misc. minor fixes on the request node ([#334](https://github.com/RequestNetwork/requestNetwork/issues/334)) ([8fcf53d](https://github.com/RequestNetwork/requestNetwork/commit/8fcf53d))
- Node socket hangup error ([#293](https://github.com/RequestNetwork/requestNetwork/issues/293)) ([02777ea](https://github.com/RequestNetwork/requestNetwork/commit/02777ea))
- Rename providerHost to providerUrl ([#271](https://github.com/RequestNetwork/requestNetwork/issues/271)) ([fa5480c](https://github.com/RequestNetwork/requestNetwork/commit/fa5480c))

### Features

- add .env support to the node ([#336](https://github.com/RequestNetwork/requestNetwork/issues/336)) ([e1ef0c6](https://github.com/RequestNetwork/requestNetwork/commit/e1ef0c6))
- add concurrent readMany to storage layer ([#363](https://github.com/RequestNetwork/requestNetwork/issues/363)) ([db3f484](https://github.com/RequestNetwork/requestNetwork/commit/db3f484))
- add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
- add logging interfaces and default logger ([#397](https://github.com/RequestNetwork/requestNetwork/issues/397)) ([f83a716](https://github.com/RequestNetwork/requestNetwork/commit/f83a716))
- additional node logs to show progress and logLevel option ([#338](https://github.com/RequestNetwork/requestNetwork/issues/338)) ([38559f4](https://github.com/RequestNetwork/requestNetwork/commit/38559f4))
- Create usable Dockerfile ([#278](https://github.com/RequestNetwork/requestNetwork/issues/278)) ([6c83f28](https://github.com/RequestNetwork/requestNetwork/commit/6c83f28))
- getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
- implements cached-throttle utility ([#348](https://github.com/RequestNetwork/requestNetwork/issues/348)) ([01c9885](https://github.com/RequestNetwork/requestNetwork/commit/01c9885))
- introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
- Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
- Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))

### Performance Improvements

- faster initialization by factoring stat and read IPFS calls in one call ([#401](https://github.com/RequestNetwork/requestNetwork/issues/401)) ([184c14e](https://github.com/RequestNetwork/requestNetwork/commit/184c14e))

## [0.1.1-alpha.12](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.1.1-alpha.4...@requestnetwork/request-node@0.1.1-alpha.12) (2019-05-21)

### Bug Fixes

- Add a specific tsconfig for Dockerfile ([#286](https://github.com/RequestNetwork/requestNetwork/issues/286)) ([901c36c](https://github.com/RequestNetwork/requestNetwork/commit/901c36c))
- block not found error in function addHashAndSizeToEthereum of storage ([#349](https://github.com/RequestNetwork/requestNetwork/issues/349)) ([1fea138](https://github.com/RequestNetwork/requestNetwork/commit/1fea138))
- Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))
- Misc. minor fixes on the request node ([#334](https://github.com/RequestNetwork/requestNetwork/issues/334)) ([8fcf53d](https://github.com/RequestNetwork/requestNetwork/commit/8fcf53d))
- Node socket hangup error ([#293](https://github.com/RequestNetwork/requestNetwork/issues/293)) ([02777ea](https://github.com/RequestNetwork/requestNetwork/commit/02777ea))
- Rename providerHost to providerUrl ([#271](https://github.com/RequestNetwork/requestNetwork/issues/271)) ([fa5480c](https://github.com/RequestNetwork/requestNetwork/commit/fa5480c))

### Features

- add .env support to the node ([#336](https://github.com/RequestNetwork/requestNetwork/issues/336)) ([e1ef0c6](https://github.com/RequestNetwork/requestNetwork/commit/e1ef0c6))
- add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
- additional node logs to show progress and logLevel option ([#338](https://github.com/RequestNetwork/requestNetwork/issues/338)) ([38559f4](https://github.com/RequestNetwork/requestNetwork/commit/38559f4))
- Create usable Dockerfile ([#278](https://github.com/RequestNetwork/requestNetwork/issues/278)) ([6c83f28](https://github.com/RequestNetwork/requestNetwork/commit/6c83f28))
- getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
- implements cached-throttle utility ([#348](https://github.com/RequestNetwork/requestNetwork/issues/348)) ([01c9885](https://github.com/RequestNetwork/requestNetwork/commit/01c9885))
- introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
- Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
- Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))

## [0.1.1-alpha.11](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.1.1-alpha.4...@requestnetwork/request-node@0.1.1-alpha.11) (2019-05-17)

### Bug Fixes

- Add a specific tsconfig for Dockerfile ([#286](https://github.com/RequestNetwork/requestNetwork/issues/286)) ([901c36c](https://github.com/RequestNetwork/requestNetwork/commit/901c36c))
- Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))
- Misc. minor fixes on the request node ([#334](https://github.com/RequestNetwork/requestNetwork/issues/334)) ([8fcf53d](https://github.com/RequestNetwork/requestNetwork/commit/8fcf53d))
- Node socket hangup error ([#293](https://github.com/RequestNetwork/requestNetwork/issues/293)) ([02777ea](https://github.com/RequestNetwork/requestNetwork/commit/02777ea))
- Rename providerHost to providerUrl ([#271](https://github.com/RequestNetwork/requestNetwork/issues/271)) ([fa5480c](https://github.com/RequestNetwork/requestNetwork/commit/fa5480c))

### Features

- add .env support to the node ([#336](https://github.com/RequestNetwork/requestNetwork/issues/336)) ([e1ef0c6](https://github.com/RequestNetwork/requestNetwork/commit/e1ef0c6))
- add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
- additional node logs to show progress and logLevel option ([#338](https://github.com/RequestNetwork/requestNetwork/issues/338)) ([38559f4](https://github.com/RequestNetwork/requestNetwork/commit/38559f4))
- Create usable Dockerfile ([#278](https://github.com/RequestNetwork/requestNetwork/issues/278)) ([6c83f28](https://github.com/RequestNetwork/requestNetwork/commit/6c83f28))
- getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
- implements cached-throttle utility ([#348](https://github.com/RequestNetwork/requestNetwork/issues/348)) ([01c9885](https://github.com/RequestNetwork/requestNetwork/commit/01c9885))
- introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
- Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
- Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))

## [0.1.1-alpha.10](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/request-node@0.1.1-alpha.4...@requestnetwork/request-node@0.1.1-alpha.10) (2019-05-10)

### Bug Fixes

- Add a specific tsconfig for Dockerfile ([#286](https://github.com/RequestNetwork/requestNetwork/issues/286)) ([901c36c](https://github.com/RequestNetwork/requestNetwork/commit/901c36c))
- Error block XXX not found ([#306](https://github.com/RequestNetwork/requestNetwork/issues/306)) ([6c9c59b](https://github.com/RequestNetwork/requestNetwork/commit/6c9c59b))
- Misc. minor fixes on the request node ([#334](https://github.com/RequestNetwork/requestNetwork/issues/334)) ([8fcf53d](https://github.com/RequestNetwork/requestNetwork/commit/8fcf53d))
- Node socket hangup error ([#293](https://github.com/RequestNetwork/requestNetwork/issues/293)) ([02777ea](https://github.com/RequestNetwork/requestNetwork/commit/02777ea))
- Rename providerHost to providerUrl ([#271](https://github.com/RequestNetwork/requestNetwork/issues/271)) ([fa5480c](https://github.com/RequestNetwork/requestNetwork/commit/fa5480c))

### Features

- add .env support to the node ([#336](https://github.com/RequestNetwork/requestNetwork/issues/336)) ([e1ef0c6](https://github.com/RequestNetwork/requestNetwork/commit/e1ef0c6))
- add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
- Create usable Dockerfile ([#278](https://github.com/RequestNetwork/requestNetwork/issues/278)) ([6c83f28](https://github.com/RequestNetwork/requestNetwork/commit/6c83f28))
- getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
- introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
- Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
- Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))
