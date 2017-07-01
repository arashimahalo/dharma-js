const Loans = require('./loans');
const Metadata = require('../package.json');

class Dharma {
  static async init(web3, metadata, callback) {
    if (arguments.length === 2) {
      callback = metadata;
      metadata = Metadata;
    }

    LoanContract.instantiate(web3, metadata, function(err, contract) {
      if (err) callback(err, null);
      else {
        callback(null, new Dharma(web3, contract))
      }
    })
  }

  constructor(web3, contract) {
    this.web3 = web3;
    this.loans = new Loans(web3, contract);
  }
}

module.exports = Dharma;
