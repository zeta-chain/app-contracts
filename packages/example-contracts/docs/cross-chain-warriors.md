# Cross Chain Warriors

[![Docs](https://img.shields.io/badge/Zeta%20docs-🔗-43ad51)](https://docs.zetachain.com/develop/examples/cross-chain-nft)

A cross-chain NFT collection using [Zeta Connector](https://docs.zetachain.com/reference/connector).

## Try it in testnet

The collection is currently deployed to [BSC Testnet](https://testnet.bscscan.com/address/0xa9016FB99846314E0f96f657E5271cFD7919a244) and [Goerli](https://goerli.etherscan.io/address/0xe08f1d23a68231543a595391D82c39BbaFc22470), the contracts are verified so you can use BSCScan and Etherscan to play with them.

### Doing a cross-chain NFT transfer

1. Go to the [BSC Testnet contract's write methods](https://testnet.bscscan.com/address/0xa9016FB99846314E0f96f657E5271cFD7919a244#writeContract).
1. Connect with your wallet.
1. Mint an NFT to your address.
1. View the transaction and copy the TokenId.
1. Call the crossChainTransfer method with the receiver address on the other chain and the TokenId you just minted.
1. After the transaction was mined, go to the contract's read methods and call ownerOf TokenId, you should get an `execution reverted` message since the NFT was burnt by the crossChainTransfer.
1. Go to the [Goerli contract's read methods](https://goerli.etherscan.io/address/0xe08f1d23a68231543a595391D82c39BbaFc22470#readContract).
1. Call the ownerOf method with your TokenId, the owner should be the receiver address you used before. *If it's not, note that the cross-chain transfer may take around 1 minute.*
