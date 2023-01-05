// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.7;

library BytesHelperLib {
    function bytesToAddress(bytes calldata data, uint256 offset) internal pure returns (address output) {
        bytes memory b = data[offset:offset + 20];
        assembly {
            output := mload(add(b, 20))
        }
    }

    function bytesToUint32(bytes calldata data, uint256 offset) internal pure returns (uint32 output) {
        bytes memory b = data[offset:offset + 4];
        assembly {
            output := mload(add(b, 4))
        }
    }

    function addressToBytes(address someAddress) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(someAddress)));
    }
}
