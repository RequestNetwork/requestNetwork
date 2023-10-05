# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.36.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-detection@0.30.0...@requestnetwork/payment-detection@0.36.0) (2022-11-04)

### Bug Fixes

- Add prefix in userData ([#846](https://github.com/RequestNetwork/requestNetwork/issues/846)) ([520d348](https://github.com/RequestNetwork/requestNetwork/commit/520d3487278f811fdc65267d3c9320413b69d2fb))
- add txHash to balance ([#664](https://github.com/RequestNetwork/requestNetwork/issues/664)) ([95bc076](https://github.com/RequestNetwork/requestNetwork/commit/95bc076630995d9178f3d5c25324bf3c1d17f03b))
- arbiscan API ([#772](https://github.com/RequestNetwork/requestNetwork/issues/772)) ([2449b71](https://github.com/RequestNetwork/requestNetwork/commit/2449b718b89b0d6542a3a95f3499cd21c5c98177))
- balance of detected payments for declared extensions ([#646](https://github.com/RequestNetwork/requestNetwork/issues/646)) ([f0d5492](https://github.com/RequestNetwork/requestNetwork/commit/f0d5492dc612a5be8e8cf2d63f8a9689b53fd18e))
- celo api ([#941](https://github.com/RequestNetwork/requestNetwork/issues/941)) ([8fc5ba8](https://github.com/RequestNetwork/requestNetwork/commit/8fc5ba89f0960996feb63f2ee4a17c82af69561a))
- changed graph getTransferEvents return types into IERC20Fee ([#803](https://github.com/RequestNetwork/requestNetwork/issues/803)) ([5f1313c](https://github.com/RequestNetwork/requestNetwork/commit/5f1313c612b13bcb37a3d8b0031108f5b2d0aae6))
- currencyManager in PN factory from request ([#584](https://github.com/RequestNetwork/requestNetwork/issues/584)) ([df223c1](https://github.com/RequestNetwork/requestNetwork/commit/df223c11bad0a05efc75efed0ff7dc56460565b4))
- detect in subgraph same reference than paid ([#858](https://github.com/RequestNetwork/requestNetwork/issues/858)) ([550c71e](https://github.com/RequestNetwork/requestNetwork/commit/550c71e8800e2560077411918733ed205958e61c))
- detection for arbitrum input-data([#770](https://github.com/RequestNetwork/requestNetwork/issues/770)) ([c2fe1f9](https://github.com/RequestNetwork/requestNetwork/commit/c2fe1f9879b17db34b6ecf4dfea7a0e271ea7e96))
- ethereum proxy ([#807](https://github.com/RequestNetwork/requestNetwork/issues/807)) ([bcda36d](https://github.com/RequestNetwork/requestNetwork/commit/bcda36dee054504310aaaa98f9d870682893efcc))
- failing test (rate-limiting) ([#522](https://github.com/RequestNetwork/requestNetwork/issues/522)) ([3954d87](https://github.com/RequestNetwork/requestNetwork/commit/3954d87ba41aebcb6eab40fb02bf0b33b668da2d))
- fill block and txHash parameters in events ([#860](https://github.com/RequestNetwork/requestNetwork/issues/860)) ([1b1aad0](https://github.com/RequestNetwork/requestNetwork/commit/1b1aad0ea11f2f3bb79946fca9abc7d2e417b863))
- getPaymentNetworkFrom conversion request ([#976](https://github.com/RequestNetwork/requestNetwork/issues/976)) ([03eaa6d](https://github.com/RequestNetwork/requestNetwork/commit/03eaa6dce6a4d05ba6f07d4c910c87147c0b7c54))
- imports from types package ([#577](https://github.com/RequestNetwork/requestNetwork/issues/577)) ([071dc5f](https://github.com/RequestNetwork/requestNetwork/commit/071dc5f97a777e79e94a71c1b49056edc221a8d7))
- invoice total types + upgrade ethers ([#514](https://github.com/RequestNetwork/requestNetwork/issues/514)) ([c2b98b2](https://github.com/RequestNetwork/requestNetwork/commit/c2b98b2bd3c93f063f340d58c6b95ad026fd9519))
- min gas ([#940](https://github.com/RequestNetwork/requestNetwork/issues/940)) ([ce9990f](https://github.com/RequestNetwork/requestNetwork/commit/ce9990f704cd374218769ff4cd9f4d2e8e041bbd))
- NEAR contracts addresses for conversion-native ([#922](https://github.com/RequestNetwork/requestNetwork/issues/922)) ([2386f1b](https://github.com/RequestNetwork/requestNetwork/commit/2386f1b68c3ac9c2d7e33688dcaa871eff17850a))
- NEAR native timestamp precision ([#963](https://github.com/RequestNetwork/requestNetwork/issues/963)) ([8ae22e1](https://github.com/RequestNetwork/requestNetwork/commit/8ae22e1b0acbecd900c7221fb1f5205da4827190))
- Near processing and detection ([#578](https://github.com/RequestNetwork/requestNetwork/issues/578)) ([27362f0](https://github.com/RequestNetwork/requestNetwork/commit/27362f06970005aefd226b785a358a3afc153c37))
- Payment network eth-input-data uses theGraph for payments via EthProxy ([#703](https://github.com/RequestNetwork/requestNetwork/issues/703)) ([aa84f16](https://github.com/RequestNetwork/requestNetwork/commit/aa84f16c0748cc31b36211e821c0b6401e084e27))
- replace blockscout by gnosisscan ([#942](https://github.com/RequestNetwork/requestNetwork/issues/942)) ([2ba9cf2](https://github.com/RequestNetwork/requestNetwork/commit/2ba9cf25ae387faac6b8adaa5095f0eaba975b16))
- request-client should support conversion and network checks ([#975](https://github.com/RequestNetwork/requestNetwork/issues/975)) ([9ff30cd](https://github.com/RequestNetwork/requestNetwork/commit/9ff30cdc8e1237c488be039dbbfabac07960fb32))
- **graph retriever:** null values ([#961](https://github.com/RequestNetwork/requestNetwork/issues/961)) ([eccd486](https://github.com/RequestNetwork/requestNetwork/commit/eccd48676b0dcb7a1bc5c7b20c6e4b6e12be9419))
- rinkeby deprecation workaround ([#933](https://github.com/RequestNetwork/requestNetwork/issues/933)) ([464a63a](https://github.com/RequestNetwork/requestNetwork/commit/464a63a1bb12d3fa722bc3610359fa828fd85e5b))
- superfluid balance error ([#913](https://github.com/RequestNetwork/requestNetwork/issues/913)) ([f1f877d](https://github.com/RequestNetwork/requestNetwork/commit/f1f877dad8cbba6bae67580c5db5f7fa9d125c32))
- superfluid block type ([#914](https://github.com/RequestNetwork/requestNetwork/issues/914)) ([1879f74](https://github.com/RequestNetwork/requestNetwork/commit/1879f746488d072390f4852a0c477de63c9a81be))
- thegraph detector ([#960](https://github.com/RequestNetwork/requestNetwork/issues/960)) ([1231f3b](https://github.com/RequestNetwork/requestNetwork/commit/1231f3b473f83538b46cdd640c1dfb5b9d1b0942))
- **payment-detection:** Fee event filter update get balance ([#790](https://github.com/RequestNetwork/requestNetwork/issues/790)) ([6da7f8b](https://github.com/RequestNetwork/requestNetwork/commit/6da7f8bc0c8b48e2a3ab0edb5540d9d9b2566cae)), closes [#780](https://github.com/RequestNetwork/requestNetwork/issues/780) [#791](https://github.com/RequestNetwork/requestNetwork/issues/791) [#671](https://github.com/RequestNetwork/requestNetwork/issues/671)
- this undefined for fee-proxy-contract ([#510](https://github.com/RequestNetwork/requestNetwork/issues/510)) ([67898bb](https://github.com/RequestNetwork/requestNetwork/commit/67898bb0136a03a9107b0bc41d79cfc5acd2b139))
- typescript lint for test files ([#778](https://github.com/RequestNetwork/requestNetwork/issues/778)) ([048e876](https://github.com/RequestNetwork/requestNetwork/commit/048e876a905516be0de8a31d446e4572eb74eccb))
- unpad amounts from chainlink in payment-detection ([#529](https://github.com/RequestNetwork/requestNetwork/issues/529)) ([d67027f](https://github.com/RequestNetwork/requestNetwork/commit/d67027ff4590b5f1369257ebdce78b6a1296ee9b))
- Update currency package dependency in payment-detection ([#436](https://github.com/RequestNetwork/requestNetwork/issues/436)) ([de22c06](https://github.com/RequestNetwork/requestNetwork/commit/de22c06ce073f9a67168093459c66b0afae0d500))
- updated Near payment detection + gas increase ([#589](https://github.com/RequestNetwork/requestNetwork/issues/589)) ([1ae8468](https://github.com/RequestNetwork/requestNetwork/commit/1ae8468104aa316b7072e73dafd8e4bd382487c8))
- upgrade ethers to 5.2.0 ([#532](https://github.com/RequestNetwork/requestNetwork/issues/532)) ([6c7cf35](https://github.com/RequestNetwork/requestNetwork/commit/6c7cf350a04e280b77ce6fd758b6f065f28fd1cc))

### Features

- add declarative payment network for erc20 ([#635](https://github.com/RequestNetwork/requestNetwork/issues/635)) ([ecf4a9d](https://github.com/RequestNetwork/requestNetwork/commit/ecf4a9d5515d5eea59e017b9aaf89c133421d71b)), closes [#631](https://github.com/RequestNetwork/requestNetwork/issues/631) [#633](https://github.com/RequestNetwork/requestNetwork/issues/633) [#636](https://github.com/RequestNetwork/requestNetwork/issues/636) [#637](https://github.com/RequestNetwork/requestNetwork/issues/637) [#638](https://github.com/RequestNetwork/requestNetwork/issues/638) [#550](https://github.com/RequestNetwork/requestNetwork/issues/550)
- add delegate in request client ([#541](https://github.com/RequestNetwork/requestNetwork/issues/541)) ([253b308](https://github.com/RequestNetwork/requestNetwork/commit/253b30847f261840508a14cabf5dea93bb7c5dba))
- add network as declarative params ([#665](https://github.com/RequestNetwork/requestNetwork/issues/665)) ([e3a4515](https://github.com/RequestNetwork/requestNetwork/commit/e3a4515e23261b79a377ff8ce3d7a5c8d8e84127))
- add streamEventName to streaming event parameters ([#908](https://github.com/RequestNetwork/requestNetwork/issues/908)) ([e870f03](https://github.com/RequestNetwork/requestNetwork/commit/e870f03e51839f4cfb6bea8a342da21eef76f619))
- add xdai rpc provider ([#637](https://github.com/RequestNetwork/requestNetwork/issues/637)) ([fc24e5e](https://github.com/RequestNetwork/requestNetwork/commit/fc24e5e3c3033e01796aea2f2039a46f802b7ad9))
- adding BSC support ([#594](https://github.com/RequestNetwork/requestNetwork/issues/594)) ([0a923a2](https://github.com/RequestNetwork/requestNetwork/commit/0a923a2d7403fa7a280ff8f74fd9f998d56cee23))
- address based pn inherits from declarative ([#620](https://github.com/RequestNetwork/requestNetwork/issues/620)) ([cb9695e](https://github.com/RequestNetwork/requestNetwork/commit/cb9695eb9bf0c0180b1524a11aab9e52c5f3299b))
- arbitrum-one support ([#756](https://github.com/RequestNetwork/requestNetwork/issues/756)) ([ecc147a](https://github.com/RequestNetwork/requestNetwork/commit/ecc147a88633b727ee1c4ace911c2f221bee7319))
- arbitrum-testnet-update ([#728](https://github.com/RequestNetwork/requestNetwork/issues/728)) ([803159e](https://github.com/RequestNetwork/requestNetwork/commit/803159e30f9ea7c3a97e5f808701013b5639735e))
- avalanche network ([#796](https://github.com/RequestNetwork/requestNetwork/issues/796)) ([04d99ff](https://github.com/RequestNetwork/requestNetwork/commit/04d99ff73139ecdf442dbc4e626b751ce3fac813))
- bsc payments except swap ([#619](https://github.com/RequestNetwork/requestNetwork/issues/619)) ([cd8493e](https://github.com/RequestNetwork/requestNetwork/commit/cd8493e8c9d218f9c16d8b8b9020059ba669294b))
- BSC support for eth-input-data ([#800](https://github.com/RequestNetwork/requestNetwork/issues/800)) ([ec71254](https://github.com/RequestNetwork/requestNetwork/commit/ec712547f35b309a619cd0ce88505e1d93b3d8c1))
- Currency Manager ([#571](https://github.com/RequestNetwork/requestNetwork/issues/571)) ([3a68ad3](https://github.com/RequestNetwork/requestNetwork/commit/3a68ad31fc049e13f0f6dac4759b08c06b33416b))
- currencyManager manages conversion paths ([#699](https://github.com/RequestNetwork/requestNetwork/issues/699)) ([7f6e1d1](https://github.com/RequestNetwork/requestNetwork/commit/7f6e1d1a6a06e5666ad7c784e5ab14a7b6f400a1))
- default version is 0.2.0 for AnyToEthProxy ([#746](https://github.com/RequestNetwork/requestNetwork/issues/746)) ([1cdf40a](https://github.com/RequestNetwork/requestNetwork/commit/1cdf40ae9df5b8357aa8b6ffdad11e93a448e937))
- defaultProvider ([#497](https://github.com/RequestNetwork/requestNetwork/issues/497)) ([96e9486](https://github.com/RequestNetwork/requestNetwork/commit/96e94866a888b621001f56299b8484f576622ad5))
- detect payments on near ([#561](https://github.com/RequestNetwork/requestNetwork/issues/561)) ([314f676](https://github.com/RequestNetwork/requestNetwork/commit/314f67672830fd04b10775fff6fd3272a922cade))
- enable custom TheGraph client options ([#643](https://github.com/RequestNetwork/requestNetwork/issues/643)) ([124918a](https://github.com/RequestNetwork/requestNetwork/commit/124918a7665f0b45bc25d9babeeab6568b12cbe9))
- enable TheGraph on all networks ([#753](https://github.com/RequestNetwork/requestNetwork/issues/753)) ([bf2bd4c](https://github.com/RequestNetwork/requestNetwork/commit/bf2bd4c60590782685efa289ae188c0668b42bde))
- ERC20 Fee Proxy on Matic ([#495](https://github.com/RequestNetwork/requestNetwork/issues/495)) ([ac003d5](https://github.com/RequestNetwork/requestNetwork/commit/ac003d538715c18dc158ccc84249da10dc9a984f))
- erc777 superfluid get balance of subsequent requests ([#900](https://github.com/RequestNetwork/requestNetwork/issues/900)) ([fd491d0](https://github.com/RequestNetwork/requestNetwork/commit/fd491d07bfc48d5f5d2a9cd112d28a2485fea9aa))
- escrow deployment info ([#847](https://github.com/RequestNetwork/requestNetwork/issues/847)) ([aea1187](https://github.com/RequestNetwork/requestNetwork/commit/aea1187bf8ef62d88d9c7c5838f8848e75114a99))
- escrow detector class ([#773](https://github.com/RequestNetwork/requestNetwork/issues/773)) ([c4c2276](https://github.com/RequestNetwork/requestNetwork/commit/c4c22765df68a6438e4a0e9bc3d6255e844da791))
- Escrow payment detection library ([#712](https://github.com/RequestNetwork/requestNetwork/issues/712)) ([5b2bd70](https://github.com/RequestNetwork/requestNetwork/commit/5b2bd7066049b843bb33ddc498220aa4e3741ee0))
- Eth native payments detection from TheGraph ([#656](https://github.com/RequestNetwork/requestNetwork/issues/656)) ([b492a38](https://github.com/RequestNetwork/requestNetwork/commit/b492a38c390d24596fe20903fdaa259e9ceee60b))
- eth-input-data optional proxy ([#738](https://github.com/RequestNetwork/requestNetwork/issues/738)) ([2353d36](https://github.com/RequestNetwork/requestNetwork/commit/2353d361c96524bcf2e2b456877756c3a214026a))
- exporting calcEscrowState function from payment-detection ([#809](https://github.com/RequestNetwork/requestNetwork/issues/809)) ([86dd586](https://github.com/RequestNetwork/requestNetwork/commit/86dd5868b061f0b437998824cdf387fa2de04878))
- fantom/fuse RPC url & remove default etherscan API key ([#551](https://github.com/RequestNetwork/requestNetwork/issues/551)) ([5ce4413](https://github.com/RequestNetwork/requestNetwork/commit/5ce44139276afde9f7a5ec1c642e68fd2266d255))
- goerli payment ([#892](https://github.com/RequestNetwork/requestNetwork/issues/892)) ([2495d00](https://github.com/RequestNetwork/requestNetwork/commit/2495d00ba7edd32b5aeba4bca3d555e910e00941))
- implementation of delegation in declarative pn ([#535](https://github.com/RequestNetwork/requestNetwork/issues/535)) ([cf4eac7](https://github.com/RequestNetwork/requestNetwork/commit/cf4eac7665f5d797e2768c888fc87f470fe4f8cf))
- mark streaming payment events ([#910](https://github.com/RequestNetwork/requestNetwork/issues/910)) ([58bc597](https://github.com/RequestNetwork/requestNetwork/commit/58bc5979f05530e163cb197a4beabe137f9dafa1))
- native payment multichain ([#542](https://github.com/RequestNetwork/requestNetwork/issues/542)) ([8480cf3](https://github.com/RequestNetwork/requestNetwork/commit/8480cf35b2b113e301ae482aeabcbfb37414b056))
- near conversion payment detector ([#920](https://github.com/RequestNetwork/requestNetwork/issues/920)) ([8b851e7](https://github.com/RequestNetwork/requestNetwork/commit/8b851e7fd634ad9f92bc6e83280d68da3e306bfe))
- near conversion payment processor ([#921](https://github.com/RequestNetwork/requestNetwork/issues/921)) ([af836c2](https://github.com/RequestNetwork/requestNetwork/commit/af836c29405adbeb994af24e324e83b57a07997f))
- Near detection with autobahn ([#576](https://github.com/RequestNetwork/requestNetwork/issues/576)) ([86e0145](https://github.com/RequestNetwork/requestNetwork/commit/86e01459a6b32dacfa778434226f374f7668786c))
- near mainnet deployment info ([#579](https://github.com/RequestNetwork/requestNetwork/issues/579)) ([2d95057](https://github.com/RequestNetwork/requestNetwork/commit/2d950574140755cf4e6dfb0682d4788a8a9e7873))
- payment detection for ethereum fee proxy ([#585](https://github.com/RequestNetwork/requestNetwork/issues/585)) ([c78803f](https://github.com/RequestNetwork/requestNetwork/commit/c78803fb1333917b843db935df0114a50e294f5f))
- Payment detection for the any to erc20 payment network ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6f7338f](https://github.com/RequestNetwork/requestNetwork/commit/6f7338f42ddf793a733a31b434d6116beebefdf6))
- payment detection thegraph block hash ([#674](https://github.com/RequestNetwork/requestNetwork/issues/674)) ([4f642d3](https://github.com/RequestNetwork/requestNetwork/commit/4f642d3ca59b6a0e9982bd6053116ca067f024cf))
- Payment network any-to-eth in the payment detection ([#605](https://github.com/RequestNetwork/requestNetwork/issues/605)) ([b830d46](https://github.com/RequestNetwork/requestNetwork/commit/b830d4690625754c33c4a6262d96e490de768a10))
- payment reference utils ([#906](https://github.com/RequestNetwork/requestNetwork/issues/906)) ([f0ee19f](https://github.com/RequestNetwork/requestNetwork/commit/f0ee19f1fc9b2fd2ae36bc2c8d4305fade06771b))
- payment-detection with TheGraph ([#519](https://github.com/RequestNetwork/requestNetwork/issues/519)) ([c068b88](https://github.com/RequestNetwork/requestNetwork/commit/c068b88786111558a84cdff941bc60dd04f6034a))
- pn to smart-contract version mapping ([#649](https://github.com/RequestNetwork/requestNetwork/issues/649)) ([d45ab85](https://github.com/RequestNetwork/requestNetwork/commit/d45ab85c2c47b8d7325fef78965ad94272250598))
- process near payments ([#565](https://github.com/RequestNetwork/requestNetwork/issues/565)) ([82c485b](https://github.com/RequestNetwork/requestNetwork/commit/82c485b01240d0be05d46e1488c0cf917e57cd20))
- pull from field from subgraph ([#872](https://github.com/RequestNetwork/requestNetwork/issues/872)) ([545b17d](https://github.com/RequestNetwork/requestNetwork/commit/545b17d8875c11c3b3ce85f55a9183db5f10b80b))
- pull gas info field from subgraph ([#865](https://github.com/RequestNetwork/requestNetwork/issues/865)) ([fd74b0f](https://github.com/RequestNetwork/requestNetwork/commit/fd74b0fbfa6d8e39e21389d4ccb8dbce44ce9b5d))
- pull gas info from subgraph on other payment networks ([#876](https://github.com/RequestNetwork/requestNetwork/issues/876)) ([9c5ae2b](https://github.com/RequestNetwork/requestNetwork/commit/9c5ae2b2b73ff9e1379c99e2ab8e056e6366dc56))
- reference calculator command ([#802](https://github.com/RequestNetwork/requestNetwork/issues/802)) ([7e9b380](https://github.com/RequestNetwork/requestNetwork/commit/7e9b3801a5d2fab19ec05adcde13584f9b50a5f3))
- retrieve active escrow data ([#818](https://github.com/RequestNetwork/requestNetwork/issues/818)) ([0bcf58c](https://github.com/RequestNetwork/requestNetwork/commit/0bcf58cdad76d42320f22065207f82455d4a12fe))
- superfluid one off payment detection ([#970](https://github.com/RequestNetwork/requestNetwork/issues/970)) ([608fe00](https://github.com/RequestNetwork/requestNetwork/commit/608fe0002e2e87dcdb2a0681a55bd0865669cf6d))
- **declarative:** payment reference ([#901](https://github.com/RequestNetwork/requestNetwork/issues/901)) ([2679368](https://github.com/RequestNetwork/requestNetwork/commit/2679368241ea8e34fc88f60eb395459c3c277029))
- Start of SuperFluid integration ([#671](https://github.com/RequestNetwork/requestNetwork/issues/671)) ([ab828ce](https://github.com/RequestNetwork/requestNetwork/commit/ab828ce44f99023a8b8825b5cef0b09c8d019a5f))
- start SF payments processing ([#821](https://github.com/RequestNetwork/requestNetwork/issues/821)) ([53e5879](https://github.com/RequestNetwork/requestNetwork/commit/53e587916e336057935c3d54655de0dc539a59a3))
- SuperFluid advanced logic ([#797](https://github.com/RequestNetwork/requestNetwork/issues/797)) ([de5ef06](https://github.com/RequestNetwork/requestNetwork/commit/de5ef06e50a7950d49d35dfe318c01190a6a91e5))
- TheGraph get last synced block ([#521](https://github.com/RequestNetwork/requestNetwork/issues/521)) ([7d69ae4](https://github.com/RequestNetwork/requestNetwork/commit/7d69ae49c1bb56fffd94f3fa49ab038b040491bf))
- upgrade near references to 0.2.0 ([#580](https://github.com/RequestNetwork/requestNetwork/issues/580)) ([2f0507d](https://github.com/RequestNetwork/requestNetwork/commit/2f0507df3d98b2ee9e15d21818b0ac639ee4cca3))

# [0.35.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-detection@0.30.0...@requestnetwork/payment-detection@0.35.0) (2021-06-22)

### Bug Fixes

- failing test (rate-limiting) ([#522](https://github.com/RequestNetwork/requestNetwork/issues/522)) ([3954d87](https://github.com/RequestNetwork/requestNetwork/commit/3954d87ba41aebcb6eab40fb02bf0b33b668da2d))
- invoice total types + upgrade ethers ([#514](https://github.com/RequestNetwork/requestNetwork/issues/514)) ([c2b98b2](https://github.com/RequestNetwork/requestNetwork/commit/c2b98b2bd3c93f063f340d58c6b95ad026fd9519))
- this undefined for fee-proxy-contract ([#510](https://github.com/RequestNetwork/requestNetwork/issues/510)) ([67898bb](https://github.com/RequestNetwork/requestNetwork/commit/67898bb0136a03a9107b0bc41d79cfc5acd2b139))
- Update currency package dependency in payment-detection ([#436](https://github.com/RequestNetwork/requestNetwork/issues/436)) ([de22c06](https://github.com/RequestNetwork/requestNetwork/commit/de22c06ce073f9a67168093459c66b0afae0d500))

### Features

- defaultProvider ([#497](https://github.com/RequestNetwork/requestNetwork/issues/497)) ([96e9486](https://github.com/RequestNetwork/requestNetwork/commit/96e94866a888b621001f56299b8484f576622ad5))
- ERC20 Fee Proxy on Matic ([#495](https://github.com/RequestNetwork/requestNetwork/issues/495)) ([ac003d5](https://github.com/RequestNetwork/requestNetwork/commit/ac003d538715c18dc158ccc84249da10dc9a984f))
- Payment detection for the any to erc20 payment network ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6f7338f](https://github.com/RequestNetwork/requestNetwork/commit/6f7338f42ddf793a733a31b434d6116beebefdf6))
- payment-detection with TheGraph ([#519](https://github.com/RequestNetwork/requestNetwork/issues/519)) ([c068b88](https://github.com/RequestNetwork/requestNetwork/commit/c068b88786111558a84cdff941bc60dd04f6034a))
- TheGraph get last synced block ([#521](https://github.com/RequestNetwork/requestNetwork/issues/521)) ([7d69ae4](https://github.com/RequestNetwork/requestNetwork/commit/7d69ae49c1bb56fffd94f3fa49ab038b040491bf))

# [0.34.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-detection@0.30.0...@requestnetwork/payment-detection@0.34.0) (2021-05-12)

### Bug Fixes

- this undefined for fee-proxy-contract ([#510](https://github.com/RequestNetwork/requestNetwork/issues/510)) ([67898bb](https://github.com/RequestNetwork/requestNetwork/commit/67898bb0136a03a9107b0bc41d79cfc5acd2b139))
- Update currency package dependency in payment-detection ([#436](https://github.com/RequestNetwork/requestNetwork/issues/436)) ([de22c06](https://github.com/RequestNetwork/requestNetwork/commit/de22c06ce073f9a67168093459c66b0afae0d500))

### Features

- defaultProvider ([#497](https://github.com/RequestNetwork/requestNetwork/issues/497)) ([96e9486](https://github.com/RequestNetwork/requestNetwork/commit/96e94866a888b621001f56299b8484f576622ad5))
- ERC20 Fee Proxy on Matic ([#495](https://github.com/RequestNetwork/requestNetwork/issues/495)) ([ac003d5](https://github.com/RequestNetwork/requestNetwork/commit/ac003d538715c18dc158ccc84249da10dc9a984f))
- Payment detection for the any to erc20 payment network ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6f7338f](https://github.com/RequestNetwork/requestNetwork/commit/6f7338f42ddf793a733a31b434d6116beebefdf6))

# [0.33.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-detection@0.30.0...@requestnetwork/payment-detection@0.33.0) (2021-04-19)

### Bug Fixes

- Update currency package dependency in payment-detection ([#436](https://github.com/RequestNetwork/requestNetwork/issues/436)) ([de22c06](https://github.com/RequestNetwork/requestNetwork/commit/de22c06ce073f9a67168093459c66b0afae0d500))

### Features

- Payment detection for the any to erc20 payment network ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6f7338f](https://github.com/RequestNetwork/requestNetwork/commit/6f7338f42ddf793a733a31b434d6116beebefdf6))

# [0.32.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-detection@0.30.0...@requestnetwork/payment-detection@0.32.0) (2021-03-25)

### Bug Fixes

- Update currency package dependency in payment-detection ([#436](https://github.com/RequestNetwork/requestNetwork/issues/436)) ([de22c06](https://github.com/RequestNetwork/requestNetwork/commit/de22c06ce073f9a67168093459c66b0afae0d500))

### Features

- Payment detection for the any to erc20 payment network ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6f7338f](https://github.com/RequestNetwork/requestNetwork/commit/6f7338f42ddf793a733a31b434d6116beebefdf6))

# [0.31.0](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-detection@0.30.0...@requestnetwork/payment-detection@0.31.0) (2021-03-15)

### Bug Fixes

- Update currency package dependency in payment-detection ([#436](https://github.com/RequestNetwork/requestNetwork/issues/436)) ([de22c06](https://github.com/RequestNetwork/requestNetwork/commit/de22c06ce073f9a67168093459c66b0afae0d500))

### Features

- Payment detection for the any to erc20 payment network ([#419](https://github.com/RequestNetwork/requestNetwork/issues/419)) ([6f7338f](https://github.com/RequestNetwork/requestNetwork/commit/6f7338f42ddf793a733a31b434d6116beebefdf6))

## [0.30.4](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-detection@0.30.0...@requestnetwork/payment-detection@0.30.4) (2021-03-03)

**Note:** Version bump only for package @requestnetwork/payment-detection

## [0.30.3](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-detection@0.30.0...@requestnetwork/payment-detection@0.30.3) (2021-02-22)

**Note:** Version bump only for package @requestnetwork/payment-detection

## [0.30.2](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-detection@0.30.0...@requestnetwork/payment-detection@0.30.2) (2020-12-22)

**Note:** Version bump only for package @requestnetwork/payment-detection

## [0.30.1](https://github.com/RequestNetwork/requestNetwork/compare/@requestnetwork/payment-detection@0.30.0...@requestnetwork/payment-detection@0.30.1) (2020-12-21)

**Note:** Version bump only for package @requestnetwork/payment-detection

# 0.30.0 (2020-12-02)

# 0.26.0 (2020-10-14)

### Bug Fixes

- remove unknown modifier warning ([#331](https://github.com/RequestNetwork/requestNetwork/issues/331)) ([a0ec35d](https://github.com/RequestNetwork/requestNetwork/commit/a0ec35d38ca97d8702ce2790cf0f6c7162a31b86))

# 0.20.0 (2020-08-27)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))
- fix ERC20 fee payment detection filter typo ([#274](https://github.com/RequestNetwork/requestNetwork/issues/274)) ([8046cd9](https://github.com/RequestNetwork/requestNetwork/commit/8046cd968f32591752905c7893c38686fca5038b))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- calculate ERC20 fee balance ([#255](https://github.com/RequestNetwork/requestNetwork/issues/255)) ([273f55d](https://github.com/RequestNetwork/requestNetwork/commit/273f55df63bedb111027aac78f072563f7f60007))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

### Bug Fixes

- add request custom etherscan key ([#152](https://github.com/RequestNetwork/requestNetwork/issues/152)) ([5b74d0e](https://github.com/RequestNetwork/requestNetwork/commit/5b74d0efe7c38e1e995ac0af34e4a0c9ecf712fd))

### Features

- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.29.0 (2020-11-12)

# 0.26.0 (2020-10-14)

### Bug Fixes

- remove unknown modifier warning ([#331](https://github.com/RequestNetwork/requestNetwork/issues/331)) ([a0ec35d](https://github.com/RequestNetwork/requestNetwork/commit/a0ec35d38ca97d8702ce2790cf0f6c7162a31b86))

# 0.20.0 (2020-08-27)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))
- fix ERC20 fee payment detection filter typo ([#274](https://github.com/RequestNetwork/requestNetwork/issues/274)) ([8046cd9](https://github.com/RequestNetwork/requestNetwork/commit/8046cd968f32591752905c7893c38686fca5038b))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- calculate ERC20 fee balance ([#255](https://github.com/RequestNetwork/requestNetwork/issues/255)) ([273f55d](https://github.com/RequestNetwork/requestNetwork/commit/273f55df63bedb111027aac78f072563f7f60007))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

### Bug Fixes

- add request custom etherscan key ([#152](https://github.com/RequestNetwork/requestNetwork/issues/152)) ([5b74d0e](https://github.com/RequestNetwork/requestNetwork/commit/5b74d0efe7c38e1e995ac0af34e4a0c9ecf712fd))

### Features

- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.28.0 (2020-11-05)

# 0.26.0 (2020-10-14)

### Bug Fixes

- remove unknown modifier warning ([#331](https://github.com/RequestNetwork/requestNetwork/issues/331)) ([a0ec35d](https://github.com/RequestNetwork/requestNetwork/commit/a0ec35d38ca97d8702ce2790cf0f6c7162a31b86))

# 0.20.0 (2020-08-27)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))
- fix ERC20 fee payment detection filter typo ([#274](https://github.com/RequestNetwork/requestNetwork/issues/274)) ([8046cd9](https://github.com/RequestNetwork/requestNetwork/commit/8046cd968f32591752905c7893c38686fca5038b))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- calculate ERC20 fee balance ([#255](https://github.com/RequestNetwork/requestNetwork/issues/255)) ([273f55d](https://github.com/RequestNetwork/requestNetwork/commit/273f55df63bedb111027aac78f072563f7f60007))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

### Bug Fixes

- add request custom etherscan key ([#152](https://github.com/RequestNetwork/requestNetwork/issues/152)) ([5b74d0e](https://github.com/RequestNetwork/requestNetwork/commit/5b74d0efe7c38e1e995ac0af34e4a0c9ecf712fd))

### Features

- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.27.0 (2020-10-21)

# 0.26.0 (2020-10-14)

### Bug Fixes

- remove unknown modifier warning ([#331](https://github.com/RequestNetwork/requestNetwork/issues/331)) ([a0ec35d](https://github.com/RequestNetwork/requestNetwork/commit/a0ec35d38ca97d8702ce2790cf0f6c7162a31b86))

# 0.20.0 (2020-08-27)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))
- fix ERC20 fee payment detection filter typo ([#274](https://github.com/RequestNetwork/requestNetwork/issues/274)) ([8046cd9](https://github.com/RequestNetwork/requestNetwork/commit/8046cd968f32591752905c7893c38686fca5038b))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- calculate ERC20 fee balance ([#255](https://github.com/RequestNetwork/requestNetwork/issues/255)) ([273f55d](https://github.com/RequestNetwork/requestNetwork/commit/273f55df63bedb111027aac78f072563f7f60007))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

### Bug Fixes

- add request custom etherscan key ([#152](https://github.com/RequestNetwork/requestNetwork/issues/152)) ([5b74d0e](https://github.com/RequestNetwork/requestNetwork/commit/5b74d0efe7c38e1e995ac0af34e4a0c9ecf712fd))

### Features

- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.26.0 (2020-10-14)

### Bug Fixes

- remove unknown modifier warning ([#331](https://github.com/RequestNetwork/requestNetwork/issues/331)) ([a0ec35d](https://github.com/RequestNetwork/requestNetwork/commit/a0ec35d38ca97d8702ce2790cf0f6c7162a31b86))

# 0.20.0 (2020-08-27)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))
- fix ERC20 fee payment detection filter typo ([#274](https://github.com/RequestNetwork/requestNetwork/issues/274)) ([8046cd9](https://github.com/RequestNetwork/requestNetwork/commit/8046cd968f32591752905c7893c38686fca5038b))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- calculate ERC20 fee balance ([#255](https://github.com/RequestNetwork/requestNetwork/issues/255)) ([273f55d](https://github.com/RequestNetwork/requestNetwork/commit/273f55df63bedb111027aac78f072563f7f60007))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

### Bug Fixes

- add request custom etherscan key ([#152](https://github.com/RequestNetwork/requestNetwork/issues/152)) ([5b74d0e](https://github.com/RequestNetwork/requestNetwork/commit/5b74d0efe7c38e1e995ac0af34e4a0c9ecf712fd))

### Features

- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.25.0 (2020-10-13)

### Bug Fixes

- remove unknown modifier warning ([#331](https://github.com/RequestNetwork/requestNetwork/issues/331)) ([a0ec35d](https://github.com/RequestNetwork/requestNetwork/commit/a0ec35d38ca97d8702ce2790cf0f6c7162a31b86))

# 0.20.0 (2020-08-27)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))
- fix ERC20 fee payment detection filter typo ([#274](https://github.com/RequestNetwork/requestNetwork/issues/274)) ([8046cd9](https://github.com/RequestNetwork/requestNetwork/commit/8046cd968f32591752905c7893c38686fca5038b))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- calculate ERC20 fee balance ([#255](https://github.com/RequestNetwork/requestNetwork/issues/255)) ([273f55d](https://github.com/RequestNetwork/requestNetwork/commit/273f55df63bedb111027aac78f072563f7f60007))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

### Bug Fixes

- add request custom etherscan key ([#152](https://github.com/RequestNetwork/requestNetwork/issues/152)) ([5b74d0e](https://github.com/RequestNetwork/requestNetwork/commit/5b74d0efe7c38e1e995ac0af34e4a0c9ecf712fd))

### Features

- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.24.0 (2020-10-09)

### Bug Fixes

- remove unknown modifier warning ([#331](https://github.com/RequestNetwork/requestNetwork/issues/331)) ([a0ec35d](https://github.com/RequestNetwork/requestNetwork/commit/a0ec35d38ca97d8702ce2790cf0f6c7162a31b86))

# 0.20.0 (2020-08-27)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))
- fix ERC20 fee payment detection filter typo ([#274](https://github.com/RequestNetwork/requestNetwork/issues/274)) ([8046cd9](https://github.com/RequestNetwork/requestNetwork/commit/8046cd968f32591752905c7893c38686fca5038b))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- calculate ERC20 fee balance ([#255](https://github.com/RequestNetwork/requestNetwork/issues/255)) ([273f55d](https://github.com/RequestNetwork/requestNetwork/commit/273f55df63bedb111027aac78f072563f7f60007))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

### Bug Fixes

- add request custom etherscan key ([#152](https://github.com/RequestNetwork/requestNetwork/issues/152)) ([5b74d0e](https://github.com/RequestNetwork/requestNetwork/commit/5b74d0efe7c38e1e995ac0af34e4a0c9ecf712fd))

### Features

- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.23.0 (2020-09-28)

# 0.20.0 (2020-08-27)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))
- fix ERC20 fee payment detection filter typo ([#274](https://github.com/RequestNetwork/requestNetwork/issues/274)) ([8046cd9](https://github.com/RequestNetwork/requestNetwork/commit/8046cd968f32591752905c7893c38686fca5038b))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- calculate ERC20 fee balance ([#255](https://github.com/RequestNetwork/requestNetwork/issues/255)) ([273f55d](https://github.com/RequestNetwork/requestNetwork/commit/273f55df63bedb111027aac78f072563f7f60007))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

### Bug Fixes

- add request custom etherscan key ([#152](https://github.com/RequestNetwork/requestNetwork/issues/152)) ([5b74d0e](https://github.com/RequestNetwork/requestNetwork/commit/5b74d0efe7c38e1e995ac0af34e4a0c9ecf712fd))

### Features

- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.22.0 (2020-09-18)

# 0.20.0 (2020-08-27)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))
- fix ERC20 fee payment detection filter typo ([#274](https://github.com/RequestNetwork/requestNetwork/issues/274)) ([8046cd9](https://github.com/RequestNetwork/requestNetwork/commit/8046cd968f32591752905c7893c38686fca5038b))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- calculate ERC20 fee balance ([#255](https://github.com/RequestNetwork/requestNetwork/issues/255)) ([273f55d](https://github.com/RequestNetwork/requestNetwork/commit/273f55df63bedb111027aac78f072563f7f60007))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

### Bug Fixes

- add request custom etherscan key ([#152](https://github.com/RequestNetwork/requestNetwork/issues/152)) ([5b74d0e](https://github.com/RequestNetwork/requestNetwork/commit/5b74d0efe7c38e1e995ac0af34e4a0c9ecf712fd))

### Features

- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.21.0 (2020-09-01)

# 0.20.0 (2020-08-27)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))
- fix ERC20 fee payment detection filter typo ([#274](https://github.com/RequestNetwork/requestNetwork/issues/274)) ([8046cd9](https://github.com/RequestNetwork/requestNetwork/commit/8046cd968f32591752905c7893c38686fca5038b))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- calculate ERC20 fee balance ([#255](https://github.com/RequestNetwork/requestNetwork/issues/255)) ([273f55d](https://github.com/RequestNetwork/requestNetwork/commit/273f55df63bedb111027aac78f072563f7f60007))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

### Bug Fixes

- add request custom etherscan key ([#152](https://github.com/RequestNetwork/requestNetwork/issues/152)) ([5b74d0e](https://github.com/RequestNetwork/requestNetwork/commit/5b74d0efe7c38e1e995ac0af34e4a0c9ecf712fd))

### Features

- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.20.0 (2020-08-27)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))
- fix ERC20 fee payment detection filter typo ([#274](https://github.com/RequestNetwork/requestNetwork/issues/274)) ([8046cd9](https://github.com/RequestNetwork/requestNetwork/commit/8046cd968f32591752905c7893c38686fca5038b))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- calculate ERC20 fee balance ([#255](https://github.com/RequestNetwork/requestNetwork/issues/255)) ([273f55d](https://github.com/RequestNetwork/requestNetwork/commit/273f55df63bedb111027aac78f072563f7f60007))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

### Bug Fixes

- add request custom etherscan key ([#152](https://github.com/RequestNetwork/requestNetwork/issues/152)) ([5b74d0e](https://github.com/RequestNetwork/requestNetwork/commit/5b74d0efe7c38e1e995ac0af34e4a0c9ecf712fd))

### Features

- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.19.0 (2020-08-13)

### Bug Fixes

- fix bugs and missing exports for ERC20 fee payment network ([#263](https://github.com/RequestNetwork/requestNetwork/issues/263)) ([764b7f0](https://github.com/RequestNetwork/requestNetwork/commit/764b7f026c8f6089d8933b5fb79ffbef0067abea))

### Features

- add ERC20 fee proxy contract PN payment detection ([#254](https://github.com/RequestNetwork/requestNetwork/issues/254)) ([bec5fac](https://github.com/RequestNetwork/requestNetwork/commit/bec5fac0ee7dbbd4f3af5cf9a627627fcc689e14))
- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))
- calculate ERC20 fee balance ([#255](https://github.com/RequestNetwork/requestNetwork/issues/255)) ([273f55d](https://github.com/RequestNetwork/requestNetwork/commit/273f55df63bedb111027aac78f072563f7f60007))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

### Bug Fixes

- add request custom etherscan key ([#152](https://github.com/RequestNetwork/requestNetwork/issues/152)) ([5b74d0e](https://github.com/RequestNetwork/requestNetwork/commit/5b74d0efe7c38e1e995ac0af34e4a0c9ecf712fd))

### Features

- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.18.0 (2020-06-29)

### Features

- amount are only number or string ([#223](https://github.com/RequestNetwork/requestNetwork/issues/223)) ([7a35bde](https://github.com/RequestNetwork/requestNetwork/commit/7a35bde63f78b9305819a80e97022fca7e9494d2))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

### Bug Fixes

- add request custom etherscan key ([#152](https://github.com/RequestNetwork/requestNetwork/issues/152)) ([5b74d0e](https://github.com/RequestNetwork/requestNetwork/commit/5b74d0efe7c38e1e995ac0af34e4a0c9ecf712fd))

### Features

- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.17.0 (2020-05-04)

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

### Bug Fixes

- add request custom etherscan key ([#152](https://github.com/RequestNetwork/requestNetwork/issues/152)) ([5b74d0e](https://github.com/RequestNetwork/requestNetwork/commit/5b74d0efe7c38e1e995ac0af34e4a0c9ecf712fd))

### Features

- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.16.0 (2020-04-21)

# 0.15.0 (2020-04-06)

### Bug Fixes

- add request custom etherscan key ([#152](https://github.com/RequestNetwork/requestNetwork/issues/152)) ([5b74d0e](https://github.com/RequestNetwork/requestNetwork/commit/5b74d0efe7c38e1e995ac0af34e4a0c9ecf712fd))

### Features

- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.15.0 (2020-04-06)

### Bug Fixes

- add request custom etherscan key ([#152](https://github.com/RequestNetwork/requestNetwork/issues/152)) ([5b74d0e](https://github.com/RequestNetwork/requestNetwork/commit/5b74d0efe7c38e1e995ac0af34e4a0c9ecf712fd))

### Features

- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.14.0 (2020-03-23)

### Bug Fixes

- add request custom etherscan key ([#152](https://github.com/RequestNetwork/requestNetwork/issues/152)) ([5b74d0e](https://github.com/RequestNetwork/requestNetwork/commit/5b74d0efe7c38e1e995ac0af34e4a0c9ecf712fd))

### Features

- payment detection error does not throw ([#163](https://github.com/RequestNetwork/requestNetwork/issues/163)) ([f49640b](https://github.com/RequestNetwork/requestNetwork/commit/f49640b264c1350f1a7b0001fd71736f8bf3dc23))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))

# 0.13.0 (2020-02-20)

### Bug Fixes

- ts-node configuration ([#138](https://github.com/RequestNetwork/requestNetwork/issues/138)) ([e2180d5](https://github.com/RequestNetwork/requestNetwork/commit/e2180d507bd87116fdeb3466690b6df0c5187976))

### Features

- add proxy contract to eth input data in payment detection ([#140](https://github.com/RequestNetwork/requestNetwork/issues/140)) ([0c36de1](https://github.com/RequestNetwork/requestNetwork/commit/0c36de12d08b1b591a7fd282d2cac1e5f38adb24))
- payment-processor new package ([#130](https://github.com/RequestNetwork/requestNetwork/issues/130)) ([a2ce521](https://github.com/RequestNetwork/requestNetwork/commit/a2ce521736e0607d3116347b42ecbfc6ba52d1b4))
