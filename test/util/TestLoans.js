import {web3} from '../init.js';
import uuidV4 from 'uuid/v4';

module.exports = {
  LoanDataUnsigned: (accounts) => {
    return {
      uuid: web3.sha3(uuidV4()),
      borrower: accounts[0],
      attestor: accounts[1],
      principal: web3.toWei(1, 'ether'),
      terms: {
        version: 1,
        periodType: 'daily',
        periodLength: 1,
        termLength: 3,
        compounded: true
      },
      attestorFee: web3.toWei(0.001, 'ether'),
      defaultRisk: 0.323,
      auctionPeriodLength: 20,
      reviewPeriodLength: 100
    }
  },

  LoanDataMalformed: (accounts) => {
    return {
      uuid: 'hey',
      borrower: accounts[0],
      attestor: 123,
      principal: web3.toWei(1, 'ether'),
      terms: {
        version: 1,
        periodType: 'daily',
        periodLength: 1,
        compounded: true
      },
      attestorFee: web3.toWei(0.001, 'ether'),
      defaultRisk: 0.323,
      auctionPeriodLength: 10,
      reviewPeriodLength: 10
    }
  }
}
