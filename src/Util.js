'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _es6Promisify = require('es6-promisify');

var _es6Promisify2 = _interopRequireDefault(_es6Promisify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Util = function () {
  function Util() {
    _classCallCheck(this, Util);
  }

  _createClass(Util, null, [{
    key: 'stripZeroEx',
    value: function stripZeroEx(data) {
      if (data.slice(0, 2) === '0x') return data.slice(2);else return data;
    }
  }, {
    key: 'isTestRpc',
    value: async function isTestRpc(web3) {
      var getNodeVersion = (0, _es6Promisify2.default)(web3.version.getNode);
      var nodeVersion = await getNodeVersion();

      return _lodash2.default.includes(nodeVersion, 'TestRPC');
    }
  }, {
    key: 'getLatestBlockNumber',
    value: async function getLatestBlockNumber(web3) {
      return new Promise(function (accept, reject) {
        web3.eth.getBlockNumber(function (err, blockNumber) {
          if (err) reject(err);else {
            accept(blockNumber);
          }
        });
      });
    }
  }, {
    key: 'getBlock',
    value: async function getBlock(web3, blockNumber) {
      return new Promise(function (accept, reject) {
        web3.eth.getBlock(blockNumber, function (err, block) {
          if (err) reject(err);else {
            accept(block);
          }
        });
      });
    }
  }]);

  return Util;
}();

module.exports = Util;