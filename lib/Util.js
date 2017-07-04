import _ from 'lodash';
import promisify from 'es6-promisify';

class Util {
  static stripZeroEx(data) {
    if (data.slice(0, 2) === '0x')
      return data.slice(2)
    else
      return data;
  }

  static async isTestRpc(web3) {
    const getNodeVersion = promisify(web3.version.getNode);
    const nodeVersion = await getNodeVersion();

    return _.includes(nodeVersion, 'TestRPC');
  }

  static async getLatestBlockNumber(web3) {
    return new Promise(function(accept, reject) {
      web3.eth.getBlock('latest', function(err, block) {
        if (err) reject(err);
        else {
          accept(block.number)
        }
      })
    });
  }
}

module.exports = Util;
