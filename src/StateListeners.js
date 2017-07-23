'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Constants = require('./Constants.js');

var _Util = require('./Util.js');

var _Util2 = _interopRequireDefault(_Util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var StateListeners = function () {
  function StateListeners(web3, loan) {
    _classCallCheck(this, StateListeners);

    this.web3 = web3;
    this.loan = loan;
    this.listeners = {};
  }

  _createClass(StateListeners, [{
    key: 'refresh',
    value: async function refresh() {
      var state = await this.loan.getState();
      this.loan.state = state.toNumber();
      switch (this.loan.state) {
        case _Constants.NULL_STATE:
          await this.setupNullStateListeners();
          break;
        case _Constants.AUCTION_STATE:
          await this.setupAuctionStateListeners();
          break;
        case _Constants.REVIEW_STATE:
          await this.setupReviewStateListeners();
          break;
        // case ACCEPTED_STATE:
        //   await this.refreshAcceptedState();
        //   break;
        // case REJECTED_STATE:
        //   await this.refreshRejectedState();
        //   break;
        default:
          break;
      }
    }
  }, {
    key: 'setupNullStateListeners',
    value: async function setupNullStateListeners() {
      this.listeners['loanCreated'] = await this.loan.events.created();
      this.listeners['loanCreated'].watch(this.onLoanCreated());
    }
  }, {
    key: 'setupAuctionStateListeners',
    value: async function setupAuctionStateListeners() {
      this.listeners['auctionCompleted'] = await this.loan.events.auctionCompleted();
      this.listeners['auctionCompleted'].watch(this.onAuctionCompleted());
    }
  }, {
    key: 'setupReviewStateListeners',
    value: async function setupReviewStateListeners() {
      this.listeners['bidsRejected'] = await this.loan.events.bidsRejected();
      this.listeners['bidsRejected'].watch(this.onBidsRejected());

      this.listeners['termBegin'] = await this.loan.events.termBegin();
      this.listeners['termBegin'].watch(this.onTermBegin());

      this.listeners['bidsIgnored'] = await this.loan.events.reviewPeriodCompleted();
      this.listeners['bidsIgnored'].watch(this.onBidsIgnored());
    }
  }, {
    key: 'onLoanCreated',
    value: function onLoanCreated() {
      var _this = this;

      return async function (err, logs) {
        _this.loan.state = _Constants.AUCTION_STATE;
        await _this.refresh();
        _this.listeners['loanCreated'].stopWatching(function () {});
      };
    }
  }, {
    key: 'onAuctionCompleted',
    value: function onAuctionCompleted() {
      var _this = this;

      return async function (err, logs) {
        _this.loan.state = _Constants.REVIEW_STATE;
        await _this.refresh();
        _this.listeners['auctionCompleted'].stopWatching(function () {});
      };
    }
  }, {
    key: 'onBidsRejected',
    value: function onBidsRejected() {
      var _this = this;

      return async function (err, logs) {
        _this.loan.state = _Constants.REJECTED_STATE;
        await _this.refresh();

        _this.listeners['bidsRejected'].stopWatching(function () {});

        if ('termBegin' in _this.listeners) {
          _this.listeners['termBegin'].stopWatching(function () {});
        }

        if ('bidsIgnored' in _this.listeners) {
          _this.listeners['bidsIgnored'].stopWatching(function () {});
        }
      };
    }
  }, {
    key: 'onTermBegin',
    value: function onTermBegin() {
      var _this = this;

      return async function (err, logs) {
        _this.loan.state = _Constants.ACCEPTED_STATE;

        var termBeginBlock = await _Util2.default.getBlock(_this.web3, logs.blockNumber);

        _this.loan.termBeginBlockNumber = termBeginBlock.number;
        _this.loan.termBeginTimestamp = termBeginBlock.timestamp;

        _this.loan.interestRate = await _this.loan.getInterestRate();
        await _this.refresh();

        _this.listeners['termBegin'].stopWatching(function () {});

        if ('bidsRejected' in _this.listeners) _this.listeners['bidsRejected'].stopWatching(function () {});

        if ('bidsIgnored' in _this.listeners) {
          _this.listeners['bidsIgnored'].stopWatching(function () {});
        }
      };
    }
  }, {
    key: 'onBidsIgnored',
    value: function onBidsIgnored() {
      var _this = this;

      return async function (err, logs) {
        _this.loan.state = _Constants.REJECTED_STATE;
        await _this.refresh();

        _this.listeners['bidsIgnored'].stopWatching(function () {});

        if ('termBegin' in _this.listeners) {
          _this.listeners['termBegin'].stopWatching(function () {});
        }

        if ('bidsRejected' in _this.listeners) _this.listeners['bidsRejected'].stopWatching(function () {});
      };
    }
  }]);

  return StateListeners;
}();

module.exports = StateListeners;