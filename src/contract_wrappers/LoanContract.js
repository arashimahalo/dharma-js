'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _truffleContract = require('truffle-contract');

var _truffleContract2 = _interopRequireDefault(_truffleContract);

var _package = require('../../package.json');

var _package2 = _interopRequireDefault(_package);

var _Loan = require('../../contracts/Loan.json');

var _Loan2 = _interopRequireDefault(_Loan);

var _VersionRegister = require('../../contracts/VersionRegister.json');

var _VersionRegister2 = _interopRequireDefault(_VersionRegister);

var _semver = require('semver');

var _semver2 = _interopRequireDefault(_semver);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LoanContract = function () {
  function LoanContract() {
    _classCallCheck(this, LoanContract);
  }

  _createClass(LoanContract, null, [{
    key: 'instantiate',
    value: async function instantiate(web3) {
      var metadata = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _package2.default;

      var VersionRegister = new _truffleContract2.default(_VersionRegister2.default);
      var Loan = new _truffleContract2.default(_Loan2.default);

      VersionRegister.defaults({ from: web3.eth.defaultAccount });
      Loan.defaults({ from: web3.eth.defaultAccount });

      VersionRegister.setProvider(web3.currentProvider);
      Loan.setProvider(web3.currentProvider);

      var versionRegisterInstance = await VersionRegister.deployed();
      var contractVersion = await versionRegisterInstance.currentVersion.call();
      var localVersion = {
        major: _semver2.default.major(metadata.version),
        minor: _semver2.default.minor(metadata.version),
        patch: _semver2.default.patch(metadata.version)
      };

      if (contractVersion[0] != localVersion.major || contractVersion[1] != localVersion.minor || contractVersion[2] != localVersion.patch) {
        throw new Error('This version of dharma.js is trying to access a ' + 'deprecated version of the Dharma Protocol contract.  This can ' + 'be resolved by upgrading the dharma.js package.');
      }

      var loanContractAddress = await versionRegisterInstance.getContractByVersion.call(localVersion.major, localVersion.minor, localVersion.patch);

      return Loan.at(loanContractAddress);
    }
  }]);

  return LoanContract;
}();

module.exports = LoanContract;