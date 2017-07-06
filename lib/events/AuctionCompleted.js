import Util from '../Util';
import LoanContract from '../contract_wrappers/LoanContract';

class AuctionCompleted {
  constructor(web3, auctionPeriodEndBlock) {
    this.web3 = web3;
    this.auctionPeriodEndBlock = auctionPeriodEndBlock;
  }

  watch(callback) {
    const web3 = this.web3;
    const auctionPeriodEndBlock = this.auctionPeriodEndBlock

    const blockListener = this.web3.eth.filter('latest');
    blockListener.watch(function (err, result) {
      if (err) {
        callback(err, null);
      } else {
        Util.getLatestBlockNumber(web3).then(function (blockNumber) {
          console.log(blockNumber)
          console.log(auctionPeriodEndBlock);
          if (auctionPeriodEndBlock.lt(blockNumber)) {
            callback(null, blockNumber);
            blockListener.stopWatching();
          }
        });
      }
    })
  }

  static async create(web3, options={}) {
    const contract = await LoanContract.instantiate(web3);

    if (options.uuid === 'undefined')
      throw new Error('AuctionCompleted event requires UUID to follow.');

    const auctionPeriodEndBlock =
      await contract.getAuctionEndBlock.call(options.uuid);

    if (auctionPeriodEndBlock.equals(0))
      throw new Error('AuctionCompleted listener can only be activated once loan' +
        'has been broadcasted');

    return new AuctionCompleted(web3, auctionPeriodEndBlock);
  }
}

module.exports = AuctionCompleted;
