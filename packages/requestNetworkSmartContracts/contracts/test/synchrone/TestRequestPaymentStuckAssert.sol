pragma solidity 0.4.18;

contract TestRequestPaymentStuckAssert {
    // Launcher -------------------------------------------------
    function ()
        public
        payable
    {   
        assert(false);
    } 
}
