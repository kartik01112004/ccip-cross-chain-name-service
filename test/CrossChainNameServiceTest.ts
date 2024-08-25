import { expect } from "chai";
import { ethers } from "hardhat";
import { CCIPLocalSimulator } from "@chainlink/local/src/ccip/CCIPLocalSimulator.sol";

import {
  CrossChainNameServiceLookup,
  CrossChainNameServiceReceiver,
  CrossChainNameServiceRegister,
} from "contracts";

describe("CrossChainNameService Test", function () {
  let ccipLocalSimulator: CCIPLocalSimulator;
  let registerContract: CrossChainNameServiceRegister;
  let receiverContract: CrossChainNameServiceReceiver;
  let lookupSourceContract: CrossChainNameServiceLookup;
  let lookupReceiverContract: CrossChainNameServiceLookup;
  let aliceEOA: ethers.Signer;

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    const sourceChainSelector = 1;
    aliceEOA = signers[0];

    // Create CCIPLocalSimulator instance
    ccipLocalSimulator = await (
      await ethers.getContractFactory("CCIPLocalSimulator")
    ).deploy();
    await ccipLocalSimulator.deployed();

    // Get Router contract address
    const routerAddress = await ccipLocalSimulator.configuration();

    // Deploy contracts
    registerContract = await (
      await ethers.getContractFactory("CrossChainNameServiceRegister")
    ).deploy(routerAddress, lookupSourceContract.address);
    await registerContract.deployed();
    receiverContract = await (
      await ethers.getContractFactory("CrossChainNameServiceReceiver")
    ).deploy(
      routerAddress,
      lookupReceiverContract.address,
      sourceChainSelector
    );
    await receiverContract.deployed();
    lookupSourceContract = await (
      await ethers.getContractFactory("CrossChainNameServiceLookup")
    ).deploy(registerContract.address);
    await lookupSourceContract.deployed();
    lookupReceiverContract = await (
      await ethers.getContractFactory("CrossChainNameServiceLookup")
    ).deploy(receiverContract.address);
    await lookupReceiverContract.deployed();

    // Enable chains (replace with actual chain IDs if needed)
    await registerContract.enableChain(1);
    await receiverContract.enableChain(2);

    // Set CrossChainNameService addresses
    await lookupSourceContract.setCrossChainNameServiceAddress(
      registerContract.address
    );
    await lookupReceiverContract.setCrossChainNameServiceAddress(
      receiverContract.address
    );
  });

  it("registers and looks up a name", async () => {
    const name = "alice.ccns";

    // Register the name
    await registerContract.register(name, aliceEOA.address);

    // Lookup the name
    const address = await lookupSourceContract.lookup(name);

    // Assert that the address matches Alice's EOA address
    expect(address).to.equal(aliceEOA.address);
  });
});
