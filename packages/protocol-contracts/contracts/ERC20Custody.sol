// SPDX-License-Identifier: MIT
// v1.0, 2023-01-10
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title ERC20Custody.
/// @notice ERC20Custody for depositing ERC20 assets into ZetaChain and making operations with them.
contract ERC20Custody {
    using SafeERC20 for IERC20;

    error NotWhitelisted();
    error NotPaused();
    error InvalidSender();
    error InvalidTSSUpdater();
    error ZeroAddress();
    error IsPaused();
    error ZetaMaxFeeExceeded();
    error ZeroFee();

    /// @notice If custody operations are paused.
    bool public paused;
    /// @notice TSSAddress is the TSS address collectively possessed by Zeta blockchain validators. 
    address public TSSAddress; 
    /// @notice Threshold Signature Scheme (TSS) [GG20] is a multi-sig ECDSA/EdDSA protocol. 
    address public TSSAddressUpdater;
    /// @notice Current zeta fee for depositing funds into ZetaChain.
    uint256 public zetaFee;
    /// @notice Maximum zeta fee for transaction.
    uint256 immutable public zetaMaxFee;
    /// @notice Zeta ERC20 token 
    IERC20 immutable public zeta;
    /// @notice Mapping of whitelisted token => true/false
    mapping(IERC20 => bool) public whitelisted;
    
    event Paused(address sender);
    event Unpaused(address sender);
    event Whitelisted(IERC20 indexed asset);
    event Unwhitelisted(IERC20 indexed asset);
    event Deposited(bytes recipient, IERC20 indexed asset, uint256 amount, bytes message);
    event Withdrawn(address indexed recipient, IERC20 indexed asset, uint256 amount);
    event RenouncedTSSUpdater(address tssAddressUpdater);

    /**
     * @dev Only TSS address allowed modifier.
     */
    modifier onlyTSS() {
        if (msg.sender != TSSAddress) {
            revert InvalidSender();
        }
        _;
    }

    /**
     * @dev Only TSS address updater allowed modifier.
     */
    modifier onlyTSSUpdater() {
        if (msg.sender != TSSAddressUpdater) {
            revert InvalidTSSUpdater();
        }
        _;
    }

    constructor(address TSSAddress_, address TSSAddressUpdater_, uint256 zetaFee_, uint256 zetaMaxFee_, IERC20 zeta_) {       
        TSSAddress = TSSAddress_; 
        TSSAddressUpdater = TSSAddressUpdater_;
        zetaFee = zetaFee_;
        zeta = zeta_;
        zetaMaxFee = zetaMaxFee_;
    }

    /**
     * @dev Update the TSSAddress in case of Zeta blockchain validator nodes churn
     * @param TSSAddress_, new tss address
     */
    function updateTSSAddress(address TSSAddress_) external onlyTSSUpdater {
        if (TSSAddress_ == address(0)) {
            revert ZeroAddress();
        }
        TSSAddress = TSSAddress_;
    }

    /**
     * @dev Update zeta fee
     * @param zetaFee_, new zeta fee
     */
    function updateZetaFee(uint256 zetaFee_) external {
        if (msg.sender != TSSAddress) {
            revert InvalidSender();
        }
        if (zetaFee_ == 0) {
            revert ZeroFee();
        }
        if (zetaFee_ > zetaMaxFee) {
            revert ZetaMaxFeeExceeded();
        }
        zetaFee = zetaFee_;
    }

    /**
     * @dev Change the ownership of TSSAddressUpdater to the Zeta blockchain TSS nodes.
     * Effectively, only Zeta blockchain validators collectively can update TSSAddress afterwards.
     */
    function renounceTSSAddressUpdater() external onlyTSSUpdater {
        if (TSSAddress == address(0)) {
            revert ZeroAddress();
        }
        TSSAddressUpdater = TSSAddress;
        emit RenouncedTSSUpdater(msg.sender);
    }

    /**
     * @dev Pause custody operations.
     */
    function pause() external onlyTSSUpdater {
        if (paused) {
            revert IsPaused();
        }
        if (TSSAddress == address(0)) {
            revert ZeroAddress();
        }
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @dev Unpause custody operations.
     */
    function unpause() external onlyTSSUpdater {
        if (!paused) {
            revert NotPaused();
        }
        paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @dev Whitelist asset
     * @param asset, ERC20 asset
     */
    function whitelist(IERC20 asset) external onlyTSS {
        whitelisted[asset] = true;
        emit Whitelisted(asset);
    }

    /**
     * @dev Unwhitelist asset
     * @param asset, ERC20 asset
     */
    function unwhitelist(IERC20 asset) external onlyTSS {
        whitelisted[asset] = false;
        emit Unwhitelisted(asset);
    }

    /**
     * @dev Deposit asset amount to recipient with message that encodes additional zetachain evm call or message.
     * @param recipient, recipient address
     * @param asset, ERC20 asset
     * @param amount, asset amount
     * @param message, bytes message or encoded zetechain call.
     */
    function deposit(bytes calldata recipient, IERC20 asset, uint256 amount, bytes calldata message) external {
        if (paused) {
            revert IsPaused();
        }
        if (!whitelisted[asset]) {
            revert NotWhitelisted();
        }
        if (zetaFee != 0 && address(zeta) != address(0)) {
            zeta.transferFrom(msg.sender, TSSAddress, zetaFee);
        }
        asset.transferFrom(msg.sender, address(this), amount);
        emit Deposited(recipient, asset, amount, message);
    }

    /**
     * @dev Withdraw asset amount to recipient by custody TSS owner.
     * @param recipient, recipient address
     * @param asset, ERC20 asset
     * @param amount, asset amount
     */
    function withdraw(address recipient, IERC20 asset, uint256 amount) external onlyTSS {
        if (paused) {
            revert IsPaused();
        }
        if (msg.sender != TSSAddress) {
            revert InvalidSender();
        }
        if (!whitelisted[asset]) {
            revert NotWhitelisted();
        }
        IERC20(asset).transfer(recipient, amount);
        emit Withdrawn(recipient, asset, amount);
    }
}
