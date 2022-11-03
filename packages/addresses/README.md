# ZetaChain addresses

This package includes the addresses and networks to use Zetachain.

## Usage

```js
import { getAddress } from "@zetachain/addresses";

const address = getAddress({ address: "zetaToken", networkName: "goerli", zetaNetwork:"athens" });
```

## API


| Method | Description |
| :---- | ------ |
| isTestnetNetworkName = (networkName: string): networkName is TestnetNetworkName | Returns true if it's a valid Testnet name |
| isZetaTestnet = (networkName: string): networkName is ZetaTestnetNetworkName | Returns true if it's a valid ZetaTestnet name |
| isMainnetNetworkName = (networkName: string): networkName is MainnetNetworkName | Returns true if it's a valid Mainnet name |
| isNetworkName = (networkName: string): networkName is NetworkName | Returns true if it's a valid network name |
| isZetaNetworkName = (networkName: string): networkName is ZetaNetworkName | Returns true if it's a valid Zeta network name |
| type ZetaAddress | Valid values for ZetaAddress |
| getAddress = ({ address: ZetaAddress; networkName: string; zetaNetwork: string; }): string  | Returns the address of a valid ZetaAddress |

```