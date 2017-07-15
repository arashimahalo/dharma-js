class StateListeners {
  constructor(loan) {
    this.loan = loan;
    this.listeners = {}
  }

  async refresh() {
    // this.loan.state = await

    switch (this.loan.state) {
      case NULL_STATE:
        await this.setupNullStateListeners();
        break;
      // case AUCTION_STATE:
      //   await this.setupAuctionStateListeners();
      //   break;
      // case REVIEW_STATE:
      //   await this.setupReviewStateListeners();
      //   break;
      // case ACCEPTED_STATE:
      //   await this.refreshAcceptedState();
      //   break;
      // case REJECTED_STATE:
      //   await this.refreshRejectedState();
      //   break;
    }
  }

  setupNullStateListeners() {
    // const
  }
}
