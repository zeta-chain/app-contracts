// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.7;

library BytesHelperLib {
    function bytesToAddress(bytes calldata data, uint256 offset, uint256 size) public pure returns (address output) {
        bytes memory b = data[offset:offset + size];
        assembly {
            output := mload(add(b, size))
        }
    }

    function bytesToUint32(bytes calldata data, uint256 offset, uint256 size) public pure returns (uint32 output) {
        bytes memory b = data[offset:offset + size];
        assembly {
            output := mload(add(b, size))
        }
    }

    function addressToBytes(address someAddress) public pure returns (bytes32) {
        return bytes32(uint256(uint160(someAddress)));
    }
}
