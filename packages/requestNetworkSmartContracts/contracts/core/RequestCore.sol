pragma solidity 0.4.18;

import './Administrable.sol';
import '../base/math/SafeMath.sol';
import '../base/math/SafeMathInt.sol';
import '../base/math/SafeMathUint96.sol';
import '../base/math/SafeMathUint8.sol';

/**
 * @title RequestCore
 *
 * @dev The Core is the main contract which store all the Requests.
 *
 * @dev The Core philosophy is to be as much flexible as possible to adapt in the future to any new system
 * @dev All the important conditions and an important part of the business logic takes place in the subcontracts.
 * @dev Requests can only be created in the subcontracts
 * @dev Subcontracts have to be allowed by the Core and respect the business logic.
 * @dev Request Network will develop one subcontracts per currency and anyone can creates its own subcontracts.
 */
contract RequestCore is Administrable {
    using SafeMath for uint256;
    using SafeMathUint96 for uint96;
    using SafeMathInt for int256;
    using SafeMathUint8 for uint8;

    enum State { Created, Accepted, Canceled }

    struct Payee {
        address addr;
        int256 expectedAmount;
        int256 balance;
    }
    struct Request {
        address payer;
        address currencyContract;
        State state;
        address payee;
        int256 expectedAmount;
        int256 balance;
    }

    // index of the Request in the mapping
    uint96 public numRequests; 
    
    // mapping of all the Requests
    mapping(bytes32 => Request) public requests;
    mapping(bytes32 => Payee[256]) public subPayees;

    /*
     *  Events 
     */
    event Created(bytes32 indexed requestId, address indexed payee, address indexed payer, address creator, string data);
    event Accepted(bytes32 indexed requestId);
    event Canceled(bytes32 indexed requestId);
    event UpdatePayer(bytes32 indexed requestId, address payer);

    // Event for Payee & subPayees
    event NewSubPayee(bytes32 indexed requestId, address indexed payee);
    event UpdatePayee(bytes32 indexed requestId, address payee);
    event UpdateAddressPayee(bytes32 indexed requestId, uint8 position, address indexed payee);
    event UpdateExpectedAmount(bytes32 indexed requestId, uint8 position, int256 deltaAmount);
    event UpdateBalance(bytes32 indexed requestId, uint8 position, int256 deltaAmount);

    /*
     *  Constructor 
     */
    function RequestCore() 
        public
    {
        numRequests = 0;
    }

    /*
     * @dev Function used by Subcontracts to create a request in the Core
     * @param _creator Request creator
     * @param _payees array of payees address (the position 0 will be the payee - must be msg.sender - the others are subPayees). Size must be smaller than 255.
     * @param _expectedAmounts array of Expected amount to be received by each payees. Size must be smaller than 255.
     * @param _payer Entity supposed to pay
     * @param _data data of the request
     * @return Returns the id of the request 
     */   
    function createRequest(address _creator, address[] _payees, int256[] _expectedAmounts, address _payer, string _data) 
        external
        whenNotPaused 
        returns (bytes32 requestId) 
    {
        require(_creator!=0); // not as modifier to lighten the stack
        require(isTrustedContract(msg.sender)); // not as modifier to lighten the stack

        numRequests = numRequests.add(1);
        // create requestId = ADDRESS_CONTRACT_CORE + numRequests (0xADRRESSCONTRACT00000NUMREQUEST)
        requestId = bytes32((uint256(this) << 96).add(numRequests));

        address defaultPayee;
        int256 defaultExpectedAmount;
        if(_payees.length!=0) {
            defaultPayee = _payees[0];
            defaultExpectedAmount = _expectedAmounts[0];
        }
        requests[requestId] = Request(_payer, msg.sender, State.Created, defaultPayee, defaultExpectedAmount, 0);
        Created(requestId, defaultPayee, _payer, _creator, _data);
        
        // add all the subPayees for the request (needed in internal function to avoid "stack too deep")
        initSubPayees(requestId, _payees, _expectedAmounts);

        return requestId;
    }

    /*
     * @dev Function used by Subcontracts to create a request in the Core from bytes
     * @param _data bytes containing all the data packed :
            address(creator)
            address(payer)
            uint8(number_of_payees)
            address(first_payee_address)
            int256(first_payee_expected_amount)
            address(second_payee_address)
            int256(second_payee_expected_amount)
                ...
            uint8(data_string_size)
            size(data)
     * @return Returns the id of the request 
     */ 
    function createRequestFromBytes(bytes _data) 
        external
        whenNotPaused 
        returns (bytes32 requestId) 
    {
        // TODO overflow sur uint8 offsetDataSize+1+dataSize+20 /!\ (?)
        address creator = extractAddress(_data, 0);
        address payer = extractAddress(_data, 20);
        uint8 payeesCount = uint8(_data[40]);
        uint offsetDataSize = payeesCount.mul(52).add(41);
        uint8 dataSize = uint8(_data[offsetDataSize]);
        string memory dataStr = extractString(_data, dataSize, offsetDataSize+1);

        require(creator!=0); // not as modifier to lighten the stack
        require(isTrustedContract(msg.sender)); // not as modifier to lighten the stack

        numRequests = numRequests.add(1);
        // create requestId = ADDRESS_CONTRACT_CORE + numRequests (0xADRRESSCONTRACT00000NUMREQUEST)
        requestId = bytes32((uint256(this) << 96).add(numRequests));

        address firstPayee = extractAddress(_data, 41); 
        int256 firstExpectedAmount = int256(extractBytes32(_data, 61));

        requests[requestId] = Request(payer, msg.sender, State.Created, firstPayee, firstExpectedAmount, 0);
        Created(requestId, firstPayee, payer, creator, dataStr);

        for(uint8 i = 1; i < payeesCount; i = i.add(1)) {
            // TODO overflow sur uint8 i avec 1+i*8 /!\ (?)
            address subPayeeAddress = extractAddress(_data, 41+i*52);
            // TODO overflow sur uint8 i avec 1+i*8 /!\ (?)
            subPayees[requestId][i-1] =  Payee(subPayeeAddress, int256(extractBytes32(_data, 61+i*52)), 0);
            NewSubPayee(requestId, subPayeeAddress);
        }

        return requestId;
    }

    /*
     * @dev Function used by Subcontracts to accept a request in the Core.
     * @param _requestId Request id
     */ 
    function accept(bytes32 _requestId) 
        external
    {
        Request storage r = requests[_requestId];
        require(r.currencyContract==msg.sender); 
        r.state = State.Accepted;
        Accepted(_requestId);
    }

    /*
     * @dev Function used by Subcontracts to cancel a request in the Core. Several reasons can lead to cancel a reason, see request life cycle for more info.
     * @param _requestId Request id
     */ 
    function cancel(bytes32 _requestId)
        external
    {
        Request storage r = requests[_requestId];
        require(r.currencyContract==msg.sender);

        r.state = State.Canceled;
        Canceled(_requestId);
    }   

    /*
     * @dev Function used to update the balance
     * @param _requestId Request id
     * @param _position position of the payee (0 = the default)
     * @param _deltaAmount modifier amount
     */ 
    function updateBalance(bytes32 _requestId, uint8 _position, int256 _deltaAmount)
        external
    {   
        Request storage r = requests[_requestId];
        require(r.currencyContract==msg.sender); 

        if( _position == 0 ) {
            r.balance = r.balance.add(_deltaAmount);    
        } else {
            Payee storage sp = subPayees[_requestId][_position-1];
            sp.balance = sp.balance.add(_deltaAmount);
        }
        UpdateBalance(_requestId, _position, _deltaAmount);
    }

    /*
     * @dev Function update the expectedAmount adding additional or subtract
     * @param _requestId Request id
     * @param _position position of the payee (0 = the default)
     * @param _deltaAmount modifier amount
     */ 
    function updateExpectedAmount(bytes32 _requestId, uint8 _position, int256 _deltaAmount)
        external
    {   
        Request storage r = requests[_requestId];
        require(r.currencyContract==msg.sender); 

        if( _position == 0 ) {
            r.expectedAmount = r.expectedAmount.add(_deltaAmount);    
        } else {
            Payee storage sp = subPayees[_requestId][_position-1];
            sp.expectedAmount = sp.expectedAmount.add(_deltaAmount);
        }
        UpdateExpectedAmount(_requestId, _position, _deltaAmount);
    }

    /*
     * @dev Internal: Init payees for a request (needed to avoid 'stack too deep' in createRequest())
     * @param _requestId Request id
     * @param _payees array of payees address
     * @param _expectedAmounts array of payees initialAmount
     */ 
    function initSubPayees(bytes32 _requestId, address[] _payees, int256[] _expectedAmounts)
        internal
    {
        require(_payees.length == _expectedAmounts.length);
     
        for (uint8 i = 1; i < _payees.length; i = i.add(1))
        {
            subPayees[_requestId][i-1] = Payee(_payees[i], _expectedAmounts[i], 0);
            NewSubPayee(_requestId, _payees[i]);
        }
    }

    /* SETTER */
    /*
     * @dev Set payee of a request
     * @param _requestId Request id
     * @param _payee new payee
     */ 
    function setPayee(bytes32 _requestId, address _payee)
        external
    {
        Request storage r = requests[_requestId];
        require(r.currencyContract==msg.sender);
        requests[_requestId].payee = _payee;
        UpdatePayee(_requestId, _payee);
    }

    /*
     * @dev Get payer of a request
     * @param _requestId Request id
     * @param _payee new payer
     */ 
    function setPayer(bytes32 _requestId, address _payer)
        external
    {
        Request storage r = requests[_requestId];
        require(r.currencyContract==msg.sender);
        requests[_requestId].payer = _payer;
        UpdatePayer(_requestId, _payer);
    }

    /* GETTER */
    /*
     * @dev Get address of a payee
     * @param _requestId Request id
     * @param _position payee position
     * @return payee address
     */ 
    function getPayeeAddress(bytes32 _requestId, uint8 _position)
        public
        constant
        returns(address)
    {
        if(_position == 0) {
            return requests[_requestId].payee;    
        } else {
            return subPayees[_requestId][_position-1].addr;
        }
    }

    /*
     * @dev Get payer of a request
     * @param _requestId Request id
     * @return payer address
     */ 
    function getPayer(bytes32 _requestId)
        public
        constant
        returns(address)
    {
        return requests[_requestId].payer;
    }

    /*
     * @dev Get amount expected of a payee
     * @param _requestId Request id
     * @param _position payee position
     * @return amount expected
     */     
    function getPayeeExpectedAmount(bytes32 _requestId, uint8 _position)
        public
        constant
        returns(int256)
    {   
        if(_position == 0) {
            return requests[_requestId].expectedAmount;    
        } else {
            return subPayees[_requestId][_position-1].expectedAmount;
        }
    }

    /*
     * @dev Get number of subPayees for a request
     * @param _requestId Request id
     * @return number of subPayees
     */     
    function getSubPayeesCount(bytes32 _requestId)
        public
        constant
        returns(uint8)
    {
        for (uint8 i = 0; i < 255 && subPayees[_requestId][i].addr != address(0); i = i.add(1)) {
            // nothing to do
        }
        return i;
    }

    /*
     * @dev Get currencyContract of a request
     * @param _requestId Request id
     * @return currencyContract address
     */
    function getCurrencyContract(bytes32 _requestId)
        public
        constant
        returns(address)
    {
        return requests[_requestId].currencyContract;
    }

    /*
     * @dev Get balance of a payee
     * @param _requestId Request id
     * @param _position payee position
     * @return balance
     */     
    function getPayeeBalance(bytes32 _requestId, uint8 _position)
        public
        constant
        returns(int256)
    {
        if(_position == 0) {
            return requests[_requestId].balance;    
        } else {
            return subPayees[_requestId][_position-1].balance;
        }
    }

    /*
     * @dev Get balance of a request
     * @param _requestId Request id
     * @return balance
     */     
    function getBalance(bytes32 _requestId)
        public
        constant
        returns(int256)
    {
        int256 balance = requests[_requestId].balance;

        for (uint8 i = 0; i < 256 && subPayees[_requestId][i].addr != address(0); i = i.add(1))
        {
            balance = balance.add(subPayees[_requestId][i].balance);
        }

        return balance;
    }

    /*
     * @dev Get expectedAmount of a request
     * @param _requestId Request id
     * @return balance
     */     
    function getExpectedAmount(bytes32 _requestId)
        public
        constant
        returns(int256)
    {
        int256 expectedAmount = requests[_requestId].expectedAmount;

        for (uint8 i = 0; i < 256 && subPayees[_requestId][i].addr != address(0); i = i.add(1))
        {
            expectedAmount = expectedAmount.add(subPayees[_requestId][i].expectedAmount);
        }

        return expectedAmount;
    }

    /*
     * @dev Get state of a request
     * @param _requestId Request id
     * @return state
     */ 
    function getState(bytes32 _requestId)
        public
        constant
        returns(State)
    {
        return requests[_requestId].state;
    }

    /*
     * @dev Get address of a payee
     * @param _requestId Request id
     * @param _position payee position
     * @return payee address
     */ 
    function getPayeePosition(bytes32 _requestId, address _address)
        public
        constant
        returns(int16)
    {
        if(requests[_requestId].payee == _address) return 0;

        for (uint8 i = 0; i < 256 && subPayees[_requestId][i].addr != address(0); i = i.add(1))
        {
            if(subPayees[_requestId][i].addr == _address) {
                return i+1;
            }
        }
        return -1;
    }

    /*
     * @dev extract a string in a bytes
     * @param data bytes from where the string will be extract
     * @param size string size to extract
     * @param _offset position of the first byte of the string
     * @return string
     */ 
    function extractString(bytes data, uint8 size, uint _offset) internal constant returns (string) {
        bytes memory bytesString = new bytes(size);
        for (uint j = 0; j < size; j++) {
            bytesString[j] = data[_offset+j];
        }
        return string(bytesString);
    }

    /*
     * @dev extract an address in a bytes
     * @param _data bytes from where the address will be extract
     * @param _offset position of the first byte of the address
     * @return address
     */ 
    function extractAddress(bytes _data, uint offset) internal pure returns (address) {
        uint160 m = uint160(_data[offset]); // 2576 gas
        m = m*256 + uint160(_data[offset+1]);
        m = m*256 + uint160(_data[offset+2]);
        m = m*256 + uint160(_data[offset+3]);
        m = m*256 + uint160(_data[offset+4]);
        m = m*256 + uint160(_data[offset+5]);
        m = m*256 + uint160(_data[offset+6]);
        m = m*256 + uint160(_data[offset+7]);
        m = m*256 + uint160(_data[offset+8]);
        m = m*256 + uint160(_data[offset+9]);
        m = m*256 + uint160(_data[offset+10]);
        m = m*256 + uint160(_data[offset+11]);
        m = m*256 + uint160(_data[offset+12]);
        m = m*256 + uint160(_data[offset+13]);
        m = m*256 + uint160(_data[offset+14]);
        m = m*256 + uint160(_data[offset+15]);
        m = m*256 + uint160(_data[offset+16]);
        m = m*256 + uint160(_data[offset+17]);
        m = m*256 + uint160(_data[offset+18]);
        m = m*256 + uint160(_data[offset+19]);
        return address(m);
    }

    /*
     * @dev extract a bytes32 in a bytes
     * @param data bytes from where the bytes32 will be extract
     * @param offset position of the first byte of the bytes32
     * @return address
     */ 
    function extractBytes32(bytes _data, uint _offset) public pure returns (bytes32) {
        uint256 m = uint256(_data[_offset]); // 3930
        m = m*256 + uint256(_data[_offset+1]);
        m = m*256 + uint256(_data[_offset+2]);
        m = m*256 + uint256(_data[_offset+3]);
        m = m*256 + uint256(_data[_offset+4]);
        m = m*256 + uint256(_data[_offset+5]);
        m = m*256 + uint256(_data[_offset+6]);
        m = m*256 + uint256(_data[_offset+7]);
        m = m*256 + uint256(_data[_offset+8]);
        m = m*256 + uint256(_data[_offset+9]);
        m = m*256 + uint256(_data[_offset+10]);
        m = m*256 + uint256(_data[_offset+11]);
        m = m*256 + uint256(_data[_offset+12]);
        m = m*256 + uint256(_data[_offset+13]);
        m = m*256 + uint256(_data[_offset+14]);
        m = m*256 + uint256(_data[_offset+15]);
        m = m*256 + uint256(_data[_offset+16]);
        m = m*256 + uint256(_data[_offset+17]);
        m = m*256 + uint256(_data[_offset+18]);
        m = m*256 + uint256(_data[_offset+19]);
        m = m*256 + uint256(_data[_offset+20]);
        m = m*256 + uint256(_data[_offset+21]);
        m = m*256 + uint256(_data[_offset+22]);
        m = m*256 + uint256(_data[_offset+23]);
        m = m*256 + uint256(_data[_offset+24]);
        m = m*256 + uint256(_data[_offset+25]);
        m = m*256 + uint256(_data[_offset+26]);
        m = m*256 + uint256(_data[_offset+27]);
        m = m*256 + uint256(_data[_offset+28]);
        m = m*256 + uint256(_data[_offset+29]);
        m = m*256 + uint256(_data[_offset+30]);
        m = m*256 + uint256(_data[_offset+31]);
        return bytes32(m);
    }

}
