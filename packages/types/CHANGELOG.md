# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.36.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.29.0...@requestnetwork/types@0.36.0) (2022-11-04)

### Bug Fixes

- add txHash to balance ([#664](https://github.com/RequestNetwork/requestNetwork/issues/664)) ([95bc076](https://github.com/RequestNetwork/requestNetwork/commit/95bc076630995d9178f3d5c25324bf3c1d17f03b))
- balance of detected payments for declared extensions ([#646](https://github.com/RequestNetwork/requestNetwork/issues/646)) ([f0d5492](https://github.com/RequestNetwork/requestNetwork/commit/f0d5492dc612a5be8e8cf2d63f8a9689b53fd18e))
- change note type to string ([#622](https://github.com/RequestNetwork/requestNetwork/issues/622)) ([4cc80d7](https://github.com/RequestNetwork/requestNetwork/commit/4cc80d7ad6f63142210d99117a419804958ca1ba))
- invoice total types + upgrade ethers ([#514](https://github.com/RequestNetwork/requestNetwork/issues/514)) ([c2b98b2](https://github.com/RequestNetwork/requestNetwork/commit/c2b98b2bd3c93f063f340d58c6b95ad026fd9519))
- IPaymentNetworkState better typing ([#967](https://github.com/RequestNetwork/requestNetwork/issues/967)) ([4d26fe8](https://github.com/RequestNetwork/requestNetwork/commit/4d26fe8105931e387d3ee55dfc8da6306426f8b8))
- typescript lint for test files ([#778](https://github.com/RequestNetwork/requestNetwork/issues/778)) ([048e876](https://github.com/RequestNetwork/requestNetwork/commit/048e876a905516be0de8a31d446e4572eb74eccb))
- upgrade ethers to 5.2.0 ([#532](https://github.com/RequestNetwork/requestNetwork/issues/532)) ([6c7cf35](https://github.com/RequestNetwork/requestNetwork/commit/6c7cf350a04e280b77ce6fd758b6f065f28fd1cc))

### Features

- add declarative payment network for erc20 ([#635](https://github.com/RequestNetwork/requestNetwork/issues/635)) ([ecf4a9d](https://github.com/RequestNetwork/requestNetwork/commit/ecf4a9d5515d5eea59e017b9aaf89c133421d71b)), closes [#631](https://github.com/RequestNetwork/requestNetwork/issues/631) [#633](https://github.com/RequestNetwork/requestNetwork/issues/633) [#636](https://github.com/RequestNetwork/requestNetwork/issues/636) [#637](https://github.com/RequestNetwork/requestNetwork/issues/637) [#638](https://github.com/RequestNetwork/requestNetwork/issues/638) [#550](https://github.com/RequestNetwork/requestNetwork/issues/550)
- add delegate in request client ([#541](https://github.com/RequestNetwork/requestNetwork/issues/541)) ([253b308](https://github.com/RequestNetwork/requestNetwork/commit/253b30847f261840508a14cabf5dea93bb7c5dba))
- add extension data at request creation ([#897](https://github.com/RequestNetwork/requestNetwork/issues/897)) ([1ca2363](https://github.com/RequestNetwork/requestNetwork/commit/1ca2363b08284fe04e481cccdf768db0f5016e24))
- add streamEventName to streaming event parameters ([#908](https://github.com/RequestNetwork/requestNetwork/issues/908)) ([e870f03](https://github.com/RequestNetwork/requestNetwork/commit/e870f03e51839f4cfb6bea8a342da21eef76f619))
- any to near advanced logic ([#842](https://github.com/RequestNetwork/requestNetwork/issues/842)) ([ac79133](https://github.com/RequestNetwork/requestNetwork/commit/ac791339a0f228b622c43f3a5ffa243c40311196))
- erc777 superfluid get balance of subsequent requests ([#900](https://github.com/RequestNetwork/requestNetwork/issues/900)) ([fd491d0](https://github.com/RequestNetwork/requestNetwork/commit/fd491d07bfc48d5f5d2a9cd112d28a2485fea9aa))
- goerli storage ([#890](https://github.com/RequestNetwork/requestNetwork/issues/890)) ([6aa9849](https://github.com/RequestNetwork/requestNetwork/commit/6aa9849e7c5795de6ec3cbd2a1607af15416a833))
- near conversion payment detector ([#920](https://github.com/RequestNetwork/requestNetwork/issues/920)) ([8b851e7](https://github.com/RequestNetwork/requestNetwork/commit/8b851e7fd634ad9f92bc6e83280d68da3e306bfe))
- near conversion payment processor ([#921](https://github.com/RequestNetwork/requestNetwork/issues/921)) ([af836c2](https://github.com/RequestNetwork/requestNetwork/commit/af836c29405adbeb994af24e324e83b57a07997f))
- **declarative:** payment reference ([#901](https://github.com/RequestNetwork/requestNetwork/issues/901)) ([2679368](https://github.com/RequestNetwork/requestNetwork/commit/2679368241ea8e34fc88f60eb395459c3c277029))
- **smart-contracts:** batch conversion ([#877](https://github.com/RequestNetwork/requestNetwork/issues/877)) ([2000058](https://github.com/RequestNetwork/requestNetwork/commit/20000587318107e97742688f69ba561868e39f8f))
- add network as declarative params ([#665](https://github.com/RequestNetwork/requestNetwork/issues/665)) ([e3a4515](https://github.com/RequestNetwork/requestNetwork/commit/e3a4515e23261b79a377ff8ce3d7a5c8d8e84127))
- address based pn inherits from declarative ([#620](https://github.com/RequestNetwork/requestNetwork/issues/620)) ([cb9695e](https://github.com/RequestNetwork/requestNetwork/commit/cb9695eb9bf0c0180b1524a11aab9e52c5f3299b))
- escrow detector class ([#773](https://github.com/RequestNetwork/requestNetwork/issues/773)) ([c4c2276](https://github.com/RequestNetwork/requestNetwork/commit/c4c22765df68a6438e4a0e9bc3d6255e844da791))
- Escrow payment detection library ([#712](https://github.com/RequestNetwork/requestNetwork/issues/712)) ([5b2bd70](https://github.com/RequestNetwork/requestNetwork/commit/5b2bd7066049b843bb33ddc498220aa4e3741ee0))
- implementation of delegation in declarative pn ([#535](https://github.com/RequestNetwork/requestNetwork/issues/535)) ([cf4eac7](https://github.com/RequestNetwork/requestNetwork/commit/cf4eac7665f5d797e2768c888fc87f470fe4f8cf))
- native tokens payment extension ([#574](https://github.com/RequestNetwork/requestNetwork/issues/574)) ([0d2bb4f](https://github.com/RequestNetwork/requestNetwork/commit/0d2bb4fb28a6099d8a87b740061d350b10255c60))
- Near detection with autobahn ([#576](https://github.com/RequestNetwork/requestNetwork/issues/576)) ([86e0145](https://github.com/RequestNetwork/requestNetwork/commit/86e01459a6b32dacfa778434226f374f7668786c))
- optionally disable events ([#469](https://github.com/RequestNetwork/requestNetwork/issues/469)) ([e16a926](https://github.com/RequestNetwork/requestNetwork/commit/e16a926cc182a0048909de5cfe1cdd5f9772a153))
- payment detection for ethereum fee proxy ([#585](https://github.com/RequestNetwork/requestNetwork/issues/585)) ([c78803f](https://github.com/RequestNetwork/requestNetwork/commit/c78803fb1333917b843db935df0114a50e294f5f))
- Payment detection for the any to erc20 payment network ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6f7338f](https://github.com/RequestNetwork/requestNetwork/commit/6f7338f42ddf793a733a31b434d6116beebefdf6))
- payment network any to erc20 in advanced logic ([#414](https://github.com/RequestNetwork/requestNetwork/issues/414)) ([45f09f9](https://github.com/RequestNetwork/requestNetwork/commit/45f09f9ee5693378722559d414b07e887fb3c63c))
- Payment network any-to-eth in the advanced logic ([#599](https://github.com/RequestNetwork/requestNetwork/issues/599)) ([4f113c9](https://github.com/RequestNetwork/requestNetwork/commit/4f113c9b5c9df9adfccc828a4f64b5c6e6f12b49))
- Payment network any-to-eth in the payment detection ([#605](https://github.com/RequestNetwork/requestNetwork/issues/605)) ([b830d46](https://github.com/RequestNetwork/requestNetwork/commit/b830d4690625754c33c4a6262d96e490de768a10))
- Payment network any-to-eth in the payment processor ([#610](https://github.com/RequestNetwork/requestNetwork/issues/610)) ([a7c12ac](https://github.com/RequestNetwork/requestNetwork/commit/a7c12ac3c28dd6b4f144f10bad1223ed5c48d02e))
- payment network ethereum fee proxy in advanced logic ([#582](https://github.com/RequestNetwork/requestNetwork/issues/582)) ([b32c85d](https://github.com/RequestNetwork/requestNetwork/commit/b32c85de82cf6aea6ac7f406e339180f7e2d9218))
- payment processing for ethereum fee proxy ([#587](https://github.com/RequestNetwork/requestNetwork/issues/587)) ([2b1c04c](https://github.com/RequestNetwork/requestNetwork/commit/2b1c04c112b732431fdfd342da8c60f233ef0819))
- reference calculator command ([#802](https://github.com/RequestNetwork/requestNetwork/issues/802)) ([7e9b380](https://github.com/RequestNetwork/requestNetwork/commit/7e9b3801a5d2fab19ec05adcde13584f9b50a5f3))
- retrieve active escrow data ([#818](https://github.com/RequestNetwork/requestNetwork/issues/818)) ([0bcf58c](https://github.com/RequestNetwork/requestNetwork/commit/0bcf58cdad76d42320f22065207f82455d4a12fe))
- sf advanced logic subsequent request ([#899](https://github.com/RequestNetwork/requestNetwork/issues/899)) ([43adccf](https://github.com/RequestNetwork/requestNetwork/commit/43adccff2b99e3268ea21e1a23b3a7f3cbdf3461))
- split data-access read and write for TheGraph ([#875](https://github.com/RequestNetwork/requestNetwork/issues/875)) ([8fdf34d](https://github.com/RequestNetwork/requestNetwork/commit/8fdf34d280a5c277125fa431d74976be69768d38))
- SuperFluid advanced logic ([#797](https://github.com/RequestNetwork/requestNetwork/issues/797)) ([de5ef06](https://github.com/RequestNetwork/requestNetwork/commit/de5ef06e50a7950d49d35dfe318c01190a6a91e5))
- **request-node:** TheGraph as data access ([#717](https://github.com/RequestNetwork/requestNetwork/issues/717)) ([651e77f](https://github.com/RequestNetwork/requestNetwork/commit/651e77f5fbb1f1c18d01381a8e439029e1d61f30))
- xdai gas price ([#457](https://github.com/RequestNetwork/requestNetwork/issues/457)) ([8f0822d](https://github.com/RequestNetwork/requestNetwork/commit/8f0822de91cb2d9f617fa94c4d11dcd9adf806b2))

# [0.35.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.29.0...@requestnetwork/types@0.35.0) (2021-06-22)

### Bug Fixes

- invoice total types + upgrade ethers ([#514](https://github.com/RequestNetwork/requestNetwork/issues/514)) ([c2b98b2](https://github.com/RequestNetwork/requestNetwork/commit/c2b98b2bd3c93f063f340d58c6b95ad026fd9519))

### Features

- optionally disable events ([#469](https://github.com/RequestNetwork/requestNetwork/issues/469)) ([e16a926](https://github.com/RequestNetwork/requestNetwork/commit/e16a926cc182a0048909de5cfe1cdd5f9772a153))
- Payment detection for the any to erc20 payment network ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6f7338f](https://github.com/RequestNetwork/requestNetwork/commit/6f7338f42ddf793a733a31b434d6116beebefdf6))
- payment network any to erc20 in advanced logic ([#414](https://github.com/RequestNetwork/requestNetwork/issues/414)) ([45f09f9](https://github.com/RequestNetwork/requestNetwork/commit/45f09f9ee5693378722559d414b07e887fb3c63c))
- xdai gas price ([#457](https://github.com/RequestNetwork/requestNetwork/issues/457)) ([8f0822d](https://github.com/RequestNetwork/requestNetwork/commit/8f0822de91cb2d9f617fa94c4d11dcd9adf806b2))

# [0.34.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.29.0...@requestnetwork/types@0.34.0) (2021-05-12)

### Features

- optionally disable events ([#469](https://github.com/RequestNetwork/requestNetwork/issues/469)) ([e16a926](https://github.com/RequestNetwork/requestNetwork/commit/e16a926cc182a0048909de5cfe1cdd5f9772a153))
- Payment detection for the any to erc20 payment network ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6f7338f](https://github.com/RequestNetwork/requestNetwork/commit/6f7338f42ddf793a733a31b434d6116beebefdf6))
- payment network any to erc20 in advanced logic ([#414](https://github.com/RequestNetwork/requestNetwork/issues/414)) ([45f09f9](https://github.com/RequestNetwork/requestNetwork/commit/45f09f9ee5693378722559d414b07e887fb3c63c))
- xdai gas price ([#457](https://github.com/RequestNetwork/requestNetwork/issues/457)) ([8f0822d](https://github.com/RequestNetwork/requestNetwork/commit/8f0822de91cb2d9f617fa94c4d11dcd9adf806b2))

# [0.33.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.29.0...@requestnetwork/types@0.33.0) (2021-04-19)

### Features

- optionally disable events ([#469](https://github.com/RequestNetwork/requestNetwork/issues/469)) ([e16a926](https://github.com/RequestNetwork/requestNetwork/commit/e16a926cc182a0048909de5cfe1cdd5f9772a153))
- Payment detection for the any to erc20 payment network ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6f7338f](https://github.com/RequestNetwork/requestNetwork/commit/6f7338f42ddf793a733a31b434d6116beebefdf6))
- payment network any to erc20 in advanced logic ([#414](https://github.com/RequestNetwork/requestNetwork/issues/414)) ([45f09f9](https://github.com/RequestNetwork/requestNetwork/commit/45f09f9ee5693378722559d414b07e887fb3c63c))
- xdai gas price ([#457](https://github.com/RequestNetwork/requestNetwork/issues/457)) ([8f0822d](https://github.com/RequestNetwork/requestNetwork/commit/8f0822de91cb2d9f617fa94c4d11dcd9adf806b2))

# [0.32.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.29.0...@requestnetwork/types@0.32.0) (2021-03-25)

### Features

- Payment detection for the any to erc20 payment network ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6f7338f](https://github.com/RequestNetwork/requestNetwork/commit/6f7338f42ddf793a733a31b434d6116beebefdf6))
- payment network any to erc20 in advanced logic ([#414](https://github.com/RequestNetwork/requestNetwork/issues/414)) ([45f09f9](https://github.com/RequestNetwork/requestNetwork/commit/45f09f9ee5693378722559d414b07e887fb3c63c))
- xdai gas price ([#457](https://github.com/RequestNetwork/requestNetwork/issues/457)) ([8f0822d](https://github.com/RequestNetwork/requestNetwork/commit/8f0822de91cb2d9f617fa94c4d11dcd9adf806b2))

# [0.31.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.29.0...@requestnetwork/types@0.31.0) (2021-03-15)

### Features

- Payment detection for the any to erc20 payment network ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6f7338f](https://github.com/RequestNetwork/requestNetwork/commit/6f7338f42ddf793a733a31b434d6116beebefdf6))
- payment network any to erc20 in advanced logic ([#414](https://github.com/RequestNetwork/requestNetwork/issues/414)) ([45f09f9](https://github.com/RequestNetwork/requestNetwork/commit/45f09f9ee5693378722559d414b07e887fb3c63c))

# [0.30.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.29.0...@requestnetwork/types@0.30.0) (2021-03-03)

### Features

- payment network any to erc20 in advanced logic ([#414](https://github.com/RequestNetwork/requestNetwork/issues/414)) ([45f09f9](https://github.com/RequestNetwork/requestNetwork/commit/45f09f9ee5693378722559d414b07e887fb3c63c))

## [0.29.3](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.29.0...@requestnetwork/types@0.29.3) (2021-02-22)

**Note:** Version bump only for package @requestnetwork/types

## [0.29.2](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.29.0...@requestnetwork/types@0.29.2) (2020-12-22)

**Note:** Version bump only for package @requestnetwork/types

## [0.29.1](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.29.0...@requestnetwork/types@0.29.1) (2020-12-21)

**Note:** Version bump only for package @requestnetwork/types

# [0.29.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.29.0) (2020-12-02)

# 0.26.0 (2020-10-14)

### Bug Fixes

- enhance node synchronization and storing of ignored data ([#205](https://github.com/RequestNetwork/requestNetwork/issues/205)) ([fb6add2](https://github.com/RequestNetwork/requestNetwork/commit/fb6add27b0507e5db3a19682dbcda90274ab19f1))
- topic can be any not only string ([#219](https://github.com/RequestNetwork/requestNetwork/issues/219)) ([8d8b601](https://github.com/RequestNetwork/requestNetwork/commit/8d8b6014759ca50b1152b98b1faf4888b732b327))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- remove hash in encrypted transaction ([#232](https://github.com/RequestNetwork/requestNetwork/issues/232)) ([d58f101](https://github.com/RequestNetwork/requestNetwork/commit/d58f101f9f76e408671dd1edb0d67863d1c8abd5))
- replace symmetric encryption algorithm by aes-256-gcm ([#233](https://github.com/RequestNetwork/requestNetwork/issues/233)) ([969bebe](https://github.com/RequestNetwork/requestNetwork/commit/969bebeb99b4bc2fdd31405a162934cfdff6db05))

# 0.16.0 (2020-04-21)

### Features

- add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
- emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))
- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

# [0.28.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.28.0) (2020-11-12)

# 0.26.0 (2020-10-14)

### Bug Fixes

- enhance node synchronization and storing of ignored data ([#205](https://github.com/RequestNetwork/requestNetwork/issues/205)) ([fb6add2](https://github.com/RequestNetwork/requestNetwork/commit/fb6add27b0507e5db3a19682dbcda90274ab19f1))
- topic can be any not only string ([#219](https://github.com/RequestNetwork/requestNetwork/issues/219)) ([8d8b601](https://github.com/RequestNetwork/requestNetwork/commit/8d8b6014759ca50b1152b98b1faf4888b732b327))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- remove hash in encrypted transaction ([#232](https://github.com/RequestNetwork/requestNetwork/issues/232)) ([d58f101](https://github.com/RequestNetwork/requestNetwork/commit/d58f101f9f76e408671dd1edb0d67863d1c8abd5))
- replace symmetric encryption algorithm by aes-256-gcm ([#233](https://github.com/RequestNetwork/requestNetwork/issues/233)) ([969bebe](https://github.com/RequestNetwork/requestNetwork/commit/969bebeb99b4bc2fdd31405a162934cfdff6db05))

# 0.16.0 (2020-04-21)

### Features

- add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
- emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))
- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

# [0.27.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.27.0) (2020-11-05)

# 0.26.0 (2020-10-14)

### Bug Fixes

- enhance node synchronization and storing of ignored data ([#205](https://github.com/RequestNetwork/requestNetwork/issues/205)) ([fb6add2](https://github.com/RequestNetwork/requestNetwork/commit/fb6add27b0507e5db3a19682dbcda90274ab19f1))
- topic can be any not only string ([#219](https://github.com/RequestNetwork/requestNetwork/issues/219)) ([8d8b601](https://github.com/RequestNetwork/requestNetwork/commit/8d8b6014759ca50b1152b98b1faf4888b732b327))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- remove hash in encrypted transaction ([#232](https://github.com/RequestNetwork/requestNetwork/issues/232)) ([d58f101](https://github.com/RequestNetwork/requestNetwork/commit/d58f101f9f76e408671dd1edb0d67863d1c8abd5))
- replace symmetric encryption algorithm by aes-256-gcm ([#233](https://github.com/RequestNetwork/requestNetwork/issues/233)) ([969bebe](https://github.com/RequestNetwork/requestNetwork/commit/969bebeb99b4bc2fdd31405a162934cfdff6db05))

# 0.16.0 (2020-04-21)

### Features

- add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
- emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))
- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

# [0.26.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.26.0) (2020-10-21)

# 0.26.0 (2020-10-14)

### Bug Fixes

- enhance node synchronization and storing of ignored data ([#205](https://github.com/RequestNetwork/requestNetwork/issues/205)) ([fb6add2](https://github.com/RequestNetwork/requestNetwork/commit/fb6add27b0507e5db3a19682dbcda90274ab19f1))
- topic can be any not only string ([#219](https://github.com/RequestNetwork/requestNetwork/issues/219)) ([8d8b601](https://github.com/RequestNetwork/requestNetwork/commit/8d8b6014759ca50b1152b98b1faf4888b732b327))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- remove hash in encrypted transaction ([#232](https://github.com/RequestNetwork/requestNetwork/issues/232)) ([d58f101](https://github.com/RequestNetwork/requestNetwork/commit/d58f101f9f76e408671dd1edb0d67863d1c8abd5))
- replace symmetric encryption algorithm by aes-256-gcm ([#233](https://github.com/RequestNetwork/requestNetwork/issues/233)) ([969bebe](https://github.com/RequestNetwork/requestNetwork/commit/969bebeb99b4bc2fdd31405a162934cfdff6db05))

# 0.16.0 (2020-04-21)

### Features

- add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
- emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))
- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

# [0.25.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.25.0) (2020-10-14)

### Bug Fixes

- enhance node synchronization and storing of ignored data ([#205](https://github.com/RequestNetwork/requestNetwork/issues/205)) ([fb6add2](https://github.com/RequestNetwork/requestNetwork/commit/fb6add27b0507e5db3a19682dbcda90274ab19f1))
- topic can be any not only string ([#219](https://github.com/RequestNetwork/requestNetwork/issues/219)) ([8d8b601](https://github.com/RequestNetwork/requestNetwork/commit/8d8b6014759ca50b1152b98b1faf4888b732b327))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- remove hash in encrypted transaction ([#232](https://github.com/RequestNetwork/requestNetwork/issues/232)) ([d58f101](https://github.com/RequestNetwork/requestNetwork/commit/d58f101f9f76e408671dd1edb0d67863d1c8abd5))
- replace symmetric encryption algorithm by aes-256-gcm ([#233](https://github.com/RequestNetwork/requestNetwork/issues/233)) ([969bebe](https://github.com/RequestNetwork/requestNetwork/commit/969bebeb99b4bc2fdd31405a162934cfdff6db05))

# 0.16.0 (2020-04-21)

### Features

- add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
- emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))
- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

# [0.24.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.24.0) (2020-10-13)

### Bug Fixes

- enhance node synchronization and storing of ignored data ([#205](https://github.com/RequestNetwork/requestNetwork/issues/205)) ([fb6add2](https://github.com/RequestNetwork/requestNetwork/commit/fb6add27b0507e5db3a19682dbcda90274ab19f1))
- topic can be any not only string ([#219](https://github.com/RequestNetwork/requestNetwork/issues/219)) ([8d8b601](https://github.com/RequestNetwork/requestNetwork/commit/8d8b6014759ca50b1152b98b1faf4888b732b327))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- remove hash in encrypted transaction ([#232](https://github.com/RequestNetwork/requestNetwork/issues/232)) ([d58f101](https://github.com/RequestNetwork/requestNetwork/commit/d58f101f9f76e408671dd1edb0d67863d1c8abd5))
- replace symmetric encryption algorithm by aes-256-gcm ([#233](https://github.com/RequestNetwork/requestNetwork/issues/233)) ([969bebe](https://github.com/RequestNetwork/requestNetwork/commit/969bebeb99b4bc2fdd31405a162934cfdff6db05))

# 0.16.0 (2020-04-21)

### Features

- add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
- emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))
- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

# [0.23.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.23.0) (2020-10-09)

### Bug Fixes

- enhance node synchronization and storing of ignored data ([#205](https://github.com/RequestNetwork/requestNetwork/issues/205)) ([fb6add2](https://github.com/RequestNetwork/requestNetwork/commit/fb6add27b0507e5db3a19682dbcda90274ab19f1))
- topic can be any not only string ([#219](https://github.com/RequestNetwork/requestNetwork/issues/219)) ([8d8b601](https://github.com/RequestNetwork/requestNetwork/commit/8d8b6014759ca50b1152b98b1faf4888b732b327))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- remove hash in encrypted transaction ([#232](https://github.com/RequestNetwork/requestNetwork/issues/232)) ([d58f101](https://github.com/RequestNetwork/requestNetwork/commit/d58f101f9f76e408671dd1edb0d67863d1c8abd5))
- replace symmetric encryption algorithm by aes-256-gcm ([#233](https://github.com/RequestNetwork/requestNetwork/issues/233)) ([969bebe](https://github.com/RequestNetwork/requestNetwork/commit/969bebeb99b4bc2fdd31405a162934cfdff6db05))

# 0.16.0 (2020-04-21)

### Features

- add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
- emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))
- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

# [0.22.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.22.0) (2020-09-28)

### Bug Fixes

- enhance node synchronization and storing of ignored data ([#205](https://github.com/RequestNetwork/requestNetwork/issues/205)) ([fb6add2](https://github.com/RequestNetwork/requestNetwork/commit/fb6add27b0507e5db3a19682dbcda90274ab19f1))
- topic can be any not only string ([#219](https://github.com/RequestNetwork/requestNetwork/issues/219)) ([8d8b601](https://github.com/RequestNetwork/requestNetwork/commit/8d8b6014759ca50b1152b98b1faf4888b732b327))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- remove hash in encrypted transaction ([#232](https://github.com/RequestNetwork/requestNetwork/issues/232)) ([d58f101](https://github.com/RequestNetwork/requestNetwork/commit/d58f101f9f76e408671dd1edb0d67863d1c8abd5))
- replace symmetric encryption algorithm by aes-256-gcm ([#233](https://github.com/RequestNetwork/requestNetwork/issues/233)) ([969bebe](https://github.com/RequestNetwork/requestNetwork/commit/969bebeb99b4bc2fdd31405a162934cfdff6db05))

# 0.16.0 (2020-04-21)

### Features

- add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
- emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))
- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

# [0.21.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.21.0) (2020-09-18)

### Bug Fixes

- enhance node synchronization and storing of ignored data ([#205](https://github.com/RequestNetwork/requestNetwork/issues/205)) ([fb6add2](https://github.com/RequestNetwork/requestNetwork/commit/fb6add27b0507e5db3a19682dbcda90274ab19f1))
- topic can be any not only string ([#219](https://github.com/RequestNetwork/requestNetwork/issues/219)) ([8d8b601](https://github.com/RequestNetwork/requestNetwork/commit/8d8b6014759ca50b1152b98b1faf4888b732b327))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- remove hash in encrypted transaction ([#232](https://github.com/RequestNetwork/requestNetwork/issues/232)) ([d58f101](https://github.com/RequestNetwork/requestNetwork/commit/d58f101f9f76e408671dd1edb0d67863d1c8abd5))
- replace symmetric encryption algorithm by aes-256-gcm ([#233](https://github.com/RequestNetwork/requestNetwork/issues/233)) ([969bebe](https://github.com/RequestNetwork/requestNetwork/commit/969bebeb99b4bc2fdd31405a162934cfdff6db05))

# 0.16.0 (2020-04-21)

### Features

- add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
- emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))
- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

# [0.20.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.20.0) (2020-09-01)

### Bug Fixes

- enhance node synchronization and storing of ignored data ([#205](https://github.com/RequestNetwork/requestNetwork/issues/205)) ([fb6add2](https://github.com/RequestNetwork/requestNetwork/commit/fb6add27b0507e5db3a19682dbcda90274ab19f1))
- topic can be any not only string ([#219](https://github.com/RequestNetwork/requestNetwork/issues/219)) ([8d8b601](https://github.com/RequestNetwork/requestNetwork/commit/8d8b6014759ca50b1152b98b1faf4888b732b327))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- remove hash in encrypted transaction ([#232](https://github.com/RequestNetwork/requestNetwork/issues/232)) ([d58f101](https://github.com/RequestNetwork/requestNetwork/commit/d58f101f9f76e408671dd1edb0d67863d1c8abd5))
- replace symmetric encryption algorithm by aes-256-gcm ([#233](https://github.com/RequestNetwork/requestNetwork/issues/233)) ([969bebe](https://github.com/RequestNetwork/requestNetwork/commit/969bebeb99b4bc2fdd31405a162934cfdff6db05))

# 0.16.0 (2020-04-21)

### Features

- add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
- emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))
- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

# [0.19.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.19.0) (2020-08-27)

### Bug Fixes

- enhance node synchronization and storing of ignored data ([#205](https://github.com/RequestNetwork/requestNetwork/issues/205)) ([fb6add2](https://github.com/RequestNetwork/requestNetwork/commit/fb6add27b0507e5db3a19682dbcda90274ab19f1))
- topic can be any not only string ([#219](https://github.com/RequestNetwork/requestNetwork/issues/219)) ([8d8b601](https://github.com/RequestNetwork/requestNetwork/commit/8d8b6014759ca50b1152b98b1faf4888b732b327))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- remove hash in encrypted transaction ([#232](https://github.com/RequestNetwork/requestNetwork/issues/232)) ([d58f101](https://github.com/RequestNetwork/requestNetwork/commit/d58f101f9f76e408671dd1edb0d67863d1c8abd5))
- replace symmetric encryption algorithm by aes-256-gcm ([#233](https://github.com/RequestNetwork/requestNetwork/issues/233)) ([969bebe](https://github.com/RequestNetwork/requestNetwork/commit/969bebeb99b4bc2fdd31405a162934cfdff6db05))

# 0.16.0 (2020-04-21)

### Features

- add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
- emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))
- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

# [0.18.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.18.0) (2020-08-13)

### Bug Fixes

- enhance node synchronization and storing of ignored data ([#205](https://github.com/RequestNetwork/requestNetwork/issues/205)) ([fb6add2](https://github.com/RequestNetwork/requestNetwork/commit/fb6add27b0507e5db3a19682dbcda90274ab19f1))
- topic can be any not only string ([#219](https://github.com/RequestNetwork/requestNetwork/issues/219)) ([8d8b601](https://github.com/RequestNetwork/requestNetwork/commit/8d8b6014759ca50b1152b98b1faf4888b732b327))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- ERC20 fees payment network extension ([#251](https://github.com/RequestNetwork/requestNetwork/issues/251)) ([95af529](https://github.com/RequestNetwork/requestNetwork/commit/95af529c168734ea5018d9220c127fe115f2ac37))
- remove hash in encrypted transaction ([#232](https://github.com/RequestNetwork/requestNetwork/issues/232)) ([d58f101](https://github.com/RequestNetwork/requestNetwork/commit/d58f101f9f76e408671dd1edb0d67863d1c8abd5))
- replace symmetric encryption algorithm by aes-256-gcm ([#233](https://github.com/RequestNetwork/requestNetwork/issues/233)) ([969bebe](https://github.com/RequestNetwork/requestNetwork/commit/969bebeb99b4bc2fdd31405a162934cfdff6db05))

# 0.16.0 (2020-04-21)

### Features

- add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
- emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))
- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

# [0.17.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.17.0) (2020-06-29)

### Bug Fixes

- enhance node synchronization and storing of ignored data ([#205](https://github.com/RequestNetwork/requestNetwork/issues/205)) ([fb6add2](https://github.com/RequestNetwork/requestNetwork/commit/fb6add27b0507e5db3a19682dbcda90274ab19f1))
- topic can be any not only string ([#219](https://github.com/RequestNetwork/requestNetwork/issues/219)) ([8d8b601](https://github.com/RequestNetwork/requestNetwork/commit/8d8b6014759ca50b1152b98b1faf4888b732b327))

### Features

- add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))
- add the identity ethereumSmartContract to the request logic ([#218](https://github.com/RequestNetwork/requestNetwork/issues/218)) ([66d97e0](https://github.com/RequestNetwork/requestNetwork/commit/66d97e00dee7305088cb94a0edf542fe4d0bbd56))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- remove hash in encrypted transaction ([#232](https://github.com/RequestNetwork/requestNetwork/issues/232)) ([d58f101](https://github.com/RequestNetwork/requestNetwork/commit/d58f101f9f76e408671dd1edb0d67863d1c8abd5))
- replace symmetric encryption algorithm by aes-256-gcm ([#233](https://github.com/RequestNetwork/requestNetwork/issues/233)) ([969bebe](https://github.com/RequestNetwork/requestNetwork/commit/969bebeb99b4bc2fdd31405a162934cfdff6db05))

# 0.16.0 (2020-04-21)

### Features

- add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
- emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))
- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

# [0.16.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.16.0) (2020-05-04)

### Bug Fixes

- enhance node synchronization and storing of ignored data ([#205](https://github.com/RequestNetwork/requestNetwork/issues/205)) ([fb6add2](https://github.com/RequestNetwork/requestNetwork/commit/fb6add27b0507e5db3a19682dbcda90274ab19f1))

### Features

- add getIgnoredData() to the ethereum storage ([#206](https://github.com/RequestNetwork/requestNetwork/issues/206)) ([255d2dc](https://github.com/RequestNetwork/requestNetwork/commit/255d2dc22ce0158ba3e6ce6766efece6e4c054cb))

# 0.16.0 (2020-04-21)

### Features

- add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
- emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))
- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

# [0.15.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.15.0) (2020-04-21)

### Features

- add an option to disable payment detection in the request client ([#201](https://github.com/RequestNetwork/requestNetwork/issues/201)) ([035302f](https://github.com/RequestNetwork/requestNetwork/commit/035302f70f86fe914d2970417c4b55a6e0a32eda))
- add entry point to request node to get monitoring status ([#191](https://github.com/RequestNetwork/requestNetwork/issues/191)) ([1d9c239](https://github.com/RequestNetwork/requestNetwork/commit/1d9c239f5de5143cd54c3470b42786eff17748f6))

# 0.15.0 (2020-04-06)

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
- emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))
- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

# [0.14.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.14.0) (2020-04-06)

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
- emits "error" event when the confirmation fails ([#179](https://github.com/RequestNetwork/requestNetwork/issues/179)) ([73bfcfb](https://github.com/RequestNetwork/requestNetwork/commit/73bfcfb5f6a54d2036a47e09ce180a00c12a81ae))
- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

# [0.13.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.13.0) (2020-03-23)

### Features

- add the confirmed events in the highest layers ([#141](https://github.com/RequestNetwork/requestNetwork/issues/141)) ([7f9b756](https://github.com/RequestNetwork/requestNetwork/commit/7f9b756d51b20fbd45971f4db3e9865b75f2d265))
- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

# [0.12.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.12.0) (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- buffered ethereum storage ([#113](https://github.com/RequestNetwork/requestNetwork/issues/113)) ([fe4ece6](https://github.com/RequestNetwork/requestNetwork/commit/fe4ece6a1768155182be2d3ebb2908501f571912))
- confirmed & pending state in the highest layers ([#119](https://github.com/RequestNetwork/requestNetwork/issues/119)) ([9424dc0](https://github.com/RequestNetwork/requestNetwork/commit/9424dc0c9482208fdbe714f8d29f5deed68711de))
- persist transaction with custom ethereum provider ([#106](https://github.com/RequestNetwork/requestNetwork/issues/106)) ([61b215f](https://github.com/RequestNetwork/requestNetwork/commit/61b215fb8335d01dfa069d7f7899dd5b33749692))

# 0.12.0 (2020-01-16)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

# [0.11.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.11.0) (2020-01-16)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

# [0.10.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.10.0) (2019-12-18)

### Features

- **advanced-logic:** add ERC20 proxy contract payment network ([#74](https://github.com/RequestNetwork/requestNetwork/issues/74)) ([031a374](https://github.com/RequestNetwork/requestNetwork/commit/031a3742d2dddc0324e75b7853287d252bf43c6c))

# 0.10.0 (2019-12-04)

## [0.9.1](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.9.0...@requestnetwork/types@0.9.1) (2019-12-04)

**Note:** Version bump only for package @requestnetwork/types

# [0.9.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.8.0...@requestnetwork/types@0.9.0) (2019-11-20)

### Features

- ETH payement network in advanced-logic ([#589](https://github.com/RequestNetwork/requestNetwork/issues/589)) ([7b32ce8](https://github.com/RequestNetwork/requestNetwork/commit/7b32ce84c23ee723a143d752fb93786a6c5cc813))
- validate role for increase & decrease ([#590](https://github.com/RequestNetwork/requestNetwork/issues/590)) ([4793782](https://github.com/RequestNetwork/requestNetwork/commit/47937828a0f42e912eda440be4e277f26aa51bdb))
- Validation of accept, cancel and add extension data ([#599](https://github.com/RequestNetwork/requestNetwork/issues/599)) ([8f7798e](https://github.com/RequestNetwork/requestNetwork/commit/8f7798e6e71819e5201efaf73678ff5b71b52503))

# [0.8.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.7.0...@requestnetwork/types@0.8.0) (2019-10-21)

### Features

- add ERC20 payment network ([#568](https://github.com/RequestNetwork/requestNetwork/issues/568)) ([8d820d4](https://github.com/RequestNetwork/requestNetwork/commit/8d820d4))
- add multi-format package to serialize and deserialize data ([#546](https://github.com/RequestNetwork/requestNetwork/issues/546)) ([2b03cd1](https://github.com/RequestNetwork/requestNetwork/commit/2b03cd1))

# [0.7.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.6.0...@requestnetwork/types@0.7.0) (2019-09-16)

### Features

- **data-access:** get channels from multiple topics ([#527](https://github.com/RequestNetwork/requestNetwork/issues/527)) ([bdebab7](https://github.com/RequestNetwork/requestNetwork/commit/bdebab7))
- **transaction-manager:** add transaction to an existing encrypted channel ([#524](https://github.com/RequestNetwork/requestNetwork/issues/524)) ([027a0f5](https://github.com/RequestNetwork/requestNetwork/commit/027a0f5))
- get requests by multiple topics or multiple identities ([#530](https://github.com/RequestNetwork/requestNetwork/issues/530)) ([8fe7d30](https://github.com/RequestNetwork/requestNetwork/commit/8fe7d30))

# [0.6.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.5.0...@requestnetwork/types@0.6.0) (2019-09-05)

### Bug Fixes

- Encryption channel use multi-format for identity instead of hash ([#501](https://github.com/RequestNetwork/requestNetwork/issues/501)) ([500a724](https://github.com/RequestNetwork/requestNetwork/commit/500a724))

### Features

- Transaction-manager: ignore the wrong transactions of channels ([#514](https://github.com/RequestNetwork/requestNetwork/issues/514)) ([4ec82c6](https://github.com/RequestNetwork/requestNetwork/commit/4ec82c6))
- **transaction-manager:** decrypt channels ([#516](https://github.com/RequestNetwork/requestNetwork/issues/516)) ([8142c3d](https://github.com/RequestNetwork/requestNetwork/commit/8142c3d))

# [0.5.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.4.0...@requestnetwork/types@0.5.0) (2019-08-19)

### Features

- add ECIES Encryption in types and utils packages ([#488](https://github.com/RequestNetwork/requestNetwork/issues/488)) ([0252903](https://github.com/RequestNetwork/requestNetwork/commit/0252903))
- Ethereum Private key (Epk) decryption provider implementation ([#499](https://github.com/RequestNetwork/requestNetwork/issues/499)) ([207b762](https://github.com/RequestNetwork/requestNetwork/commit/207b762))
- persist encrypted transaction in transaction manager ([#495](https://github.com/RequestNetwork/requestNetwork/issues/495)) ([7523f93](https://github.com/RequestNetwork/requestNetwork/commit/7523f93))
- Request logic: create encrypted request ([#496](https://github.com/RequestNetwork/requestNetwork/issues/496)) ([9f1ebe6](https://github.com/RequestNetwork/requestNetwork/commit/9f1ebe6))

# [0.3.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.1.1-alpha.3...@requestnetwork/types@0.3.0) (2019-07-24)

### Features

- add concurrent readMany to storage layer ([#363](https://github.com/RequestNetwork/requestNetwork/issues/363)) ([db3f484](https://github.com/RequestNetwork/requestNetwork/commit/db3f484))
- add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
- add IPFS peer for faster IPFS retrieval, and check IPFS and Ethereum nodes connections ([#353](https://github.com/RequestNetwork/requestNetwork/issues/353)) ([47358c2](https://github.com/RequestNetwork/requestNetwork/commit/47358c2))
- add logging interfaces and default logger ([#397](https://github.com/RequestNetwork/requestNetwork/issues/397)) ([f83a716](https://github.com/RequestNetwork/requestNetwork/commit/f83a716))
- add request node logger ([#416](https://github.com/RequestNetwork/requestNetwork/issues/416)) ([8d56ade](https://github.com/RequestNetwork/requestNetwork/commit/8d56ade))
- additional node logs to show progress and logLevel option ([#338](https://github.com/RequestNetwork/requestNetwork/issues/338)) ([38559f4](https://github.com/RequestNetwork/requestNetwork/commit/38559f4))
- asynchronously pin IPFS files in batches ([#403](https://github.com/RequestNetwork/requestNetwork/issues/403)) ([926c22b](https://github.com/RequestNetwork/requestNetwork/commit/926c22b))
- class to get Ethereum block information in storage ([#283](https://github.com/RequestNetwork/requestNetwork/issues/283)) ([1454981](https://github.com/RequestNetwork/requestNetwork/commit/1454981))
- compute the requestId before creation with computeRequestId ([#407](https://github.com/RequestNetwork/requestNetwork/issues/407)) ([c88c6f6](https://github.com/RequestNetwork/requestNetwork/commit/c88c6f6))
- declarative requests on request-client.js ([#318](https://github.com/RequestNetwork/requestNetwork/issues/318)) ([c4a4cb5](https://github.com/RequestNetwork/requestNetwork/commit/c4a4cb5))
- **data-access:** transaction index persisted for faster initialization ([#406](https://github.com/RequestNetwork/requestNetwork/issues/406)) ([d820036](https://github.com/RequestNetwork/requestNetwork/commit/d820036))
- determines gas price automatically on mainnet ([#429](https://github.com/RequestNetwork/requestNetwork/issues/429)) ([3d42c75](https://github.com/RequestNetwork/requestNetwork/commit/3d42c75))
- getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
- getTransactionByTopic with timestamp boundaries ([#294](https://github.com/RequestNetwork/requestNetwork/issues/294)) ([be4ec56](https://github.com/RequestNetwork/requestNetwork/commit/be4ec56))
- introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
- IPFS retry on error ([#421](https://github.com/RequestNetwork/requestNetwork/issues/421)) ([18d6e6e](https://github.com/RequestNetwork/requestNetwork/commit/18d6e6e))
- Migrate the synchronization from storage to data-access ([#292](https://github.com/RequestNetwork/requestNetwork/issues/292)) ([3d04d0d](https://github.com/RequestNetwork/requestNetwork/commit/3d04d0d))
- payment network declarative for any currency ([#315](https://github.com/RequestNetwork/requestNetwork/issues/315)) ([06fb561](https://github.com/RequestNetwork/requestNetwork/commit/06fb561))
- Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
- Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))
- upgradable smart contracts ([#337](https://github.com/RequestNetwork/requestNetwork/issues/337)) ([c8cf724](https://github.com/RequestNetwork/requestNetwork/commit/c8cf724))

### Performance Improvements

- faster initialization by factoring stat and read IPFS calls in one call ([#401](https://github.com/RequestNetwork/requestNetwork/issues/401)) ([184c14e](https://github.com/RequestNetwork/requestNetwork/commit/184c14e))

## [0.2.1-alpha.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.1.1-alpha.3...@requestnetwork/types@0.2.1-alpha.0) (2019-07-22)

### Features

- add concurrent readMany to storage layer ([#363](https://github.com/RequestNetwork/requestNetwork/issues/363)) ([db3f484](https://github.com/RequestNetwork/requestNetwork/commit/db3f484))
- add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
- add IPFS peer for faster IPFS retrieval, and check IPFS and Ethereum nodes connections ([#353](https://github.com/RequestNetwork/requestNetwork/issues/353)) ([47358c2](https://github.com/RequestNetwork/requestNetwork/commit/47358c2))
- add logging interfaces and default logger ([#397](https://github.com/RequestNetwork/requestNetwork/issues/397)) ([f83a716](https://github.com/RequestNetwork/requestNetwork/commit/f83a716))
- add request node logger ([#416](https://github.com/RequestNetwork/requestNetwork/issues/416)) ([8d56ade](https://github.com/RequestNetwork/requestNetwork/commit/8d56ade))
- additional node logs to show progress and logLevel option ([#338](https://github.com/RequestNetwork/requestNetwork/issues/338)) ([38559f4](https://github.com/RequestNetwork/requestNetwork/commit/38559f4))
- asynchronously pin IPFS files in batches ([#403](https://github.com/RequestNetwork/requestNetwork/issues/403)) ([926c22b](https://github.com/RequestNetwork/requestNetwork/commit/926c22b))
- class to get Ethereum block information in storage ([#283](https://github.com/RequestNetwork/requestNetwork/issues/283)) ([1454981](https://github.com/RequestNetwork/requestNetwork/commit/1454981))
- compute the requestId before creation with computeRequestId ([#407](https://github.com/RequestNetwork/requestNetwork/issues/407)) ([c88c6f6](https://github.com/RequestNetwork/requestNetwork/commit/c88c6f6))
- declarative requests on request-client.js ([#318](https://github.com/RequestNetwork/requestNetwork/issues/318)) ([c4a4cb5](https://github.com/RequestNetwork/requestNetwork/commit/c4a4cb5))
- **data-access:** transaction index persisted for faster initialization ([#406](https://github.com/RequestNetwork/requestNetwork/issues/406)) ([d820036](https://github.com/RequestNetwork/requestNetwork/commit/d820036))
- determines gas price automatically on mainnet ([#429](https://github.com/RequestNetwork/requestNetwork/issues/429)) ([3d42c75](https://github.com/RequestNetwork/requestNetwork/commit/3d42c75))
- getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
- getTransactionByTopic with timestamp boundaries ([#294](https://github.com/RequestNetwork/requestNetwork/issues/294)) ([be4ec56](https://github.com/RequestNetwork/requestNetwork/commit/be4ec56))
- introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
- IPFS retry on error ([#421](https://github.com/RequestNetwork/requestNetwork/issues/421)) ([18d6e6e](https://github.com/RequestNetwork/requestNetwork/commit/18d6e6e))
- Migrate the synchronization from storage to data-access ([#292](https://github.com/RequestNetwork/requestNetwork/issues/292)) ([3d04d0d](https://github.com/RequestNetwork/requestNetwork/commit/3d04d0d))
- payment network declarative for any currency ([#315](https://github.com/RequestNetwork/requestNetwork/issues/315)) ([06fb561](https://github.com/RequestNetwork/requestNetwork/commit/06fb561))
- Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
- Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))
- upgradable smart contracts ([#337](https://github.com/RequestNetwork/requestNetwork/issues/337)) ([c8cf724](https://github.com/RequestNetwork/requestNetwork/commit/c8cf724))

### Performance Improvements

- faster initialization by factoring stat and read IPFS calls in one call ([#401](https://github.com/RequestNetwork/requestNetwork/issues/401)) ([184c14e](https://github.com/RequestNetwork/requestNetwork/commit/184c14e))

# [0.2.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.1.1-alpha.3...@requestnetwork/types@0.2.0) (2019-06-06)

### Features

- add concurrent readMany to storage layer ([#363](https://github.com/RequestNetwork/requestNetwork/issues/363)) ([db3f484](https://github.com/RequestNetwork/requestNetwork/commit/db3f484))
- add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
- add IPFS peer for faster IPFS retrieval, and check IPFS and Ethereum nodes connections ([#353](https://github.com/RequestNetwork/requestNetwork/issues/353)) ([47358c2](https://github.com/RequestNetwork/requestNetwork/commit/47358c2))
- add logging interfaces and default logger ([#397](https://github.com/RequestNetwork/requestNetwork/issues/397)) ([f83a716](https://github.com/RequestNetwork/requestNetwork/commit/f83a716))
- additional node logs to show progress and logLevel option ([#338](https://github.com/RequestNetwork/requestNetwork/issues/338)) ([38559f4](https://github.com/RequestNetwork/requestNetwork/commit/38559f4))
- asynchronously pin IPFS files in batches ([#403](https://github.com/RequestNetwork/requestNetwork/issues/403)) ([926c22b](https://github.com/RequestNetwork/requestNetwork/commit/926c22b))
- class to get Ethereum block information in storage ([#283](https://github.com/RequestNetwork/requestNetwork/issues/283)) ([1454981](https://github.com/RequestNetwork/requestNetwork/commit/1454981))
- declarative requests on request-client.js ([#318](https://github.com/RequestNetwork/requestNetwork/issues/318)) ([c4a4cb5](https://github.com/RequestNetwork/requestNetwork/commit/c4a4cb5))
- getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
- getTransactionByTopic with timestamp boundaries ([#294](https://github.com/RequestNetwork/requestNetwork/issues/294)) ([be4ec56](https://github.com/RequestNetwork/requestNetwork/commit/be4ec56))
- introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
- Migrate the synchronization from storage to data-access ([#292](https://github.com/RequestNetwork/requestNetwork/issues/292)) ([3d04d0d](https://github.com/RequestNetwork/requestNetwork/commit/3d04d0d))
- payment network declarative for any currency ([#315](https://github.com/RequestNetwork/requestNetwork/issues/315)) ([06fb561](https://github.com/RequestNetwork/requestNetwork/commit/06fb561))
- Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
- Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))
- upgradable smart contracts ([#337](https://github.com/RequestNetwork/requestNetwork/issues/337)) ([c8cf724](https://github.com/RequestNetwork/requestNetwork/commit/c8cf724))

### Performance Improvements

- faster initialization by factoring stat and read IPFS calls in one call ([#401](https://github.com/RequestNetwork/requestNetwork/issues/401)) ([184c14e](https://github.com/RequestNetwork/requestNetwork/commit/184c14e))

## [0.1.1-alpha.11](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.1.1-alpha.3...@requestnetwork/types@0.1.1-alpha.11) (2019-05-21)

### Features

- add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
- additional node logs to show progress and logLevel option ([#338](https://github.com/RequestNetwork/requestNetwork/issues/338)) ([38559f4](https://github.com/RequestNetwork/requestNetwork/commit/38559f4))
- class to get Ethereum block information in storage ([#283](https://github.com/RequestNetwork/requestNetwork/issues/283)) ([1454981](https://github.com/RequestNetwork/requestNetwork/commit/1454981))
- declarative requests on request-client.js ([#318](https://github.com/RequestNetwork/requestNetwork/issues/318)) ([c4a4cb5](https://github.com/RequestNetwork/requestNetwork/commit/c4a4cb5))
- getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
- getTransactionByTopic with timestamp boundaries ([#294](https://github.com/RequestNetwork/requestNetwork/issues/294)) ([be4ec56](https://github.com/RequestNetwork/requestNetwork/commit/be4ec56))
- introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
- Migrate the synchronization from storage to data-access ([#292](https://github.com/RequestNetwork/requestNetwork/issues/292)) ([3d04d0d](https://github.com/RequestNetwork/requestNetwork/commit/3d04d0d))
- payment network declarative for any currency ([#315](https://github.com/RequestNetwork/requestNetwork/issues/315)) ([06fb561](https://github.com/RequestNetwork/requestNetwork/commit/06fb561))
- Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
- Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))
- upgradable smart contracts ([#337](https://github.com/RequestNetwork/requestNetwork/issues/337)) ([c8cf724](https://github.com/RequestNetwork/requestNetwork/commit/c8cf724))

## [0.1.1-alpha.10](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.1.1-alpha.3...@requestnetwork/types@0.1.1-alpha.10) (2019-05-17)

### Features

- add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
- additional node logs to show progress and logLevel option ([#338](https://github.com/RequestNetwork/requestNetwork/issues/338)) ([38559f4](https://github.com/RequestNetwork/requestNetwork/commit/38559f4))
- class to get Ethereum block information in storage ([#283](https://github.com/RequestNetwork/requestNetwork/issues/283)) ([1454981](https://github.com/RequestNetwork/requestNetwork/commit/1454981))
- declarative requests on request-client.js ([#318](https://github.com/RequestNetwork/requestNetwork/issues/318)) ([c4a4cb5](https://github.com/RequestNetwork/requestNetwork/commit/c4a4cb5))
- getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
- getTransactionByTopic with timestamp boundaries ([#294](https://github.com/RequestNetwork/requestNetwork/issues/294)) ([be4ec56](https://github.com/RequestNetwork/requestNetwork/commit/be4ec56))
- introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
- Migrate the synchronization from storage to data-access ([#292](https://github.com/RequestNetwork/requestNetwork/issues/292)) ([3d04d0d](https://github.com/RequestNetwork/requestNetwork/commit/3d04d0d))
- payment network declarative for any currency ([#315](https://github.com/RequestNetwork/requestNetwork/issues/315)) ([06fb561](https://github.com/RequestNetwork/requestNetwork/commit/06fb561))
- Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
- Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))

## [0.1.1-alpha.9](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/types@0.1.1-alpha.3...@requestnetwork/types@0.1.1-alpha.9) (2019-05-10)

### Features

- add getChannelByTopic in data-access ([#305](https://github.com/RequestNetwork/requestNetwork/issues/305)) ([b345df8](https://github.com/RequestNetwork/requestNetwork/commit/b345df8))
- class to get Ethereum block information in storage ([#283](https://github.com/RequestNetwork/requestNetwork/issues/283)) ([1454981](https://github.com/RequestNetwork/requestNetwork/commit/1454981))
- getRequestsByIdentity include timestamp boundaries in request-clients ([#308](https://github.com/RequestNetwork/requestNetwork/issues/308)) ([1fd2df5](https://github.com/RequestNetwork/requestNetwork/commit/1fd2df5))
- getTransactionByTopic with timestamp boundaries ([#294](https://github.com/RequestNetwork/requestNetwork/issues/294)) ([be4ec56](https://github.com/RequestNetwork/requestNetwork/commit/be4ec56))
- introduce channelIds to enhance the topics mechanism ([#297](https://github.com/RequestNetwork/requestNetwork/issues/297)) ([6072905](https://github.com/RequestNetwork/requestNetwork/commit/6072905))
- Migrate the synchronization from storage to data-access ([#292](https://github.com/RequestNetwork/requestNetwork/issues/292)) ([3d04d0d](https://github.com/RequestNetwork/requestNetwork/commit/3d04d0d))
- payment network declarative for any currency ([#315](https://github.com/RequestNetwork/requestNetwork/issues/315)) ([06fb561](https://github.com/RequestNetwork/requestNetwork/commit/06fb561))
- Storage get data from timestamp boundaries ([#291](https://github.com/RequestNetwork/requestNetwork/issues/291)) ([e9554cd](https://github.com/RequestNetwork/requestNetwork/commit/e9554cd))
- Timestamp from storage to client ([#309](https://github.com/RequestNetwork/requestNetwork/issues/309)) ([bb0ac19](https://github.com/RequestNetwork/requestNetwork/commit/bb0ac19))
