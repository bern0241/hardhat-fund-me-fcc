// Get funds from users
// Withdraw fundss
// Set a minimum funding value in USD

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;
// imports
import "./PriceConverter.sol";
// Error Codes
error FundMe__NotOwner();

// Interfaces, Libaries, Contracts

/** @title A contract for crowd funding
 *  @author Justin Bernard
 *  @notice This contract is to demo a sample funding contract
 *  @dev This implements price feeds as our library
 */
contract FundMe {
    // Type Declarations
    using PriceConverter for uint256;

    // State Variables!
    uint256 public constant MINIMUM_USD = 50 * 1e18; // 1 * 10 ** 18
    // 351 gas - constant
    // 2451 gas - non-constant
    address[] private s_funders; // donators
    mapping(address => uint256) private s_addressToAmountFunded;
    address private immutable i_owner;
    // immutable gas - 444
    // non-immutable gas - 2580
    AggregatorV3Interface private s_priceFeed;

    modifier onlyOwner() {
        //require(msg.sender == i_owner, "Sender is not owner!"); //gets called BEFORE function executes (put in function line)
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    // Functions Order:
    //// constructor
    //// receive
    //// fallback
    //// external
    //// public
    //// internal
    //// private
    //// view / pure

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // What happens if someone ends this contract ETH without calling the fund function
    // receive() external payable {
    //     fund();
    // }
    // fallback() external payable {
    //     fund();
    // }

    /** 
     *  @notice This function funds this contract
     *  @dev This implements price feeds as our library
     */
    function fund() public payable {
        // Want to be able to set a minimum fund amount in USD
        // msg.value.getConversionRate();
        // require (getConversionRate(msg.value) >= minimumUsd, "Didn't send enough!"); // 1e18 = 1 * 10 ** 18 == 1000000000000000000
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Didn't send enough!"
        );
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public payable onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            // code
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        // reset the array
        s_funders = new address[](0);
        // actually withdraw the funds

        // transfer - throws error
        // payable(msg.sender).transfer(address(this).balance);
        // send - sends boolean
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");
        // call
        // (bool callSuccess, bytes memory dataReturned) = payable(msg.sender).call{value: address(this).balance}("");
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }(""); //USE THIS!
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders; //memory = a lot cheaper
        // mappings can't be in memory, sorry!
        for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }


    // View / Pure

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
