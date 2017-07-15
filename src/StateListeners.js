"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var StateListeners = function () {
  function StateListeners(loan) {
    _classCallCheck(this, StateListeners);

    this.loan = loan;
    this.listeners = {};
  }

  _createClass(StateListeners, [{
    key: "refresh",
    value: async function refresh() {
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
  }, {
    key: "setupNullStateListeners",
    value: function setupNullStateListeners() {
      // const
    }
  }]);

  return StateListeners;
}();