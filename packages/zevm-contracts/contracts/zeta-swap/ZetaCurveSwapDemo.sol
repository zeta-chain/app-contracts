// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../interfaces/IZRC4.sol";
import "../interfaces/zContract.sol";

interface ICRV3 {
    function exchange(
        uint256 i,
        uint256 j,
        uint256 dx,
        uint256 min_dy,
        bool use_eth
    ) external returns (uint256);
}

interface ZetaCurveSwapErrors {
    error WrongGasContract();

    error NotEnoughToPayGasFee();
}

contract ZetaCurveSwapDemo is zContract, ZetaCurveSwapErrors {
    address public crv3pool; // gETH/tBNB/tMATIC pool
    address[3] public crvZrc4s;

    constructor(address crv3pool_, address[3] memory zrc4s_) {
        crv3pool = crv3pool_;
        crvZrc4s = zrc4s_;
    }

    function encode(
        address zrc4,
        address recipient,
        uint256 minAmountOut
    ) public pure returns (bytes memory) {
        return abi.encode(zrc4, recipient, minAmountOut);
    }

    function addr2idx(address zrc4) public view returns (uint256) {
        for (uint256 i = 0; i < 3; i++) {
            if (crvZrc4s[i] == zrc4) {
                return i;
            }
        }
        return 18;
    }

    function doWithdrawal(
        address targetZRC4,
        uint256 amount,
        bytes32 receipient
    ) private {
        (address gasZRC4, uint256 gasFee) = IZRC4(targetZRC4).withdrawGasFee();

        if (gasZRC4 != targetZRC4) revert WrongGasContract();
        if (gasFee >= amount) revert NotEnoughToPayGasFee();

        IZRC4(targetZRC4).approve(targetZRC4, gasFee);
        IZRC4(targetZRC4).withdraw(receipient, amount - gasFee);
    }

    function onCrossChainCall(
        address zrc4,
        uint256 amount,
        bytes calldata message
    ) external override {
        (address targetZRC4, bytes32 receipient, uint256 minAmountOut) = abi.decode(
            message,
            (address, bytes32, uint256)
        );

        address[] memory path = new address[](2);
        path[0] = zrc4;
        path[1] = targetZRC4;
        IZRC4(zrc4).approve(address(crv3pool), amount);

        uint256 i = addr2idx(zrc4);
        uint256 j = addr2idx(targetZRC4);
        require(i >= 0 && i < 3 && j >= 0 && j < 3 && i != j, "i,j error");

        uint256 outAmount = ICRV3(crv3pool).exchange(i, j, amount, 0, false);

        doWithdrawal(targetZRC4, outAmount, receipient);
    }
}
