import {Schema, Bytes32Type, Bytes1Type, AddressType,
  NumberType, PeriodType, BooleanType} from './Schema';

class SignatureSchema extends Schema {
  constructor(web3, optional=false) {
    const schema = {
      r: new Bytes32Type(),
      s: new Bytes32Type(),
      v: new Bytes1Types()
    };
    super('Signature', schema, optional);
  }
}

module.exports = SignatureSchema;
