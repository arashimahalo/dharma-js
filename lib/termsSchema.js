class AddressType {
  constructor(web3) {
    this.web3 = web3;
  }

  validate(term) {
    if (!this.web3.isAddress(term))
      throw 'Address format is invalid';
  }
}

class NumberType {
  validate(term) {
    if (typeof term !== 'number')
      throw term + ' is not a valid number';
  }
}

class PeriodType {
  validate(term) {
    if (!(term === 'daily' ||
        term === 'weekly' ||
        term === 'monthly' ||
        term === 'yearly' ||
        term === 'fixed'))
      throw 'Invalid period type';
  }
}

class TimeLockType extends NumberType {
  validate(term) {
    super.validate(term);
    if (Date.now() > term)
      throw 'Timelock date must be in the future';
  }
}

class TermsSchema {
  constructor(web3) {
    this.schema = {
      borrower: new AddressType(web3),
      attestor: new AddressType(web3),
      principal: new NumberType(),
      interest: new NumberType(),
      periodType: new PeriodType(),
      periodLength: new NumberType(),
      termLength: new NumberType(),
      fundingPeriodTimeLock: new TimeLockType()
    }
  }

  validate(terms) {
    for (let key in this.schema) {
      if (!(key in terms)) {
        throw 'Required term ' + key + ' is missing.';
      } else {
        this.schema[key].validate(terms[key])
      }
    }
  }
}

module.exports = TermsSchema;
