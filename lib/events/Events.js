import LoanContract from '../contract_wrappers/LoanContract';
import AuctionCompleted from './AuctionCompleted';
import ReviewPeriodCompleted from './ReviewPeriodCompleted';

const EVENTS = {
  created: 'LoanCreated',
  termBegin: 'LoanTermBegin',
  bidsRejected: 'LoanBidsRejected',
  repayment: 'PeriodicRepayment',
  valueRedeemed: 'ValueRedeemed',
  transfer: 'Transfer',
  approval: 'Approval'
}

class Events {
  constructor(web3, defaultOptions) {
    this.web3 = web3;
    this.defaultOptions = defaultOptions || {};
    this.events = {};
    for (let eventName in EVENTS) {
      this[eventName] = async (filter, additionalFilter, callback) => {
        return await this.getEvent(EVENTS[eventName], filter, additionalFilter, callback);
      }
    }

    this.auctionCompleted = async (callback) => {
      return await AuctionCompleted.create(web3, defaultOptions, callback)
    }

    this.reviewPeriodCompleted = async (callback) => {
      return await ReviewPeriodCompleted.create(web3, defaultOptions, callback)
    }
  }

  async getEvent(eventName, filter, additionalFilter, callback) {
    const contract = await LoanContract.instantiate(this.web3);

    if (arguments.length === 2 && typeof filter === 'function') {
      callback = filter;
      filter = {};
    } else if (arguments.length === 3 && typeof additionalFilter === 'function') {
      callback = additionalFilter;
      additionalFilter = {};
    }

    filter = filter || this.defaultOptions;

    Object.assign(filter, this.defaultOptions);

    const contractEvent = contract[eventName](filter, additionalFilter)

    if (callback) {
      contractEvent.watch(callback)
    } else {
      return contractEvent;
    }
  }
}

module.exports = Events;
