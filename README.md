# ZetaChain

ZetaChain is a public, decentralized blockchain and smart contract platform built for omnichain interoperability.

## What's in this repo?

* Utilities to interact with ZetaChain's contracts from your dApp, scripts, or tests.
* Interfaces to easily develop omnichain contracts.

## Learn more about ZetaChain

* Check our [website](https://www.zetachain.com/).
* Read our [docs](https://docs.zetachain.com/).

<!-- ## Packages -->

## Usage

1. Install [Node.js LTS](https://nodejs.org/en/) (previous versions may, but are not guaranteed to work).

1. Install `yarn` (make sure NPM has the right permissions to add global packages):

        npm i -g yarn

1. Install the dependencies:

        yarn

1. From the root folder, compile the contracts:

        yarn compile

### Packages

#### [Zeta App contracts](packages/zeta-app-contracts)

#### [ZEVM App contracts](packages/zevm-app-contracts)

### Cross-repo commands

#### Package-specific commands

They run independently, only on the packages that implement them:

```bash
yarn compile
```

```bash
yarn clean
```

```bash
yarn test
```

#### Repo commands

They run once, across the whole repo:

```bash
yarn lint
```

```bash
yarn lint:fix
```

## Contributing

We welcome (and appreciate) everyone's contributions. If you wanna contribute, read [CONTRIBUTING.md](CONTRIBUTING.md) for next steps.
