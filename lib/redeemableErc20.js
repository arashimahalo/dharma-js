TOKEN_EVENTS = {
  transfer: 'Transfer',
  approval: 'Approval'
}

class RedeemableERC20 {
  constructor(web3, uuid) {
    this.web3 = web3;
    this.uuid = uuid;

    this.events = {};

    for (let eventName in TOKEN_EVENTS) {
      this.events[eventName] = (options, callback) => {
        return this._getEvent(TOKEN_EVENTS[eventName], options, callback);
      }
    }
  }

  transfer(tokenRecipient, value, options, callback) {
    if (arguments.length === 3) {
      callback = options;
      options = { from: this.web3.eth.defaultAccount };
    }

    this.contract.transfer(this.uuid, tokenRecipient, value, options, callback);
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

  approve(spender, value, options, callback) {
    if (arguments.length === 3) {
      callback = options;
      options = { from: this.web3.eth.defaultAccount };
    }

    this.contract.approve(this.uuid, spender, value, options, callback);
  }

  allowance(owner, spender, options, callback) {
    if (arguments.length === 3) {
      callback = options;
      options = { from: this.web3.eth.defaultAccount };
    }

    this.contract.allowance(this.uuid, owner, spender, options, callback);
  }

  transferFrom(from, to, value, options, callback) {
    if (arguments.length === 4) {
      callback = options;
      options = { from: this.web3.eth.defaultAccount };
    }

    this.contract.transferFrom(this.uuid, from, to, value, options, callback);
  }

  _getEvent(eventName, options, callback) {
    options = options || {};
    options._uuid = this.uuid;

    const contractEvent = this.contract[eventName](options)
    if (callback) {
      contractEvent.watch(callback)
    } else {
      return contractEvent;
    }
  }
}

module.exports = RedeemableERC20;
