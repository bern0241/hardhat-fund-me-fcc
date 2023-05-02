const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");


!developmentChains.includes(network.name) //ONLY RUN UNIT TESTS ON DevelopmentChains (localhost,hardhat)
    ? describe.skip
    : describe("FundMe", function() {
        let fundMe;
        let deployer; //= address
        let mockV3Aggregator;
        const sendValue = ethers.utils.parseEther("1"); // 1 ETH = 18 zeros
        beforeEach(async function() {
            // deploy our fundMe contract
            // using Hardhat-deploy
            // const accounts = await ethers.getSigners(); //Gets accounts in network config sections - NOTE: default network hardhat gets list of 10 fake accounts
            // const accountZero = accounts[0];
            deployer = (await getNamedAccounts()).deployer; //= address
            // const { deployer } = await getNamedAccounts();
            await deployments.fixture(["all"]); // deploys all contracts with tag "all" in module
            fundMe = await ethers.getContract("FundMe", deployer); //get most recently deployed contract
            mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
        })

        describe("constructor", async function() {
            it("Sets the aggregator addresses correctly", async function() {
                const response = await fundMe.getPriceFeed(); 
                assert.equal(response, mockV3Aggregator.address); //We want to TEST on MOCKS (locally)
            })
        })

        describe("fund", async function() {
            it("Fails if you don't send enough ETH", async function() {
                await expect(fundMe.fund()).to.be.revertedWith("Didn't send enough!");
            })
            it("Updated the amount funded data structure", async function()  {
                await fundMe.fund({ value: sendValue });
                const response = await fundMe.getAddressToAmountFunded(deployer);
                //response.toString() == bigNumber version of how much was funded to account
                assert.equal(response.toString(), sendValue.toString());
            })
            it("Adds funder to array of funders", async function() {
                await fundMe.fund({ value: sendValue });
                const funder = await fundMe.getFunder(0);
                assert.equal(funder, deployer);
            })
        })

        describe("withdraw", async function() {
            beforeEach(async function() {
                await fundMe.fund({ value: sendValue });
            })

            it("Withdraw ETH from a single funder", async function() {
                // Arrange
                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address); // 1
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer); // 3
                // Act
                const transactionResponse = await fundMe.withdraw();
                const transactionReceipt = await transactionResponse.wait(1);
                const { gasUsed, effectiveGasPrice } = transactionReceipt;
                // const gasCost = gasUsed * effectiveGasPrice;
                const gasCost = gasUsed.mul(effectiveGasPrice); // MULTIPLIES BIG NUMBERS
                
                //New
                const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address); // 0
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer); // 4
                // Assert
                // assert.equal(startingFundMeBalance.toString(), sendValue); //TRUE
                assert.equal(endingFundMeBalance, 0);
                // assert.equal(startingFundMeBalance + startingDeployerBalance, endingDeployerBalance);
                assert.equal(startingFundMeBalance.add(startingDeployerBalance), //Retrieve BigNumber from the blockchain -
                            endingDeployerBalance.add(gasCost).toString()); //GET gas cost too!!!
            })


            it("Withdraw ETH from a single funder", async function() {
                // Arrange
                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address); // 1
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer); // 3
                // Act
                const transactionResponse = await fundMe.cheaperWithdraw();
                const transactionReceipt = await transactionResponse.wait(1);
                const { gasUsed, effectiveGasPrice } = transactionReceipt;
                // const gasCost = gasUsed * effectiveGasPrice;
                const gasCost = gasUsed.mul(effectiveGasPrice); // MULTIPLIES BIG NUMBERS
                
                //New
                const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address); // 0
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer); // 4
                // Assert
                // assert.equal(startingFundMeBalance.toString(), sendValue); //TRUE
                assert.equal(endingFundMeBalance, 0);
                // assert.equal(startingFundMeBalance + startingDeployerBalance, endingDeployerBalance);
                assert.equal(startingFundMeBalance.add(startingDeployerBalance), //Retrieve BigNumber from the blockchain -
                            endingDeployerBalance.add(gasCost).toString()); //GET gas cost too!!!
            })


            it("Allows us to withdraw with multiple funders", async function() {
                // Arrange
                const accounts = await ethers.getSigners(); // accounts (10 fake ones? - default network hardhat)
                for (let i = 1; i < 6; i++) { //0 = deployer
                    const fundMeConnectedContract = await fundMe.connect(accounts[i]);
                    await fundMeConnectedContract.fund({ value: sendValue })
                }

                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer);
                // Act
                const transactionResponse = await fundMe.withdraw();
                const transactionReceipt = await transactionResponse.wait(1);
                const { gasUsed, effectiveGasPrice } = transactionReceipt;
                const gasCost = gasUsed.mul(effectiveGasPrice);
                // Assert
                const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
                
                assert.equal(endingFundMeBalance, 0);
                assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(),
                            endingDeployerBalance.add(gasCost).toString());
                
                // Make sure that the funders are reset properly
                await expect(fundMe.getFunder(0)).to.be.reverted;
                
                for (let i = 1; i < 6; i++) { //0 = deployer - making sure all the mappings are ZERO
                    assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0);
                }
            })

            it("Only allows the owner to withdraw", async function() {
                const accounts = await ethers.getSigners();
                const attacker = accounts[1];
                const attackerConnectedContract = await fundMe.connect(attacker);
                await expect(attackerConnectedContract.withdraw()).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner"); //SHOULD NOT = pass
                // Other account tries to call withdraw(), automatically gets reverted!
            })


            it("CheaperWithdraw testing...", async function() {
                // Arrange
                const accounts = await ethers.getSigners(); // accounts (10 fake ones? - default network hardhat)
                for (let i = 1; i < 6; i++) { //0 = deployer
                    const fundMeConnectedContract = await fundMe.connect(accounts[i]);
                    await fundMeConnectedContract.fund({ value: sendValue })
                }

                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer);
                // Act
                const transactionResponse = await fundMe.cheaperWithdraw();
                const transactionReceipt = await transactionResponse.wait(1);
                const { gasUsed, effectiveGasPrice } = transactionReceipt;
                const gasCost = gasUsed.mul(effectiveGasPrice);
                // Assert
                const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
                
                assert.equal(endingFundMeBalance, 0);
                assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(),
                            endingDeployerBalance.add(gasCost).toString());
                
                // Make sure that the funders are reset properly
                await expect(fundMe.getFunder(0)).to.be.reverted;
                
                for (let i = 1; i < 6; i++) { //0 = deployer - making sure all the mappings are ZERO
                    assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0);
                }
            })
        })
    })






// beforeEach(async function () {
//     simpleStorageFactory = await ethers.getContractFactory("SimpleStorage");
//     simpleStorage = await simpleStorageFactory.deploy();
// })