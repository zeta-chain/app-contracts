# ZetaChain addresses

This package includes the addresses and networks to use Zetachain.

## Usage

```js
import { getAddress } from "@zetachain/addresses";

const address = getAddress({address: "zetaToken", networkName: "goerli", zetaNetwork:"athens"});
```

## API


| Method | Description |
| :---- | ------ |
| isTestnetNetworkName = (networkName: string) | Returns true if is a valid Testnet name |
| isZetaTestnet = (networkName: string) | Returns true if is a valid ZetaTestnet name |
| isMainnetNetworkName = (networkName: string) | Returns true if is a valid Mainnet name |
| isNetworkName = (networkName: string) | Returns true if is a valid network name |
| isZetaNetworkName = (networkName: string) | Returns true if is a valid Zeta network name |
| type ZetaAddress | Valid values for ZetaAddress |
| getAddress = ({address: ZetaAddress; networkName: string; zetaNetwork: string; }): string  | Returns the address of a valid ZetaAddress |

```