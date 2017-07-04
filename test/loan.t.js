import Loan from '../lib/Loan.js';
import LoanContract from '../lib/contract_wrappers/LoanContract.js';
import Metadata from '../package.json';
import expect from 'expect.js';
import uuidV4 from 'uuid/v4';
import {web3, util} from './init.js';
import _ from 'lodash';
import TestLoans from './util/TestLoans.js';
import {generateTestBids} from './util/BidUtils';

describe('Loan', () => {
  let contract;
  let uuid;
  let loan;

  describe('#constructor()', function() {
    let unsignedLoanData;
    let malformedLoanData;
    let signedLoanData;

    before(() => {
       unsignedLoanData = TestLoans.LoanDataUnsigned(ACCOUNTS);
       malformedLoanData = TestLoans.LoanDataMalformed(ACCOUNTS);
    })

    it('should instantiate w/o throwing w/ valid unsigned loan data', async () => {
      loan = await Loan.create(web3, unsignedLoanData);
    });

    it('should instantiate w/o throwing w/ valid signed loan data', async () => {
      loan = await Loan.create(web3, unsignedLoanData);
      await loan.signAttestation()

      signedLoanData = unsignedLoanData;
      signedLoanData.signature = loan.signature;
      loan = await Loan.create(web3, signedLoanData);
    })

    it('should throw when instantiated with malformed loan data', async () => {
      try {
        await Loan.create(web3, TestLoans.LoanDataMalformed(ACCOUNTS))
        expect().fail('should throw error')
      } catch (err) {
        expect(err.toString()).to.contain("is not a valid");
      }
    })

    it('should throw if included signature is not valid', async () => {
      signedLoanData.defaultRisk = 0.1;
      try {
        await Loan.create(web3, signedLoanData)
        expect().fail('should throw error')
      } catch (err) {
        expect(err.toString()).to.contain("invalid signature!");
      }
    })
  })

  describe('#broadcast()', function() {
    it("should successfuly broadcast a loan creation request", async function() {
      try {
        const result = await loan.broadcast({ from: ACCOUNTS[0] });
      } catch (err) {
        expect().fail(err);
      }
    })

    it("should return error when broadcasting a loan request that already exists", async function() {
      try {
        const result = await loan.broadcast()
        expect().fail("should throw error");
      } catch (err) {
        util.assertThrowMessage(err);
      }
    })
  })

  let bids;

  describe('#bid()', async () => {
    before(() => {
      bids = generateTestBids(web3, ACCOUNTS.slice(2, 10), 0.25, 0.5);
    })

    it('should let investors bid on loan request', async () => {
      for (let i = 0; i < bids.length; i++) {
        const bid = bids[i]
        await loan.bid(bid.amount, bid.bidder, bid.minInterestRate,
          { from: bid.bidder })
      }
    });

    it('should throw if token recipient is malformed address', async () => {
      try {
        await loan.bid(bids[0].amount, '0x123', bids[0].minInterestRate,
          { from: bids[0].bidder })
        expect().fail("should throw error");
      } catch (err) {
        expect(err.toString()).to.contain('valid ethereum address.')
      }
    })
  })

  describe('#getBids()', () => {
    it('should allow borrower to retrieve bids', async () => {
      let retrievedBids = await loan.getBids();
      for (let i = 0; i < bids.length; i++) {
        expect(retrievedBids[i].amount.equals(bids[i].amount)).to.be(true)
        expect(retrievedBids[i].minInterestRate.equals(bids[i].minInterestRate)).to.be(true)
        expect(retrievedBids[i].bidder).to.be(bids[i].bidder)
      }
    })
  })

  describe('#acceptBids()', () => {
    before(async () => {
      await util.setBlockNumberForward(20);
    })

    it('should throw if borrower accepts bids that total < principal + fee', async () => {
      try {
        let acceptedBids = bids.slice(0,1).map((bid) => {
          return {
            bidder: bid.bidder,
            amount: web3.toWei(0.2, 'ether'),
          }
        })
        await loan.acceptBids(acceptedBids)
        expect().fail('should throw error')
      } catch (err) {
        expect(err.toString()).to.contain('should equal the desired principal');
      }
    })

    it('should throw if borrower accept sbids that total > principal + fee', async () => {
      try {
        let acceptedBids = bids.slice(0,10).map((bid) => {
          return {
            bidder: bid.bidder,
            amount: web3.toWei(0.2, 'ether'),
          }
        })
        await loan.acceptBids(acceptedBids)
        expect().fail('should throw error')
      } catch (err) {
        expect(err.toString()).to.contain('should equal the desired principal');
      }
    })

    it('should throw if borrower accepts bids that have malformed data', async () => {
      try {
        let acceptedBids = bids.slice(0,5).map((bid) => {
          return {
            bidder: '0x123',
            amount: web3.toWei(0.2002, 'ether'),
          }
        })
        await loan.acceptBids(acceptedBids)
        expect().fail('should throw error')
      } catch (err) {
        expect(err.toString()).to.contain('format is invalid');
      }
    })

    it('should let borrower accept bids that total = principal + fee', async () => {
      let acceptedBids = bids.slice(0,5).map((bid) => {
        return {
          bidder: bid.bidder,
          amount: web3.toWei(0.2002, 'ether'),
        }
      })

      const balanceBefore = web3.eth.getBalance(loan.borrower);
      const result = await loan.acceptBids(acceptedBids)
      const balanceAfter = web3.eth.getBalance(loan.borrower);
      const gasCosts = await util.getGasCosts(result);
      const balanceDelta = balanceAfter.minus(balanceBefore).plus(gasCosts);

      expect(balanceDelta.equals(loan.principal)).to.be(true);
    })
  })

  describe('#rejectBids()', () => {
    describe('Auction State', () => {
      it('should throw if borrower rejects bids during auction', async () => {
        const auctionStateLoan = await TestLoans.LoanInAuctionState(ACCOUNTS);
        try {
          await auctionStateLoan.rejectBids()
          expect().fail('should throw error')
        } catch (err) {
          expect(err.toString()).to.contain('during the review period.');
        }
      })
    })

    describe('Review State', () => {
      it('should let borrower rejects bids during the review period', async () => {
        const reviewStateLoan = await TestLoans.LoanInReviewState(ACCOUNTS);
        await reviewStateLoan.rejectBids();
      })
    })

    describe('Accepted State', () => {
      it('should throw if borrower rejects bids after accepting', async () => {
        const acceptedStateLoan = await TestLoans.LoanInAcceptedState(ACCOUNTS);
        try {
          await acceptedStateLoan.rejectBids()
          expect().fail('should throw error')
        } catch (err) {
          expect(err.toString()).to.contain('during the review period.');
        }
      })
    })

    describe('Rejected State', () => {
      it('should throw if borrower rejects bids after rejecting', async () => {
        const rejectedStateLoan = await TestLoans.LoanInRejectedState(ACCOUNTS);
        try {
          await rejectedStateLoan.rejectBids()
          expect().fail('should throw error')
        } catch (err) {
          expect(err.toString()).to.contain('during the review period.');
        }
      })
    })
  })

  describe('#withdrawInvestment()', () => {
    let withdrawTestLoan;

    describe('auction state', () => {
      before(async () => {
        withdrawTestLoan = await TestLoans.LoanInAuctionState(ACCOUNTS);
        await withdrawTestLoan.bid(
          web3.toWei(0.1, 'ether'),
          ACCOUNTS[2],
          web3.toWei(0.1, 'ether'),
          { from: ACCOUNTS[2] }
        )
      })

      it('should throw when bidder tries to withdraw', async () => {
        try {
          await withdrawTestLoan.withdrawInvestment({ from: ACCOUNTS[2] })
          expect().fail('should throw error')
        } catch (err) {
          expect(err.toString())
            .to.contain('cannot be withdrawn during the auction period.');
        }
      })
    })

    describe('review state', () => {
      before(async () => {
        withdrawTestLoan = await TestLoans.LoanInReviewState(ACCOUNTS);
      })

      it('should throw when bidder tries to withdraw and review period has not lapsed', async () => {
        try {
          await withdrawTestLoan.withdrawInvestment({ from: ACCOUNTS[2] })
          expect().fail('should throw error')
        } catch (err) {
          expect(err.toString())
            .to.contain('cannot be withdrawn during the review period.');
        }
      })

      it("should let bidders withdraw the entirety of their bids when review" +
          " period has lapsed w/o borrower action", async () => {
        await util.setBlockNumberForward(40);
        const balanceBefore = web3.eth.getBalance(ACCOUNTS[2]);
        await withdrawTestLoan.withdrawInvestment({ from: ACCOUNTS[2] })
        const balanceAfter = web3.eth.getBalance(ACCOUNTS[2]);
        expect(balanceAfter).to.be.greaterThan(balanceBefore);
      })
    })

    describe('accepted state', () => {
      before(async () => {
        withdrawTestLoan = await TestLoans.LoanInAcceptedState(ACCOUNTS);
      })

      it('should let bidder withdraw the remainders of the bid', async () => {
        const balanceBefore = web3.eth.getBalance(ACCOUNTS[2]);
        await withdrawTestLoan.withdrawInvestment({ from: ACCOUNTS[2] })
        const balanceAfter = web3.eth.getBalance(ACCOUNTS[2]);
        expect(balanceAfter).to.be.greaterThan(balanceBefore);
      })
    })

    describe('rejected state', () => {
      before(async () => {
        withdrawTestLoan = await TestLoans.LoanInRejectedState(ACCOUNTS);
      })

      it('should let bidder withdraw the remainders of the bid', async () => {
        const balanceBefore = web3.eth.getBalance(ACCOUNTS[2]);
        await withdrawTestLoan.withdrawInvestment({ from: ACCOUNTS[2] })
        const balanceAfter = web3.eth.getBalance(ACCOUNTS[2]);
        expect(balanceAfter).to.be.greaterThan(balanceBefore);
      })
    })
  })

  describe("#repay()", async function() {
    let loanInReview;

    before(async () => {
      loanInReview = await TestLoans.LoanInReviewState(ACCOUNTS);
    })

    it("should not let a user make a repayment before the loan term begins", async function() {
      try {
        await loanInReview.repay(web3.toWei(0.1, 'ether'), { from: ACCOUNTS[0] });
        expect().fail("should throw error");
      } catch (err) {
        expect(err.toString()).to.contain('until loan term has begun.');
      }
    })

    it("should let a user make a repayment once the loan term begins", async function() {
      await loan.repay(web3.toWei(0.1, 'ether'), { from: ACCOUNTS[0] });
      const amountRepaid = await loan.amountRepaid()
      expect(amountRepaid.equals(web3.toWei(0.1, 'ether'))).to.be(true);
    });
  })

  describe('#withdrawInvestment()', function() {
    let unpopularLoanUuid;
    let unpopularLoan;
    const investmentAmount = 800;

    before(async function() {
      try {
        unpopularLoanUuid = web3.sha3(uuidV4());
        unpopularLoan = new Loan(web3, unpopularLoanUuid, terms);
        await unpopularLoan.broadcast()
        await unpopularLoan.attest('QmaF1vXQDHnn5MVgfRc54Hs1ivemMDdfLhZABpuJwQwuPE',
          { from: ACCOUNTS[1], gas: 500000 });
        await unpopularLoan.fund(investmentAmount, ACCOUNTS[2], { from: ACCOUNTS[2] });
      } catch (err) {
        expect().fail(err);
      }
    })

    it("should not allow an investor to withdraw their investment if the " +
        "timelock period has not yet lapsed", async function() {
      try {
        await unpopularLoan.withdrawInvestment({ from: ACCOUNTS[2] });
        expect().fail("should throw error");
      } catch (err) {
        util.assertThrowMessage(err);
      }
    })

    it("should allow an investor to withdraw their investment if timelock " +
        "period has lapsed.", async function() {
      try {
        await util.setTimeForward(2 * 60 * 60);
        const balanceBefore = web3.eth.getBalance(ACCOUNTS[2])
        const result = await unpopularLoan.withdrawInvestment({ from: ACCOUNTS[2] });
        const gasCosts = await util.getGasCosts(result.tx);
        const balanceAfter = web3.eth.getBalance(ACCOUNTS[2]);
        expect(balanceAfter.sub(balanceBefore).plus(gasCosts).equals(investmentAmount)).to.be(true);
      } catch (err) {
        expect().fail(err);
      }
    })
  })

  describe("#redeemValue()", function() {
    let repaidLoanUuid;
    let repaidLoan;
    const amountRepaid = 1000;

    before(async function() {
      try {
        repaidLoanUuid = web3.sha3(uuidV4());
        repaidLoan = new Loan(web3, repaidLoanUuid, terms);

        await repaidLoan.broadcast()
        await repaidLoan.attest('QmaF1vXQDHnn5MVgfRc54Hs1ivemMDdfLhZABpuJwQwuPE',
          { from: ACCOUNTS[1], gas: 500000 });
        await repaidLoan.fund(800, ACCOUNTS[2], { from: ACCOUNTS[2] });
      } catch (err) {
        expect().fail(err);
      }
    })

    it("should not allow an investor to redeem value repaid to the loan " +
        "before the loan is fully funded and principal has been transferred " +
        "to the borrower", async function() {
      try {
        await repaidLoan.redeemValue(ACCOUNTS[2], { from: ACCOUNTS[2] });
        expect().fail("should throw error");
      } catch (err) {
        util.assertThrowMessage(err);
      }
    })

    it("should allow an investor to redeem repaid value after the loan is " +
        "funded and the loan principal has been transferrred to the borrower", async function() {
      try {
        await repaidLoan.fund(200, ACCOUNTS[3], { from: ACCOUNTS[3] });
        await repaidLoan.repay(1000);
        const balanceBefore = web3.eth.getBalance(ACCOUNTS[2])
        const result = await repaidLoan.redeemValue(ACCOUNTS[2],
          { from: ACCOUNTS[2] });
        const balanceAfter = web3.eth.getBalance(ACCOUNTS[2]);
        const gasCosts = await util.getGasCosts(result.tx);
        expect(balanceAfter.minus(balanceBefore).plus(gasCosts).equals(800)).to.be(true);
      } catch (err) {
        expect().fail(err);
      }
    })

    it("should not allow a non-investor to redeem repaid value", async function() {
      try {
        await repaidLoan.redeemValue(ACCOUNTS[5], { from: ACCOUNTS[5] });
        expect().fail("should throw error");
      } catch (err) {
        util.assertThrowMessage(err)
      }
    })
  });

  describe('#events', function() {
    this.timeout(10000)

    let loanOfInterest;
    let uuidOfInterest;

    before(async function() {
      uuidOfInterest = web3.sha3(uuidV4());
      loanOfInterest = new Loan(web3, uuidOfInterest, terms);
    });

    it("should callback on LoanCreated event", async function() {
      return new Promise(async function(accept, reject) {
        try {
          const createdEvent = await loanOfInterest.events.created();
          createdEvent.watch(function(err, obj) {
            if (err) reject(err)
            expect(obj.args._uuid).to.be(uuidOfInterest)
            expect(obj.args._borrower).to.be(terms.borrower)
            expect(obj.args._attestor).to.be(terms.attestor)
            createdEvent.stopWatching()
            accept()
          })

          await loanOfInterest.broadcast()
        } catch (err) {
          reject(err);
        }
      })
    })

    it("should callback on Attested event", async function() {
      return new Promise(async function(accept, reject) {
        try {
          const attestedEvent = await loanOfInterest.events.attested();
          attestedEvent.watch(function(err, obj) {
            if (err) reject(err);
            else {
              expect(obj.args._uuid).to.be(uuidOfInterest);
              expect(obj.args._attestor).to.be(terms.attestor);
              attestedEvent.stopWatching();
              accept();
            }
          });

          await loanOfInterest.attest('QmaF1vXQDHnn5MVgfRc54Hs1ivemMDdfLhZABpuJwQwuPE',
            { from: ACCOUNTS[1], gas: 1000000 });
        } catch (err) {
          reject(err);
        }
      });
    })

    it("should callback on Investment event", async function() {
      let amount = 200;
      return new Promise(async function(accept, reject) {
        try {
          const investmentEvent = await loanOfInterest.events.investment();
          investmentEvent.watch(function(err, obj) {
            if (err) reject(err);
            else {
              expect(obj.args._uuid).to.be(uuidOfInterest);
              expect(obj.args._from).to.be(ACCOUNTS[2]);
              expect(obj.args._value.equals(amount)).to.be(true);
              investmentEvent.stopWatching();
              accept();
            }
          })

          await loanOfInterest.fund(amount, ACCOUNTS[2]);
        } catch (err) {
          reject(err);
        }
      })
    })

    it("should callback on LoanTermBegin event", async function() {
      let amount = 800;
      return new Promise(async function(accept, reject) {
        try {
          const termBeginEvent = await loanOfInterest.events.termBegin();
          termBeginEvent.watch(function(err, obj) {
            if (err) reject(err);
            else {
              expect(obj.args._uuid).to.be(uuidOfInterest);
              expect(obj.args._borrower).to.be(terms.borrower);
              termBeginEvent.stopWatching();
              accept();
            }
          })

          await loanOfInterest.fund(amount, ACCOUNTS[2]);
        } catch (err) {
          reject(err);
        }
      })
    })

    it("should callback on PeriodicRepayment event", async function() {
      const amount = 200;
      return new Promise(async function(accept, reject) {
        try {
          const repaymentEvent = await loanOfInterest.events.repayment();
          repaymentEvent.watch(function(err, obj) {
            if (err) reject(err);
            else {
              expect(obj.args._uuid).to.be(uuidOfInterest);
              expect(obj.args._from).to.be(terms.borrower);
              expect(obj.args._value.equals(amount)).to.be(true);
              repaymentEvent.stopWatching();
              accept()
            }
          })

          await loanOfInterest.repay(amount);
        } catch (err) {
          reject(err);
        }
      })
    })

    it("should callback on InvestmentRedeemed event", async function() {
      const amount = 200;
      return new Promise(async function(accept, reject) {
        try {
          const investmentRedeemedEvent = await loanOfInterest.events.investmentRedeemed();
          investmentRedeemedEvent.watch(function(err, obj) {
            if (err) reject(err);
            else {
              expect(obj.args._uuid).to.be(uuidOfInterest);
              expect(obj.args._investor).to.be(ACCOUNTS[2]);
              expect(obj.args._recipient).to.be(ACCOUNTS[2])
              expect(obj.args._value.equals(amount)).to.be(true);
              investmentRedeemedEvent.stopWatching();
              accept();
            }
          })

          await loanOfInterest.redeemValue(ACCOUNTS[2], { from: ACCOUNTS[2] });
        } catch (err) {
          reject(err);
        }
      })
    })
  })
})
