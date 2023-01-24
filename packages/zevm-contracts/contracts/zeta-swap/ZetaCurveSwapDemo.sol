// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../interfaces/IZRC20.sol";
import "../interfaces/zContract.sol";

interface ICRV3 {
    function exchange(uint256 i, uint256 j, uint256 dx, uint256 min_dy, bool use_eth) external returns (uint256);
}

interface ZetaCurveSwapErrors {
    error WrongGasContract();

    error NotEnoughToPayGasFee();

    error InvalidAddress();
}

contract ZetaCurveSwapDemo is zContract, ZetaCurveSwapErrors {
    address public crv3pool; // gETH/tBNB/tMATIC pool
    address[3] public crvZRC20s;

    constructor(address crv3pool_, address[3] memory ZRC20s_) {
        if (crv3pool_ == address(0) || ZRC20s_[0] == address(0) || ZRC20s_[1] == address(0) || ZRC20s_[2] == address(0))
            revert InvalidAddress();
        crv3pool = crv3pool_;
        crvZRC20s = ZRC20s_;
    }

    function encode(address zrc20, address recipient, uint256 minAmountOut) public pure returns (bytes memory) {
        return abi.encode(zrc20, recipient, minAmountOut);
    }

    function addr2idx(address zrc20) public view returns (uint256) {
        for (uint256 i = 0; i < 3; i++) {
            if (crvZRC20s[i] == zrc20) {
                return i;
            }
        }
        return 18;
    }

    function _doWithdrawal(address targetZRC20, uint256 amount, bytes32 receipient) private {
        (address gasZRC20, uint256 gasFee) = IZRC20(targetZRC20).withdrawGasFee();

        if (gasZRC20 != targetZRC20) revert WrongGasContract();
        if (gasFee >= amount) revert NotEnoughToPayGasFee();

        IZRC20(targetZRC20).approve(targetZRC20, gasFee);
        IZRC20(targetZRC20).withdraw(abi.encodePacked(receipient), amount - gasFee);
    }

    function onCrossChainCall(address zrc20, uint256 amount, bytes calldata message) external override {
        (address targetZRC20, bytes32 receipient, ) = abi.decode(message, (address, bytes32, uint256));

        address[] memory path = new address[](2);
        path[0] = zrc20;
        path[1] = targetZRC20;
        IZRC20(zrc20).approve(address(crv3pool), amount);

        uint256 i = addr2idx(zrc20);
        uint256 j = addr2idx(targetZRC20);
        require(i >= 0 && i < 3 && j >= 0 && j < 3 && i != j, "i,j error");

        uint256 outAmount = ICRV3(crv3pool).exchange(i, j, amount, 0, false);

        _doWithdrawal(targetZRC20, outAmount, receipient);
    }
}
