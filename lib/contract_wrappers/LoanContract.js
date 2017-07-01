const Contract = require('truffle-contract')
const Metadata = require('../../package.json');
const loanArtifact = require('../../contracts/Loan.json')
const versionRegisterArtifact = require('../../contracts/VersionRegister.json')

class LoanContract {
  static async instantiate(web3, metadata=Metadata) {
    const VersionRegister = new Contract(versionRegisterArtifact)
    const Loan = new Contract(loanArtifact)

    VersionRegister.defaults({ from: web3.eth.defaultAccount });
    Loan.defaults({ from: web3.eth.defaultAccount });

    VersionRegister.setProvider(web3.currentProvider);
    Loan.setProvider(web3.currentProvider)

    const versionRegisterInstance = await VersionRegister.deployed();

    const contractVersionHash = await versionRegisterInstance.currentVersion.call();
    const localVersionHash = web3.sha3(metadata.version);

    if (localVersionHash != contractVersionHash) {
      throw new Error('This version of dharma.js is trying to access a ' +
              'deprecated version of the Dharma Protocol contract.  This can ' +
              'be resolved by upgrading the dharma.js package.')
    }

    const loanContractAddress =
      await versionRegisterInstance.getContractByVersion.call(localVersionHash)

    return Loan.at(loanContractAddress);
  }
}

module.exports = LoanContract;
