// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./xpNFT.sol";

contract ZetaXP_V2 is ZetaXP {
    bytes32 internal constant SETLEVEL_TYPEHASH =
        keccak256("SetLevel(uint256 tokenId,uint256 signatureExpiration,uint256 sigTimestamp,uint256 level)");

    struct SetLevelData {
        uint256 tokenId;
        bytes signature;
        uint256 signatureExpiration;
        uint256 sigTimestamp;
        uint256 level;
    }

    mapping(uint256 => uint256) public levelByTokenId;

    // Event for Level Set
    event LevelSet(address indexed sender, uint256 indexed tokenId, uint256 level);

    function version() public pure override returns (string memory) {
        return "2.0.0";
    }

    function _verifyUpdateNFTSignature(uint256 tokenId, UpdateData memory updateData) internal view {
        _verify(tokenId, updateData);
    }

    function _verifySetLevelSignature(SetLevelData memory data) internal view {
        bytes32 structHash = keccak256(
            abi.encode(SETLEVEL_TYPEHASH, data.tokenId, data.signatureExpiration, data.sigTimestamp, data.level)
        );
        bytes32 constructedHash = _hashTypedDataV4(structHash);

        if (!SignatureChecker.isValidSignatureNow(signerAddress, constructedHash, data.signature)) {
            revert InvalidSigner();
        }

        if (block.timestamp > data.signatureExpiration) revert SignatureExpired();
        if (data.sigTimestamp <= lastUpdateTimestampByTokenId[data.tokenId]) revert OutdatedSignature();
    }

    function setLevel(SetLevelData memory data) external {
        _verifySetLevelSignature(data);

        levelByTokenId[data.tokenId] = data.level;
        lastUpdateTimestampByTokenId[data.tokenId] = data.sigTimestamp;
        emit LevelSet(msg.sender, data.tokenId, data.level);
    }

    function getLevel(uint256 tokenId) external view returns (uint256) {
        return levelByTokenId[tokenId];
    }

    function totalSupply() external view returns (uint256) {
        return _currentTokenId - 1;
    }
}
