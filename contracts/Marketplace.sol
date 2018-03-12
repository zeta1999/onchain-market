pragma solidity ^0.4.19;

import "./EscrowAgent.sol";

contract Marketplace {

    address owner;
    address escrowAgentAddress;

    event CreatedListing(bytes32 listingHash);
    event ListingPurchased(bytes32 listingHash);

    struct Listing {
        bool available;
        address seller;
        string name;
        uint price;
        uint index;
        bytes32 escrowHash;
    }

    mapping (bytes32 => Listing) private listings;
    bytes32[] private listingIndex;

    function Marketplace(address escrowAddress) public {
        owner = msg.sender;
        escrowAgentAddress = escrowAddress;

        insertListing(keccak256(msg.sender, "listing 1", 1, now), msg.sender, "listing 1", 1 ether);
        insertListing(keccak256(msg.sender, "listing 2", 2, now), msg.sender, "listing 2", 2 ether);
        insertListing(keccak256(msg.sender, "listing 3", 3, now), msg.sender, "listing 3", 3 ether);
        listings[listingIndex[2]].available = false;
    }

    function isListing(bytes32 listingHash) public view returns (bool isIndeed) {
        if (listingIndex.length == 0) {
            return false;
        }
        return (listingIndex[listings[listingHash].index] == listingHash);
    }

    function insertListing(bytes32 listingHash, address seller, string name, uint price) private returns (uint index) {
        require(!isListing(listingHash));

        listings[listingHash].available = true;
        listings[listingHash].seller = seller;
        listings[listingHash].name = name;
        listings[listingHash].price = price;
        listings[listingHash].index = listingIndex.push(listingHash) - 1;
        CreatedListing(listingHash);
        return listingIndex.length - 1;
    }

    function getListingAtIndex(uint index) public view returns (bytes32 listingHash) {
        return listingIndex[index];
    }

    function getListing(bytes32 listingHash) public view returns (bool available, address seller, string name, uint price, uint index, bytes32 escrowHash) {
        require(isListing(listingHash));
        Listing storage listing = listings[listingHash];
        return(listing.available, listing.seller, listing.name, listing.price, listing.index, listing.escrowHash);
    }

    function getListingEscrow(bytes32 listingHash) public view returns(bool active, address seller, address buyer, uint balance, bool isBuyerApproved, bool isSellerApproved, bool isDisputed) {
        require(isListing(listingHash));
        require(listings[listingHash].escrowHash != 0x0000000000000000000000000000000000000000000000000000000000000000);
        EscrowAgent escrowAgent = EscrowAgent(escrowAgentAddress);
        return escrowAgent.escrows(listings[listingHash].escrowHash);
    }

    function getListingCount() public view returns (uint count) {
        return listingIndex.length;
    }

    function addListing(string name, uint price) public returns (bytes32 listingHash){
        listingHash = keccak256(msg.sender, name, price, now);
        insertListing(listingHash, msg.sender, name, price);
        return listingHash;
    }

    function purchaseListing(bytes32 listingHash) payable public returns (bytes32 escrowHash) {
        require(isListing(listingHash));
        Listing storage listing = listings[listingHash];
        require(msg.value == listing.price);
        EscrowAgent escrowAgent = EscrowAgent(escrowAgentAddress);
        escrowHash = escrowAgent.createEscrow.value(msg.value)(listing.seller, msg.sender);
        listing.escrowHash = escrowHash;
        listing.available = false;
        ListingPurchased(listingHash);
        return escrowHash;
    }
}