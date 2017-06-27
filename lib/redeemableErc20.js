class RedeemableERC20 {
  constructor(web3, uuid) {
    this.web3 = web3;
    this.uuid = uuid;
  }

  transfer(value, tokenRecipient) {

  }

  redeemValue() {

  }

  balanceOf(account, callback) {
    console.log(account);
    this.contract.balanceOf(this.uuid, account, callback);
  }

  approve(spender, value) {

  }

  allowance(spender) {

  }

  transferFrom(from, to, value) {

  }
}

module.exports = RedeemableERC20;
