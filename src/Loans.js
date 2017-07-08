'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _loan = require('./loan');

var _loan2 = _interopRequireDefault(_loan);

var _Terms = require('./Terms');

var _Terms2 = _interopRequireDefault(_Terms);

var _Attestation = require('./Attestation');

var _Attestation2 = _interopRequireDefault(_Attestation);

var _LoanContract = require('./contract_wrappers/LoanContract');

var _LoanContract2 = _interopRequireDefault(_LoanContract);

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

var _Events = require('./events/Events');

var _Events2 = _interopRequireDefault(_Events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Loans = function () {
  function Loans(web3) {
    _classCallCheck(this, Loans);

    this.web3 = web3;
    this.events = new _Events2.default(web3);
  }

  _createClass(Loans, [{
    key: 'create',
    value: async function create(data) {
      if (!data.uuid) {
        data.uuid = this.web3.sha3((0, _v2.default)());
      }

      return _loan2.default.create(this.web3, data);
    }
  }, {
    key: 'get',
    value: async function get(uuid) {
      var contract = await _LoanContract2.default.instantiate(this.web3);
      var data = await contract.getData.call(uuid);

      var loanData = {
        uuid: uuid,
        borrower: data[0],
        principal: this.web3.toBigNumber(data[1]),
        terms: _Terms2.default.byteStringToJson(this.web3, data[2]),
        attestor: data[3],
        attestorFee: this.web3.toBigNumber(data[4]),
        defaultRisk: this.web3.toBigNumber(data[5])
      };

      var signature = await contract.getAttestorSignature.call(uuid);
      loanData.signature = _Attestation2.default.fromSignatureData(this.web3, signature);

      var loanCreated = await this.events.created({ uuid: uuid });
      var loanCreatedEvents = await new Promise(function (accept, reject) {
        loanCreated.get(function (err, loanCreatedEvents) {
          if (err) reject(err);else accept(loanCreatedEvents);
        });
      });

      var loanCreatedBlock = loanCreatedEvents[0].args.blockNumber;

      var auctionPeriodEndBlock = await contract.getAuctionEndBlock.call(uuid);
      var reviewPeriodEndBlock = await contract.getReviewPeriodEndBlock.call(uuid);

      loanData.auctionPeriodEndBlock = this.web3.toBigNumber(auctionPeriodEndBlock);
      loanData.reviewPeriodEndBlock = this.web3.toBigNumber(reviewPeriodEndBlock);

      loanData.auctionPeriodLength = auctionPeriodEndBlock.minus(loanCreatedBlock);
      loanData.reviewPeriodLength = reviewPeriodEndBlock.minus(auctionPeriodEndBlock);

      return _loan2.default.create(this.web3, loanData);
    }
  }]);

  return Loans;
}();

module.exports = Loans;