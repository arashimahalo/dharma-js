class Util {
  constructor(web3) {
    this.web3 = web3;
    this.gasPrice = web3.toBigNumber('1');
  }

  setTimeForward(timeDiff, callback) {
    this.web3.currentProvider.sendAsync({
      method: "evm_increaseTime",
      params: [timeDiff],
      jsonrpc: "2.0",
      id: Date.now()
    }, callback);
  }

  getGasCosts(txHash, callback) {
    this.web3.eth.getTransactionReceipt(txHash, function(err, tx) {
      if (err) callback(err, null)
      else {
        const gasCost = this.gasPrice.times(tx.gasUsed);
        callback(null, gasCost);
      }
    }.bind(this))
  }
}

module.exports = Util;
