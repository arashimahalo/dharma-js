const LoanContract = require('./contract_wrappers/LoanContract')

class RedeemableERC20 {
  constructor(web3, uuid) {
    this.web3 = web3;
    this.uuid = uuid;
  }

  async transfer(tokenRecipient, value, options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    return contract.transfer(this.uuid, tokenRecipient, value, options);
  }

  async getRedeemableValue(tokenHolder, options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    return contract.getRedeemableValue.call(this.uuid, tokenHolder, options);
  }

  async redeemValue(recipient, options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    return contract.redeemValue(this.uuid, recipient, options);
  }

  async balanceOf(account, options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    return contract.balanceOf.call(this.uuid, account, options);
  }

  async approve(spender, value, options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    return contract.approve(this.uuid, spender, value, options);
  }

  async allowance(owner, spender, options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    return contract.allowance.call(this.uuid, owner, spender, options);
  }

  async transferFrom(from, to, value, options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    return contract.transferFrom(this.uuid, from, to, value, options);
  }
}

module.exports = RedeemableERC20;
