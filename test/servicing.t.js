import {LoanInAcceptedState} from './util/TestLoans';
import {web3, util} from './init';
import expect from 'expect.js';

describe('Servicing', () => {
  describe('#expectedAmountRepaidByDate()', () => {
    let loan;
    let date;

    describe('Daily non-compounded', () => {
      let expectedPeriodicRepayment;

      before(async () => {
        loan = await LoanInAcceptedState(ACCOUNTS, {
          terms: {
            version: 1,
            periodType: 'daily',
            periodLength: 3,
            termLength: 2,
            compounded: false
          }
        })

        await loan.refreshState()

        date = new Date();

        const decimals = web3.toWei(1, 'ether');
        let interestRate = await loan.getInterestRate();
        interestRate = interestRate.div(decimals).plus(1);

        const principal = loan.principal;
        expectedPeriodicRepayment = interestRate.times(principal).div(2);
      })

      it("should return correct amount for 1 day into term", () => {
        date.setDate(date.getDate() + 1)
        const expectedAmountRepaid = loan.servicing.expectedAmountRepaidByDate(date)
        expect(expectedAmountRepaid.equals(0)).to.be(true);
      })

      it("should return correct amount for 4 days into term", async () => {
        date.setDate(date.getDate() + 3)
        const returnedExpectedAmountRepaid = loan.servicing.expectedAmountRepaidByDate(date)
        expect(returnedExpectedAmountRepaid
          .equals(expectedPeriodicRepayment)).to.be(true);
      })

      it("should return correct amount for 7 days into term", () => {
        date.setDate(date.getDate() + 3)
        const returnedExpectedAmountRepaid = loan.servicing.expectedAmountRepaidByDate(date)

        expect(returnedExpectedAmountRepaid
          .equals(expectedPeriodicRepayment.times(2))).to.be(true);
      })
    });

    describe('Weekly non-compounded', () => {
      let expectedPeriodicRepayment;

      before(async () => {
        loan = await LoanInAcceptedState(ACCOUNTS, {
          terms: {
            version: 1,
            periodType: 'weekly',
            periodLength: 1,
            termLength: 4,
            compounded: false
          }
        })

        await loan.refreshState()

        date = new Date();

        const decimals = web3.toWei(1, 'ether');
        let interestRate = await loan.getInterestRate();
        interestRate = interestRate.div(decimals).plus(1);

        const principal = loan.principal;
        expectedPeriodicRepayment = interestRate.times(principal).div(4);
      })

      it('should return correct amount for 3 days into term', () => {
        date.setDate(date.getDate() + 3)
        const expectedAmountRepaid = loan.servicing.expectedAmountRepaidByDate(date)
        expect(expectedAmountRepaid.equals(0)).to.be(true);
      })

      it('should return correct amount for 10 days into term', () => {
        date.setDate(date.getDate() + 7)
        const returnedExpectedAmountRepaid = loan.servicing.expectedAmountRepaidByDate(date)
        expect(returnedExpectedAmountRepaid
          .equals(expectedPeriodicRepayment)).to.be(true);
      })

      it('should return correct amount for 17 days into term', () => {
        date.setDate(date.getDate() + 7)
        const returnedExpectedAmountRepaid = loan.servicing.expectedAmountRepaidByDate(date)
        expect(returnedExpectedAmountRepaid
          .equals(expectedPeriodicRepayment.times(2))).to.be(true);
      })

      it('should return correct amount for 24 days into term', () => {
        date.setDate(date.getDate() + 7)
        const returnedExpectedAmountRepaid = loan.servicing.expectedAmountRepaidByDate(date)
        expect(returnedExpectedAmountRepaid
          .equals(expectedPeriodicRepayment.times(3))).to.be(true);
      })

      it('should return correct amount for 31 days into term', () => {
        date.setDate(date.getDate() + 7)
        const returnedExpectedAmountRepaid = loan.servicing.expectedAmountRepaidByDate(date)
        expect(returnedExpectedAmountRepaid
          .equals(expectedPeriodicRepayment.times(4))).to.be(true);
      })
    });

    describe('Monthly non-compounded', () => {
      let expectedPeriodicRepayment;

      before(async () => {
        loan = await LoanInAcceptedState(ACCOUNTS, {
          terms: {
            version: 1,
            periodType: 'monthly',
            periodLength: 1,
            termLength: 2,
            compounded: false
          }
        })

        await loan.refreshState()

        date = new Date();

        const decimals = web3.toWei(1, 'ether');
        let interestRate = await loan.getInterestRate();
        interestRate = interestRate.div(decimals).plus(1);

        const principal = loan.principal;
        expectedPeriodicRepayment = interestRate.times(principal).div(2);
      });

      it('should return correct amount 25 days into term', () => {
        date.setDate(date.getDate() + 25)
        const expectedAmountRepaid = loan.servicing.expectedAmountRepaidByDate(date)
        expect(expectedAmountRepaid.equals(0)).to.be(true);
      })

      it('should return correct amount 50 days into term', () => {
        date.setDate(date.getDate() + 25)
        const returnedExpectedAmountRepaid = loan.servicing.expectedAmountRepaidByDate(date)
        expect(returnedExpectedAmountRepaid
          .equals(expectedPeriodicRepayment)).to.be(true);
      })

      it('should return correct amount 75 days into term', () => {
        date.setDate(date.getDate() + 25)
        const returnedExpectedAmountRepaid = loan.servicing.expectedAmountRepaidByDate(date)
        expect(returnedExpectedAmountRepaid
          .equals(expectedPeriodicRepayment.times(2))).to.be(true);
      });
    });

    describe('Yearly non-compounded', () => {
      let expectedPeriodicRepayment;

      before(async () => {
        loan = await LoanInAcceptedState(ACCOUNTS, {
          terms: {
            version: 1,
            periodType: 'yearly',
            periodLength: 1,
            termLength: 2,
            compounded: false
          }
        })

        await loan.refreshState()

        date = new Date();

        const decimals = web3.toWei(1, 'ether');
        let interestRate = await loan.getInterestRate();
        interestRate = interestRate.div(decimals).plus(1);

        const principal = loan.principal;
        expectedPeriodicRepayment = interestRate.times(principal).div(2);
      })

      it('should return correct amount 300 days into term', () => {
        date.setDate(date.getDate() + 300)
        const expectedAmountRepaid = loan.servicing.expectedAmountRepaidByDate(date)
        expect(expectedAmountRepaid.equals(0)).to.be(true);
      })

      it('should return correct amount 600 days into term', () => {
        date.setDate(date.getDate() + 300)
        const returnedExpectedAmountRepaid = loan.servicing.expectedAmountRepaidByDate(date)
        expect(returnedExpectedAmountRepaid
          .equals(expectedPeriodicRepayment)).to.be(true);
      })

      it('should return correct amount 900 days into term', () => {
        date.setDate(date.getDate() + 300)
        const returnedExpectedAmountRepaid = loan.servicing.expectedAmountRepaidByDate(date)
        expect(returnedExpectedAmountRepaid
          .equals(expectedPeriodicRepayment.times(2))).to.be(true);
      })
    });
  })
})
