// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    
    function getPrice(AggregatorV3Interface priceFeed) internal view returns (uint256) {
        // (uint80 roundId, int price, uint startedAt, uint timeStamp, uint80 answeredInRound) = priceFeed.latestRoundData();
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return uint256(price * 1e10); // 1**10 == 10000000000
    }

    // function getVersion() internal view returns (uint256) {
    //     AggregatorV3Interface priceFeed = AggregatorV3Interface(
    //         0x694AA1769357215DE4FAC081bf1f309aDC325306
    //     );
    //     return priceFeed.version();
    // }

    function getConversionRate(uint256 ethAmount, AggregatorV3Interface priceFeed) internal view returns (uint256) {
        // CONVERTS TO Sepolia USD
        uint256 ethPrice = getPrice(priceFeed);
        // 3000_000000000000000000 = ETH / USD price
        // 1_000000000000000000 ETH
        // = $3000

        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18;
        return ethAmountInUsd;
    }
}
