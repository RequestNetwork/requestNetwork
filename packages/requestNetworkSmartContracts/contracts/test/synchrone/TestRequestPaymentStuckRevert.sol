pragma solidity ^0.4.18;


// Test contract to test against reentrancy in the case where a payment contract is payable and requires
contract TestRequestPaymentStuckRevert {
    function ()
        public
        payable
    {
        // solium-disable-next-line error-reason
        require(false);
    } 
}
