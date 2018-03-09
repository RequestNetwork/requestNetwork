pragma solidity 0.4.18;

// Test contract to test against reentrance in the case where a payment contract is payable and asserts
contract TestRequestPaymentStuckAssert {
    // Launcher -------------------------------------------------
    function ()
        public
        payable
    {   
        assert(false);
    } 
}
