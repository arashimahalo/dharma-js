'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _redeemableErc = require('./redeemableErc20');

var _redeemableErc2 = _interopRequireDefault(_redeemableErc);

var _LoanContract = require('./contract_wrappers/LoanContract');

var _LoanContract2 = _interopRequireDefault(_LoanContract);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _LoanSchema = require('./schemas/LoanSchema');

var _LoanSchema2 = _interopRequireDefault(_LoanSchema);

var _BidSchema = require('./schemas/BidSchema');

var _BidSchema2 = _interopRequireDefault(_BidSchema);

var _Events = require('./events/Events');

var _Events2 = _interopRequireDefault(_Events);

var _Attestation = require('./Attestation');

var _Attestation2 = _interopRequireDefault(_Attestation);

var _Terms = require('./Terms');

var _Terms2 = _interopRequireDefault(_Terms);

var _Util = require('./Util');

var _Util2 = _interopRequireDefault(_Util);

var _Constants = require('./Constants');

var _Constants2 = _interopRequireDefault(_Constants);

var _Servicing = require('./Servicing');

var _Servicing2 = _interopRequireDefault(_Servicing);

var _StateListeners = require('./StateListeners');

var _StateListeners2 = _interopRequireDefault(_StateListeners);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var UNDEFINED_GAS_ALLOWANCE = 500000;

var Loan = function (_RedeemableERC) {
  _inherits(Loan, _RedeemableERC);

  function Loan(web3, params) {
    _classCallCheck(this, Loan);

    return _possibleConstructorReturn(this, (Loan.__proto__ || Object.getPrototypeOf(Loan)).call(this, web3, params));
  }

  _createClass(Loan, [{
    key: 'toJson',
    value: function toJson() {
      return {
        uuid: this.uuid,
        borrower: this.borrower,
        principal: this.principal,
        attestor: this.attestor,
        attestorFee: this.attestorFee,
        terms: this.terms.toJson(),
        defaultRisk: this.defaultRisk,
        signature: this.signature,
        auctionPeriodLength: this.auctionPeriodLength,
        reviewPeriodLength: this.reviewPeriodLength
      };
    }
  }, {
    key: 'equals',
    value: function equals(loan) {
      return loan.uuid === this.uuid && loan.borrower === this.borrower && loan.principal.equals(this.principal) && loan.terms.equals(this.terms) && loan.attestor === this.attestor && loan.attestorFee.equals(this.attestorFee) && loan.defaultRisk.equals(this.defaultRisk) && _lodash2.default.isEqual(loan.signature, this.signature) && loan.auctionPeriodLength.equals(this.auctionPeriodLength) && loan.reviewPeriodLength.equals(this.reviewPeriodLength);
    }
  }, {
    key: 'broadcast',
    value: async function broadcast(options) {
      var contract = await _LoanContract2.default.instantiate(this.web3);

      options = options || { from: this.web3.eth.defaultAccount };

      if (typeof options.gas === 'undefined') {
        options.gas = UNDEFINED_GAS_ALLOWANCE;
      }

      return contract.createLoan(this.uuid, this.borrower, this.principal, this.terms.toByteString(), this.attestor, this.attestorFee, this.defaultRisk, this.signature.r, this.signature.s, this.signature.v, this.auctionPeriodLength, this.reviewPeriodLength, options);
    }
  }, {
    key: 'bid',
    value: async function bid(amount, tokenRecipient, minInterestRate, options) {
      var contract = await _LoanContract2.default.instantiate(this.web3);

      options = options || { from: tokenRecipient };

      if (typeof options.gas === 'undefined') {
        options.gas = UNDEFINED_GAS_ALLOWANCE;
      }

      if (!this.web3.isAddress(tokenRecipient)) throw new Error("Token recipient must be valid ethereum address.");

      options.value = amount;
      return contract.bid(this.uuid, tokenRecipient, minInterestRate, options);
    }
  }, {
    key: 'getBids',
    value: async function getBids() {
      var _this2 = this;

      var contract = await _LoanContract2.default.instantiate(this.web3);

      var numBids = await contract.getNumBids.call(this.uuid);

      var bids = await Promise.all(_lodash2.default.range(numBids).map(async function (index) {
        var bid = await contract.getBid.call(_this2.uuid, index);
        return {
          bidder: bid[0],
          amount: bid[1],
          minInterestRate: bid[2]
        };
      }));

      return bids;
    }
  }, {
    key: 'getContract',
    value: async function getContract() {
      return await _LoanContract2.default.instantiate(this.web3);
    }
  }, {
    key: 'acceptBids',
    value: async function acceptBids(bids, options) {
      var contract = await _LoanContract2.default.instantiate(this.web3);

      options = options || { from: this.borrower };

      if (typeof options.gas === 'undefined') {
        options.gas = UNDEFINED_GAS_ALLOWANCE;
      }

      var bidSchema = new _BidSchema2.default(this.web3);
      var totalBidValueAccepted = new this.web3.BigNumber(0);
      for (var i = 0; i < bids.length; i++) {
        bidSchema.validate(bids[i]);
        totalBidValueAccepted = totalBidValueAccepted.plus(bids[i].amount);
      }

      if (!totalBidValueAccepted.equals(this.principal.plus(this.attestorFee))) throw new Error('Total value of bids accepted should equal the desired ' + "principal, plus the attestor's fee");

      console.log("right here");
      var state = await this.getState(true);
      console.log("almost made it");

      if (!state.equals(_Constants2.default.REVIEW_STATE)) {
        throw new Error('Bids can only be accepted during the review period.');
      }

      return await contract.acceptBids(this.uuid, bids.map(function (bid) {
        return bid.bidder;
      }), bids.map(function (bid) {
        return bid.amount;
      }), options);
    }
  }, {
    key: 'rejectBids',
    value: async function rejectBids(options) {
      var contract = await _LoanContract2.default.instantiate(this.web3);

      options = options || { from: this.borrower };

      if (typeof options.gas === 'undefined') {
        options.gas = UNDEFINED_GAS_ALLOWANCE;
      }

      var state = await this.getState(true);

      if (!state.equals(_Constants2.default.REVIEW_STATE)) {
        throw new Error('Bids can only be rejected during the review period.');
      }

      return await contract.rejectBids(this.uuid, options);
    }
  }, {
    key: 'getState',
    value: async function getState() {
      var nextBlock = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      var contract = await _LoanContract2.default.instantiate(this.web3);

      var blockNumber = 'latest';
      if (nextBlock) {
        blockNumber = await _Util2.default.getLatestBlockNumber(this.web3);
        blockNumber += 1;
      }

      return await contract.getState.call(this.uuid, blockNumber);
    }
  }, {
    key: 'getInterestRate',
    value: async function getInterestRate() {
      var contract = await _LoanContract2.default.instantiate(this.web3);

      return await contract.getInterestRate.call(this.uuid);
    }
  }, {
    key: 'repay',
    value: async function repay(amount, options) {
      var contract = await _LoanContract2.default.instantiate(this.web3);

      options = options || { from: this.web3.eth.defaultAccount };

      options.value = amount;

      var state = await this.getState(true);

      if (!state.equals(_Constants2.default.ACCEPTED_STATE)) throw new Error('Repayments cannot be made until loan term has begun.');

      return contract.periodicRepayment(this.uuid, options);
    }
  }, {
    key: 'withdrawInvestment',
    value: async function withdrawInvestment(options, callback) {
      var contract = await _LoanContract2.default.instantiate(this.web3);

      options = options || { from: this.web3.eth.defaultAccount };

      var state = await this.getState(true);

      if (!state.equals(_Constants2.default.REJECTED_STATE) && !state.equals(_Constants2.default.ACCEPTED_STATE)) {
        throw new Error('Bids can only be withdrawn once the loan has been ' + 'accepted or rejected.');
      }

      return contract.withdrawInvestment(this.uuid, options);
    }
  }, {
    key: 'amountRepaid',
    value: async function amountRepaid(options, callback) {
      var contract = await _LoanContract2.default.instantiate(this.web3);

      options = options || { from: this.web3.eth.defaultAccount };

      return contract.getAmountRepaid.call(this.uuid, options);
    }
  }, {
    key: 'signAttestation',
    value: async function signAttestation() {
      this.signature = await this.attestation.sign();
    }
  }, {
    key: 'verifyAttestation',
    value: function verifyAttestation() {
      var validSignature = this.attestation.verifySignature(this.signature);
      if (!validSignature) throw new Error('Attestation has invalid signature!');
    }
  }], [{
    key: 'create',
    value: async function create(web3, params) {
      var loan = new Loan(web3, params);

      loan.web3 = web3;

      var schema = new _LoanSchema2.default(web3);
      schema.validate(params);

      loan.uuid = params.uuid;
      loan.borrower = params.borrower;
      loan.principal = new web3.BigNumber(params.principal);
      loan.terms = new _Terms2.default(web3, params.terms);
      loan.attestor = params.attestor;
      loan.attestorFee = new web3.BigNumber(params.attestorFee);
      loan.defaultRisk = new web3.BigNumber(params.defaultRisk);
      loan.signature = params.signature;
      loan.auctionPeriodLength = new web3.BigNumber(params.auctionPeriodLength);
      loan.reviewPeriodLength = new web3.BigNumber(params.reviewPeriodLength);

      if (params.auctionPeriodEndBlock) loan.auctionPeriodEndBlock = new web3.BigNumber(params.auctionPeriodEndBlock);
      if (params.reviewPeriodEndBlock) loan.reviewPeriodEndBlock = new web3.BigNumber(params.reviewPeriodEndBlock);

      loan.attestation = new _Attestation2.default(loan.web3, {
        uuid: loan.uuid,
        borrower: loan.borrower,
        principal: loan.principal,
        terms: loan.terms.toByteString(),
        attestor: loan.attestor,
        attestorFee: loan.attestorFee,
        defaultRisk: loan.defaultRisk
      });

      if (loan.signature) loan.verifyAttestation();

      loan.events = new _Events2.default(web3, { uuid: loan.uuid });
      loan.servicing = new _Servicing2.default(loan);
      loan.stateListeners = new _StateListeners2.default(web3, loan);

      // await loan.stateListeners.refresh();

      return loan;
    }
  }, {
    key: 'broadcast',
    value: async function broadcast(web3, params, options) {
      var loan = await Loan.create(web3, params);
      await loan.broadcast(options);
    }
  }]);

  return Loan;
}(_redeemableErc2.default);

module.exports = Loan;