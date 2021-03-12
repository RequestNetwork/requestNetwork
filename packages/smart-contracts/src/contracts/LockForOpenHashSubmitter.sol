// SPDX-License-Identifier: MIT



///@dev xDAI based  contract for   delegating Xdai payment of the  invoice hash commits . 

///@author Dhruv Malik , Request Network 

pragma solidity ^0.5.0;
import "./RequestOpenHashSubmitterXdai.sol";
interface IRequestOpenHashSubmitterXdai {

function submitHash(string calldata _hash) payable external;

}

contract lockForOpenHashSubmitter {
    // currently  the address added is for the mainnet to supress errors   .
    address payable   ROSH_XDAI = 0xf4eacf30944A1a029b567A9eD29Db8d120452c2C;
    address payable internal owner;
//    event HashSubmit(string calldata _invoiceHash);
    constructor() public {
        owner = msg.sender;
    }

    ///@dev it returns the Xdai Funds locked by this contract for transfer , back to the owner , working as safety valve. 
    
    function revertamount() external {
        owner.transfer(address(this).balance);
    }
    ///@dev for getting the balance being held by the contract , so as to monitor the transaction directly onchain.

    function balance() view external returns(uint) {
        return address(this).balance;
    }
    function() external payable {
    }
    
    function XdaiPayment(string calldata _invoiceHash ) external {
        IRequestOpenHashSubmitterXdai HashSubmitter = IRequestOpenHashSubmitterXdai(ROSH_XDAI);
        HashSubmitter.submitHash(_invoiceHash);
  //      emit HashSubmit(_invoiceHash);
    }
    
    function setOpenHashSubmitterAddress(address payable _newaddr) external
    {
        
        ROSH_XDAI = _newaddr;
    }
    
    



}

