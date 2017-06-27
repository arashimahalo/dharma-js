const Util = require('./util.js');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8546'))

util = new Util(web3);

ACCOUNTS = []

before(function(done) {
  web3.eth.getAccounts(function(err, result) {
    if (err) {
      done(err);
    } else {
      ACCOUNTS = result;
      web3.eth.defaultAccount = ACCOUNTS[0];
      done()
    }
  })
})

module.exports = web3;
