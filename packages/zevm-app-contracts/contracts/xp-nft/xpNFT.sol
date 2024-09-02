// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

contract ZetaXP is ERC721Upgradeable, Ownable2StepUpgradeable, EIP712Upgradeable {
    bytes32 private constant MINTORUPDATE_TYPEHASH =
        keccak256("MintOrUpdateNFT(address to,uint256 signatureExpiration,uint256 sigTimestamp,bytes32 tag)");

    struct UpdateData {
        address to;
        bytes signature;
        uint256 signatureExpiration;
        uint256 sigTimestamp;
        bytes32 tag;
    }

    mapping(uint256 => uint256) public lastUpdateTimestampByTokenId;
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
    // Event for Signer Update
    event SignerUpdated(address indexed signerAddress);
    // Event for Base URI Update
    event BaseURIUpdated(string baseURI);

    error InvalidSigner();
    error SignatureExpired();
    error InvalidAddress();
    error LengthMismatch();
    error TransferNotAllowed();
    error OutdatedSignature();
    error TagAlreadyHoldByUser();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name,
        string memory symbol,
        string memory baseTokenURI_,
        address signerAddress_,
        address owner
    ) public initializer {
        if (signerAddress_ == address(0)) revert InvalidAddress();
        __EIP712_init("ZetaXP", "1");
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

    // Internal function to set the signer address
    function setSignerAddress(address signerAddress_) external onlyOwner {
        if (signerAddress_ == address(0)) revert InvalidAddress();
        signerAddress = signerAddress_;
        emit SignerUpdated(signerAddress_);
    }

    // Set the base URI for tokens
    function setBaseURI(string calldata _uri) external onlyOwner {
        baseTokenURI = _uri;
        emit BaseURIUpdated(_uri);
    }

    // The following functions are overrides required by Solidity.
    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable) returns (string memory) {
        _requireMinted(tokenId);

        return string(abi.encodePacked(baseTokenURI, Strings.toString(tokenId)));
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _verify(uint256 tokenId, UpdateData memory updateData) private view {
        bytes32 structHash = keccak256(
            abi.encode(
                MINTORUPDATE_TYPEHASH,
                updateData.to,
                updateData.signatureExpiration,
                updateData.sigTimestamp,
                updateData.tag
            )
        );
        bytes32 constructedHash = _hashTypedDataV4(structHash);

        if (!SignatureChecker.isValidSignatureNow(signerAddress, constructedHash, updateData.signature)) {
            revert InvalidSigner();
        }

        if (block.timestamp > updateData.signatureExpiration) revert SignatureExpired();
        if (updateData.sigTimestamp <= lastUpdateTimestampByTokenId[tokenId]) revert OutdatedSignature();
    }

    function _updateNFT(uint256 tokenId, UpdateData memory updateData) internal {
        _verify(tokenId, updateData);
        lastUpdateTimestampByTokenId[tokenId] = updateData.sigTimestamp;
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
        bool willUpdateTag = tagByTokenId[tokenId] != updateData.tag;

        if (willUpdateTag) {
            if (tokenByUserTag[owner][updateData.tag] != 0) revert TagAlreadyHoldByUser();
            tokenByUserTag[owner][tagByTokenId[tokenId]] = 0;
        }

        _updateNFT(tokenId, updateData);

        emit NFTUpdated(owner, tokenId, updateData.tag);
    }

    function _transfer(address from, address to, uint256 tokenId) internal override {
        revert TransferNotAllowed();
    }
}
