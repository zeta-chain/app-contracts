// SPDX-License-Identifier: GPL-3.0

/*
 *
 * #####    ##   #    #  ####  ######   ##      #####  #####   ####  #####  ####   ####   ####  #
 * #    #  #  #  ##   # #    # #       #  #     #    # #    # #    #   #   #    # #    # #    # #
 * #    # #    # # #  # #      #####  #    #    #    # #    # #    #   #   #    # #      #    # #
 * #####  ###### #  # # #  ### #      ######    #####  #####  #    #   #   #    # #      #    # #
 * #      #    # #   ## #    # #      #    #    #      #   #  #    #   #   #    # #    # #    # #
 * #      #    # #    #  ####  ###### #    #    #      #    #  ####    #    ####   ####   ####  ######
 *
 */

pragma solidity >=0.8.0;

interface IPoolRouter {
    struct ExactInputSingleParams {
        address tokenIn; /// @dev the input token address. If tokenIn is address(0), msg.value will be wrapped and used as input token
        uint256 amountIn; /// @dev The amount of input tokens to send
        uint256 amountOutMinimum; /// @dev minimum required amount of output token after swap
        address pool; /// @dev pool address to swap
        address to; /// @dev address to receive
        bool unwrap; /// @dev unwrap if output token is wrapped klay
    }

    struct ExactInputParams {
        address tokenIn; /// @dev the token address to swap-in. If tokenIn is address(0), msg.value will be wrapped and used as input token
        uint256 amountIn; /// @dev The amount of input tokens to send.
        uint256 amountOutMinimum; /// @dev minimum required amount of output token after swap
        address[] path; /// @dev An array of pool addresses to pass through
        address to; /// @dev recipient of the output tokens
        bool unwrap; /// @dev unwrap if output token is wrapped klay
    }

    struct ExactOutputSingleParams {
        address tokenIn; /// @dev the input token address. If tokenIn is address(0), msg.value will be wrapped and used as input token
        uint256 amountOut; /// @dev The amount of output tokens to receive
        uint256 amountInMaximum; /// @dev maximum available amount of input token after swap
        address pool; /// @dev pool address to swap
        address to; /// @dev address to receive
        bool unwrap; /// @dev unwrap if output token is wrapped klay
    }

    struct ExactOutputParams {
        address tokenIn; /// @dev the token address to swap-in. If tokenIn is address(0), msg.value will be wrapped and used as input token
        uint256 amountOut; /// @dev The amount of output tokens to receive
        uint256 amountInMaximum; /// @dev  maximum available amount of input token after swap
        address[] path; /// @dev An array of pool addresses to pass through
        address to; /// @dev recipient of the output tokens
        bool unwrap; /// @dev unwrap if output token is wrapped klay
    }

    /// @notice Swap amountIn of one token for as much as possible of another token
    /// @param params The parameters necessary for the swap, encoded as ExactInputSingleParams in calldata
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);

    /// @notice Swap amountIn of one token for as much as possible of another along the specified path
    /// @param params The parameters necessary for the multi-hop swap, encoded as ExactInputParams in calldata
    function exactInput(ExactInputParams calldata params) external payable returns (uint256 amountOut);

    /// @notice Swaps as little as possible of one token for `amountOut` of another token
    /// @param params The parameters necessary for the swap, encoded as ExactOutputSingleParams in calldata
    function exactOutputSingle(ExactOutputSingleParams calldata params) external payable returns (uint256 amountIn);

    /// @notice Swaps as little as possible of one token for `amountOut` of another along the specified path (reversed)
    /// @param params The parameters necessary for the multi-hop swap, encoded as ExactOutputParams in calldata
    function exactOutput(ExactOutputParams calldata params) external payable returns (uint256 amountIn);

    /// @notice Recover mistakenly sent tokens
    function sweep(
        address token,
        uint256 amount,
        address recipient
    ) external payable;
}
