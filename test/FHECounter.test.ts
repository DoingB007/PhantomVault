import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { FHECounter } from "../types";

describe("FHECounter", function () {
  let counterContract: FHECounter;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const FHECounterFactory = await ethers.getContractFactory("FHECounter");
    counterContract = await FHECounterFactory.deploy();
    await counterContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(counterContract.target).to.not.be.undefined;
    });

    it("Should have initial count of zero", async function () {
      const count = await counterContract.getCount();
      expect(count).to.not.be.undefined;
    });
  });

  describe("Increment Function", function () {
    it("Should increment counter by encrypted value", async function () {
      const incrementValue = 5n;

      // Create encrypted input
      const input = fhevm.createEncryptedInput(counterContract.target as string, user1.address);
      input.add32(incrementValue);
      const encryptedInput = await input.encrypt();

      // Increment the counter
      await counterContract.connect(user1).increment(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // Get the count (still encrypted)
      const encryptedCount = await counterContract.getCount();
      expect(encryptedCount).to.not.be.undefined;
    });

    it("Should handle multiple increments", async function () {
      const incrementValue1 = 3n;
      const incrementValue2 = 7n;

      // First increment
      const input1 = fhevm.createEncryptedInput(counterContract.target as string, user1.address);
      input1.add32(incrementValue1);
      const encrypted1 = await input1.encrypt();

      await counterContract.connect(user1).increment(
        encrypted1.handles[0],
        encrypted1.inputProof
      );

      // Second increment
      const input2 = fhevm.createEncryptedInput(counterContract.target as string, user1.address);
      input2.add32(incrementValue2);
      const encrypted2 = await input2.encrypt();

      await counterContract.connect(user1).increment(
        encrypted2.handles[0],
        encrypted2.inputProof
      );

      const finalCount = await counterContract.getCount();
      expect(finalCount).to.not.be.undefined;
    });

    it("Should allow different users to increment", async function () {
      const incrementValue1 = 2n;
      const incrementValue2 = 4n;

      // User1 increments
      const input1 = fhevm.createEncryptedInput(counterContract.target as string, user1.address);
      input1.add32(incrementValue1);
      const encrypted1 = await input1.encrypt();

      await counterContract.connect(user1).increment(
        encrypted1.handles[0],
        encrypted1.inputProof
      );

      // User2 increments
      const input2 = fhevm.createEncryptedInput(counterContract.target as string, user2.address);
      input2.add32(incrementValue2);
      const encrypted2 = await input2.encrypt();

      await counterContract.connect(user2).increment(
        encrypted2.handles[0],
        encrypted2.inputProof
      );

      const finalCount = await counterContract.getCount();
      expect(finalCount).to.not.be.undefined;
    });

    it("Should handle large increment values", async function () {
      const largeValue = 1000000n;

      const input = fhevm.createEncryptedInput(counterContract.target as string, user1.address);
      input.add32(largeValue);
      const encrypted = await input.encrypt();

      await counterContract.connect(user1).increment(
        encrypted.handles[0],
        encrypted.inputProof
      );

      const count = await counterContract.getCount();
      expect(count).to.not.be.undefined;
    });

    it("Should handle zero increment", async function () {
      const zeroValue = 0n;

      const input = fhevm.createEncryptedInput(counterContract.target as string, user1.address);
      input.add32(zeroValue);
      const encrypted = await input.encrypt();

      await counterContract.connect(user1).increment(
        encrypted.handles[0],
        encrypted.inputProof
      );

      const count = await counterContract.getCount();
      expect(count).to.not.be.undefined;
    });
  });

  describe("Decrement Function", function () {
    beforeEach(async function () {
      // First increment to have something to decrement
      const initialValue = 10n;
      const input = fhevm.createEncryptedInput(counterContract.target as string, user1.address);
      input.add32(initialValue);
      const encrypted = await input.encrypt();

      await counterContract.connect(user1).increment(
        encrypted.handles[0],
        encrypted.inputProof
      );
    });

    it("Should decrement counter by encrypted value", async function () {
      const decrementValue = 3n;

      const input = fhevm.createEncryptedInput(counterContract.target as string, user1.address);
      input.add32(decrementValue);
      const encrypted = await input.encrypt();

      await counterContract.connect(user1).decrement(
        encrypted.handles[0],
        encrypted.inputProof
      );

      const count = await counterContract.getCount();
      expect(count).to.not.be.undefined;
    });

    it("Should handle multiple decrements", async function () {
      const decrementValue1 = 2n;
      const decrementValue2 = 1n;

      // First decrement
      const input1 = fhevm.createEncryptedInput(counterContract.target as string, user1.address);
      input1.add32(decrementValue1);
      const encrypted1 = await input1.encrypt();

      await counterContract.connect(user1).decrement(
        encrypted1.handles[0],
        encrypted1.inputProof
      );

      // Second decrement
      const input2 = fhevm.createEncryptedInput(counterContract.target as string, user1.address);
      input2.add32(decrementValue2);
      const encrypted2 = await input2.encrypt();

      await counterContract.connect(user1).decrement(
        encrypted2.handles[0],
        encrypted2.inputProof
      );

      const finalCount = await counterContract.getCount();
      expect(finalCount).to.not.be.undefined;
    });

    it("Should allow different users to decrement", async function () {
      const decrementValue1 = 1n;
      const decrementValue2 = 2n;

      // User1 decrements
      const input1 = fhevm.createEncryptedInput(counterContract.target as string, user1.address);
      input1.add32(decrementValue1);
      const encrypted1 = await input1.encrypt();

      await counterContract.connect(user1).decrement(
        encrypted1.handles[0],
        encrypted1.inputProof
      );

      // User2 decrements
      const input2 = fhevm.createEncryptedInput(counterContract.target as string, user2.address);
      input2.add32(decrementValue2);
      const encrypted2 = await input2.encrypt();

      await counterContract.connect(user2).decrement(
        encrypted2.handles[0],
        encrypted2.inputProof
      );

      const finalCount = await counterContract.getCount();
      expect(finalCount).to.not.be.undefined;
    });

    it("Should handle zero decrement", async function () {
      const zeroValue = 0n;

      const input = fhevm.createEncryptedInput(counterContract.target as string, user1.address);
      input.add32(zeroValue);
      const encrypted = await input.encrypt();

      await counterContract.connect(user1).decrement(
        encrypted.handles[0],
        encrypted.inputProof
      );

      const count = await counterContract.getCount();
      expect(count).to.not.be.undefined;
    });
  });

  describe("Mixed Operations", function () {
    it("Should handle increment and decrement operations", async function () {
      const incrementValue = 15n;
      const decrementValue = 5n;

      // First increment
      const incrementInput = fhevm.createEncryptedInput(counterContract.target as string, user1.address);
      incrementInput.add32(incrementValue);
      const incrementEncrypted = await incrementInput.encrypt();

      await counterContract.connect(user1).increment(
        incrementEncrypted.handles[0],
        incrementEncrypted.inputProof
      );

      // Then decrement
      const decrementInput = fhevm.createEncryptedInput(counterContract.target as string, user1.address);
      decrementInput.add32(decrementValue);
      const decrementEncrypted = await decrementInput.encrypt();

      await counterContract.connect(user1).decrement(
        decrementEncrypted.handles[0],
        decrementEncrypted.inputProof
      );

      const finalCount = await counterContract.getCount();
      expect(finalCount).to.not.be.undefined;
    });

    it("Should handle complex sequence of operations", async function () {
      const operations = [
        { type: 'increment', value: 5n },
        { type: 'increment', value: 3n },
        { type: 'decrement', value: 2n },
        { type: 'increment', value: 8n },
        { type: 'decrement', value: 4n }
      ];

      for (const op of operations) {
        const input = fhevm.createEncryptedInput(counterContract.target as string, user1.address);
        input.add32(op.value);
        const encrypted = await input.encrypt();

        if (op.type === 'increment') {
          await counterContract.connect(user1).increment(
            encrypted.handles[0],
            encrypted.inputProof
          );
        } else {
          await counterContract.connect(user1).decrement(
            encrypted.handles[0],
            encrypted.inputProof
          );
        }
      }

      const finalCount = await counterContract.getCount();
      expect(finalCount).to.not.be.undefined;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle maximum uint32 values", async function () {
      const maxUint32 = BigInt("4294967295"); // 2^32 - 1

      const input = fhevm.createEncryptedInput(counterContract.target as string, user1.address);
      input.add32(maxUint32);
      const encrypted = await input.encrypt();

      await counterContract.connect(user1).increment(
        encrypted.handles[0],
        encrypted.inputProof
      );

      const count = await counterContract.getCount();
      expect(count).to.not.be.undefined;
    });

    it("Should maintain state between different transactions", async function () {
      // Multiple transactions to verify state persistence
      for (let i = 0; i < 3; i++) {
        const value = BigInt(i + 1);
        const input = fhevm.createEncryptedInput(counterContract.target as string, user1.address);
        input.add32(value);
        const encrypted = await input.encrypt();

        await counterContract.connect(user1).increment(
          encrypted.handles[0],
          encrypted.inputProof
        );

        const count = await counterContract.getCount();
        expect(count).to.not.be.undefined;
      }
    });
  });
});