import { ethers } from 'hardhat';
import { getSelectors } from './utils/diamond';
import { DiamondInit__factory, Diamond__factory } from '../src/types';
import { currencyManager } from '@requestnetwork/payment-processor/test/payment/shared';

export const deployDiamondAndFacets = async () => {
  const [signer] = await ethers.getSigners();

  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet');
  const diamondCutFacet = await DiamondCutFacet.deploy();
  await diamondCutFacet.deployed();

  // deploy Diamond
  const diamond = await new Diamond__factory(signer).deploy(
    signer.address,
    diamondCutFacet.address,
  );
  await diamond.deployed();

  // deploy DiamondInit
  // DiamondInit provides a function that is called when the diamond is upgraded to initialize state variables
  // Read about how the diamondCut function works here: https://eips.ethereum.org/EIPS/eip-2535#addingreplacingremoving-functions
  const diamondInit = await new DiamondInit__factory(signer).deploy();
  await diamondInit.deployed();

  // deploy facets
  const FacetNames = [
    'DiamondLoupeFacet',
    'OwnershipFacet',
    'DiamondChainlinkConversionFacet',
    'DiamondPaymentFacet',
    'DiamondPaymentConversionFacet',
    'DiamondBatchFacet',
  ];
  const cut: any[] = [];
  for (const FacetName of FacetNames) {
    const Facet = await ethers.getContractFactory(FacetName);
    const facet = await Facet.deploy();
    await facet.deployed();
    cut.push({
      facetAddress: facet.address,
      action: 0, // 0 Represents the FacetCutAction.ADD action.
      functionSelectors: getSelectors(facet),
    });
  }

  // upgrade diamond with facets
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address);

  const ETH_hash = currencyManager.fromSymbol('ETH-private')!.hash;

  // call to init function
  const functionCall = diamondInit.interface.encodeFunctionData('init', [ETH_hash]);
  const tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall);
  const receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`);
  }
  return diamond.address;
};
