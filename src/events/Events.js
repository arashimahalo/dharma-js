'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _LoanContract = require('../contract_wrappers/LoanContract.js');

var _LoanContract2 = _interopRequireDefault(_LoanContract);

var _AuctionCompleted = require('./AuctionCompleted.js');

var _AuctionCompleted2 = _interopRequireDefault(_AuctionCompleted);

var _ReviewPeriodCompleted = require('./ReviewPeriodCompleted.js');

var _ReviewPeriodCompleted2 = _interopRequireDefault(_ReviewPeriodCompleted);

var _EventWrapper = require('./EventWrapper.js');

var _EventWrapper2 = _interopRequireDefault(_EventWrapper);

var _EventQueue = require('./EventQueue.js');

var _EventQueue2 = _interopRequireDefault(_EventQueue);

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
    this.queues = {};

    var _loop = function _loop(eventName) {
      _this[eventName] = async function (filter, additionalFilter, callback) {
        return await _this.getEvent(EVENTS[eventName], filter, additionalFilter, callback);
      };
    };

    for (var eventName in EVENTS) {
      _loop(eventName);
    }

    this.auctionCompleted = async function (callback) {
      var identifier = _EventQueue2.default.getIdentifier('AuctionCompleted', defaultOptions, {});

      var event = await _AuctionCompleted2.default.create(web3, defaultOptions, callback);

      if (!(identifier in _this.queues)) {
        _this.queues[identifier] = new _EventQueue2.default(identifier, event);
      }

      var queue = _this.queues[identifier];
      return new _EventWrapper2.default(event, queue, callback);
    };

    this.reviewPeriodCompleted = async function (callback) {
      var identifier = _EventQueue2.default.getIdentifier('ReviewPeriodCompleted', defaultOptions, {});

      var event = await _ReviewPeriodCompleted2.default.create(web3, defaultOptions, callback);

      if (!(identifier in _this.queues)) {
        _this.queues[identifier] = new _EventQueue2.default(identifier, event);
      }

      var queue = _this.queues[identifier];
      return new _EventWrapper2.default(event, queue, callback);
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

      var event = contract[eventName](filter, additionalFilter);

      var queueIdentifier = _EventQueue2.default.getIdentifier(eventName, filter, additionalFilter);

      if (!(queueIdentifier in this.queues)) {
        this.queues[queueIdentifier] = new _EventQueue2.default(queueIdentifier, event);
      }

      var queue = this.queues[queueIdentifier];

      return new _EventWrapper2.default(event, queue, callback);
    }
  }]);

  return Events;
}();

module.exports = Events;