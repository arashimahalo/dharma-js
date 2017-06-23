module.exports = {
  setTimeForward: (timeDiff, callback) => {
    web3.currentProvider.sendAsync({
      method: "evm_increaseTime",
      params: [timeDiff],
      jsonrpc: "2.0",
      id: Date.now()
    }, callback);
  }
}
