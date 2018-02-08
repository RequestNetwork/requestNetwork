pragma solidity 0.4.18;

// contract RequestEthereumWeak {

//     function createRequestAsPayeeOLD(address _payer, int256 _expectedAmount, address _extension, bytes32[9] _extensionParams, string _data) public returns(bytes32);
//     function createRequestAsPayee(address[] _payees, int256[] _expectedAmounts, address _payer, string _data);

//     function withdraw() public;

// }
import '../../synchrone/RequestEthereum.sol';

contract TestRequestReentrance {

    address contractAdd;
    uint8 round;
    int256[] amounts;
    address[] payees;

    event Log(bytes32 id);

    function TestRequestReentrance(address _contract, uint8 _round) public {
        contractAdd = _contract;
        round = _round;
    }

    function init(address _payer) public {
        RequestEthereum weakContract = RequestEthereum(contractAdd);
        payees.push(this);
        amounts.push(10000000000000);
        bytes32 id = weakContract.createRequestAsPayee(payees, amounts, _payer, "");
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

