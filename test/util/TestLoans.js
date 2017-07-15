import {web3, util} from '../init.js';
import uuidV4 from 'uuid/v4';
import Loan from '../../src/Loan';
import {generateTestBids} from './BidUtils';

class TestLoans {
  static LoanDataUnsigned(accounts, options={}) {
    let loanData = {
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
      defaultRisk: web3.toWei(0.323, 'ether'),
      auctionPeriodLength: 20,
      reviewPeriodLength: 40
    }

    for (let key in options) {
      loanData[key] = options[key]
    }

    return loanData;
  }

  static LoanDataMalformed(accounts) {
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
      defaultRisk: web3.toWei(0.323, 'ether'),
      auctionPeriodLength: 10,
      reviewPeriodLength: 10
    }
  }

  static async LoanInAuctionState(accounts, options={}) {
    const loan = await Loan.create(web3, TestLoans.LoanDataUnsigned(accounts, options))
    await loan.signAttestation();
    await loan.broadcast();
    return loan;
  }

  static async LoanInReviewState(accounts, options={}) {
    const loan = await TestLoans.LoanInAuctionState(accounts, options);
    const bids = generateTestBids(web3, accounts.slice(2,10), 0.25, 0.5);
    for (let i = 0; i < bids.length; i++) {
      const bid = bids[i];
      await loan.bid(bid.amount, bid.bidder, bid.minInterestRate, { from: bid.bidder })
    }
    await util.setBlockNumberForward(20);
    return loan;
  }

  static async LoanInAcceptedState(accounts, options={}) {
    const loan = await TestLoans.LoanInReviewState(accounts, options);
    await loan.acceptBids(accounts.slice(2,7).map((account) => {
      return {
        bidder: account,
        amount: web3.toWei(0.2002, 'ether')
      }
    }), { from: loan.borrower })
    return loan;
  }

  static async LoanInRejectedState(accounts, options={}) {
    const loan = await TestLoans.LoanInReviewState(accounts, options);
    await loan.rejectBids({ from: accounts[0] })
    return loan;
  }
}

module.exports = TestLoans
