class Util {
  constructor(web3) {
    this.web3 = web3;
    this.gasPrice = web3.toBigNumber('100000000000');
  }

  setTimeForward(timeDiff, callback) {
    this.web3.currentProvider.sendAsync({
      method: "evm_increaseTime",
      params: [timeDiff],
      jsonrpc: "2.0",
      id: Date.now()
    }, callback);
  }

  getGasCosts(result) {
    return this.gasPrice.times(result.receipt.gasUsed);
  }
}

module.exports = Util;
