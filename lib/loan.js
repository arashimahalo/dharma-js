const RedeemableERC20 = require('./redeemableErc20');
const LoanContract = require('./contract_wrappers/LoanContract');
const Config = require('../config');
const isIpfs = require('is-ipfs');
const request = require('request-promise');
const TermsSchema = require('./termsSchema');
const Events = require('./events');

IPFS_GATEWAY_ROOT = 'http://gateway.ipfs.io/ipfs/';
UNDEFINED_GAS_ALLOWANCE = 200000;
PERIOD_TYPE_ID = {
  'daily': 0,
  'weekly': 1,
  'monthly': 2,
  'yearly': 3
}

class Loan extends RedeemableERC20 {
  constructor(web3, uuid, terms) {
    super(web3, uuid);
    this.web3 = web3;

    if (!/0x[0-9A-Fa-f]{64}/g.test(uuid))
      throw new Error('Invalid loan UUID.');

    const schema = new TermsSchema(web3);
    schema.validate(terms);

    this.uuid = uuid;
    this.terms = terms;

    this.events = new Events(web3, { _uuid: this.uuid });
  }

  async broadcast(options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    if (typeof options.gas === 'undefined') {
      options.gas = UNDEFINED_GAS_ALLOWANCE;
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

    return contract.createLoan(uuid, borrower, attestor,
        principal, periodType, periodLength, interest,
        termLength, fundingPeriodTimeLock, options);
  }

  async fund(amount, tokenRecipient, options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    if (!this.web3.isAddress(tokenRecipient))
      throw new Error("Token recipient must be valid ethereum address.");

    options.value = amount;
    return contract.fundLoan(this.uuid, tokenRecipient, options);
  }

  async attest(ipfsMultihash, options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    const attestor = await contract.getAttestor.call(this.uuid);
    const commitmentHash = await contract.getAttestation.call(this.uuid);

    if (attestor !== options.from)
      throw new Error('Account ' + options.from + ' is not authorized to attest to this loan.');

    if (commitmentHash !== '0x')
      throw new Error('Loan ' + this.uuid + ' has already been attested to.');

    if (!isIpfs.multihash(ipfsMultihash))
      throw new Error('Attestation commitment ' + ipfsMultihash + ' is not a valid IPFS multihash.');

    return contract.attest(this.uuid, ipfsMultihash, options);
  }

  async getAttestation() {
    const contract = await LoanContract.instantiate(this.web3);

    const commitmentHash = await contract.getAttestation.call(this.uuid);

    if (commitmentHash === '0x')
      throw new Error('Loan ' + this.uuid + ' has not been attested to yet.');

    const multihash = this.web3.toAscii(commitmentHash);

    const url = IPFS_GATEWAY_ROOT + multihash;
    const body = await request(url)

    const attestation = JSON.parse(body);

    return attestation;
  }

  async amountFunded(options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    return contract.getTotalInvested.call(this.uuid, options);
  }

  async repay(amount, options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    options.value = amount;

    return contract.periodicRepayment(this.uuid, options);
  }

  async withdrawInvestment(options, callback) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    return contract.withdrawInvestment(this.uuid, options);
  }

  async amountRepaid(options, callback) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    return contract.getRedeemableValue.call(this.uuid, options);
  }
}

module.exports = Loan;
