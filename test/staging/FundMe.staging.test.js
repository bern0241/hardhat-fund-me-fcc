const { ethers, getNamedAccounts, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { assert } = require("chai");

// let variable = true
// let someVar = variable ? "yes" : "no"
// if (variable) { someVar = "yes"} else { someVar = "no" })

developmentChains.includes(network.name)  //TESTNET (Staging)
    ? describe.skip 
    : describe("FundMe", async function() {
        let fundMe;
        let deployer;
        const sendValue = ethers.utils.parseEther("0.1");
        beforeEach(async function() {
            deployer = (await getNamedAccounts()).deployer;
            // Already deployed! - NO deployments.fixture(["all"])
            // NO Mock! (Assuming we're on testnet)
            fundMe = await ethers.getContract("FundMe", deployer);
        })

        it("Allows people to fund and withdraw", async function() {
            await fundMe.fund({ value: sendValue });
            await fundMe.withdraw();
            const endingBalance = await fundMe.provider.getBalance(fundMe.address);
            assert.equal(endingBalance.toString(), "0");
        })
    })