// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HelloTrial {
    string public greeting;

    event GreetingChanged(string newGreeting);

    constructor(string memory _greeting) {
        greeting = _greeting;
    }

    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
        emit GreetingChanged(_greeting);
    }
}