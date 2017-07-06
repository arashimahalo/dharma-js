'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LoanContract = require('./contract_wrappers/LoanContract');

var RedeemableERC20 = function () {
  function RedeemableERC20(web3, uuid) {
    _classCallCheck(this, RedeemableERC20);

    this.web3 = web3;
    this.uuid = uuid;
  }

  _createClass(RedeemableERC20, [{
    key: 'transfer',
    value: async function transfer(tokenRecipient, value, options) {
      var contract = await LoanContract.instantiate(this.web3);

      options = options || { from: this.web3.eth.defaultAccount };

      return contract.transfer(this.uuid, tokenRecipient, value, options);
    }
  }, {
    key: 'getRedeemableValue',
    value: async function getRedeemableValue(tokenHolder, options) {
      var contract = await LoanContract.instantiate(this.web3);

      options = options || { from: this.web3.eth.defaultAccount };

      return contract.getRedeemableValue.call(this.uuid, tokenHolder, options);
    }
  }, {
    key: 'redeemValue',
    value: async function redeemValue(recipient, options) {
      var contract = await LoanContract.instantiate(this.web3);

      options = options || { from: this.web3.eth.defaultAccount };

      return contract.redeemValue(this.uuid, recipient, options);
    }
  }, {
    key: 'balanceOf',
    value: async function balanceOf(account, options) {
      var contract = await LoanContract.instantiate(this.web3);

      options = options || { from: this.web3.eth.defaultAccount };

      return contract.balanceOf.call(this.uuid, account, options);
    }
  }, {
    key: 'approve',
    value: async function approve(spender, value, options) {
      var contract = await LoanContract.instantiate(this.web3);

      options = options || { from: this.web3.eth.defaultAccount };

      return contract.approve(this.uuid, spender, value, options);
    }
  }, {
    key: 'allowance',
    value: async function allowance(owner, spender, options) {
      var contract = await LoanContract.instantiate(this.web3);

      options = options || { from: this.web3.eth.defaultAccount };

      return contract.allowance.call(this.uuid, owner, spender, options);
    }
  }, {
    key: 'transferFrom',
    value: async function transferFrom(from, to, value, options) {
      var contract = await LoanContract.instantiate(this.web3);

      options = options || { from: this.web3.eth.defaultAccount };

      return contract.transferFrom(this.uuid, from, to, value, options);
    }
  }]);

  return RedeemableERC20;
}();

module.exports = RedeemableERC20;