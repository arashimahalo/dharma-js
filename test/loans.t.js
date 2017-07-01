const Loans = require('../lib/loans')
const web3 = require('./init.js');
const expect = require('expect.js');

const loans = new Loans(web3);

describe('Loans', function() {
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
        done();
      }
    });
  })

  describe('#create()', function() {
    it('should create a new loan when terms are formatted correctly', function() {
      let loan;
      expect(() => { loan = loans.create(terms) }).to.not.throwException();
      expect(/0x[0-9A-Fa-f]{64}/g.test(loan.uuid)).to.be(true);
    })

    it('should throw when attempting to create loan w/ malformed/missing terms', function() {
      const malformedTerms = {
        borrower: 123,
        principal: 'malformed'
      }
      expect(() => { loans.create(malformedTerms) }).to.throwException();

    })
  })

  describe('#events', function() {
    this.timeout(10000)
    let loan;

    before(function() {
      loan = loans.create(terms);
    })

    it('should callback when LoanCreated with query', async function() {
      return new Promise(async function(accept, reject) {
        let borrowerCreatedLoanEvent = await loans.events.created({ _borrower: ACCOUNTS[0] });
        borrowerCreatedLoanEvent.watch(function(err, obj) {
          if (err) reject(err);
          else {
            borrowerCreatedLoanEvent.stopWatching();
            accept();
          }
        })

        await loan.broadcast();
      });
    })

    it('should callback when Attested with query', async function() {
      return new Promise(async function(accept, reject) {
        const attestedEvent = await loans.events.attested({ _attestor: ACCOUNTS[1] });
        attestedEvent.watch(function(err, obj) {
          if (err) reject(err)
          else {
            attestedEvent.stopWatching();
            accept();
          }
        })

        await loan.attest('QmaF1vXQDHnn5MVgfRc54Hs1ivemMDdfLhZABpuJwQwuPE',
          { from: ACCOUNTS[1], gas: 1000000 });
      });
    })

    it('should callback when Investment with query', async function() {
      return new Promise(async function(accept, reject) {
        const investmentEvent = await loans.events.investment({ _investor: ACCOUNTS[2] });
        investmentEvent.watch(function(err, obj) {
          if (err) reject(err)
          else {
            investmentEvent.stopWatching();
            accept();
          }
        })

        await loan.fund(200, ACCOUNTS[2]);
      });
    })

    it('should callback when LoanTermBegin with query', async function() {
      return new Promise(async function(accept, reject) {
        const termBeginEvent = await loans.events.termBegin({ _borrower: ACCOUNTS[0] });
        termBeginEvent.watch(function(err, obj) {
          if (err) reject(err)
          else {
            termBeginEvent.stopWatching();
            accept();
          }
        })

        await loan.fund(800, ACCOUNTS[2]);
      });
    })

    it('should callback when PeriodicRepayment with query', async function() {
      return new Promise(async function(accept, reject) {
        const repaymentEvent = await loans.events.repayment({ _borrower: ACCOUNTS[0] });
        repaymentEvent.watch(function(err, obj) {
          if (err) reject(err)
          else {
            repaymentEvent.stopWatching();
            accept();
          }
        })

        await loan.repay(800);
      });
    })

    it('should callback when InvestmentRedeemed with query', async function() {
      return new Promise(async function(accept, reject) {
        const investmentRedeemedEvent = await loans.events.investmentRedeemed({ _recipient: ACCOUNTS[2] });
        investmentRedeemedEvent.watch(function(err, obj) {
          if (err) reject(err)
          else {
            investmentRedeemedEvent.stopWatching();
            accept();
          }
        })

        await loan.redeemValue(ACCOUNTS[2], { from: ACCOUNTS[2] });
      });
    })

    it('should callback when Transfer with query', async function() {
      return new Promise(async function(accept, reject) {
        const transferEvent = await loans.events.transfer({ _to: ACCOUNTS[3] });
        transferEvent.watch(function(err, obj) {
          if (err) reject(err)
          else {
            transferEvent.stopWatching();
            accept();
          }
        })

        await loan.transfer(ACCOUNTS[3], 100, { from: ACCOUNTS[2] });
      });
    })

    it('should callback when Approve with query', async function() {
      return new Promise(async function(accept, reject) {
        const approveEvent = await loans.events.approval({ _spender: ACCOUNTS[4] });
        approveEvent.watch(function(err, obj) {
          if (err) reject(err)
          else {
            approveEvent.stopWatching();
            accept();
          }
        })

        await loan.approve(ACCOUNTS[4], 100, { from: ACCOUNTS[2] });
      });
    })
  })
})
