import LoanContract from '../contract_wrappers/LoanContract';
import AuctionCompleted from './AuctionCompleted';
import ReviewPeriodCompleted from './ReviewPeriodCompleted';
import EventWrapper from './EventWrapper';

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
      const identifier =
        EventWrapper.getIdentifier('AuctionCompleted', defaultOptions, {});

      if (identifier in this.events) {
        const event = this.events[identifier];
        if (callback) {
          event.watch(callback);
        }
        return event;
      } else {
        return await AuctionCompleted.create(web3, defaultOptions, callback)
      }
    }

    this.reviewPeriodCompleted = async (callback) => {
      const identifier =
        EventWrapper.getIdentifier('ReviewPeriodCompleted', defaultOptions, {});

      if (identifier in this.events) {
        const event = this.events[identifier];
        if (callback) {
          event.watch(callback);
        }
        return event;
      } else {
        return await ReviewPeriodCompleted.create(web3, defaultOptions, callback)
      }
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

    const eventIdentifier = EventWrapper.getIdentifier(eventName, filter, additionalFilter);

    if (eventIdentifier in this.events) {
      const event = this.events[eventIdentifier];
      if (callback) {
        event.watch(callback);
        return event;
      } else {
        return event;
      }
    } else {
      const event = contract[eventName](filter, additionalFilter)
      this.events[eventIdentifier] = new EventWrapper(event, callback);
      return event;
    }
  }
}

module.exports = Events;
