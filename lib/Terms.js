import Util from './Util';

class Terms {
  constructor(web3, terms) {
    this.web3 = web3;
    this.terms = terms;
  }

  toByteString() {
    let version = Util.stripZeroEx(this.web3.toHex(this.terms.version));
    let periodType = Util.stripZeroEx(this.web3.toHex(this.getPeriodTypeValue()))
    let periodLength = Util.stripZeroEx(this.web3.toHex(this.terms.periodLength))
    let termLength = Util.stripZeroEx(this.web3.toHex(this.terms.termLength))
    let compounded = Util.stripZeroEx(this.web3.toHex(this.terms.compounded))

    version = this.web3.padLeft(version, 2) // uint8
    periodType = this.web3.padLeft(periodType, 2) // uint8
    periodLength = this.web3.padLeft(periodLength, 64) // uint256
    termLength = this.web3.padLeft(termLength, 64) // uint256
    compounded = this.web3.padLeft(compounded, 2) // uint8

    return '0x' + version + periodType + periodLength + termLength + compounded;
  }

  getPeriodTypeValue() {
    let periodTypes = {
      "daily": 0,
      "weekly": 1,
      "monthly": 2,
      "yearly": 3,
      "fixed": 4
    }

    return periodTypes[this.terms.periodType];
  }
}

module.exports = Terms;
