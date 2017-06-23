const Loans = require('./loans');

class Dharma {
  constructor(web3) {
    this.web3 = web3;
    this.loans = Loans(web3);
  }
}

module.exports = Dharma;
