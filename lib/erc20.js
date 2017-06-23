class ERC20 {
  constructor(web3, uuid) {
    this.web3 = web3;
    this.uuid = uuid;
  }

  transfer(value, tokenRecipient) {

  }

  redeemValue() {

  }

  balanceOf(account) {
    return this.contract.balanceOf.call(this.uuid, account);
  }

  approve(spender, value) {

  }

  allowance(spender) {

  }

  transferFrom(from, to, value) {

  }
}

module.exports = ERC20;
