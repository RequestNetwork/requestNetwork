pragma solidity ^0.5.0;

 interface IERC20  {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint256);

   
    function approve(address spender, uint256 amount) external returns (bool);

  
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

  
    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);
}




library SafeERC20 {

  /**
   * @notice Call transferFrom ERC20 function and validates the return data of a ERC20 contract call.
   * @dev This is necessary because of non-standard ERC20 tokens that don't have a return value.
   * @return The return value of the ERC20 call, returning true for non-standard tokens
   */
  function safeTransferFrom(
    IERC20  _token,
    address _from,
    address _to,
    uint256 _amount
  ) internal returns (bool result)
  {
    // solium-disable-next-line security/no-low-level-calls
    (bool success, bytes memory data) = address(_token).call(abi.encodeWithSignature(
      "transferFrom(address,address,uint256)",
      _from,
      _to,
      _amount
    ));

    return success && (data.length == 0 || abi.decode(data, (bool)));
  }

  /**
   * @notice Call approve ERC20 function and validates the return data of a ERC20 contract call.
   * @dev This is necessary because of non-standard ERC20 tokens that don't have a return value.
   * @return The return value of the ERC20 call, returning true for non-standard tokens
   */
  function safeApprove(IERC20 _token, address _spender, uint256 _amount) internal returns (bool result) {
    // solium-disable-next-line security/no-low-level-calls
    (bool success, bytes memory data) = address(_token).call(abi.encodeWithSignature(
      "approve(address,uint256)",
      _spender,
      _amount
    ));

    return success && (data.length == 0 || abi.decode(data, (bool)));
  }

  /**
   * @notice Call transfer ERC20 function and validates the return data of a ERC20 contract call.
   * @dev This is necessary because of non-standard ERC20 tokens that don't have a return value.
   * @return The return value of the ERC20 call, returning true for non-standard tokens
   */
  function safeTransfer(IERC20 _token, address _to, uint256 _amount) internal  returns (bool result) {
    // solium-disable-next-line security/no-low-level-calls
    (bool success, bytes memory data) = address(_token).call(abi.encodeWithSignature(
      "transfer(address,uint256)",
      _to,
      _amount
    ));

    return success && (data.length == 0 || abi.decode(data, (bool)));
  }
}
