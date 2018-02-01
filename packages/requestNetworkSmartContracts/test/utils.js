var ethUtil = require('ethereumjs-util');
var abiUtils = require("web3-eth-abi");
var config = require("./config.js");

exports.getRequestId = function(addressCore,num) {
  let hex = num.toString(16);
  for(i=0; i < 24 - hex.length; i++) addressCore+='0';
  return addressCore + hex;
}

exports.expectThrow = async function(promise) {
  try {
    await promise;
  } catch (error) {
    const invalidOpcode = error.message.search('invalid opcode') >= 0;
    const invalidJump = error.message.search('invalid JUMP') >= 0;
    const outOfGas = error.message.search('out of gas') >= 0;
    const revert = error.message.search('revert') >= 0;

    assert(
      invalidOpcode || invalidJump || outOfGas || revert,
      "Expected throw, got '" + error + "' instead",
    );
    return;
  }
  assert.fail('Expected throw not received');
};

exports.getEventFromReceipt = function(log, abi) {
  var event = null;

  for (var i = 0; i < abi.length; i++) {
    var item = abi[i];
    if (item.type != "event") continue;
    var signature = item.name + "(" + item.inputs.map(function(input) {return input.type;}).join(",") + ")";
    var hash = web3.sha3(signature);
    if (hash == log.topics[0]) {
      event = item;
      break;
    }
  }

  if (event != null) {
    var inputs = event.inputs.filter(function(input) {return !input.indexed;}).map(function(input) {return input.type;});
    var data = abiUtils.decodeParameters(inputs, log.data.replace("0x", ""));
    // Do something with the data. Depends on the log and what you're using the data for.
    return {name:event.name , data:data};
  }
  return null;
}

exports.bytes32StrToAddressStr= function(bytes32) {
  return bytes32.replace('0x000000000000000000000000','0x');
}