pragma solidity 0.4.18;

import './Administrable.sol';
import '../base/math/SafeMath.sol';
import '../base/math/SafeMathInt.sol';
import '../base/math/SafeMathUint96.sol';

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

    enum State { Created, Accepted, Canceled }

    struct Request {
        address creator;
        address payee;
        address payer;
        int256 expectedAmount;
        address currencyContract;
        int256 balance;
        State state;
        address extension;
        string data;
    }

    // index of the Request in the mapping
    uint96 public numRequests; 
    
    // mapping of all the Requests
    mapping(bytes32 => Request) public requests;

    /*
     *  Events 
     */
    event Created(bytes32 indexed requestId, address indexed payee, address indexed payer);
    event Accepted(bytes32 indexed requestId);
    event Canceled(bytes32 indexed requestId);
    event UpdateBalance(bytes32 indexed requestId, int256 deltaAmount);
    event UpdateExpectedAmount(bytes32 indexed requestId, int256 deltaAmount);

    event NewPayee(bytes32 indexed requestId, address payee);
    event NewPayer(bytes32 indexed requestId, address payer);
    event NewExpectedAmount(bytes32 indexed requestId, int256 expectedAmount);
    event NewExtension(bytes32 indexed requestId, address extension);
    event NewData(bytes32 indexed requestId, string data);

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
     * @param _extension an extension can be linked to a request and allows advanced payments conditions such as escrow. Extensions have to be whitelisted in Core
     * @return Returns the id of the request 
     */   
    function createRequest(address _creator, address _payee, address _payer, int256 _expectedAmount, address _extension, string _data) 
        payable
        external
        whenNotPaused 
        isTrustedContract(msg.sender)
        isTrustedExtension(_extension)
        creatorNotZero(_creator)
        returns (bytes32 requestId) 
    {
        numRequests = numRequests.add(1);
        requestId = bytes32((uint256(this) << 96).add(numRequests));

        requests[requestId] = Request(_creator, _payee, _payer, _expectedAmount, msg.sender, 0, State.Created, _extension, _data); 

        // collect
        require(trustedNewBurnManager.collectForReqBurning.value(msg.value)(_expectedAmount, msg.sender, _extension));

        Created(requestId, _payee, _payer);
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
     * @param _deltaAmount modifier amount
     */ 
    function updateBalance(bytes32 _requestId, int256 _deltaAmount)
        external
    {   
        Request storage r = requests[_requestId];
        require(r.currencyContract==msg.sender); 

        r.balance = r.balance.add(_deltaAmount);

        UpdateBalance(_requestId, _deltaAmount);
    }

    /*
     * @dev Function update the expectedAmount adding additional or subtract
     * @param _requestId Request id
     * @param _deltaAmount modifier amount
     */ 
    function updateExpectedAmount(bytes32 _requestId, int256 _deltaAmount)
        external
    {   
        Request storage r = requests[_requestId];
        require(r.currencyContract==msg.sender); 

        r.expectedAmount = r.expectedAmount.add(_deltaAmount);

        UpdateExpectedAmount(_requestId, _deltaAmount);
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
        NewPayee(_requestId, _payee);
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
        NewPayer(_requestId, _payer);
    }

    /*
     * @dev Set amount expected of a request
     * @param _requestId Request id
     * @param new amount expected
     */     
    function setExpectedAmount(bytes32 _requestId, int256 _expectedAmount)
        external
    {
        Request storage r = requests[_requestId];
        require(r.currencyContract==msg.sender);
        requests[_requestId].expectedAmount = _expectedAmount;
        NewExpectedAmount(_requestId, _expectedAmount);
    }

    /*
     * @dev Set extension of a request
     * @param _requestId Request id
     * @param new extension
     */     
    function setExtension(bytes32 _requestId, address _extension)
        external
        isTrustedExtension(_extension)
    {
        Request storage r = requests[_requestId];
        require(r.currencyContract==msg.sender);
        requests[_requestId].extension = _extension;
        NewExtension(_requestId, _extension);
    }

    /*
     * @dev Set extension of a request
     * @param _requestId Request id
     * @param new extension
     */     
    function setData(bytes32 _requestId, string _data)
        external
    {
        Request storage r = requests[_requestId];
        require(r.currencyContract==msg.sender);
        requests[_requestId].data = _data;
        NewData(_requestId, _data);
    }

    /* GETTER */
    /*
     * @dev Get payee of a request
     * @param _requestId Request id
     * @return payee address
     */ 
    function getPayee(bytes32 _requestId)
        public
        constant
        returns(address)
    {
        return requests[_requestId].payee;
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
     * @dev Get amount expected of a request
     * @param _requestId Request id
     * @return amount expected
     */     
    function getExpectedAmount(bytes32 _requestId)
        public
        constant
        returns(int256)
    {
        return requests[_requestId].expectedAmount;
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
     * @dev Get balance of a request
     * @param _requestId Request id
     * @return balance
     */     
    function getBalance(bytes32 _requestId)
        public
        constant
        returns(int256)
    {
        return requests[_requestId].balance;
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
     * @dev Get extension of a request
     * @param _requestId Request id
     * @return address
     */
    function getExtension(bytes32 _requestId)
        public
        constant
        returns(address)
    {
        return requests[_requestId].extension;
    } 

    /*
     * @dev Modifier Check that creator is not zero
     * @param _creator Request
     */
    modifier creatorNotZero(address _creator) {
       require(_creator!=0);
       _;
    }
}