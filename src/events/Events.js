'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _LoanContract = require('../contract_wrappers/LoanContract');

var _LoanContract2 = _interopRequireDefault(_LoanContract);

var _AuctionCompleted = require('./AuctionCompleted');

var _AuctionCompleted2 = _interopRequireDefault(_AuctionCompleted);

var _ReviewPeriodCompleted = require('./ReviewPeriodCompleted');

var _ReviewPeriodCompleted2 = _interopRequireDefault(_ReviewPeriodCompleted);

var _EventWrapper = require('./EventWrapper');

var _EventWrapper2 = _interopRequireDefault(_EventWrapper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EVENTS = {
  created: 'LoanCreated',
  termBegin: 'LoanTermBegin',
  bidsRejected: 'LoanBidsRejected',
  repayment: 'PeriodicRepayment',
  valueRedeemed: 'ValueRedeemed',
  transfer: 'Transfer',
  approval: 'Approval'
};

var Events = function () {
  function Events(web3, defaultOptions) {
    var _this = this;

    _classCallCheck(this, Events);

    this.web3 = web3;
    this.defaultOptions = defaultOptions || {};
    this.events = {};

    var _loop = function _loop(eventName) {
      _this[eventName] = async function (filter, additionalFilter, callback) {
        return await _this.getEvent(EVENTS[eventName], filter, additionalFilter, callback);
      };
    };

    for (var eventName in EVENTS) {
      _loop(eventName);
    }

    this.auctionCompleted = async function (callback) {
      var identifier = _EventWrapper2.default.getIdentifier('AuctionCompleted', defaultOptions, {});

      if (identifier in _this.events) {
        var event = _this.events[identifier];
        if (callback) {
          event.watch(callback);
        }
        return event;
      } else {
        return await _AuctionCompleted2.default.create(web3, defaultOptions, callback);
      }
    };

    this.reviewPeriodCompleted = async function (callback) {
      var identifier = _EventWrapper2.default.getIdentifier('ReviewPeriodCompleted', defaultOptions, {});

      if (identifier in _this.events) {
        var event = _this.events[identifier];
        if (callback) {
          event.watch(callback);
        }
        return event;
      } else {
        return await _ReviewPeriodCompleted2.default.create(web3, defaultOptions, callback);
      }
    };
  }

  _createClass(Events, [{
    key: 'getEvent',
    value: async function getEvent(eventName, filter, additionalFilter, callback) {
      var contract = await _LoanContract2.default.instantiate(this.web3);

      if (arguments.length === 2 && typeof filter === 'function') {
        callback = filter;
        filter = {};
      } else if (arguments.length === 3 && typeof additionalFilter === 'function') {
        callback = additionalFilter;
        additionalFilter = {};
      }

      filter = filter || this.defaultOptions;

      Object.assign(filter, this.defaultOptions);

      var eventIdentifier = _EventWrapper2.default.getIdentifier(eventName, filter, additionalFilter);

      if (eventIdentifier in this.events) {
        var event = this.events[eventIdentifier];
        if (callback) {
          event.watch(callback);
          return event;
        } else {
          return event;
        }
      } else {
        var _event = contract[eventName](filter, additionalFilter);
        this.events[eventIdentifier] = new _EventWrapper2.default(_event, callback);
        return _event;
      }
    }
  }]);

  return Events;
}();

module.exports = Events;