'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _AttestationSchema = require('./schemas/AttestationSchema');

var _AttestationSchema2 = _interopRequireDefault(_AttestationSchema);

var _jsonStableStringify = require('json-stable-stringify');

var _jsonStableStringify2 = _interopRequireDefault(_jsonStableStringify);

var _Util = require('./Util');

var _Util2 = _interopRequireDefault(_Util);

var _ethereumjsUtil = require('ethereumjs-util');

var _ethereumjsUtil2 = _interopRequireDefault(_ethereumjsUtil);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Attestation = function () {
  function Attestation(web3, data) {
    _classCallCheck(this, Attestation);

    this.web3 = web3;

    this.schema = new _AttestationSchema2.default(web3);
    this.schema.validate(data);

    this.attestor = data.attestor;
    this.data = data;
  }

  _createClass(Attestation, [{
    key: 'sign',
    value: async function sign() {
      var web3 = this.web3;
      var attestor = this.attestor;

      var data = web3.toHex((0, _jsonStableStringify2.default)(this.data));

      return await new Promise(function (accept, reject) {
        web3.eth.sign(attestor, data, function (err, signatureRaw) {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            var signature = _Util2.default.stripZeroEx(signatureRaw);
            accept({
              r: '0x' + signature.slice(0, 64),
              s: '0x' + signature.slice(64, 128),
              v: '0x' + signature.slice(128, 130)
            });
          }
        });
      });
    }
  }, {
    key: 'verifySignature',
    value: function verifySignature(signature) {
      var web3 = this.web3;

      var r = _ethereumjsUtil2.default.toBuffer(signature.r);
      var s = _ethereumjsUtil2.default.toBuffer(signature.s);
      var v = this.web3.toDecimal(signature.v);

      if (v < 27) v += 27;

      var dataBuffer = _ethereumjsUtil2.default.toBuffer((0, _jsonStableStringify2.default)(this.data));
      var encodedMessage = _ethereumjsUtil2.default.hashPersonalMessage(dataBuffer);

      try {
        var pubKey = _ethereumjsUtil2.default.ecrecover(encodedMessage, v, r, s);
        var retrievedAddress = _ethereumjsUtil2.default.bufferToHex(_ethereumjsUtil2.default.pubToAddress(pubKey));

        return retrievedAddress === this.attestor;
      } catch (err) {
        return false;
      }
    }
  }], [{
    key: 'fromSignatureData',
    value: function fromSignatureData(web3, signature) {
      var v = _Util2.default.stripZeroEx(web3.toHex(signature[2]));

      return {
        r: signature[0],
        s: signature[1],
        v: '0x' + web3.padLeft(v, 2)
      };
    }
  }]);

  return Attestation;
}();

module.exports = Attestation;