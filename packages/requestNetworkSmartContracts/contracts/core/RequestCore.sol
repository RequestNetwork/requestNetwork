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
    mapping(bytes32 => Payee[]) public subPayees;

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
     * @param _payee Entity which will receive the payment
     * @param _payer Entity supposed to pay
     * @param _expectedAmount Expected amount to be received. This amount can't be changed.
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
            subPayees[_requestId].push(Payee(_payees[i], _expectedAmounts[i], 0));
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
        returns(uint)
    {
        return subPayees[_requestId].length;
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

        for (uint8 i = 0; i < subPayees[_requestId].length; i = i.add(1))
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

        for (uint8 i = 0; i < subPayees[_requestId].length; i = i.add(1))
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

        for (uint8 i = 0; i < subPayees[_requestId].length; i = i.add(1))
        {
            if(subPayees[_requestId][i].addr == _address) {
                return i+1;
            }
        }
        return -1;
    }
}
