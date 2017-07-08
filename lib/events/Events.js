import LoanContract from '../contract_wrappers/LoanContract';
import AuctionCompleted from './AuctionCompleted';

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
      this[eventName] = async (options, callback) => {
        return await this.getEvent(EVENTS[eventName], options, callback);
      }
    }

    this.auctionCompleted = async (callback) => {
      return await AuctionCompleted.create(web3, defaultOptions, callback)
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
