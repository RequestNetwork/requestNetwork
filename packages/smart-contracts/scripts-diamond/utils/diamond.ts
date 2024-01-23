import { Contract, ethers } from 'ethers';

// get function selectors from ABI
export const getSelectors = (contract: Contract): string[] => {
  const signatures = Object.keys(contract.interface.functions);
  const selectors = signatures.reduce((acc: string[], val: string) => {
    if (val !== 'init(bytes)') {
      acc.push(contract.interface.getSighash(val));
    }
    return acc;
  }, []);
  return selectors;
};

// get function selector from function signature
export const getSelector = (func: string): string => {
  const abiInterface = new ethers.utils.Interface([func]);
  return abiInterface.getSighash(ethers.utils.Fragment.from(func));
};

// Remove function selectors based on an existing list of selectors and a list of function signatures to remove
export const removeSelectors = (selectors: string[], functionSigs: string[]): string[] => {
  return selectors.filter((v) => {
    for (const functionSig of functionSigs) {
      const abiInterface = new ethers.utils.Interface([functionSig]);
      const selector = abiInterface.getSighash(ethers.utils.Fragment.from(functionSig));
      if (v === selector) {
        return false;
      }
    }
    return true;
  });
};
