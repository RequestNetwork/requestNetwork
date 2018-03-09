pragma solidity 0.4.18;

// Test contract to test against reentrance in the case where a payment contract is payable and requires
contract TestRequestPaymentStuckRevert {
    // Launcher -------------------------------------------------
    function ()
        public
        payable
    {   
        require(false);
    } 
}
