# Multi Chain Value

[![Docs](https://img.shields.io/badge/Zeta%20docs-🔗-43ad51)](https://docs.zetachain.com/develop/examples/multi-chain-value-transfer)

Transfer value across chains using [Zeta Connector](https://docs.zetachain.com/reference/connector).

## Try it in testnet

This example is currently deployed to [BSC Testnet](https://testnet.bscscan.com/address/0x0E396e23cAD688c0e5252B20dFeAcC248b0d8B01) and [Goerli](https://goerli.etherscan.io/address/0x8bA6c6047AA5a55C2Ce10615b1D358Cb4B9D27f6), the contracts are verified so you can use BSCScan and Etherscan to play with them.

### Doing a cross-chain value transfer

1. Get some [testnet Zeta](https://docs.zetachain.com/develop/get-testnet-zeta). You may have to manually add the ZETA token to your wallet. The token addresses can be found [here](https://docs.zetachain.com/develop/development-addresses).
1. Go to the [BSC Testnet ZETA token contract's write methods](https://testnet.bscscan.com/address/0x6Cc37160976Bbd1AecB5Cce4C440B28e883c7898#writeContract).
1. Connect your wallet.
1. Give allowance to the multi-chain value contract to spend your ZETA: `0x0E396e23cAD688c0e5252B20dFeAcC248b0d8B01`. Use the methods `approve()` or  `increaseAllowance()`
1. Go to the [BSC Testnet multi-chain value contract's write methods](https://testnet.bscscan.com/address/0x0E396e23cAD688c0e5252B20dFeAcC248b0d8B01#writeContract).
1. Connect your wallet.
1. You will need some tBNB to perform the transfer step. You can get some from [this faucet](https://testnet.binance.org/faucet-smart).
1. Transfer (up to) the amount you previously approved of ZETA to Goerli (chain id 5) by calling `send()` in the write contract, passing in your wallet's address as the `destinationAddress`. *Make sure to convert the destinationAddress to bytes. You can use [this code snippet](https://stackblitz.com/edit/typescript-bwhh4c?file=index.ts).* Use [eth converter](https://eth-converter.com/) to express the amount in wei.
1. Check the receiver address balance in Goerli. *Note that the cross-chain transfer may take around 1 minute.*
