import AttestationSchema from './schemas/AttestationSchema';
import stringify from 'json-stable-stringify';
import Util from './Util';
import ethUtils from 'ethereumjs-util';

class Attestation {
  constructor(web3, data) {
    this.web3 = web3;

    this.schema = new AttestationSchema(web3);
    this.schema.validate(data);

    this.attestor = data.attestor;
    this.data = data;
  }

  async sign() {
    const web3 = this.web3;
    const attestor = this.attestor;

    const isTestRpc = await Util.isTestRpc(web3)

    let data;
    if (isTestRpc) {
      data = web3.sha3(stringify(this.data))
    } else {
      data = stringify(this.data);
    }

    return await new Promise(function(accept, reject) {
      web3.eth.sign(attestor, data, function(err, signatureRaw) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          const signature = Util.stripZeroEx(signatureRaw);
          accept({
            r: '0x' + signature.slice(0, 64),
            s: '0x' + signature.slice(64, 128),
            v: '0x' + signature.slice(128, 130)
          })
        }
      })
    });
  }

  async verifySignature(signature) {
    const web3 = this.web3;

    let r = ethUtils.toBuffer(signature.r);
    let s = ethUtils.toBuffer(signature.s);
    let v = this.web3.toDecimal(signature.v);

    if (v < 27) v += 27;

    const isTestRpc = await Util.isTestRpc(web3)

    let encodedMessage;
    if (isTestRpc) {
      encodedMessage = ethUtils.toBuffer(web3.sha3(stringify(this.data)))
    } else {
      const dataBuffer = ethUtils.toBuffer(stringify(this.data));
      encodedMessage = ethUtils.hashPersonalMessage(dataBuffer);
    }

    try {
      const pubKey = ethUtils.ecrecover(encodedMessage, v, r, s);
      const retrievedAddress = ethUtils.bufferToHex(ethUtils.pubToAddress(pubKey));

      return retrievedAddress === this.attestor;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
}

module.exports = Attestation;
