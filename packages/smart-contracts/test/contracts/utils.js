const abiUtils = require('web3-eth-abi');

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
      const hash = web3.utils.sha3(signature);
      return hash === log.topics[0];
    });

  if (!event) {
    return null;
  }

  const inputs = event.inputs.filter(input => !input.indexed).map(input => input.type);
  var data = abiUtils.decodeParameters(inputs, log.data.replace('0x', ''));

  return { name: event.name, data: data };
};
