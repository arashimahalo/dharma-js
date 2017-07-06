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

    loan.events = new Events(web3, { uuid: loan.uuid });

    return loan;
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
      { from: this.web3.eth.defaultAccount };

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

  async acceptBids(bids, options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

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
      { from: this.web3.eth.defaultAccount };

    if (typeof options.gas === 'undefined') {
      options.gas = UNDEFINED_GAS_ALLOWANCE;
    }

    const auctionPeriodEndBlock =
      await contract.getAuctionEndBlock.call(this.uuid);
    const reviewPeriodEndBlock =
      await contract.getReviewPeriodEndBlock.call(this.uuid);
    const latestBlockNumber = await Util.getLatestBlockNumber(this.web3);
    const state = await contract.getState.call(this.uuid);

    if (state.equals(Constants.AUCTION_STATE)) {
      if (latestBlockNumber < auctionPeriodEndBlock)
        throw new Error('Bids can only be rejected during the review period.');
    } else if (state.equals(Constants.REVIEW_STATE)) {
      if (latestBlockNumber >= reviewPeriodEndBlock)
        throw new Error('Bids can only be rejected during the review period.');
    } else {
      throw new Error('Bids can only be rejected during the review period.');
    }

    return await contract.rejectBids(this.uuid, options)
  }

  async repay(amount, options) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    options.value = amount;

    const state = await contract.getState.call(this.uuid);

    if (!state.equals(Constants.ACCEPTED_STATE))
      throw new Error('Repayments cannot be made until loan term has begun.');

    return contract.periodicRepayment(this.uuid, options);
  }

  async withdrawInvestment(options, callback) {
    const contract = await LoanContract.instantiate(this.web3);

    options = options ||
      { from: this.web3.eth.defaultAccount };

    const auctionPeriodEndBlock =
      await contract.getAuctionEndBlock.call(this.uuid);
    const reviewPeriodEndBlock =
      await contract.getReviewPeriodEndBlock.call(this.uuid);
    const latestBlockNumber = await Util.getLatestBlockNumber(this.web3);
    const state = await contract.getState.call(this.uuid);

    if (!state.equals(Constants.ACCEPTED_STATE) &&
          !state.equals(Constants.REJECTED_STATE)) {
      if (latestBlockNumber < auctionPeriodEndBlock) {
        throw new Error('Bids cannot be withdrawn during the auction period.');
      } else if (latestBlockNumber <= reviewPeriodEndBlock) {
        throw new Error('Bids cannot be withdrawn during the review period.');
      }
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

  async verifyAttestation() {
    const validSignature = await this.attestation.verifySignature(this.signature);
    if (!validSignature)
      throw new Error('Attestation has invalid signature!');
  }
}

module.exports = Loan;
