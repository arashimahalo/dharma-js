import BigNumber from 'bignumber.js';
import moment from 'moment';

class Servicing {
  constructor(loan) {
    this.loan = loan;
  }

  expectedAmountRepaidByDate(date) {
    if (!this.loan.termBeginTimestamp)
      throw new Error('Loan must be in ACCEPTED state and refreshState() must' +
        ' be called before servicing utilities can be accessed');

    const decimals = 10**18;

    let interestRate = this.loan.interestRate;
    interestRate = interestRate.div(decimals).plus(1);

    const principal = this.loan.principal;
    const expectedPeriodicRepayment =
      interestRate.times(principal).div(this.loan.terms.termLength());

    const termBeginDate = new Date(this.loan.termBeginTimestamp*1000);
    const numPeriods = this._numPeriodsBetween(termBeginDate, date,
      this.loan.terms.periodType(), this.loan.terms.periodLength());
    return expectedPeriodicRepayment.times(numPeriods);
  }

  _numPeriodsBetween(startDate, endDate, periodType, periodLength) {
    const startDateWrapper = moment(startDate);
    const endDateWrapper = moment(endDate);

    const timeDiff = moment.duration(endDateWrapper.diff(startDateWrapper))

    switch(periodType) {
      case 'daily':
        return Math.floor(timeDiff.asDays() / periodLength);
        break;
      case 'weekly':
        return Math.floor(timeDiff.asWeeks() / periodLength)
        break;
      case 'monthly':
        return Math.floor(timeDiff.asMonths() / periodLength)
        break;
      case 'yearly':
        return Math.floor(timeDiff.asYears() / periodLength)
        break;
    }
  }
}

module.exports = Servicing;
