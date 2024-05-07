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

    struct Data {
        uint256 xpTotal;
        uint256 level;
        uint256 testnetCampaignParticipant;
        uint256 enrollDate;
        uint256 mintDate;
        uint256 generation;
    }

    mapping(uint256 => Data) public data;
    mapping(uint256 => mapping(uint256 => Task)) public tasks;

    // Base URL for NFT images
    string public baseTokenURI;
    address public signerAddress;

    // Event for New Mint
    event NewNFTMinted(address indexed sender, uint256 indexed tokenId);
    // Event for NFT Update
    event NFTUpdated(address indexed sender, uint256 indexed tokenId);

    error InvalidSigner();
    error LengthMismatch();

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

    function _verify(
        address to,
        uint256 tokenId,
        Data memory data_,
        uint256[] calldata taskIds,
        Task[] calldata taskValues,
        Signature calldata signature
    ) private view {
        bytes32 payloadHash = _calculateHash(to, tokenId, data_, taskIds, taskValues);
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", payloadHash));

        address messageSigner = ecrecover(messageHash, signature.v, signature.r, signature.s);

        if (signerAddress != messageSigner) revert InvalidSigner();
    }

    // Function to compute the hash of the data and tasks for a token
    function _calculateHash(
        address to,
        uint256 tokenId,
        Data memory data_,
        uint256[] memory taskIds,
        Task[] memory taskValues
    ) private pure returns (bytes32) {
        bytes memory encodedData = abi.encode(
            to,
            tokenId,
            data_.xpTotal,
            data_.level,
            data_.testnetCampaignParticipant,
            data_.enrollDate,
            data_.mintDate,
            data_.generation
        );

        for (uint256 i = 0; i < taskIds.length; i++) {
            encodedData = abi.encode(encodedData, taskIds[i], taskValues[i].completed, taskValues[i].count);
        }

        return keccak256(encodedData);
    }

    function _updateNFT(
        address to,
        uint256 tokenId,
        Data memory data_,
        uint256[] calldata taskIds,
        Task[] calldata taskValues,
        Signature calldata signature
    ) internal {
        _verify(to, tokenId, data_, taskIds, taskValues, signature);
        if (taskIds.length != taskValues.length) revert LengthMismatch();

        data[tokenId] = data_;
        for (uint256 i = 0; i < taskIds.length; i++) {
            tasks[tokenId][taskIds[i]] = taskValues[i];
        }
    }

    // External mint function
    function mintNFT(
        address to,
        uint256 tokenId,
        Data memory data_,
        uint256[] calldata taskIds,
        Task[] calldata taskValues,
        Signature calldata signature
    ) external {
        _mint(to, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked(baseTokenURI, _uint2str(tokenId))));

        _updateNFT(to, tokenId, data_, taskIds, taskValues, signature);

        emit NewNFTMinted(to, tokenId);
    }

    // External mint function
    function updateNFT(
        address to,
        uint256 tokenId,
        Data memory data_,
        uint256[] calldata taskIds,
        Task[] calldata taskValues,
        Signature calldata signature
    ) external {
        _updateNFT(to, tokenId, data_, taskIds, taskValues, signature);

        emit NFTUpdated(to, tokenId);
    }

    // Set the base URI for tokens
    function setBaseURI(string calldata _uri) external onlyOwner {
        baseTokenURI = _uri;
    }
}
