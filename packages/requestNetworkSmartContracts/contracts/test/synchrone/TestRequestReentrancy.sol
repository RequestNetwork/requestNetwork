pragma solidity 0.4.18;

import '../../synchrone/RequestEthereum.sol';


// Reentrancy test for Ether currency contract
contract TestRequestReentrancy {

    address contractAdd;
    uint8 round;
    int256[] amounts;
    address[] payees;
    address[] payeesPayment;

    event Log(bytes32 id);

    function TestRequestReentrancy(address _contract, uint8 _round) public {
        contractAdd = _contract;
        round = _round;
    }

    function init(address _payer) public {
        RequestEthereum weakContract = RequestEthereum(contractAdd);
        payees.push(this);
        amounts.push(10000000000000);
        bytes32 id = weakContract.createRequestAsPayee(payees, payeesPayment, amounts, _payer, 0, "");
        Log(id);
    }

    function start() public {
        round--;
        RequestEthereum weakContract = RequestEthereum(contractAdd);
        weakContract.withdraw();
    }

    // Launcher -------------------------------------------------
    function ()
        public
        payable
    {   
        if(round != 0) {
            round--;
            RequestEthereum weakContract = RequestEthereum(contractAdd);
            weakContract.withdraw();
        }
    } 
}

