pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
contract SimpleVoting {
    mapping(address => bool) public hasVoted;
    mapping(string => uint256) public votes;

    string[] public options;
    string public sessionName;

    constructor(string memory _sessionName, string[] memory _options) {
        sessionName = _sessionName;
        options = _options;
    }

    function vote(string memory option) public {
        require(!hasVoted[msg.sender], "You have already voted!");
        bool validOption = false;
        for (uint i = 0; i < options.length; i++) {
            if (keccak256(abi.encodePacked(options[i])) == keccak256(abi.encodePacked(option))) {
                validOption = true;
                break;
            }
        }
        require(validOption, "Invalid voting option!");
        votes[option]++;
        hasVoted[msg.sender] = true;
    }

    function getVotes(string memory option) public view returns (uint256) {
        return votes[option];
    }

    function getOptions() public view returns (string[] memory) {
        return options;
    }

}
