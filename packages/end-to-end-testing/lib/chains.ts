import { getAddress, isNetworkName, ZetaNetworkName } from "@zetachain/addresses";
import { isLocalNetworkName, NetworkName } from "@zetachain/addresses";
import { getConnectorFactory, getTokenFactory } from "@zetachain/protocol-contracts";
import { ZetaConnectorEth, ZetaConnectorNonEth, ZetaEth, ZetaNonEth } from "@zetachain/protocol-contracts";
import { Axios, AxiosInstance } from "axios";
import axios from "axios";
import { Overrides, providers, Signer, Wallet } from "ethers";
import { ethers } from "hardhat";

const defaultOverrideOptions: Overrides = {
  gasLimit: "3000000",
  gasPrice: "40000000000",
};

export class Blockchain {
  accounts: any;
  api: AxiosInstance;
  chainId: number;
  initStatus: undefined | Promise<void>;
  name: NetworkName | ZetaNetworkName;
  p: ethers.providers.JsonRpcProvider;
  rpcEndpoint: string;
  type: ZetaNetworkName;
  wallet: Wallet;
  zetaNetworkName: ZetaNetworkName;

  constructor(
    name: NetworkName | ZetaNetworkName,
    rpcEndpoint: string,
    chainId: number,
    zetaNetworkName: ZetaNetworkName
  ) {
    this.name = name;
    this.chainId = chainId;
    this.rpcEndpoint = rpcEndpoint;
    this.zetaNetworkName = zetaNetworkName;
  }
}

export class EVMChain extends Blockchain {
  connectorContractAddress: string;
  connectorContract: ZetaConnectorEth | ZetaConnectorNonEth;
  zetaContractAddress: string;
  zetaContract: ZetaEth | ZetaNonEth;
  signer: Signer | any;
  name: NetworkName;

  constructor(name: NetworkName, rpcEndpoint: string, chainId: number, type: ZetaNetworkName, explorerArgs: {}) {
    super(name, rpcEndpoint, chainId, type);

    this.connectorContractAddress = getAddress("connector", {
      customNetworkName: this.name,
      customZetaNetwork: this.zetaNetworkName,
    });
    this.zetaContractAddress = getAddress("zetaToken", {
      customNetworkName: this.name,
      customZetaNetwork: this.zetaNetworkName,
    });
    this.api = axios.create({
      baseURL: `${this.rpcEndpoint}`,
      timeout: 15000,
      // @ts-ignore
      jsonrpc: "2.0",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    this.initStatus = this.init();
  }

  async init() {
    this.p = new ethers.providers.JsonRpcProvider(this.rpcEndpoint);

    /**
     * @description For Local Development use the default unlocked account
     * For public networks import the private key
     */
    if (this.zetaNetworkName === "troy") {
      this.accounts = await this.p.listAccounts();
      this.signer = await this.p.getSigner(this.accounts[0]);
    } else {
      this.wallet = new ethers.Wallet(`${process.env.PRIVATE_KEY}`, this.p);
      this.accounts = [this.wallet.address];
      this.signer = this.wallet;
    }

    this.zetaContract = await this.getTokenContract(await this.signer);
    this.connectorContract = await this.getConnectorContract(await this.signer);
  }

  async getAccountBalance(account = this.accounts) {
    await this.initStatus;
    const balance = await this.p.getBalance(account);
    console.info(`balance of ${account}: ${balance}`);
    return balance;
  }

  async getTokenContract(signer: Signer) {
    const Factory = await getTokenFactory(this.name);
    const zetaTokenContract = Factory.attach(this.zetaContractAddress);
    return zetaTokenContract.connect(signer);
  }

  async getConnectorContract(signer: Signer) {
    const Factory = await getConnectorFactory(this.name);
    const zetaConnectorContract = await Factory.attach(this.connectorContractAddress);
    return zetaConnectorContract.connect(signer);
  }

  async getConnectorEvents(eventName = "ZetaMessageReceiveEvent", filterKeyPairs = null) {
    await this.initStatus;
    const sentFilter = await this.connectorContract.filters[eventName]();
    const sent = await this.connectorContract.queryFilter(sentFilter);
    console.debug(`Recent '${eventName}' Events On ${this.name} Network: ${sent}`);
  }

  async sendConnectorMessage(
    destinationNetwork: EVMChain,
    incrementNonce: boolean = false,
    destinationAddress = destinationNetwork.accounts[0],
    zetaAmount: string = "45000000000000000000", // 45
    gasLimit: string = "300000",
    message: any = [],
    zetaParams: any = []
  ) {
    await this.initStatus;
    await destinationNetwork.initStatus;
    const input = {
      destinationChainId: destinationNetwork.chainId,
      destinationAddress: destinationAddress,
      gasLimit: gasLimit,
      message: message,
      zetaAmount: zetaAmount,
      zetaParams: zetaParams,
    };
    const overrideOptions = defaultOverrideOptions;

    /**
     * @description Localnet automatically increments the nonce for each transaction.
     * When using public testnets the nonce must be incremented manually when sending transactions in rapid succession.
     */
    if (incrementNonce && !isLocalNetworkName(this.name)) {
      overrideOptions.nonce = ((await this.wallet.getTransactionCount()) + 1).toString();
    }
    const tx = await this.connectorContract.send(input, defaultOverrideOptions);
    await tx.wait();

    console.info(`Outbound Hash ${tx.hash} for Connector Message from ${this.name} to ${destinationNetwork.name} `);
    console.debug(tx);
    return await tx;
  }
}

export async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class ZetaChain extends Blockchain {
  api: AxiosInstance;

  constructor(name: ZetaNetworkName, rpcEndpoint: string, chainId: number) {
    super(name, rpcEndpoint, chainId, name);
    this.initStatus = this.init();
  }

  async init() {
    this.api = await axios.create({
      baseURL: `${this.rpcEndpoint}/zeta-chain/zetacore/`,
      timeout: 10000,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
  }

  async getTxWithHash(txHash: string, timeout: number = 18): Promise<{ index: string }> {
    let i: number = 0;
    let response;
    console.debug("Checking Zetachain For Transaction With Source Hash: " + txHash);
    do {
      try {
        while (i <= timeout) {
          response = await this.api.get(`inTxRich/${txHash}`);
          if (response.data.tx != null) {
            console.debug(`Found Transaction ${txHash} from ${response.data.tx.senderChain}`);
            return response.data.tx;
          }
          i++;
          await wait(10000); // Wait 10 seconds between checks
        }
        throw new Error("TX not found received within " + timeout * 10 + " seconds");
      } catch (err) {
        console.error(err);
        throw err;
      }
    } while (response.data.tx == null);
  }

  async getEvent(sendHash: string) {
    const result = await this.api.get(`send/${sendHash}`);
    return result;
  }

  async confirmOutboundMined(zetaIndexHash: string) {
    console.info(`Checking TX transitions to 'OutboundMined' status for Zeta Index Hash: ${zetaIndexHash}`);
    try {
      let tx = await this.getEvent(zetaIndexHash);
      let i = 0;
      while (tx.data.Send.status !== "OutboundMined" && i <= 180) {
        await wait(10000); // Wait 10 seconds between checks
        tx = await this.getEvent(zetaIndexHash);
        i++;
      }

      console.debug(
        `Zeta TX ${zetaIndexHash} From ${tx.data.Send.senderChain} to ${tx.data.Send.receiverChain} status: ${tx.data.Send.status}`
      );

      if (tx.data.Send.status !== "OutboundMined") {
        throw new Error(
          `Zeta TX Status From ${tx.data.Send.senderChain} to ${tx.data.Send.receiverChain}: ${tx.data.Send.status}`
        );
      }
      return tx.data.Send.status;
    } catch (err) {
      throw err;
    }
  }
}
