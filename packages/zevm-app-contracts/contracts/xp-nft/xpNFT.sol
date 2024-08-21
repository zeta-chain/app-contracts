// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ZetaXP is ERC721Upgradeable, OwnableUpgradeable {
    /* An ECDSA signature. */
    struct Signature {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct UpdateData {
        address to;
        Signature signature;
        uint256 sigTimestamp;
        uint256 signedUp;
        bytes32 tag;
    }

    mapping(uint256 => uint256) public lastUpdateTimestampByTokenId;
    mapping(uint256 => uint256) public signedUpByTokenId;
    mapping(uint256 => bytes32) public tagByTokenId;
    mapping(address => mapping(bytes32 => uint256)) public tokenByUserTag;

    // Base URL for NFT images
    string public baseTokenURI;
    address public signerAddress;

    // Counter for the next token ID
    uint256 private _currentTokenId;

    // Event for New Mint
    event NFTMinted(address indexed sender, uint256 indexed tokenId, bytes32 tag);
    // Event for NFT Update
    event NFTUpdated(address indexed sender, uint256 indexed tokenId, bytes32 tag);

    error InvalidSigner();
    error InvalidAddress();
    error LengthMismatch();
    error TransferNotAllowed();
    error OutdatedSignature();
    error TagAlreadyHoldByUser();

    function initialize(
        string memory name,
        string memory symbol,
        string memory baseTokenURI_,
        address signerAddress_,
        address owner
    ) public initializer {
        if (signerAddress_ == address(0)) revert InvalidAddress();
        __ERC721_init(name, symbol);
        __Ownable_init();
        transferOwnership(owner);
        baseTokenURI = baseTokenURI_;
        signerAddress = signerAddress_;
        _currentTokenId = 1; // Start token IDs from 1
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

    function _verify(uint256 tokenId, UpdateData memory updateData) private view {
        bytes32 payloadHash = _calculateHash(updateData);

        bytes32 messageHash = ECDSA.toEthSignedMessageHash(payloadHash);

        address messageSigner = ECDSA.recover(
            messageHash,
            updateData.signature.v,
            updateData.signature.r,
            updateData.signature.s
        );

        if (signerAddress != messageSigner) revert InvalidSigner();
        if (updateData.sigTimestamp <= lastUpdateTimestampByTokenId[tokenId]) revert OutdatedSignature();
    }

    // Function to compute the hash of the data and tasks for a token
    function _calculateHash(UpdateData memory updateData) private pure returns (bytes32) {
        bytes memory encodedData = abi.encode(
            updateData.to,
            updateData.sigTimestamp,
            updateData.signedUp,
            updateData.tag
        );

        return keccak256(encodedData);
    }

    function _updateNFT(uint256 tokenId, UpdateData memory updateData) internal {
        _verify(tokenId, updateData);
        lastUpdateTimestampByTokenId[tokenId] = updateData.sigTimestamp;
        signedUpByTokenId[tokenId] = updateData.signedUp;
        tagByTokenId[tokenId] = updateData.tag;
        tokenByUserTag[updateData.to][updateData.tag] = tokenId;
    }

    // External mint function with auto-incremented token ID
    function mintNFT(UpdateData memory mintData) external {
        uint256 newTokenId = _currentTokenId;
        _mint(mintData.to, newTokenId);

        if (tokenByUserTag[mintData.to][mintData.tag] != 0) revert TagAlreadyHoldByUser();
        _updateNFT(newTokenId, mintData);

        emit NFTMinted(mintData.to, newTokenId, mintData.tag);

        _currentTokenId++; // Increment the token ID for the next mint
    }

    // External update function
    function updateNFT(uint256 tokenId, UpdateData memory updateData) external {
        address owner = ownerOf(tokenId);
        updateData.to = owner;
        if (tokenByUserTag[owner][updateData.tag] != tokenId) revert TagAlreadyHoldByUser();
        _updateNFT(tokenId, updateData);

        emit NFTUpdated(owner, tokenId, updateData.tag);
    }

    // Set the base URI for tokens
    function setBaseURI(string calldata _uri) external onlyOwner {
        baseTokenURI = _uri;
    }

    function _transfer(address from, address to, uint256 tokenId) internal override {
        revert TransferNotAllowed();
    }
}
