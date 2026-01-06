// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DocumentRegistry {
    // Event to notify frontend when a document is stored
    event DocumentStored(address indexed owner, string ipfsHash, uint256 timestamp);

    // Store mapping of IPFS hash to Owner Address
    mapping(string => address) public documents;

    function storeDocument(string memory _ipfsHash) public {
        // Optional: Check if document already exists
        require(documents[_ipfsHash] == address(0), "Document already exists on-chain.");

        documents[_ipfsHash] = msg.sender;
        
        emit DocumentStored(msg.sender, _ipfsHash, block.timestamp);
    }

    function verifyDocument(string memory _ipfsHash) public view returns (address) {
        return documents[_ipfsHash];
    }
}