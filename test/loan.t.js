const Loan = require('../lib/loan.js');
const expect = require('expect.js');
const uuidV4 = require('uuid/v4');
const exampleAttestation = require('./attestations/example.js');
const web3 = require('./init.js');

describe('Loan', function() {
  let uuid;
  let loan;
  let terms;

  before(function(done) {
    web3.eth.getBlock('latest', function(err, result) {
      if (err) done(err);
      else {
        const timelock = result.timestamp + 60 * 60;
        terms = {
          borrower: ACCOUNTS[0],
          attestor: ACCOUNTS[1],
          principal: 1000,
          interest: 5,
          periodType: 'daily',
          periodLength: 1,
          termLength: 3,
          fundingPeriodTimeLock: timelock
        };
        uuid = web3.sha3(uuidV4());
        loan = new Loan(web3, uuid, terms);
        done();
      }
    });
  })

  describe('#constructor()', function() {
    it('should instantiate without throwing with valid hex uuid', function() {
      expect(() => { new Loan(web3, uuid, terms) }).to.not.throwException();
    });

    it('should throw when instantiating with invalid uuid', function() {
      expect(() => { new Loan(web3, 'axb12345', terms) }).to.throwException();
    });

    it('should throw when instantiated without required terms', function() {
      expect(() => { new Loan(web3, uuid, { principal: 1 }) }).to.throwException();
    })

    it('should throw when instantiated with terms that are malformed', function() {
      let malformedNumberType = Object.assign({}, terms);
      malformedNumberType.principal = 'no strings for number type values';

      let malformedStringType = Object.assign({}, terms);
      malformedStringType.periodType = 100

      expect(() => { new Loan(web3, uuid, malformedNumberType) }).to.throwException();
      expect(() => { new Loan(web3, uuid, malformedStringType) })
    })
  })

  describe('#broadcast()', function() {
    it("should successfuly broadcast a loan creation request", function(done) {
      loan.broadcast({ from: ACCOUNTS[0], gas: 500000 }, function(err, txHash) {
        if (err) {
          done(err);
        } else {
          web3.eth.getTransaction(txHash, function(err, tx) {
            if (err) {
              done(err);
            } else {
              expect(tx.hash).to.equal(txHash);
              expect(tx.to).to.equal(loan.contract.address);
              done();
            }
          })
        }
      })
    })

    it("should return error when broadcasting a loan request that already exists", function(done) {
      loan.broadcast(function(err, txHash) {
        if (!err) done("should return error");
        else done();
      })
    })
  })

  describe('#attest()', function() {
    it('should not let anyone but the attestor defined in the terms attest to the loan', function(done) {
      loan.attest('QmaF1vXQDHnn5MVgfRc54Hs1ivemMDdfLhZABpuJwQwuPE', { from: ACCOUNTS[2] }, function(err, result) {
        if (!err) done('should return error');
        else done();
      })
    })

    it('should allow the defined attestor to attest to the loan', function(done) {
      loan.attest('QmaF1vXQDHnn5MVgfRc54Hs1ivemMDdfLhZABpuJwQwuPE', { from: ACCOUNTS[1], gas: 1000000 }, function(err, result) {
        if (err) done(err);
        else {
          loan.getAttestation(function(err, attestation) {
            if (err) done(err)
            else {
              expect(JSON.stringify(attestation)).to.be(JSON.stringify(exampleAttestation));
              done();
            }
          })
        }
      })
    })

    it('should not allow anyone to attest with an invalid IPFS multihash', function(done) {
      loan.attest('abcdefgh', { from: ACCOUNTS[1] }, function(err, result) {
        if (!err) done("should return error")
        else done();
      })
    })
  })

  describe('#fund()', function() {
    it("should let user fund a loan", function(done) {
      const amount = 100;
      const funder = ACCOUNTS[2];
      loan.fund(amount, funder, function(err, txHash) {
        if (err) done(err);
        loan.balanceOf(funder, function(err, balance) {
          expect(balance.equals(amount)).to.be(true);
          loan.amountFunded(function(err, amountFunded) {
            expect(amountFunded.equals(amount)).to.be(true);
            done();
          })
        })
      })
    })

    it("should let a user fund a loan specifying a different token recipient", function(done) {
      const amount = 800;
      const total = 900;
      const tokenRecipient = ACCOUNTS[3];
      const funder = ACCOUNTS[2];
      loan.fund(amount, tokenRecipient, { from: funder }, function(err, txHash) {
        if (err) done(err);
        else {
          loan.balanceOf(tokenRecipient, function(err, balance) {
            expect(balance.equals(amount)).to.be(true);
            loan.amountFunded(function(err, amount) {
              expect(amount.equals(total)).to.be(true);
              done();
            })
          })
        }
      });
    })

    it("should not let a user fund a loan specifying a malformed token recipient address", function(done) {
      const amount = 800;
      const tokenRecipient = 'abcdex123';
      const funder = ACCOUNTS[2];
      loan.fund(amount, tokenRecipient, { from: funder }, function(err, txHash) {
        if (!err) done('should return error');
        else done();
      })
    })

    it("should transfer the balance to a user when the loan's fully funded", function(done) {
      const amount = 200;
      const funder = ACCOUNTS[2];
      const borrowerBalanceBefore = web3.eth.getBalance(ACCOUNTS[0]);
      loan.fund(amount, funder, { from: funder }, function(err, txHash) {
        if (err) done(err);
        const borrowerBalanceAfter = web3.eth.getBalance(ACCOUNTS[0]);
        expect(borrowerBalanceAfter.sub(borrowerBalanceBefore).equals(terms.principal)).to.be(true);
        done();
      })
    })
  })

  describe("#repay()", function(done) {
    let unfundedLoan;

    before(function(done) {
      const unfundedLoanUuid = web3.sha3(uuidV4());
      unfundedLoan = new Loan(web3, unfundedLoanUuid, terms)
      unfundedLoan.broadcast(function(err, txHash) {
        if (err) done(err)
        unfundedLoan.attest('QmaF1vXQDHnn5MVgfRc54Hs1ivemMDdfLhZABpuJwQwuPE',
          { from: ACCOUNTS[1], gas: 500000 }, function(err, result) {
          if (err) done(err);
          else done();
        })
      })
    })

    it("should not let a user make a repayment before the loan is fully funded", function(done) {
      unfundedLoan.repay(100, { from: ACCOUNTS[0] }, function(err, result) {
        if (!err) done("should return error");
        else done();
      })
    })

    it("should let a user make a repayment once the loan's fully funded", function(done) {
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

    before(function(done) {
      unpopularLoanUuid = web3.sha3(uuidV4());
      unpopularLoan = new Loan(web3, unpopularLoanUuid, terms);
      unpopularLoan.broadcast(function(err, txHash) {
        if (err) done(err)
        unpopularLoan.attest('QmaF1vXQDHnn5MVgfRc54Hs1ivemMDdfLhZABpuJwQwuPE',
          { from: ACCOUNTS[1], gas: 500000 }, function(err, result) {
          if (err) done(err);
          unpopularLoan.fund(investmentAmount, ACCOUNTS[2], { from: ACCOUNTS[2] }, function(err, result) {
            if(err) done(err);
            else done();
          })
        })
      })
    })

    it("should not allow an investor to withdraw their investment if the " +
        "timelock period has not yet lapsed", function(done) {
      unpopularLoan.withdrawInvestment({ from: ACCOUNTS[2] }, function(err, result) {
        if (!err) done("should return error");
        else done();
      })
    })

    it("should allow an investor to withdraw their investment if timelock " +
        "period has lapsed.", function(done) {
      util.setTimeForward(2 * 60 * 60, function(err, result) {
        if (err) done(err);
        const balanceBefore = web3.eth.getBalance(ACCOUNTS[2])
        unpopularLoan.withdrawInvestment({ from: ACCOUNTS[2] }, function(err, txHash) {
          if (err) done(err);
          else {
            util.getGasCosts(txHash, function(err, gasCosts) {
              let balanceAfter = web3.eth.getBalance(ACCOUNTS[2])

              expect(balanceAfter.sub(balanceBefore).plus(gasCosts).equals(investmentAmount)).to.be(true);
              done();
            });
          }
        })
      })
    })
  })

  describe("#redeemValue()", function() {
    let repaidLoanUuid;
    let repaidLoan;
    const amountRepaid = 1000;

    before(function(done) {
      repaidLoanUuid = web3.sha3(uuidV4());
      repaidLoan = new Loan(web3, repaidLoanUuid, terms);
      repaidLoan.broadcast(function(err, txHash) {
        if (err) done(err)
        repaidLoan.attest('QmaF1vXQDHnn5MVgfRc54Hs1ivemMDdfLhZABpuJwQwuPE',
          { from: ACCOUNTS[1], gas: 500000 }, function(err, result) {
          if (err) done(err);
          repaidLoan.fund(800, ACCOUNTS[2], { from: ACCOUNTS[2] }, function(err, result) {
            if(err) done(err);
            else done();
          })
        })
      })
    })

    it("should not allow an investor to redeem value repaid to the loan " +
        "before the loan is fully funded and principal has been transferred " +
        "to the borrower", function(done) {
      repaidLoan.redeemValue(ACCOUNTS[2], { from: ACCOUNTS[2] }, function(err, result) {
        if (!err) done("should return error");
        else done();
      })
    })

    it("should allow an investor to redeem repaid value after the loan is " +
        "funded and the loan principal has been transferrred to the borrower", function(done) {
      repaidLoan.fund(200, ACCOUNTS[3], { from: ACCOUNTS[3] }, function(err, result) {
        if (err) done(err)
        repaidLoan.repay(1000, function(err, result) {
          if (err) done(err)
          const balanceBefore = web3.eth.getBalance(ACCOUNTS[2])
          repaidLoan.redeemValue(ACCOUNTS[2], { from: ACCOUNTS[2] }, function(err, txHash) {
            if (err) done(err);
            const balanceAfter = web3.eth.getBalance(ACCOUNTS[2]);
            util.getGasCosts(txHash, function(err, gasCosts) {
              expect(balanceAfter.minus(balanceBefore).plus(gasCosts).equals(800)).to.be(true);
              done();
            });
          })
        })
      })
    })

    it("should not allow a non-investor to redeem repaid value", function(done) {
      repaidLoan.redeemValue(ACCOUNTS[5], { from: ACCOUNTS[5] }, function(err, result) {
        if (!err) done("should return error");
        else done();
      })
    })
  });

  describe('#events', function() {
    this.timeout(10000)

    let loanOfInterest;
    let uuidOfInterest;

    before(function(done) {
      uuidOfInterest = web3.sha3(uuidV4());
      loanOfInterest = new Loan(web3, uuidOfInterest, terms);
      done();
    });

    it("should callback on LoanCreated event", function(done) {
      const createdEvent = loanOfInterest.events.created();
      createdEvent.watch(function(err, obj) {
        if (err) done(err);
        else {
          expect(obj.args._uuid).to.be(uuidOfInterest)
          expect(obj.args._borrower).to.be(terms.borrower)
          expect(obj.args._attestor).to.be(terms.attestor)
          createdEvent.stopWatching()
          done();
        }
      })

      loanOfInterest.broadcast(function(err, result) {
        if (err) done(err);
      })
    })

    it("should callback on Attested event", function(done) {
      const attestedEvent = loanOfInterest.events.attested();
      attestedEvent.watch(function(err, obj) {
        if (err) done(err);
        else {
          expect(obj.args._uuid).to.be(uuidOfInterest);
          expect(obj.args._attestor).to.be(terms.attestor);
          attestedEvent.stopWatching();
          done();
        }
      })

      loanOfInterest.attest('QmaF1vXQDHnn5MVgfRc54Hs1ivemMDdfLhZABpuJwQwuPE',
        { from: ACCOUNTS[1], gas: 1000000 }, function(err, result) {
        if (err) done(err);
      })
    })

    it("should callback on Investment event", function(done) {
      let amount = 200;

      const investmentEvent = loanOfInterest.events.investment();
      investmentEvent.watch(function(err, obj) {
        if (err) done(err);
        else {
          expect(obj.args._uuid).to.be(uuidOfInterest);
          expect(obj.args._from).to.be(ACCOUNTS[2]);
          expect(obj.args._value.equals(amount)).to.be(true);
          investmentEvent.stopWatching();
          done();
        }
      })

      loanOfInterest.fund(amount, ACCOUNTS[2], function(err, result) {
        if (err) done(err);
      })
    })

    it("should callback on LoanTermBegin event", function(done) {
      let amount = 800;

      const termBeginEvent = loanOfInterest.events.termBegin();
      termBeginEvent.watch(function(err, obj) {
        if (err) done(err);
        else {
          expect(obj.args._uuid).to.be(uuidOfInterest);
          expect(obj.args._borrower).to.be(terms.borrower);
          termBeginEvent.stopWatching();
          done();
        }
      })

      loanOfInterest.fund(amount, ACCOUNTS[2], function(err, result) {
        if (err) done(err);
      })
    })

    it("should callback on PeriodicRepayment event", function(done) {
      const amount = 200;
      const repaymentEvent = loanOfInterest.events.repayment();
      repaymentEvent.watch(function(err, obj) {
        if (err) done(err);
        else {
          expect(obj.args._uuid).to.be(uuidOfInterest);
          expect(obj.args._from).to.be(terms.borrower);
          expect(obj.args._value.equals(amount)).to.be(true);
          repaymentEvent.stopWatching();
          done();
        }
      })

      loanOfInterest.repay(amount, function(err, result) {
        if (err) done(err);
      })
    })

    it("should callback on InvestmentRedeemed event", function(done) {
      const amount = 200;
      const investmentRedeemedEvent = loanOfInterest.events.investmentRedeemed();
      investmentRedeemedEvent.watch(function(err, obj) {
        if (err) done(err);
        else {
          expect(obj.args._uuid).to.be(uuidOfInterest);
          expect(obj.args._investor).to.be(ACCOUNTS[2]);
          expect(obj.args._recipient).to.be(ACCOUNTS[2])
          expect(obj.args._value.equals(amount)).to.be(true);
          investmentRedeemedEvent.stopWatching();
          done();
        }
      })

      loanOfInterest.redeemValue(ACCOUNTS[2], { from: ACCOUNTS[2] }, function(err, result) {
        if (err) done(err);
      })
    })
  })
})
