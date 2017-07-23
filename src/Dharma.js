'use strict';

var _loans = require('./loans');

var _loans2 = _interopRequireDefault(_loans);

var _package = require('../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Dharma = function Dharma(web3) {
  _classCallCheck(this, Dharma);

  this.web3 = web3;
  this.loans = new _loans2.default(web3);
};

module.exports = Dharma;