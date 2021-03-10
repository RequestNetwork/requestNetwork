pragma solidity ^0.5.0;
import "./lib/ERC20Bridge.sol";
import "@openzepplin-contracts/contrac";
contract BasicHomeBridge is ERC20Bridge {
    
    function submitSignature(bytes signature, bytes message) external onlyValidator {
        require(Message.isMessageValid(message));
        require(msg.sender == Message.recoverAddressFromSignedMessage(signature, message, false));
        bytes32 hashMsg = keccak256(abi.encodePacked(message));
        bytes32 hashSender = keccak256(abi.encodePacked(msg.sender, hashMsg));

        uint256 signed = numMessagesSigned(hashMsg);
        require(!isAlreadyProcessed(signed));
        // the check above assumes that the case when the value could be overflew will not happen in the addition operation below
        signed = signed + 1;
        if (signed > 1) {
            // Duplicated signatures
            require(!messagesSigned(hashSender));
        } else {
            setMessages(hashMsg, message);
        }
        setMessagesSigned(hashSender, true);

        bytes32 signIdx = keccak256(abi.encodePacked(hashMsg, (signed - 1)));
        setSignatures(signIdx, signature);

        setNumMessagesSigned(hashMsg, signed);

        emit SignedForUserRequest(msg.sender, hashMsg);

        uint256 reqSigs = requiredSignatures();
        if (signed >= reqSigs) {
            setNumMessagesSigned(hashMsg, markAsProcessed(signed));
            emit CollectedSignatures(msg.sender, hashMsg, reqSigs);

            onSignaturesCollected(message);
        }
        
        
        

        
        
        
        
        
        
        
        
    }
    
    
    
        function message(bytes32 _hash) external view returns (bytes) {
        return bytesStorage[keccak256(abi.encodePacked("messages", _hash))];
    }
    
    
    
    
    function relayTokens(address _receiver, uint256 _amount) external {
        // general checks to 
        require(_receiver != address(0) && _receiver != address(DAI_ADDRESS));
        require(_receiver != address(this));
        require(_amount > 0);
        require(withinLimit(_amount));

        
        
        
        
    }
    
    

    
    
    
}
