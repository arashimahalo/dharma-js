import {NULL_STATE, AUCTION_STATE, REVIEW_STATE,
  ACCEPTED_STATE, REJECTED_STATE} from './Constants';
import Util from './Util';

class StateListeners {
  constructor(web3, loan) {
    this.web3 = web3;
    this.loan = loan;
    this.listeners = {}
  }

  async refresh() {
    this.loan.state = await this.loan.getState();
    switch (this.loan.state.toNumber()) {
      case NULL_STATE:
        await this.setupNullStateListeners();
        break;
      case AUCTION_STATE:
        await this.setupAuctionStateListeners();
        break;
      case REVIEW_STATE:
        await this.setupReviewStateListeners();
        break;
      // case ACCEPTED_STATE:
      //   await this.refreshAcceptedState();
      //   break;
      // case REJECTED_STATE:
      //   await this.refreshRejectedState();
      //   break;
    }
  }

  async setupNullStateListeners() {
    this.listeners['loanCreated'] = await this.loan.events.created();
    this.listeners['loanCreated'].watch(this.onLoanCreated());
  }

  async setupAuctionStateListeners() {
    this.listeners['auctionCompleted'] =
      await this.loan.events.auctionCompleted();
    this.listeners['auctionCompleted'].watch(this.onAuctionCompleted());
  }

  async setupReviewStateListeners() {
    this.listeners['bidsRejected'] =
      await this.loan.events.bidsRejected();
    this.listeners['bidsRejected'].watch(this.onBidsRejected());

    this.listeners['termBegin'] =
      await this.loan.events.termBegin();
    this.listeners['termBegin'].watch(this.onTermBegin());

    this.listeners['bidsIgnored'] =
      await this.loan.events.reviewPeriodCompleted();
    this.listeners['bidsIgnored'].watch(this.onBidsIgnored());
  }

  onLoanCreated() {
    const _this = this;

    return (err, logs) => {
      _this.listeners['loanCreated'].stopWatching(async () => {
        _this.loan.state = AUCTION_STATE;
        await _this.refresh();
      })
    }
  }

  onAuctionCompleted() {
    const _this = this;

    return (err, logs) => {
      _this.listeners['auctionCompleted'].stopWatching(async () => {
        _this.loan.state = REVIEW_STATE;
        await _this.refresh();
      })
    }
  }

  onBidsRejected() {
    const _this = this;

    return (err, logs) => {
      _this.listeners['bidsRejected'].stopWatching(async () => {
        _this.loan.state = REJECTED_STATE;
        await _this.refresh();
      })
      _this.listeners['termBegin'].stopWatching(() => {});
      _this.listeners['bidsIgnored'].stopWatching(() => {});
    }
  }

  onTermBegin() {
    const _this = this;

    return (err, logs) => {
      _this.listeners['termBegin'].stopWatching(async () => {
        _this.loan.state = ACCEPTED_STATE;

        const termBeginBlock = await Util.getBlock(_this.web3, logs.blockNumber);

        _this.loan.termBeginBlockNumber = termBeginBlock.number;
        _this.loan.termBeginTimestamp = termBeginBlock.timestamp;

        _this.loan.interestRate = await _this.loan.getInterestRate();
        await _this.refresh();
      })
      _this.listeners['bidsRejected'].stopWatching(() => {});
      _this.listeners['bidsIgnored'].stopWatching(() => {});
    }
  }

  onBidsIgnored() {
    const _this = this;

    return (err, logs) => {
      _this.listeners['bidsIgnored'].stopWatching(async () => {
        _this.loan.state = REJECTED_STATE;
        await _this.refresh();
      })
      _this.listeners['termBegin'].stopWatching(() => {});
      _this.listeners['bidsRejected'].stopWatching(() => {});
    }
  }
}

module.exports = StateListeners;