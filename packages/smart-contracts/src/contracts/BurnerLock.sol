//SPDX-License-Identifier: MIT
pragma solidity 0.4.24;
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/AccessControl.sol";
import "https://github.com/poanetwork/tokenbridge-contracts/blob/master/contracts/upgradeable_contracts/BasicHomeBridge.sol";
import "https://github.com/poanetwork/tokenbridge-contracts/blob/master/contracts/upgradeable_contracts/ERC20Bridge.sol"
// for the transferAndCall , we need to get the function implementation 


// reference : from https://docs.tokenbridge.net/amb-bridge/how-to-develop-xchain-apps-by-amb#code-examples
interface ITokenManagement {
    function approveAndCall(address _to, uint256 _value, bytes _data) public returns (bool success);
    function transferAndCall(address _to, uint256 _value, bytes _data) public returns (bool success);
    function relayTokens(address _receiver , uint256 _value) public returns (bool success);
    
    // also for managing our custom AMB implementation 
    function requireToPassMessage(address _contract, bytes _data, uint256 _gas) external returns (bytes32);
    
}

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
        require(_receiver != address(0));
        require(_receiver != address(this));
        require(_amount > 0);
        require(withinLimit(_amount));

        
        
        
        
    }
    
    
    
    
    
    
}





contract BurnerLock is ERC20 , BasicHomeBridge {
 address public constant  SOKOL_PROXY = 0xb7D311E2Eb55F2f68a9440da38e7989210b9A05e;
 address public   constant KOVAN_PROXY = 0xFe446bEF1DbF7AFE24E81e05BC8B271C1BA9a560;   



function getXDAI(address _from , uint256 amount )  external  payable returns  (bool txnStatus)
{  ERC20 receiver =
    
    
    
    
    
    
}




    
    
    
}


