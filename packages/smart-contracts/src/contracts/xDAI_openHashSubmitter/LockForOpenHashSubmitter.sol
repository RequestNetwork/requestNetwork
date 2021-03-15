// SPDX-License-Identifier: MIT
///@dev xDAI based  contract for   delegating Xdai payment of the  invoice hash commits . 
///@author Dhruv Malik , Request Network 

pragma solidity ^0.5.0;
import "./RequestOpenHashSubmitterXdai.sol";


///@dev function definition  used from deployed open hash submitter on xDAI.
interface IRequestOpenHashSubmitterXdai {

function submitHash(string calldata _hash, uint ) payable external;

}
///@title allows for proxy call to the hash submitter to put reference in solidity

contract lockForOpenHashSubmitter {
    /// TODO: change address for deployed version of open hash submitter : 
    /// @dev deploy the RequestOpenHashSubmitterXdai.sol on xDAI mainnet and record the address.
    /// @dev use setOpenHashSubmitterAddress to set the _newAddr parameter.
    address payable   ROSH_XDAI = 0xf4eacf30944A1a029b567A9eD29Db8d120452c2C;
    address payable internal owner;
    constructor() public {
        owner = msg.sender;
    }

    function() external payable {
    }
    
    function XdaiHashSubmitter(string calldata _invoiceHash , uint256 _gasFees ) external {
        IRequestOpenHashSubmitterXdai HashSubmitter = IRequestOpenHashSubmitterXdai(ROSH_XDAI);
        HashSubmitter.submitHash(_invoiceHash , _gasFees);
    }
    
    function setOpenHashSubmitterAddress(address payable _newaddr) external
    {
        
        ROSH_XDAI = _newaddr;
    }
    
    



}

