const VCoin = artifacts.require("VCoin"); // this is auto-deployed in the console
const { assert, expect, should } = require("chai");
const truffleAssert = require("truffle-assertions");

contract("VCoin", async (accounts) => {
  describe("tests with no accounts", () => {
    beforeEach(async () => {
      this.token = await VCoin.deployed();
      this.baseAct = accounts[0];
      this.otherAct = accounts[1];
    });

    it("should return right value for name()", async () => {
      const { token } = this;
      const name = await token.name.call();
      assert.equal(name, "VCoin", "name() should return VCoin");
    });

    it("should return right value for symbol()", async () => {
      const { token } = this;
      const symbol = await token.symbol.call();
      assert.equal(symbol, "VC", "symbol() should return VC");
    });

    it("should return right value for decimals()", async () => {
      const { token } = this;
      const decimals = await token.decimals.call();
      assert.equal(decimals, 8, "decimals() should return 8");
    });

    it("should return right value for totalSupply()", async () => {
      const { token } = this;
      const totalSupply = await token.totalSupply.call();
      assert.equal(totalSupply, 1000000, "totalSupply() should return 1000000");
    });
  });

  describe("tests with one account", () => {
    beforeEach(async () => {
      this.token = await VCoin.deployed();
      this.baseAct = accounts[0];
      this.otherAct = accounts[3];
    });

    it("should return right value for accounts[0] at start", async () => {
      const { token, baseAct } = this;
      let baseActBalance = await token.balanceOf.call(baseAct);
      let totalSupply = await token.totalSupply.call();

      // get out the actual values
      baseActBalance = baseActBalance.words[baseActBalance.length - 1];
      totalSupply = totalSupply.words[totalSupply.length - 1];

      assert.equal(
        baseActBalance,
        totalSupply,
        `accounts[0] should have ${totalSupply} at start but has ${baseActBalance}`
      );
    });

    it("should return 0 if account doesn't exist", async () => {
      const { token, otherAct } = this;
      const otherActBalance = await token.balanceOf.call(otherAct);
      assert.equal(
        otherActBalance,
        0,
        "accounts[1] should have balance of zero at start"
      );
    });
  });

  describe("tests with two accounts", () => {
    beforeEach(async () => {
      this.token = await VCoin.deployed();
      this.baseAct = accounts[0];
      this.otherAct = accounts[5];
    });

    it("should allow an account to approve if it has funds", async () => {
      const { token, baseAct, otherAct } = this;
      const approvalAmt = 1;

      const success = await token.approve.call(otherAct, approvalAmt);
      assert.equal(
        success,
        true,
        "baseAct should approve transfer to otherAct"
      );
      let tx = await token.approve.sendTransaction(otherAct, approvalAmt);
      truffleAssert.eventEmitted(tx, "Approval", (ev) => {
        return (
          ev._owner == baseAct &&
          ev._spender == otherAct &&
          ev._value == approvalAmt
        );
      });
    });

    it("should return false on approve if account doesn't have funds", async () => {
      const { token, baseAct, otherAct } = this;
      const baseActBalance = await token.balanceOf.call(baseAct);
      const approvalAmt = baseActBalance + 1;

      const success = await token.approve.call(otherAct, approvalAmt);
      assert.equal(
        success,
        false,
        "baseAct should not be able to transfer more than it has"
      );
      let tx = await token.approve.sendTransaction(otherAct, approvalAmt);
      truffleAssert.eventNotEmitted(tx, "Approval");
    });

    it("should allow for approve to be called twice and overwritten", async () => {
      const { token, baseAct, otherAct } = this;
      const baseActBalance = await token.balanceOf.call(baseAct);
      const approvalAmt = 15;
      const secondApprovalAmt = 24;

      let success = await token.approve.call(otherAct, approvalAmt);
      assert.equal(success, true);
      let tx = await token.approve.sendTransaction(otherAct, approvalAmt);
      truffleAssert.eventEmitted(tx, "Approval");
      let allowance = await token.allowance.call(baseAct, otherAct);
      assert.equal(
        allowance,
        approvalAmt,
        `incorrect allowance returned: ${allowance} and ${approvalAmt}`
      );

      success = await token.approve.call(otherAct, secondApprovalAmt);
      assert.equal(success, true);
      tx = await token.approve.sendTransaction(otherAct, secondApprovalAmt);
      truffleAssert.eventEmitted(tx, "Approval");
      allowance = await token.allowance.call(baseAct, otherAct);
      assert.equal(
        allowance,
        secondApprovalAmt,
        `incorrect allowance returned: ${allowance} and ${secondApprovalAmt}`
      );
    });

    it("should return the full amount approved if an account asks for this right after approve", async () => {
      const { token, baseAct, otherAct } = this;
      const baseActBalance = await token.balanceOf.call(baseAct);
      const approvalAmt = 11;

      const success = await token.approve.call(otherAct, approvalAmt);
      assert.equal(success, true);
      let tx = await token.approve.sendTransaction(otherAct, approvalAmt);
      truffleAssert.eventEmitted(tx, "Approval");

      const allowance = await token.allowance.call(baseAct, otherAct);
      assert.equal(allowance, approvalAmt, "incorrect allowance returned");
    });

    it("should return 0 for allowance if no approve was called", async () => {
      const { token, baseAct } = this;

      let allowed = await token.allowance.call(baseAct, accounts[3]);
      assert.equal(
        allowed,
        0,
        "there should be zero allowance when no approve was called"
      );
    });

    it("should throw if amount is larger than the user has", async () => {
      const { token, baseAct, otherAct } = this;
      const transferAmt = (await token.balanceOf.call(baseAct)) + 1;
      await truffleAssert.fails(token.transfer(otherAct, transferAmt));
    });

    it("`transfer()` should work with or without approval", async () => {
      const { token, baseAct, otherAct } = this;
      const baseActBalance = await token.balanceOf.call(baseAct);
      const otherActBalance = await token.balanceOf.call(otherAct);
      const transferAmt = 10;

      let success = await token.transfer.call(otherAct, transferAmt);
      let tx = await token.transfer.sendTransaction(otherAct, transferAmt);
      assert.equal(
        success,
        true,
        "transfer should successfully return with or without approval"
      );
      truffleAssert.eventEmitted(tx, "Transfer", (ev) => {
        return (
          ev._from == baseAct && ev._to == otherAct && ev._value == transferAmt
        );
      });

      const baseActBalanceAfter = await token.balanceOf.call(baseAct);
      const otherActBalanceAfter = await token.balanceOf.call(otherAct);

      assert.equal(
        baseActBalance - transferAmt,
        baseActBalanceAfter,
        "base account balance is incorrect after transfer"
      );
      assert.equal(
        Number(otherActBalance) + transferAmt,
        otherActBalanceAfter,
        "other account balance is incorrect after transfer"
      );
    });

    it("a `transfer` of zero is treated normally with Transfer event", async () => {
      const { token, baseAct, otherAct } = this;
      const transferAmt = 0;
      let tx = await token.transfer.sendTransaction(otherAct, transferAmt);
      truffleAssert.eventEmitted(tx, "Transfer", (ev) => {
        return (
          ev._from == baseAct && ev._to == otherAct && ev._value == transferAmt
        );
      });
    });

    it("should not transfer if approve is not called first for `transferFrom()`", async () => {
      const { token, baseAct, otherAct } = this;
      const transferAmt = 10;

      let success = await token.transferFrom.call(
        baseAct,
        otherAct,
        transferAmt
      );
      assert.equal(
        success,
        false,
        "should not be able to transfer if we have not approved yet"
      );
      let tx = await token.transferFrom.sendTransaction(
        baseAct,
        otherAct,
        transferAmt
      );
      truffleAssert.eventNotEmitted(tx, "Transfer");
    });

    it("should successfully transfer if approve is called first & have correct allowance() for `transferFrom()`", async () => {
      const { token, baseAct, otherAct } = this;
      const baseActBalance = await token.balanceOf.call(baseAct);
      const otherActBalance = await token.balanceOf.call(otherAct);
      const approvalAmt = 15;
      const transferAmt = 10;

      let approval = await token.approve.call(otherAct, approvalAmt);
      assert.equal(approval, true);
      let tx = await token.approve.sendTransaction(otherAct, approvalAmt);
      truffleAssert.eventEmitted(tx, "Approval");

      let success = await token.transferFrom.call(
        baseAct,
        otherAct,
        transferAmt
      );
      assert.equal(
        success,
        true,
        "transfer should successfully return after approval"
      );
      tx = await token.transferFrom.sendTransaction(
        baseAct,
        otherAct,
        transferAmt
      );
      truffleAssert.eventEmitted(tx, "Transfer", (ev) => {
        return (
          ev._from == baseAct && ev._to == otherAct && ev._value == transferAmt
        );
      });

      const baseActBalanceAfter = await token.balanceOf.call(baseAct);
      const otherActBalanceAfter = await token.balanceOf.call(otherAct);

      assert.equal(
        baseActBalance - transferAmt,
        baseActBalanceAfter,
        "base account balance should is incorrect after transfer"
      );
      assert.equal(
        Number(otherActBalance) + transferAmt,
        otherActBalanceAfter,
        "other account balance should is incorrect after transfer"
      );

      const remainingAllowance = await token.allowance.call(baseAct, otherAct);
      assert.equal(
        approvalAmt - transferAmt,
        remainingAllowance,
        "remaining allowance is not correct"
      );
    });

    it("should emit Transfer event if approve is called first for `transferFrom()`", async () => {
      const { token, baseAct, otherAct } = this;
      const approvalAmt = 15;
      const transferAmt = 10;

      let approval = await token.approve.call(otherAct, approvalAmt);
      assert.equal(approval, true);
      let tx = await token.approve.sendTransaction(otherAct, approvalAmt);
      truffleAssert.eventEmitted(tx, "Approval");

      let success = await token.transferFrom.call(
        baseAct,
        otherAct,
        transferAmt
      );
      assert.equal(success, true);
      tx = await token.transferFrom.sendTransaction(
        baseAct,
        otherAct,
        transferAmt
      );
      truffleAssert.eventEmitted(tx, "Transfer", (ev) => {
        return (
          ev._from == baseAct && ev._to == otherAct && ev._value == transferAmt
        );
      });
    });
  });
});
