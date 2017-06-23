const Loan = require('../lib/loan.js');
const expect = require('expect.js');
const uuidV4 = require('uuid/v4');
const util = require('./util.js');
const exampleAttestation = require('./attestations/example.js');

describe('Loan', function() {
  let terms = {
    borrower: web3.eth.accounts[0],
    attestor: web3.eth.accounts[1],
    principal: 1000,
    interest: 5,
    periodType: 'daily',
    periodLength: 1,
    termLength: 3,
    fundingPeriodTimeLock: Date.now() + 60 * 60 * 1000
  };

  describe('#constructor()', function() {
    let uuid = web3.sha3(uuidV4());
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
      let malformedNumberType = Object.assign({ principal: 'no strings for number type values' }, terms);
      let malformedStringType = Object.assign({ periodType: 100 }, terms);

      expect(() => { new Loan(web3, uuid, malformedNumberType) }).to.throwException();
      expect(() => { new Loan(web3, uuid, malformedStringType) })
    })
  })

  let uuid = web3.sha3(uuidV4());
  let loan = new Loan(web3, uuid, terms);

  describe('#broadcast()', function() {
    it("should successfuly broadcast a loan creation request", function(done) {
      loan.broadcast(function(err, txHash) {
        if (err) done(err);
        else {
          web3.eth.getTransaction(txHash, function(err, tx) {
            if (err) done(err);
            expect(tx.hash).to.equal(txHash);
            expect(tx.to).to.equal(loan.contract.address);
            done();
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
      loan.attest('QmQ2pqaBQi4VaRGBxybn3t4Z3673wZP9TFchbHhFsQqL4r', { from: web3.eth.accounts[2] }, function(err, result) {
        if (!err) done('should return error');
        else done();
      })
    })

    it('should allow the defined attestor to attest to the loan', function(done) {
      loan.attest('QmQ2pqaBQi4VaRGBxybn3t4Z3673wZP9TFchbHhFsQqL4r', { from: web3.eth.accounts[1], gas: 1000000 }, function(err, result) {
        if (err) done(err);
        else {
          done();
          // loan.getAttestation(function(err, attestation) {
          //   expect(JSON.stringify(attestation)).to.be.exactly(JSON.stringify(exampleAttestation));
          //   done();
          // })
        }
      })
    })

    it('should not allow anyone to attest with an invalid IPFS multihash', function(done) {
      loan.attest('abcdefgh', { from: web3.eth.accounts[1] }, function(err, result) {
        if (!err) done("should return error")
        else done();
      })
    })
  })

  describe('#fund', function() {
    it("should let user fund a loan", function(done) {
      const amount = 100;
      const funder = web3.eth.accounts[2];
      loan.fund(amount, funder, function(err, txHash) {
        if (err) done(err);
        expect(loan.balanceOf(funder)).to.be(amount);
        expect(loan.amountFunded()).to.be(amount);
        done();
      })
    })

    it("should let a user fund a loan specifying a different token recipient", function(done) {
      const amount = 800;
      const total = 900;
      const tokenRecipient = web3.eth.accounts[3];
      const funder = web3.eth.accounts[2];
      loan.fund(amount, tokenRecipient, { from: funder }, function(err, txHash) {
        if (err) done(err);
        expect(loan.balanceOf(tokenRecipient)).to.be(amount);
        expect(loan.amountFunded()).to.be(total);
        done();
      });
    })

    it("should not let a user fund a loan specifying a malformed token recipient address", function(done) {
      const amount = 800;
      const tokenRecipient = 'abcdex123';
      const funder = web3.eth.accounts[2];
      loan.fund(amount, tokenRecipient, { from: funder }, function(err, txHash) {
        if (!err) done('should return error');
        else done();
      })
    })
  })
})
