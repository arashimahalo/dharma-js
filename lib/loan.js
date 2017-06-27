const RedeemableERC20 = require('./redeemableErc20');
const Config = require('../config');
const isIpfs = require('is-ipfs');
const request = require('request');
const TermsSchema = require('./termsSchema');

const fs = require('fs');
const abi = JSON.parse(fs.readFileSync(__dirname +
  '/../build/contracts/Loan.json', 'utf8')).abi;

IPFS_GATEWAY_ROOT = 'http://gateway.ipfs.io/ipfs/';

PERIOD_TYPE_ID = {
  'daily': 0,
  'weekly': 1,
  'monthly': 2,
  'yearly': 3
}

class Loan extends RedeemableERC20 {
  constructor(web3, uuid, terms) {
    super(web3, uuid);
    this.contract = web3.eth.contract(abi).at(Config.contractAddress);
    this.web3 = web3;


    if (!/0x[0-9A-Fa-f]{64}/g.test(uuid))
      throw 'Invalid loan UUID.';

    const schema = new TermsSchema(web3);
    schema.validate(terms);

    this.uuid = uuid;
    this.terms = terms;
  }

  broadcast(options, callback) {
    if (arguments.length === 1) {
      callback = options;
      options = { from: this.web3.eth.defaultAccount, gas: 500000 };
    }

    const uuid = this.uuid;
    const terms = this.terms;

    // Loan term values:
    const borrower = terms.borrower;
    const attestor = terms.attestor;
    const principal = terms.principal;
    const periodType = PERIOD_TYPE_ID[terms.periodType];
    const periodLength = terms.periodLength;
    const interest = terms.interest;
    const termLength = terms.termLength;
    const fundingPeriodTimeLock = terms.fundingPeriodTimeLock;

    this.contract.createLoan(uuid, borrower, attestor,
      principal, periodType, periodLength, interest,
      termLength, fundingPeriodTimeLock, options, callback);
  }

  fund(amount, tokenRecipient, options, callback) {
    if (arguments.length === 3) {
      callback = options;
      options = { from: this.web3.eth.defaultAccount };
    }

    if (!this.web3.isAddress(tokenRecipient))
      return callback("Token recipient must be valid ethereum address.", null);

    options.value = amount;
    this.contract.fundLoan(this.uuid, tokenRecipient, options,
      function(err, txHash) {
        callback(err, txHash);
      }
    );
  }

  attest(ipfsMultihash, options, callback) {
    if (arguments.length === 2) {
      callback = options;
      options = { from: this.web3.eth.defaultAccount };
    }

    // this.contract.getAttestor(this.uuid, function(err, attestor) {
    //   this.contract.getAttestation(this.uuid, function(err, commitmentHash) {
    //     console.log(attestor)
    //     if (attestor !== options.from)
    //       return callback('Account ' + options.from + ' is not authorized to attest to this loan.', null);
    //
    //     if (commitmentHash !== '0x')
    //       return callback('Loan ' + this.uuid + ' has already been attested to.', null);
    //
    //     if (!isIpfs.multihash(ipfsMultihash))
    //       return callback('Attestation commitment ' + ipfsMultihash + ' is not a valid IPFS multihash.', null);

        this.contract.attest(this.uuid, ipfsMultihash, options, callback);
    //   })
    // }.bind(this));
  }

  getAttestation(callback) {
    // this.contract.getAttestation(this.uuid, function(err, commitmentHash) {
      const commitmentHash = this.contract.getAttestation.call(this.web3.toBigNumber(this.uuid));
      if (err)
        return callback(err, null);

      if (commitmentHash === '0x')
        return callback('Loan ' + this.uuid + ' has not been attested to yet.', null);

      const multihash = this.web3.toAscii(commitmentHash);

      const url = IPFS_GATEWAY_ROOT + multihash;
      console.log(url)
      request(url, function(error, response, body) {
        if (error) {
          callback(error, null);
        } else {
          try {
            const attestation = JSON.parse(body);
            callback(null, attestation);
          } catch (error) {
            callback(error, null);
          }
        }
      })
    // }.bind(this));
  }

  amountFunded() {
    return this.contract.getTotalInvested.call(this.uuid);
  }

  repay(amount, options, callback) {
    if (arguments.length === 2) {
      callback = options;
      options = { from: this.web3.eth.defaultAccount };
    }

    options.value = amount;

    this.contract.periodicRepayment(this.uuid, options, callback);
  }

  withdrawInvestment(options, callback) {
    if (arguments.length === 1) {
      callback = options;
      options = { from: this.web3.eth.defaultAccount };
    }

    this.contract.withdrawInvestment(this.uuid, options, callback);
  }

  getRedeemableValue() {
    return this.contract.getRedeemableValue.call(this.uuid);
  }

  getAmountRepaid() {

  }

  listen(eventName, callback) {

  }
}

module.exports = Loan;
