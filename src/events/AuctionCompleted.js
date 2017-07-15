'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Util = require('../Util');

var _Util2 = _interopRequireDefault(_Util);

var _LoanContract = require('../contract_wrappers/LoanContract');

var _LoanContract2 = _interopRequireDefault(_LoanContract);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AuctionCompleted = function () {
  function AuctionCompleted(web3, auctionPeriodEndBlock) {
    _classCallCheck(this, AuctionCompleted);

    this.web3 = web3;
    this.auctionPeriodEndBlock = auctionPeriodEndBlock;
    this.blockListener = null;
    this.listening = false;
  }

  _createClass(AuctionCompleted, [{
    key: 'watch',
    value: function watch(callback) {
      var web3 = this.web3;
      var auctionPeriodEndBlock = this.auctionPeriodEndBlock;

      this.listening = true;

      this.blockListener = this.web3.eth.filter('latest');
      this.blockListener.watch(function (err, result) {
        if (err) {
          this.listening = false;
          callback(err, null);
        } else {
          web3.eth.getBlockNumber(function (err, blockNumber) {

            if (!this.listening) return;

            if (auctionPeriodEndBlock.lt(blockNumber)) {
              this.listening = false;

              callback(null, blockNumber);
            }
          }.bind(this));
        }
      }.bind(this));
    }
  }, {
    key: 'stopWatching',
    value: function stopWatching(callback) {
      this.listening = false;
      this.blockListener.stopWatching(callback);
    }
  }], [{
    key: 'create',
    value: async function create(web3, options, callback) {
      var contract = await _LoanContract2.default.instantiate(web3);

      if (options.uuid === 'undefined') throw new Error('AuctionCompleted event requires UUID to follow.');

      var auctionPeriodEndBlock = await contract.getAuctionEndBlock.call(options.uuid);

      if (auctionPeriodEndBlock.equals(0)) throw new Error('AuctionCompleted listener can only be activated once loan' + 'has been broadcasted');

      var auctionCompletedEvent = new AuctionCompleted(web3, auctionPeriodEndBlock);

      if (callback) {
        auctionCompletedEvent.watch(callback);
      } else {
        return auctionCompletedEvent;
      }
    }
  }]);

  return AuctionCompleted;
}();

module.exports = AuctionCompleted;