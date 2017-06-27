const web3 = require('./init.js');
const Loan = require('../lib/loan.js');
const expect = require('expect.js');
const uuidV4 = require('uuid/v4');

describe('ERC20', function() {
  let loan;

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
        loan.broadcast(function(err, result) {
          if (err) done(err);
          else {
            loan.attest('QmaF1vXQDHnn5MVgfRc54Hs1ivemMDdfLhZABpuJwQwuPE',
              { from: ACCOUNTS[1], gas: 500000 }, function(err, callback) {
              if (err) done(err);
              else {
                loan.fund(1000, ACCOUNTS[2], { from: ACCOUNTS[2] }, function(err, result) {
                  if(err) done(err)
                  else done();
                })
              }
            })
          }
        })
      }
    });
  })

  describe('#transfer()', function() {
    it("should allow an investor to transfer their balance to someone else", function(done) {
      loan.transfer(ACCOUNTS[3], 400, { from: ACCOUNTS[2] }, function(err, result) {
        if (err) done(err)
        else {
          loan.balanceOf(ACCOUNTS[3], function(err, balance) {
            expect(balance.equals(400)).to.be(true);
            loan.balanceOf(ACCOUNTS[2], function(err, balance) {
              expect(balance.equals(600)).to.be(true);
              done();
            })
          })
        }
      })
    })

    it("should prevent a non-inveestor from transfering anyone's balance", function(done) {
      loan.transfer(400, ACCOUNTS[4], { from: ACCOUNTS[4] }, function(err, result) {
        if (!err) done("should return error")
        else done()
      })
    })
  })

  describe('#approve()', function() {
    it('should allow the owner of a balance to approve usage by another party', function(done) {
      loan.approve(ACCOUNTS[4], 200, { from: ACCOUNTS[2] }, function(err, result) {
        if (err) done(err);
        else {
          loan.allowance(ACCOUNTS[2], ACCOUNTS[4], function(err, allowance) {
            expect(allowance.equals(200)).to.be(true);
            done();
          })
        }
      })
    })
  })

  describe('#transferFrom()', function() {
    it("should allow someone with an approved balance to transfer on an owner's behalf", function(done) {
      loan.transferFrom(ACCOUNTS[2], ACCOUNTS[5], 100, { from: ACCOUNTS[4] }, function(err, result) {
        if (err) done(err);
        else {
          loan.balanceOf(ACCOUNTS[5], function(err, balance) {
            if(err) done(err);
            else {
              expect(balance.equals(100)).to.be(true);
              done();
            }
          })
        }
      })
    })

    it("should not allow someone with an unapproved balance to transfer on an owner's behalf", function(done) {
      loan.transferFrom(ACCOUNTS[2], ACCOUNTS[5], 100, { from: ACCOUNTS[5] }, function(err, result) {
        if (!err) done("should return error");
        else done()
      })
    })
  })
})
