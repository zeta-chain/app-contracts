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

    constructor(address _TSSAddress, address _TSSAddressUpdater, uint256 _zetaFee, uint256 _zetaMaxFee, IERC20 _zeta) {       
        TSSAddress = _TSSAddress; 
        TSSAddressUpdater = _TSSAddressUpdater;
        zetaFee = _zetaFee;
        zeta = _zeta;
        zetaMaxFee = _zetaMaxFee;
        paused = false;
    }

    /**
     * @dev Update the TSSAddress in case of Zeta blockchain validator nodes churn
     * @param _address, new tss address
     */
    function updateTSSAddress(address _address) external {
        if (msg.sender != TSSAddressUpdater) {
            revert InvalidTSSUpdater();
        }
        if (_address == address(0)) {
            revert ZeroAddress();
        }
        TSSAddress = _address;
    }

    /**
     * @dev Update zeta fee
     * @param _zetaFee, new zeta fee
     */
    function updateZetaFee(uint256 _zetaFee) external {
        if (msg.sender != TSSAddress) {
            revert InvalidSender();
        }
        if (_zetaFee == 0) {
            revert ZeroFee();
        }
        if (_zetaFee > zetaMaxFee) {
            revert ZetaMaxFeeExceeded();
        }
        zetaFee = _zetaFee;
    }

    /**
     * @dev Change the ownership of TSSAddressUpdater to the Zeta blockchain TSS nodes.
     * Effectively, only Zeta blockchain validators collectively can update TSSAddress afterwards.
     */
    function renounceTSSAddressUpdater() external {
        if (msg.sender != TSSAddressUpdater) {
            revert InvalidTSSUpdater();
        }
        if (TSSAddress == address(0)) {
            revert ZeroAddress();
        }
        TSSAddressUpdater = TSSAddress;
    }

    /**
     * @dev Pause custody operations.
     */
    function pause() external {
        if (paused) {
            revert IsPaused();
        }
        if (msg.sender != TSSAddressUpdater) {
            revert InvalidTSSUpdater();
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
    function unpause() external {
        if (!paused) {
            revert NotPaused();
        }
        if (msg.sender != TSSAddressUpdater) {
            revert InvalidTSSUpdater();
        }
        paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @dev Whitelist asset
     * @param asset, ERC20 asset
     */
    function whitelist(IERC20 asset) external {
        if (msg.sender != TSSAddress) {
            revert InvalidSender();
        }
        whitelisted[asset] = true;
        emit Whitelisted(asset);
    }

    /**
     * @dev Unwhitelist asset
     * @param asset, ERC20 asset
     */
    function unwhitelist(IERC20 asset) external {
        if (msg.sender != TSSAddress) {
            revert InvalidSender();
        }
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
        if (address(zeta) != address(0)) {
            zeta.transferFrom(msg.sender, TSSAddress, zetaFee);
        }
        asset.transferFrom(msg.sender, address(this), amount);
        emit Deposited(recipient, asset, amount, message);
    }

    /**
     * @dev Deposit asset amount to recipient with message that encodes additional zetachain evm call or message.
     * @param recipient, recipient address
     * @param asset, ERC20 asset
     * @param amount, asset amount
     * @param message, bytes message or encoded zetechain call.
     */
    function depositFeeOnTransfer(bytes calldata recipient, IERC20 asset, uint256 amount, bytes calldata message) external {
        if (paused) {
            revert IsPaused();
        }
        if (!whitelisted[asset]) {
            revert NotWhitelisted();
        }
        if (address(zeta) != address(0)) {
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
    function withdraw(address recipient, IERC20 asset, uint256 amount) external {
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
