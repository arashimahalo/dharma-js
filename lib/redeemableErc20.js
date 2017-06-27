class RedeemableERC20 {
  constructor(web3, uuid) {
    this.web3 = web3;
    this.uuid = uuid;
  }

  transfer(value, tokenRecipient) {

  }

  redeemValue(recipient, options, callback) {
    if (arguments.length === 2) {
      callback = options;
      options = { from: this.web3.eth.defaultAccount };
    }

    this.contract.redeemValue(this.uuid, recipient, options, callback);
  }

  balanceOf(account, options, callback) {
    if (arguments.length === 2) {
      callback = options;
      options = {};
    }

    this.contract.balanceOf(this.uuid, account, options, callback);
  }

  approve(spender, value) {

  }

  allowance(spender) {

  }

  transferFrom(from, to, value) {

  }
}

module.exports = RedeemableERC20;
