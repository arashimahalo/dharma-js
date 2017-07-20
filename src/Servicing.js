'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bignumber = require('bignumber.js');

var _bignumber2 = _interopRequireDefault(_bignumber);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _Constants = require('./Constants');

var _Constants2 = _interopRequireDefault(_Constants);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Servicing = function () {
  function Servicing(loan) {
    _classCallCheck(this, Servicing);

    this.loan = loan;
  }

  _createClass(Servicing, [{
    key: 'expectedAmountRepaidByDate',
    value: function expectedAmountRepaidByDate(date) {
      if (this.loan.state !== _Constants2.default.ACCEPTED_STATE) throw new Error('Loan must be in ACCEPTED state before servicing ' + 'utilities can be accessed');

      var expectedPeriodicRepayment = this.periodicRepaymentOwed();

      var numRepaymentPeriods = this._numRepaymentPeriods(date);

      return expectedPeriodicRepayment.times(numRepaymentPeriods);
    }
  }, {
    key: 'getInterestEarnedToDate',
    value: async function getInterestEarnedToDate() {
      var amountRepaid = await this.loan.amountRepaid();
      var decimals = 10 ** 18;

      var interestRate = this.loan.interestRate;
      interestRate = interestRate.div(decimals);

      return amountRepaid.times(interestRate).div(interestRate.plus(1));
    }
  }, {
    key: '_numRepaymentPeriods',
    value: function _numRepaymentPeriods(date) {
      var termBeginDate = new Date(this.loan.termBeginTimestamp * 1000);
      var numPeriods = this._numPeriodsBetween(termBeginDate, date, this.loan.terms.periodType(), this.loan.terms.periodLength());
      return _bignumber2.default.min(numPeriods, this.loan.terms.termLength());
    }
  }, {
    key: 'getRepaymentStatus',
    value: async function getRepaymentStatus() {
      var amountRepaid = await this.loan.amountRepaid();
      var expectedAmountRepaid = this.expectedAmountRepaidByDate(new Date());

      if (amountRepaid.gte(expectedAmountRepaid)) {
        var durationSinceTermBegin = _moment2.default.duration((0, _moment2.default)().diff(this.loan.termBeginTimestamp * 1000));
        if (durationSinceTermBegin < this.termDuration()) {
          return 'CURRENT';
        } else {
          return 'REPAID';
        }
      } else {
        var numPeriodsRepaid = amountRepaid.div(this.periodicRepaymentOwed()).floor().toNumber();
        var lastRepaymentDateMissed = (0, _moment2.default)(this.loan.termBeginTimestamp * 1000).add(this.periodDuration(numPeriodsRepaid + 1));
        var weeksSinceRepaymentDateMissed = _moment2.default.duration((0, _moment2.default)().diff(lastRepaymentDateMissed)).asWeeks();

        if (weeksSinceRepaymentDateMissed <= 2) {
          return 'DELINQUENT';
        } else {
          return 'DEFAULT';
        }
      }
    }
  }, {
    key: 'getRepaymentDates',
    value: function getRepaymentDates() {
      var dates = [];
      var termBeginDate = new Date(this.loan.termBeginTimestamp * 1000);
      for (var i = 1; i <= this.loan.terms.termLength(); i++) {
        var repaymentDate = (0, _moment2.default)(termBeginDate).add(this.periodDuration(i)).toDate();
        dates.push(repaymentDate);
      }
      return dates;
    }
  }, {
    key: 'periodicRepaymentOwed',
    value: function periodicRepaymentOwed() {
      return this.totalOwed().div(this.loan.terms.termLength());
    }
  }, {
    key: 'totalOwed',
    value: function totalOwed() {
      var decimals = 10 ** 18;

      var interestRate = this.loan.interestRate;
      interestRate = interestRate.div(decimals).plus(1);

      var principal = this.loan.principal;
      return interestRate.times(principal);
    }
  }, {
    key: 'periodDuration',
    value: function periodDuration() {
      var numPeriods = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

      switch (this.loan.terms.periodType()) {
        case 'daily':
          return _moment2.default.duration(numPeriods * this.loan.terms.periodLength(), 'days');
          break;
        case 'weekly':
          return _moment2.default.duration(numPeriods * this.loan.terms.periodLength(), 'weeks');
          break;
        case 'monthly':
          return _moment2.default.duration(numPeriods * this.loan.terms.periodLength(), 'months');
          break;
        case 'yearly':
          return _moment2.default.duration(numPeriods * this.loan.terms.periodLength(), 'years');
          break;
      }
    }
  }, {
    key: 'termDuration',
    value: function termDuration() {
      return this.periodDuration(this.loan.terms.termLength());
    }
  }, {
    key: '_numPeriodsBetween',
    value: function _numPeriodsBetween(startDate, endDate, periodType, periodLength) {
      var startDateWrapper = (0, _moment2.default)(startDate);
      var endDateWrapper = (0, _moment2.default)(endDate);

      var timeDiff = _moment2.default.duration(endDateWrapper.diff(startDateWrapper));

      switch (periodType) {
        case 'daily':
          return Math.floor(timeDiff.asDays() / periodLength);
          break;
        case 'weekly':
          return Math.floor(timeDiff.asWeeks() / periodLength);
          break;
        case 'monthly':
          return Math.floor(timeDiff.asMonths() / periodLength);
          break;
        case 'yearly':
          return Math.floor(timeDiff.asYears() / periodLength);
          break;
      }
    }
  }]);

  return Servicing;
}();

module.exports = Servicing;