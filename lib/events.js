EVENTS = {
  created: 'LoanCreated',
  attested: 'Attested',
  investment: 'Investment',
  termBegin: 'LoanTermBegin',
  repayment: 'PeriodicRepayment',
  investmentRedeemed: 'InvestmentRedeemed',
  transfer: 'Transfer',
  approval: 'Approval'
}

class Events {
  constructor(contract, defaultOptions) {
    this.contract = contract;
    this.defaultOptions = defaultOptions || {};
    this.events = {};
    for (let eventName in EVENTS) {
      this[eventName] = (options, callback) => {
        return this.getEvent(EVENTS[eventName], options, callback);
      }
    }
  }

  getEvent(eventName, options, callback) {
    options = options || {};
    Object.assign(options, this.defaultOptions);

    const contractEvent = this.contract[eventName](options)
    if (callback) {
      contractEvent.watch(callback)
    } else {
      return contractEvent;
    }
  }
}

module.exports = Events;
