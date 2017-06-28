const Loan = require('./loan');
const uuidV4 = require('uuid/v4');
const Events = require('./events');
const Config = require('../config');

const fs = require('fs');
const abi = JSON.parse(fs.readFileSync(__dirname +
  '/../build/contracts/Loan.json', 'utf8')).abi;


class Loans {
  constructor(web3) {
    this.web3 = web3;
    this.contract = web3.eth.contract(abi).at(Config.contractAddress);
    this.events = new Events(this.contract);
  }

  create(terms) {
    const uuid = this.web3.sha3(uuidV4());
    return new Loan(this.web3, uuid, terms);
  }
}

module.exports = Loans;
