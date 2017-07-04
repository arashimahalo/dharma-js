import {Schema, Bytes32Type, AddressType,
  NumberType, PeriodType, BooleanType} from './Schema';

class TermsSchema extends Schema {
  constructor(web3, optional=false) {
    const schema = {
      version: new Bytes32Type(),
      periodType: new PeriodType(),
      periodLength: new NumberType(),
      termLength: new NumberType(),
      compounded: new BooleanType()
    };
    super('Terms', schema, optional);
  }
}

module.exports = TermsSchema;
