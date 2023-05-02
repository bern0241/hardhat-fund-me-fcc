// import
// main function
// calling of main function

// async function deployFunc(hre) {  1
//     console.log("PRAISE JESUS!");
// }

// module.exports.default = deployFunc;

// module.exports = async (hre) => {  2
//     const {geNamedAccounts, deployments} = hre;
//     // hre.getNamedAccount
//     // hre.deployments
// }

const { networkConfig, developmentChains } = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify.js");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    // if chainId is X use address Y
    // if chainId is Z use address A
    // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    let ethUsdPriceFeedAddress;
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    }

    // if the contract doesn't exist, we deploy a minimal version of it for our local testing

    // well what happens wwhen we want to change chains?
    // when going for localhost or hardhat network we wwant to use a mock
    const args = [ethUsdPriceFeedAddress];
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, // put price feed address
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        // verify
        await verify(fundMe.address, args);
    }
    log("---------------------------------------------------------");
}

module.exports.tags = ["all", "fundme"];