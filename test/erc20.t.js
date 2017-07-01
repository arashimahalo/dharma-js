const web3 = require('./init.js');
const Loan = require('../lib/loan.js');
const Metadata = require('../package.json');
const expect = require('expect.js');
const uuidV4 = require('uuid/v4');

describe('ERC20', function() {
  let loan;

  before(async function() {
    loan = await new Promise(function(accept, reject) {
      web3.eth.getBlock('latest', function(err, result) {
        if (err) reject(err);
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
          accept(new Loan(web3, uuid, terms));
        }
      })
    });

    await loan.broadcast();
    await loan.attest('QmaF1vXQDHnn5MVgfRc54Hs1ivemMDdfLhZABpuJwQwuPE',
      { from: ACCOUNTS[1], gas: 500000 });
    await loan.fund(1000, ACCOUNTS[2], { from: ACCOUNTS[2] });
  })

  describe('#transfer()', function() {
    it("should allow an investor to transfer their balance to someone else", async function() {
      await loan.transfer(ACCOUNTS[3], 400, { from: ACCOUNTS[2] });
      const toBalance = await loan.balanceOf(ACCOUNTS[3]);
      expect(toBalance.equals(400)).to.be(true);
      const fromBalance = await loan.balanceOf(ACCOUNTS[2]);
      expect(fromBalance.equals(600)).to.be(true);
    })

    it("should prevent a non-inveestor from transfering anyone's balance", async function() {
      try {
        await loan.transfer(400, ACCOUNTS[4], { from: ACCOUNTS[4] })
        expect().fail("should throw error");
      } catch (err) {
        util.assertThrowMessage(err);
      }
    })
  })

  describe('#approve()', function() {
    it('should allow the owner of a balance to approve usage by another party', async function() {
      await loan.approve(ACCOUNTS[4], 200, { from: ACCOUNTS[2] });
      const allowance = await loan.allowance(ACCOUNTS[2], ACCOUNTS[4]);
      expect(allowance.equals(200)).to.be(true);
    })
  })

  describe('#transferFrom()', function() {
    it("should allow someone with an approved balance to transfer on an owner's behalf", async function() {
      await loan.transferFrom(ACCOUNTS[2], ACCOUNTS[5], 100, { from: ACCOUNTS[4] });
      const balance = await loan.balanceOf(ACCOUNTS[5]);
      expect(balance.equals(100)).to.be(true);
    })

    it("should not allow someone with an unapproved balance to transfer on an owner's behalf", async function() {
      try {
        await loan.transferFrom(ACCOUNTS[2], ACCOUNTS[5], 100, { from: ACCOUNTS[5] });
        expect().fail("should throw error");
      } catch (err) {
        util.assertThrowMessage(err);
      }
    })
  })

  describe('#events', function() {
    it('should callback on Transfer event', async function() {
      const value = 300;
      return new Promise(async function(accept, reject) {
        const transferEvent = await loan.events.transfer();
        transferEvent.watch(function(err, obj) {
          if (err) reject(err);
          else {
            expect(obj.args._uuid).to.be(uuid)
            expect(obj.args._from).to.be(ACCOUNTS[2])
            expect(obj.args._to).to.be(ACCOUNTS[3])
            expect(obj.args._value.equals(value)).to.be(true)
            transferEvent.stopWatching();
            accept();
          }
        })

        await loan.transfer(ACCOUNTS[3], value, { from: ACCOUNTS[2] });
      })
    })

    it('should callback on Approval event', async function() {
      const value = 300;
      return new Promise(async function(accept, reject) {
        const approvalEvent = await loan.events.approval();
        approvalEvent.watch(function(err, obj) {
          if (err) reject(err);
          else {
            expect(obj.args._uuid).to.be(uuid)
            expect(obj.args._owner).to.be(ACCOUNTS[2])
            expect(obj.args._spender).to.be(ACCOUNTS[5])
            expect(obj.args._value.equals(value)).to.be(true)
            approvalEvent.stopWatching();
            accept();
          }
        })

        await loan.approve(ACCOUNTS[5], value, { from: ACCOUNTS[2] });
      });
    })
  })
})
