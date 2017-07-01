const LoanContract = require('../lib/contract_wrappers/LoanContract')
const Metadata = require('../package.json');
const expect = require('expect.js');
const web3 = require('./init.js');

describe('LoanContract', function() {
  it("should instantiate w/o throwing if version is current", async function() {
    await LoanContract.instantiate(web3)
  })

  it("should throw when instantiating with version mismatched to contract", async function() {
    let outdatedMetadata = Object.assign({}, Metadata);
    outdatedMetadata.version = '1' + Metadata.version

    try {
      await LoanContract.instantiate(web3, outdatedMetadata)
      expect().fail("should throw error");
    } catch (err) {
      expect(err.toString().indexOf('deprecated version') > -1).to.be(true);
    }
  })
})
