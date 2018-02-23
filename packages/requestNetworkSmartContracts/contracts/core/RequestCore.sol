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
 * @dev All the important conditions and an important part of the business logic takes place in the currency contracts.
 * @dev Requests can only be created in the currency contracts
 * @dev Currency contracts have to be allowed by the Core and respect the business logic.
 * @dev Request Network will develop one currency contracts per currency and anyone can creates its own currency contracts.
 */
contract RequestCore is Administrable {
    using SafeMath for uint256;
    using SafeMathUint96 for uint96;
    using SafeMathInt for int256;
    using SafeMathUint8 for uint8;

    enum State { Created, Accepted, Canceled }

    struct Request {
        address payer; // ID address of the payer
        address currencyContract; // address of the contract managing the request
        State state; // state of the request
        address payee; // ID address of the main payee
        int256 expectedAmount; // amount expected for the main payee
        int256 balance; // balance of the main payee
    }

    // structure for the sub Payee. A sub payee is an additional entity which will be paid during the processing of the invoice.
    // ex: can be use for routing taxes or fees at the moment of the payment.
    struct Payee {
        address addr; // ID address of the sub payee
        int256 expectedAmount; // amount expected for the sub payee
        int256 balance; // balance of the sub payee
    }

    // index of the Request in the mapping. A maximum of 2^96 requests can be created per Core contract.
    uint96 public numRequests; 
    
    // mapping of all the Requests. The bytes32 is the request ID.
    mapping(bytes32 => Request) public requests;

    // mapping of subPayees of the requests. This array is outside the Request structure to optimize the gas cost when there is only 1 payee.
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
     * @dev Function used by currency contracts to create a request in the Core
     * @param _creator Request creator. The creator is the one who initiated the request (create or sign) and not necessarily the one who broadcasted it
     * @param _payees array of payees address (the position 0 will be the payee - must be msg.sender - the others are subPayees). Size must be smaller than 255.
     * @param _expectedAmounts array of Expected amount to be received by each payees. Must be in same order than the payees. Size must be smaller than 255.
     * @param _payer Entity expected to pay
     * @param _data data of the request
     * @return Returns the id of the request
     */   
    function createRequest(address _creator, address[] _payees, int256[] _expectedAmounts, address _payer, string _data) 
        external
        whenNotPaused 
        returns (bytes32 requestId) 
    {
        // creator must not be null
        require(_creator!=0); // not as modifier to lighten the stack
        // call must come from a trusted contract
        require(isTrustedContract(msg.sender)); // not as modifier to lighten the stack

        // Generate the requestId
        numRequests = numRequests.add(1);
        // create requestId = ADDRESS_CONTRACT_CORE + numRequests (0xADRRESSCONTRACT00000NUMREQUEST). 
        requestId = bytes32((uint256(this) << 96).add(numRequests));

        address mainPayee;
        int256 mainExpectedAmount;
        // extract the main payee if filled
        if(_payees.length!=0) {
            mainPayee = _payees[0];
            mainExpectedAmount = _expectedAmounts[0];
        }

        // Store and declare the new request
        requests[requestId] = Request(_payer, msg.sender, State.Created, mainPayee, mainExpectedAmount, 0);
        Created(requestId, mainPayee, _payer, _creator, _data);
        
        // Store and declare the sub payees (needed in internal function to avoid "stack too deep")
        initSubPayees(requestId, _payees, _expectedAmounts);

        return requestId;
    }

    /*
     * @dev Function used by currency contracts to create a request in the Core from bytes
     * @dev Used to avoid receiving a stack too deep error when called from a currency contract with too many parameters.
     * @param _data bytes containing all the data packed :
            address(creator)
            address(payer)
            uint8(number_of_payees)
            [
                address(main_payee_address)
                int256(main_payee_expected_amount)
                address(second_payee_address)
                int256(second_payee_expected_amount)
                ...
            ]
            uint8(data_string_size)
            size(data)
     * @return Returns the id of the request 
     */ 
    function createRequestFromBytes(bytes _data) 
        external
        whenNotPaused 
        returns (bytes32 requestId) 
    {
        // call must come from a trusted contract
        require(isTrustedContract(msg.sender)); // not as modifier to lighten the stack

        // extract address creator & payer
        address creator = extractAddress(_data, 0);
        address payer = extractAddress(_data, 20);

        // creator must not be null
        require(creator!=0);
        
        // extract the number of payees
        uint8 payeesCount = uint8(_data[40]);

        // get the position of the dataSize in the byte (= number_of_payees * (address_payee_size + int256_payee_size) + address_creator_size + address_payer_size + payees_count_size
        //                                              (= number_of_payees * (20+32) + 20 + 20 + 1 )
        uint256 offsetDataSize = uint256(payeesCount).mul(52).add(41);

        // extract the data size and then the data itself
        uint8 dataSize = uint8(_data[offsetDataSize]);
        string memory dataStr = extractString(_data, dataSize, offsetDataSize.add(1));

        address mainPayee;
        int256 mainExpectedAmount;
        // extract the main payee if possible
        if(payeesCount!=0) {
            mainPayee = extractAddress(_data, 41);
            mainExpectedAmount = int256(extractBytes32(_data, 61));
        }

        // Generate the requestId
        numRequests = numRequests.add(1);
        // create requestId = ADDRESS_CONTRACT_CORE + numRequests (0xADRRESSCONTRACT00000NUMREQUEST)
        requestId = bytes32((uint256(this) << 96).add(numRequests));

        // Store and declare the new request
        requests[requestId] = Request(payer, msg.sender, State.Created, mainPayee, mainExpectedAmount, 0);
        Created(requestId, mainPayee, payer, creator, dataStr);

        // Store and declare the sub payees
        for(uint8 i = 1; i < payeesCount; i = i.add(1)) {
            address subPayeeAddress = extractAddress(_data, uint256(i).mul(52).add(41));
            subPayees[requestId][i-1] =  Payee(subPayeeAddress, int256(extractBytes32(_data, uint256(i).mul(52).add(61))), 0);
            NewSubPayee(requestId, subPayeeAddress);
        }

        return requestId;
    }

    /*
     * @dev Function used by currency contracts to accept a request in the Core.
     * @dev callable only by the currency contract of the request
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
     * @dev Function used by currency contracts to cancel a request in the Core. Several reasons can lead to cancel a request, see request life cycle for more info.
     * @dev callable only by the currency contract of the request
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
     * @dev callable only by the currency contract of the request
     * @param _requestId Request id
     * @param _position position of the payee (0 = main payee)
     * @param _deltaAmount modifier amount
     */ 
    function updateBalance(bytes32 _requestId, uint8 _position, int256 _deltaAmount)
        external
    {   
        Request storage r = requests[_requestId];
        require(r.currencyContract==msg.sender);

        if( _position == 0 ) {
            // modify the main payee
            r.balance = r.balance.add(_deltaAmount);
        } else {
            // modify the sub payee
            Payee storage sp = subPayees[_requestId][_position-1];
            sp.balance = sp.balance.add(_deltaAmount);
        }
        UpdateBalance(_requestId, _position, _deltaAmount);
    }

    /*
     * @dev Function update the expectedAmount adding additional or subtract
     * @dev callable only by the currency contract of the request
     * @param _requestId Request id
     * @param _position position of the payee (0 = main payee)
     * @param _deltaAmount modifier amount
     */ 
    function updateExpectedAmount(bytes32 _requestId, uint8 _position, int256 _deltaAmount)
        external
    {   
        Request storage r = requests[_requestId];
        require(r.currencyContract==msg.sender); 

        if( _position == 0 ) {
            // modify the main payee
            r.expectedAmount = r.expectedAmount.add(_deltaAmount);    
        } else {
            // modify the sub payee
            Payee storage sp = subPayees[_requestId][_position-1];
            sp.expectedAmount = sp.expectedAmount.add(_deltaAmount);
        }
        UpdateExpectedAmount(_requestId, _position, _deltaAmount);
    }

    /*
     * @dev Internal: Init payees for a request (needed to avoid 'stack too deep' in createRequest())
     * @param _requestId Request id
     * @param _payees array of payees address
     * @param _expectedAmounts array of payees initial expected amounts
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


    /* GETTER */
    /*
     * @dev Get address of a payee
     * @param _requestId Request id
     * @param _position payee position (0 = main payee)
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
     * @param _position payee position (0 = main payee)
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
     * @param _position payee position (0 = main payee)
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
     * @dev Get balance total of a request
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
     * @dev check if all the payees balances are null
     * @param _requestId Request id
     * @return true if all the payees balances are equals to 0
     */     
    function areAllBalanceNull(bytes32 _requestId)
        public
        constant
        returns(bool isNull)
    {
        isNull = requests[_requestId].balance == 0;

        for (uint8 i = 0; isNull && i < 256 && subPayees[_requestId][i].addr != address(0); i = i.add(1))
        {
            isNull = subPayees[_requestId][i].balance == 0;
        }

        return isNull;
    }

    /*
     * @dev Get total expectedAmount of a request
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
     * @return payee position (0 = main payee) or -1 if not address not found
     */
    function getPayeePosition(bytes32 _requestId, address _address)
        public
        constant
        returns(int16)
    {
        // return 0 if main payee
        if(requests[_requestId].payee == _address) return 0;

        for (uint8 i = 0; i < 256 && subPayees[_requestId][i].addr != address(0); i = i.add(1))
        {
            if(subPayees[_requestId][i].addr == _address) {
                // if found return subPayee position + 1 (0 is main payee)
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
    function extractString(bytes data, uint8 size, uint _offset) internal pure returns (string) {
        bytes memory bytesString = new bytes(size);
        for (uint j = 0; j < size; j++) {
            bytesString[j] = data[_offset+j];
        }
        return string(bytesString);
    }

    /*
     * @dev extract an address from a bytes
     * @param _data bytes from where the address will be extract
     * @param _offset position of the first byte of the address
     * @return address
     */ 
    function extractAddress(bytes _data, uint offset) internal pure returns (address) {
        // no "for" pattern to optimise gas cost
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
     * @dev extract a bytes32 from a bytes
     * @param data bytes from where the bytes32 will be extract
     * @param offset position of the first byte of the bytes32
     * @return address
     */ 
    function extractBytes32(bytes _data, uint _offset) public pure returns (bytes32) {
        // no "for" pattern to optimise gas cost
        uint256 m = uint256(_data[_offset]); // 3930 gas
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
