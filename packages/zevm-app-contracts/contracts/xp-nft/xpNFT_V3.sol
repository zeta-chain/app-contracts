// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./xpNFT_V2.sol";

contract ZetaXP_V3 is ZetaXP_V2 {
    event TagUpdated(address indexed sender, uint256 indexed tokenId, bytes32 tag);

    function version() public pure override returns (string memory) {
        return "3.0.0";
    }

    function _transfer(address from, address to, uint256 tokenId) internal override {
        bytes32 tag = tagByTokenId[tokenId];
        if (tag != 0) {
            tokenByUserTag[from][tag] = 0;
        }
        if (tokenByUserTag[to][tag] == 0) {
            tokenByUserTag[to][tag] = tokenId;
        }
        ERC721Upgradeable._transfer(from, to, tokenId);
    }

    function moveTagToToken(uint256 tokenId, bytes32 tag) external {
        uint256 currentTokenId = tokenByUserTag[msg.sender][tag];
        address owner = ownerOf(tokenId);
        if (owner != msg.sender) {
            revert TransferNotAllowed();
        }
        if (currentTokenId == tokenId) {
            return;
        }
        if (currentTokenId != 0) {
            tagByTokenId[currentTokenId] = 0;
        }

        tagByTokenId[tokenId] = tag;
        tokenByUserTag[msg.sender][tag] = tokenId;
        emit TagUpdated(msg.sender, tokenId, tag);
    }
}
