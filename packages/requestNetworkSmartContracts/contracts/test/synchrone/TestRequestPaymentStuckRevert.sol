pragma solidity 0.4.18;

contract TestRequestPaymentStuckRevert {
    // Launcher -------------------------------------------------
    function ()
        public
        payable
    {   
        require(false);
    } 
}
