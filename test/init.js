const Web3 = require('web3');
web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8546'));
web3.eth.defaultAccount = web3.eth.accounts[0];
const fs = require('fs');
const abi = JSON.parse(fs.readFileSync(__dirname +
  '/../build/contracts/Loan.json', 'utf8')).abi;

const contract = web3.eth.contract(abi);
