import {Schema, Bytes32Type, AddressType,
  NumberType, PeriodType} from './Schema';
import TermsSchema from './TermsSchema';
import SignatureSchema from './SignatureSchema';

class LoanSchema extends Schema {
  constructor(web3) {
    const schema = {
      uuid: new Bytes32Type(),
      borrower: new AddressType(web3),
      principal: new NumberType(),
      terms: new TermsSchema(),
      attestor: new AddressType(web3),
      attestorFee: new NumberType(),
      defaultRisk: new NumberType(),
      signature: new SignatureSchema({ optional: true }),
      auctionPeriodLength: new NumberType(),
      reviewPeriodLength: new NumberType()
    };
    super('Loan', schema);
  }
}

module.exports = LoanSchema;
