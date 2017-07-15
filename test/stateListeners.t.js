import TestLoans from './util/TestLoans';
import Loan from '../src/Loan';

describe('StateListeners', () => {
  let loan;

  before(async () => {
    loan = await Loan.create(web3, TestLoans.LoanDataUnsigned(ACCOUNTS));
    await loan.signAttestation();
  })

  describe('NULL_STATE', () => {
    // NO LISTENERS IN NULL_STATE
  })

  describe('AUCTION_STATE', () => {
    before(async () => {
      await loan.broadcast();
    })

    it('should initially set state to AUCTION', async () => {
      expect(loan.state).to.be(Constants.AUCTION_STATE);
    })

    it("should set state to REVIEW when state transitions to review", async () => {
      expect(loan.state).to.be(Constants.AUCTION_STATE);
      await util.setTimeForward(30);
      expect(loan.state).to.be(Constants.REVIEW_STATE);
    })
  })
})
