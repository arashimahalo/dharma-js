import Loan from './loan';
import uuidV4 from 'uuid/v4';
import Events from './events';

class Loans {
  constructor(web3) {
    this.web3 = web3;
    this.events = new Events(web3);
  }

  async create(data) {
    if (!data.uuid) {
      data.uuid = this.web3.sha3(uuidV4());
    }
    
    return Loan.create(this.web3, data);
  }
}

module.exports = Loans;
