// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract ZetaXP is ERC721Upgradeable, OwnableUpgradeable {
    /* An ECDSA signature. */
    struct Signature {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct UpdateData {
        address to;
        uint256 tokenId;
        Signature signature;
        uint256 sigTimestamp;
        uint256 signedUp;
    }

    mapping(uint256 => uint256) lastUpdateTimestampByTokenId;
    mapping(uint256 => uint256) signedUpByTokenId;

    // Base URL for NFT images
    string public baseTokenURI;
    address public signerAddress;

    // Event for New Mint
    event NFTMinted(address indexed sender, uint256 indexed tokenId);
    // Event for NFT Update
    event NFTUpdated(address indexed sender, uint256 indexed tokenId);

    error InvalidSigner();
    error LengthMismatch();
    error TransferNotAllowed();
    error OutdatedSignature();

    function initialize(
        string memory name,
        string memory symbol,
        string memory baseTokenURI_,
        address signerAddress_
    ) public initializer {
        __ERC721_init(name, symbol);
        __Ownable_init();
        baseTokenURI = baseTokenURI_;
        signerAddress = signerAddress_;
    }

    function version() public pure virtual returns (string memory) {
        return "1.0.0";
    }

    // The following functions are overrides required by Solidity.
    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable) returns (string memory) {
        _requireMinted(tokenId);

        return string(abi.encodePacked(baseTokenURI, _uint2str(tokenId)));
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable) returns (bool) {
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
        bytes memory encodedData = abi.encode(
            updateData.to,
            updateData.tokenId,
            updateData.sigTimestamp,
            updateData.signedUp
        );

        return keccak256(encodedData);
    }

    function _updateNFT(UpdateData memory updateData) internal {
        _verify(updateData);
        lastUpdateTimestampByTokenId[updateData.tokenId] = updateData.sigTimestamp;
        signedUpByTokenId[updateData.tokenId] = updateData.signedUp;
    }

    // External mint function
    function mintNFT(UpdateData calldata mintData) external {
        _mint(mintData.to, mintData.tokenId);

        _updateNFT(mintData);

        emit NFTMinted(mintData.to, mintData.tokenId);
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
