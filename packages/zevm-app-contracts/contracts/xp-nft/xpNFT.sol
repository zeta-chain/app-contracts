// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZetaXP is ERC721URIStorage, Ownable {
    /* An ECDSA signature. */
    struct Signature {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct Task {
        bool completed;
        uint256 count;
    }

    struct ZetaXPData {
        uint256 xpTotal;
        uint256 level;
        uint256 testnetCampaignParticipant;
        uint256 enrollDate;
        uint256 mintDate;
        uint256 generation;
    }

    struct UpdateData {
        address to;
        uint256 tokenId;
        ZetaXPData xpData;
        uint256[] taskIds;
        Task[] taskValues;
        Signature signature;
        uint256 sigTimestamp;
    }

    mapping(uint256 => ZetaXPData) public zetaXPData;
    mapping(uint256 => mapping(uint256 => Task)) public tasksByTokenId;
    mapping(uint256 => uint256) lastUpdateTimestampByTokenId;

    // Base URL for NFT images
    string public baseTokenURI;
    address public signerAddress;

    // Event for New Mint
    event NewNFTMinted(address indexed sender, uint256 indexed tokenId);
    // Event for NFT Update
    event NFTUpdated(address indexed sender, uint256 indexed tokenId);

    error InvalidSigner();
    error LengthMismatch();
    error TransferNotAllowed();
    error OutdatedSignature();

    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI_,
        address signerAddress_
    ) ERC721(name, symbol) {
        baseTokenURI = baseTokenURI_;
        signerAddress = signerAddress_;
    }

    // The following functions are overrides required by Solidity.

    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Helper function to convert uint to string
    function _uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (uint8(48 + (_i % 10)));
            bstr[k] = bytes1(temp);
            _i /= 10;
        }
        return string(bstr);
    }

    function _verify(UpdateData memory updateData) private view {
        bytes32 payloadHash = _calculateHash(updateData);
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", payloadHash));

        address messageSigner = ecrecover(
            messageHash,
            updateData.signature.v,
            updateData.signature.r,
            updateData.signature.s
        );

        if (signerAddress != messageSigner) revert InvalidSigner();
        if (updateData.sigTimestamp <= lastUpdateTimestampByTokenId[updateData.tokenId]) revert OutdatedSignature();
    }

    // Function to compute the hash of the data and tasks for a token
    function _calculateHash(UpdateData memory updateData) private pure returns (bytes32) {
        ZetaXPData memory xpData = updateData.xpData;
        bytes memory encodedData = abi.encode(
            updateData.to,
            updateData.tokenId,
            updateData.sigTimestamp,
            xpData.xpTotal,
            xpData.level,
            xpData.testnetCampaignParticipant,
            xpData.enrollDate,
            xpData.mintDate,
            xpData.generation
        );

        for (uint256 i = 0; i < updateData.taskIds.length; i++) {
            encodedData = abi.encode(
                encodedData,
                updateData.taskIds[i],
                updateData.taskValues[i].completed,
                updateData.taskValues[i].count
            );
        }

        return keccak256(encodedData);
    }

    function _updateNFT(UpdateData memory updateData) internal {
        _verify(updateData);
        lastUpdateTimestampByTokenId[updateData.tokenId] = updateData.sigTimestamp;
        ZetaXPData memory xpData = updateData.xpData;
        zetaXPData[updateData.tokenId] = xpData;

        if (updateData.taskIds.length != updateData.taskValues.length) revert LengthMismatch();

        zetaXPData[updateData.tokenId] = updateData.xpData;
        for (uint256 i = 0; i < updateData.taskIds.length; i++) {
            tasksByTokenId[updateData.tokenId][updateData.taskIds[i]] = updateData.taskValues[i];
        }
    }

    // External mint function
    function mintNFT(UpdateData calldata mintData) external {
        _mint(mintData.to, mintData.tokenId);
        _setTokenURI(mintData.tokenId, string(abi.encodePacked(baseTokenURI, _uint2str(mintData.tokenId))));

        _updateNFT(mintData);

        emit NewNFTMinted(mintData.to, mintData.tokenId);
    }

    // External mint function
    function updateNFT(UpdateData memory updateData) external {
        address owner = ownerOf(updateData.tokenId);
        updateData.to = owner;
        _updateNFT(updateData);

        emit NFTUpdated(owner, updateData.tokenId);
    }

    // Set the base URI for tokens
    function setBaseURI(string calldata _uri) external onlyOwner {
        baseTokenURI = _uri;
    }

    function _transfer(address from, address to, uint256 tokenId) internal override {
        revert TransferNotAllowed();
    }
}
