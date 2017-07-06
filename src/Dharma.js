'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Loans = require('./loans');
var Metadata = require('../package.json');

var Dharma = function Dharma(web3) {
  _classCallCheck(this, Dharma);

  this.web3 = web3;
  this.loans = new Loans(web3);
};

module.exports = Dharma;