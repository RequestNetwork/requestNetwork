const abiUtils = require('web3-eth-abi');
var ethABI = require("../lib/ethereumjs-abi-perso.js"); 
var ethUtil = require("ethereumjs-util");

// Builds the requestId from Core address and request number
exports.getRequestId = function(addressCore, numRequest) {
  // Convert humRequest to hex string
  const hexNumRequest = numRequest.toString(16);

  return addressCore + hexNumRequest.padStart(24, '0');
}

// Adapted from https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/test/helpers/expectThrow.js
exports.expectThrow = async function(promise) {
  try {
    await promise;
    assert.fail('Expected throw not received');
  } catch (error) {
    const invalidOpcode = error.message.search('invalid opcode') >= 0;
    const invalidJump = error.message.search('invalid JUMP') >= 0;
    const outOfGas = error.message.search('out of gas') >= 0;
    const revert = error.message.search('revert') >= 0;

    assert(
      invalidOpcode || invalidJump || outOfGas || revert,
      `Expected throw, got '${error}' instead`
    );
  }
};

// Adapted from https://ethereum.stackexchange.com/questions/1381/how-do-i-parse-the-transaction-receipt-log-with-web3-js
exports.getEventFromReceipt = function(log, abi) {
  // Find the event in the abi from the log
  const event = abi
    // Filter the 'event' items from the abi
    .filter(item => item.type === 'event')

    // Find the event that has the same signature as the log
    .find(item => {
      const inputTypes = item.inputs.map(input => input.type).join(',');
      const signature = `${item.name}(${inputTypes})`;
      const hash = web3.sha3(signature);
      return (hash === log.topics[0]);
    });

  if (!event) {
    return null;
  }

  const inputs = event.inputs
    .filter(input => !input.indexed)
    .map(input => input.type);
  var data = abiUtils.decodeParameters(inputs, log.data.replace('0x', ''));

  return { name: event.name , data: data};
}

exports.bytes32StrToAddressStr = function(bytes32) {
  return bytes32.replace('0x000000000000000000000000','0x');
}

// Create a solidity bytes from array of bitcoin address (return the bytes in hex string)
exports.createBytesForPaymentBitcoinAddress = function(_payeesPaymentAddress) {
    return ethUtil.bufferToHex(exports.createBytesForPaymentBitcoinAddressBuffer(_payeesPaymentAddress));
}

// Create a solidity bytes from array of bitcoin address (return the bytes in buffer)
exports.createBytesForPaymentBitcoinAddressBuffer = function(_payeesPaymentAddress) {
    const requestParts = [];

    for (const k in _payeesPaymentAddress) {
        if (_payeesPaymentAddress.hasOwnProperty(k)) {
            requestParts.push({value: _payeesPaymentAddress[k].length, type: 'uint8'});
            requestParts.push({value: _payeesPaymentAddress[k], type: 'string'});
        }
    }

    const types = [];
    const values = [];
    requestParts.forEach((o) => {
        types.push(o.type);
        values.push(o.value);
    });

    return ethABI.solidityPack(types, values);
}
