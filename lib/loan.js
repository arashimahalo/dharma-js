import RedeemableERC20 from './redeemableErc20';
import LoanContract from './contract_wrappers/LoanContract';
import Config from '../config';
import request from 'request-promise';
import LoanSchema from './schemas/LoanSchema';
import BidSchema from './schemas/BidSchema';
import Events from './events/Events';
import Attestation from './Attestation';
import Terms from './Terms';
import Util from './Util';
import Constants from './Constants';
import Servicing from './Servicing';
import StateListeners from './StateListeners';
import _ from 'lodash';

const UNDEFINED_GAS_ALLOWANCE = 500000;

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
    loan.principal = new web3.BigNumber(params.principal);
    loan.terms = new Terms(web3, params.terms);
    loan.attestor = params.attestor;
    loan.attestorFee = new web3.BigNumber(params.attestorFee);
    loan.defaultRisk = new web3.BigNumber(params.defaultRisk);
    loan.signature = params.signature;
    loan.auctionPeriodLength = new web3.BigNumber(params.auctionPeriodLength);
    loan.reviewPeriodLength = new web3.BigNumber(params.reviewPeriodLength);

    if (params.auctionPeriodEndBlock)
      loan.auctionPeriodEndBlock = new web3.BigNumber(params.auctionPeriodEndBlock);
    if (params.reviewPeriodEndBlock)
      loan.reviewPeriodEndBlock = new web3.BigNumber(params.reviewPeriodEndBlock);

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
      loan.verifyAttestation();

    loan.events = new Events(web3, { uuid: loan.uuid });
    loan.servicing = new Servicing(loan);
    loan.stateListeners = new StateListeners(web3, loan);

    await loan.stateListeners.refresh();

    return loan;
  }

  toJson() {
    return {
      uuid: this.uuid,
      borrower: this.borrower,
      principal: this.principal,
      attestor: this.attestor,
      attestorFee: this.attestorFee,
      terms: this.terms.toJson(),
      defaultRisk: this.defaultRisk,
      signature: this.signature,
      auctionPeriodLength: this.auctionPeriodLength,
      reviewPeriodLength: this.reviewPeriodLength
    }
  }

  equals(loan) {
    return (
      loan.uuid === this.uuid &&
      loan.borrower === this.borrower &&
      loan.principal.equals(this.principal) &&
      loan.terms.equals(this.terms) &&
      loan.attestor === this.attestor &&
      loan.attestorFee.equals(this.attestorFee) &&
      loan.defaultRisk.equals(this.defaultRisk) &&
      _.isEqual(loan.signature, this.signature) &&
      loan.auctionPeriodLength.equals(this.auctionPeriodLength) &&
      loan.reviewPeriodLength.equals(this.reviewPeriodLength)
    )
  }

  async broadcast(options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    if (typeof options.gas === 'undefined') {
      options.gas = UNDEFINED_GAS_ALLOWANCE;
    }

    return contract.createLoan(
      this.uuid,
      this.borrower,
      this.principal,
      this.terms.toByteString(),
      this.attestor,
      this.attestorFee,
      this.defaultRisk,
      this.signature.r,
      this.signature.s,
      this.signature.v,
      this.auctionPeriodLength,
      this.reviewPeriodLength,
      options
    );
  }

  static async broadcast(web3, params, options) {
    const loan = await Loan.create(web3, params);
    await loan.broadcast(options);
  }

  async bid(amount, tokenRecipient, minInterestRate, options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: tokenRecipient };

    if (typeof options.gas === 'undefined') {
      options.gas = UNDEFINED_GAS_ALLOWANCE;
    }

    if (!this.web3.isAddress(tokenRecipient))
      throw new Error("Token recipient must be valid ethereum address.");

    options.value = amount;
    return contract.bid(this.uuid, tokenRecipient, minInterestRate, options);
  }

  async getBids() {
    const contract = await LoanContract.instantiate(this.web3);

    const numBids = await contract.getNumBids.call(this.uuid);

    const bids = await Promise.all(_.range(numBids).map(async (index) => {
      const bid = await contract.getBid.call(this.uuid, index);
      return {
        bidder: bid[0],
        amount: bid[1],
        minInterestRate: bid[2]
      }
    }))

    return bids;
  }

  async getContract() {
    return await LoanContract.instantiate(this.web3);
  }

  async acceptBids(bids, options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.borrower };

    if (typeof options.gas === 'undefined') {
      options.gas = UNDEFINED_GAS_ALLOWANCE;
    }

    const bidSchema = new BidSchema(this.web3);
    let totalBidValueAccepted = new this.web3.BigNumber(0);
    for (let i = 0; i < bids.length; i++) {
      bidSchema.validate(bids[i]);
      totalBidValueAccepted = totalBidValueAccepted.plus(bids[i].amount);
    }

    if (!totalBidValueAccepted.equals(this.principal.plus(this.attestorFee)))
      throw new Error('Total value of bids accepted should equal the desired ' +
        "principal, plus the attestor's fee");

    const state = await this.getState(true);

    if (!state.equals(Constants.REVIEW_STATE)) {
      throw new Error('Bids can only be accepted during the review period.');
    }

    return await contract.acceptBids(
      this.uuid,
      bids.map((bid) => { return bid.bidder }),
      bids.map((bid) => { return bid.amount }),
      options
    )
  }

  async rejectBids(options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.borrower };

    if (typeof options.gas === 'undefined') {
      options.gas = UNDEFINED_GAS_ALLOWANCE;
    }

    const state = await this.getState(true);

    if (!state.equals(Constants.REVIEW_STATE)) {
      throw new Error('Bids can only be rejected during the review period.');
    }

    return await contract.rejectBids(this.uuid, options)
  }

  async getState(nextBlock=false) {
    const contract = await LoanContract.instantiate(this.web3);

    let blockNumber = 'latest'
    if (nextBlock) {
      blockNumber = await Util.getLatestBlockNumber(this.web3);
      blockNumber += 1;
    }

    return await contract.getState.call(this.uuid, blockNumber);
  }

  async getInterestRate() {
    const contract = await LoanContract.instantiate(this.web3);

    return await contract.getInterestRate.call(this.uuid);
  }

  async repay(amount, options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    options.value = amount;

    const state = await this.getState(true);

    if (!state.equals(Constants.ACCEPTED_STATE))
      throw new Error('Repayments cannot be made until loan term has begun.');

    return contract.periodicRepayment(this.uuid, options);
  }

  async withdrawInvestment(options, callback) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    const state = await this.getState(true);

    if (!state.equals(Constants.REJECTED_STATE) &&
          !state.equals(Constants.ACCEPTED_STATE)) {
      throw new Error('Bids can only be withdrawn once the loan has been ' +
        'accepted or rejected.');
    }

    return contract.withdrawInvestment(this.uuid, options);
  }

  async amountRepaid(options, callback) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    return contract.getAmountRepaid.call(this.uuid, options);
  }

  async signAttestation() {
    this.signature = await this.attestation.sign();
  }

  verifyAttestation() {
    const validSignature = this.attestation.verifySignature(this.signature);
    if (!validSignature)
      throw new Error('Attestation has invalid signature!');
  }

}

module.exports = Loan;
