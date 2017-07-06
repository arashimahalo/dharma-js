'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _loan = require('./loan');

var _loan2 = _interopRequireDefault(_loan);

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
  }]);

  return Loans;
}();

module.exports = Loans;