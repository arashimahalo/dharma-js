const Loans = require('./loans');
const Metadata = require('../package.json');

class Dharma {
  constructor(web3) {
    this.web3 = web3;
    this.loans = new Loans(web3);
  }
}

module.exports = Dharma;
