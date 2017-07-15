'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bignumber = require('bignumber.js');

var _bignumber2 = _interopRequireDefault(_bignumber);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

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
      if (!this.loan.termBeginTimestamp) throw new Error('Loan must be in ACCEPTED state and refreshState() must' + ' be called before servicing utilities can be accessed');

      var decimals = 10 ** 18;

      var interestRate = this.loan.interestRate;
      interestRate = interestRate.div(decimals).plus(1);

      var principal = this.loan.principal;
      var expectedPeriodicRepayment = interestRate.times(principal).div(this.loan.terms.termLength());

      var termBeginDate = new Date(this.loan.termBeginTimestamp * 1000);
      var numPeriods = this._numPeriodsBetween(termBeginDate, date, this.loan.terms.periodType(), this.loan.terms.periodLength());
      return expectedPeriodicRepayment.times(numPeriods);
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