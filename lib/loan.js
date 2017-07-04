import RedeemableERC20 from './redeemableErc20';
import LoanContract from './contract_wrappers/LoanContract';
import Config from '../config';
import request from 'request-promise';
import LoanSchema from './schemas/LoanSchema';
import Events from './events';
import Attestation from './Attestation';
import Terms from './Terms';

class Loan extends RedeemableERC20 {
  constructor(web3, params) {
    super(web3, params);
  }

  static async create(web3, params) {
    let loan = new Loan(web3, params);

    loan.web3 = web3;

    const schema = new LoanSchema(web3);
    schema.validate(params);

    loan.uuid = params.uuid;
    loan.borrower = params.borrower;
    loan.principal = params.principal;
    loan.terms = new Terms(web3, params.terms);
    loan.attestor = params.attestor;
    loan.attestorFee = params.attestorFee;
    loan.defaultRisk = params.defaultRisk;
    loan.signature = params.signature;
    loan.auctionPeriodLength = params.auctionPeriodLength;
    loan.reviewPeriodLength = params.reviewPeriodLength;

    loan.attestation = new Attestation(loan.web3, {
      uuid: loan.uuid,
      borrower: loan.borrower,
      principal: loan.principal,
      terms: loan.terms.toByteString(),
      attestor: loan.attestor,
      attestorFee: loan.attestorFee,
      defaultRisk: loan.defaultRisk,
    })

    if (loan.signature)
      await loan.verifyAttestation();

    loan.events = new Events(web3, { _uuid: loan.uuid });

    return loan;
  }

  async broadcast(options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    if (typeof options.gas === 'undefined') {
      options.gas = UNDEFINED_GAS_ALLOWANCE;
    }

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

  async signAttestation() {
    this.signature = await this.attestation.sign();
  }

  async verifyAttestation() {
    const validSignature = await this.attestation.verifySignature(this.signature);
    if (!validSignature)
      throw new Error('Attestation has invalid signature!');
  }
}

module.exports = Loan;
