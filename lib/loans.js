const Loan = require('./loan');
const uuidV4 = require('uuid/v4');
const Events = require('./events');

class Loans {
  constructor(web3) {
    this.web3 = web3;
    this.events = new Events(web3);
  }

  create(terms) {
    const uuid = this.web3.sha3(uuidV4());
    return new Loan(this.web3, uuid, terms);
  }
}

module.exports = Loans;
