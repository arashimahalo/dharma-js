const LoanContract = require('./contract_wrappers/LoanContract');

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
  constructor(web3, defaultOptions) {
    this.web3 = web3;
    this.defaultOptions = defaultOptions || {};
    this.events = {};
    for (let eventName in EVENTS) {
      this[eventName] = async (options, callback) => {
        return await this.getEvent(EVENTS[eventName], options, callback);
      }
    }
  }

  async getEvent(eventName, options, callback) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options || {};
    Object.assign(options, this.defaultOptions);

    const contractEvent = contract[eventName](options)

    if (callback) {
      contractEvent.watch(callback)
    } else {
      return contractEvent;
    }
  }
}

module.exports = Events;
