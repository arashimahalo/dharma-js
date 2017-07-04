import Loan from '../lib/Loan.js';
import LoanContract from '../lib/contract_wrappers/LoanContract.js';
import Metadata from '../package.json';
import expect from 'expect.js';
import uuidV4 from 'uuid/v4';
import {web3, util} from './init.js';
import _ from 'lodash';
import {LoanDataUnsigned, LoanDataMalformed} from './util/TestLoans.js';

describe('Loan', () => {
  let contract;
  let uuid;
  let loan;

  describe('#constructor()', function() {
    let unsignedLoanData;
    let malformedLoanData;
    let signedLoanData;

    before(() => {
       unsignedLoanData = LoanDataUnsigned(ACCOUNTS);
       malformedLoanData = LoanDataMalformed(ACCOUNTS);
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
        await Loan.create(web3, LoanDataMalformed(ACCOUNTS))
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

  describe('#attest()', function() {
    it('should not let anyone but the attestor defined in the terms attest to the loan', async function() {
      try {
        await loan.attest('QmaF1vXQDHnn5MVgfRc54Hs1ivemMDdfLhZABpuJwQwuPE',
          { from: ACCOUNTS[2] });
        expect().fail("should return error");
      } catch (err) {
        expect(err.toString().indexOf('not authorized to attest') > -1).to.be(true);
      }
    })

    it('should not allow anyone to attest with an invalid IPFS multihash', async function() {
      try  {
        await loan.attest('abcdefgh', { from: ACCOUNTS[1] })
        expect().fail("should throw error");
      } catch (err) {
        expect(err.toString().indexOf('not a valid IPFS') > -1).to.be(true);
      }
    })

    it('should allow the defined attestor to attest to the loan', async function() {
      try {
        await loan.attest('QmaF1vXQDHnn5MVgfRc54Hs1ivemMDdfLhZABpuJwQwuPE',
          { from: ACCOUNTS[1], gas: 1000000 });
        const attestation = await loan.getAttestation();
        expect(JSON.stringify(attestation)).to.be(JSON.stringify(exampleAttestation));
      } catch (err) {
        expect().fail(err)
      }
    })
  })

  describe('#fund()', function() {
    it("should let user fund a loan", async function() {
      try {
        const amount = 100;
        const funder = ACCOUNTS[2];
        await loan.fund(amount, funder)
        const balance = await loan.balanceOf(funder);
        expect(balance.equals(amount)).to.be(true);
        const amountFunded = await loan.amountFunded();
        expect(amountFunded.equals(amount)).to.be(true);
      } catch (err) {
        expect().fail(err)
      }
    })

    it("should let a user fund a loan specifying a different token recipient", async function() {
      try {
        const amount = 800;
        const total = 900;
        const tokenRecipient = ACCOUNTS[3];
        const funder = ACCOUNTS[2];
        await loan.fund(amount, tokenRecipient, { from: funder });
        const balance = await loan.balanceOf(tokenRecipient);
        expect(balance.equals(amount)).to.be(true);
        const amountFunded = await loan.amountFunded();
        expect(amountFunded.equals(total)).to.be(true);
      } catch (err) {
        expect().fail(err)
      }
    })

    it("should not let a user fund a loan specifying a malformed token recipient address", async function() {
      try {
        const amount = 800;
        const tokenRecipient = 'abcdex123';
        const funder = ACCOUNTS[2];
        await loan.fund(amount, tokenRecipient, { from: funder })
        expect().fail("should throw error");
      } catch (err) {
        expect(err.toString().indexOf('must be valid ethereum address') > -1).to.be(true);
      }
    })

    it("should transfer the balance to a user when the loan's fully funded", async function() {
      try {
        const amount = 200;
        const funder = ACCOUNTS[2];
        const borrowerBalanceBefore = web3.eth.getBalance(ACCOUNTS[0]);
        await loan.fund(amount, funder, { from: funder });
        borrowerBalanceAfter = web3.eth.getBalance(ACCOUNTS[0]);
        expect(borrowerBalanceAfter.sub(borrowerBalanceBefore).equals(terms.principal)).to.be(true);
      } catch (err) {
        expect().fail(err);
      }
    })
  })

  describe("#repay()", async function() {
    let unfundedLoan;

    before(async function() {
      try {
        const unfundedLoanUuid = web3.sha3(uuidV4());
        unfundedLoan = new Loan(web3, unfundedLoanUuid, terms)
        await unfundedLoan.broadcast()
        await unfundedLoan.attest('QmaF1vXQDHnn5MVgfRc54Hs1ivemMDdfLhZABpuJwQwuPE',
          { from: ACCOUNTS[1], gas: 500000 });
      } catch (err) {
        expect().fail(err);
      }
    })

    it("should not let a user make a repayment before the loan is fully funded", async function() {
      try {
        await unfundedLoan.repay(100, { from: ACCOUNTS[0] });
        expect().fail("should throw error");
      } catch (err) {
        util.assertThrowMessage(err);
      }
    })

    it("should let a user make a repayment once the loan's fully funded", async function() {
      try {

      } catch (err) {

      }
      loan.repay(100, { from: ACCOUNTS[0] }, function(err, result) {
        if (err) done(err)
        else {
          loan.amountRepaid(function(err, amount) {
            expect(amount.equals(100)).to.be(true);
            done();
          })
        }
      })
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
