/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  ZetaConnectorEth,
  ZetaConnectorEthInterface,
} from "../../../contracts/ZetaConnector.eth.sol/ZetaConnectorEth";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "zetaToken_",
        type: "address",
      },
      {
        internalType: "address",
        name: "tssAddress_",
        type: "address",
      },
      {
        internalType: "address",
        name: "tssAddressUpdater_",
        type: "address",
      },
      {
        internalType: "address",
        name: "pauserAddress_",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "caller",
        type: "address",
      },
    ],
    name: "CallerIsNotPauser",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "caller",
        type: "address",
      },
    ],
    name: "CallerIsNotTss",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "caller",
        type: "address",
      },
    ],
    name: "CallerIsNotTssOrUpdater",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "caller",
        type: "address",
      },
    ],
    name: "CallerIsNotTssUpdater",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "maxSupply",
        type: "uint256",
      },
    ],
    name: "ExceedsMaxSupply",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAddress",
    type: "error",
  },
  {
    inputs: [],
    name: "ZetaTransferError",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "updaterAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newTssAddress",
        type: "address",
      },
    ],
    name: "PauserAddressUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "zetaTxSenderAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newTssAddress",
        type: "address",
      },
    ],
    name: "TSSAddressUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes",
        name: "zetaTxSenderAddress",
        type: "bytes",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "sourceChainId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "destinationAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "zetaValueAndGas",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "message",
        type: "bytes",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "internalSendHash",
        type: "bytes32",
      },
    ],
    name: "ZetaReceived",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "zetaTxSenderAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "sourceChainId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "destinationChainId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "bytes",
        name: "destinationAddress",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "zetaValueAndGas",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "message",
        type: "bytes",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "internalSendHash",
        type: "bytes32",
      },
    ],
    name: "ZetaReverted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "sourceTxOriginAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "zetaTxSenderAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "destinationChainId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "bytes",
        name: "destinationAddress",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "zetaValueAndGas",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "destinationGasLimit",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "message",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "zetaParams",
        type: "bytes",
      },
    ],
    name: "ZetaSent",
    type: "event",
  },
  {
    inputs: [],
    name: "getLockedAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "zetaTxSenderAddress",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "sourceChainId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "destinationAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "zetaValueAndGas",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "message",
        type: "bytes",
      },
      {
        internalType: "bytes32",
        name: "internalSendHash",
        type: "bytes32",
      },
    ],
    name: "onReceive",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "zetaTxSenderAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "sourceChainId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "destinationAddress",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "destinationChainId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "zetaValueAndGas",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "message",
        type: "bytes",
      },
      {
        internalType: "bytes32",
        name: "internalSendHash",
        type: "bytes32",
      },
    ],
    name: "onRevert",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pauserAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceTssAddressUpdater",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "destinationChainId",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "destinationAddress",
            type: "bytes",
          },
          {
            internalType: "uint256",
            name: "destinationGasLimit",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "message",
            type: "bytes",
          },
          {
            internalType: "uint256",
            name: "zetaValueAndGas",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "zetaParams",
            type: "bytes",
          },
        ],
        internalType: "struct ZetaInterfaces.SendInput",
        name: "input",
        type: "tuple",
      },
    ],
    name: "send",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "tssAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "tssAddressUpdater",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "pauserAddress_",
        type: "address",
      },
    ],
    name: "updatePauserAddress",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "tssAddress_",
        type: "address",
      },
    ],
    name: "updateTssAddress",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "zetaToken",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x60a06040523480156200001157600080fd5b506040516200218238038062002182833981810160405281019062000037919062000284565b8383838360008060006101000a81548160ff021916908315150217905550600073ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff161480620000bd5750600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16145b80620000f55750600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16145b806200012d5750600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16145b1562000165576040517fe6c4247b00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b8373ffffffffffffffffffffffffffffffffffffffff1660808173ffffffffffffffffffffffffffffffffffffffff1660601b8152505082600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555081600260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555080600060016101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550505050505050505062000349565b6000815190506200027e816200032f565b92915050565b60008060008060808587031215620002a157620002a06200032a565b5b6000620002b1878288016200026d565b9450506020620002c4878288016200026d565b9350506040620002d7878288016200026d565b9250506060620002ea878288016200026d565b91505092959194509250565b600062000303826200030a565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600080fd5b6200033a81620002f6565b81146200034657600080fd5b50565b60805160601c611dfe620003846000396000818161024f01528181610275015281816103ff01528181610dc201526110990152611dfe6000f3fe608060405234801561001057600080fd5b50600436106100ea5760003560e01c80636128480f1161008c5780639122c344116100665780639122c344146101db578063942a5e16146101f7578063ec02690114610213578063f7fb869b1461022f576100ea565b80636128480f146101ab578063779e3b63146101c75780638456cb59146101d1576100ea565b8063328a01d0116100c8578063328a01d0146101475780633f4ba83a146101655780635b1125911461016f5780635c975abb1461018d576100ea565b806321e093b1146100ef578063252bc8861461010d57806329dd214d1461012b575b600080fd5b6100f761024d565b6040516101049190611942565b60405180910390f35b610115610271565b6040516101229190611b81565b60405180910390f35b610145600480360381019061014091906115bb565b610321565b005b61014f610682565b60405161015c9190611942565b60405180910390f35b61016d6106a8565b005b610177610744565b6040516101849190611942565b60405180910390f35b61019561076a565b6040516101a29190611a99565b60405180910390f35b6101c560048036038101906101c0919061147f565b610780565b005b6101cf6108f6565b005b6101d9610a76565b005b6101f560048036038101906101f0919061147f565b610b12565b005b610211600480360381019061020c91906114ac565b610ce4565b005b61022d6004803603810190610228919061168a565b61104d565b005b610237611230565b6040516102449190611942565b60405180910390f35b7f000000000000000000000000000000000000000000000000000000000000000081565b60007f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b81526004016102cc9190611942565b60206040518083038186803b1580156102e457600080fd5b505afa1580156102f8573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061031c91906116d3565b905090565b61032961076a565b15610369576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161036090611b1d565b60405180910390fd5b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146103fb57336040517fff70ace20000000000000000000000000000000000000000000000000000000081526004016103f29190611942565b60405180910390fd5b60007f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663a9059cbb87876040518363ffffffff1660e01b81526004016104589291906119bd565b602060405180830381600087803b15801561047257600080fd5b505af1158015610486573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104aa919061158e565b9050806104e3576040517f20878f6200000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600084849050111561061f578573ffffffffffffffffffffffffffffffffffffffff16633749c51a6040518060a001604052808c8c8080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f8201169050808301925050505050505081526020018a81526020018973ffffffffffffffffffffffffffffffffffffffff16815260200188815260200187878080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f820116905080830192505050505050508152506040518263ffffffff1660e01b81526004016105ec9190611b3d565b600060405180830381600087803b15801561060657600080fd5b505af115801561061a573d6000803e3d6000fd5b505050505b818673ffffffffffffffffffffffffffffffffffffffff16887ff1302855733b40d8acb467ee990b6d56c05c80e28ebcabfa6e6f3f57cb50d6988c8c8a8a8a60405161066f959493929190611ab4565b60405180910390a4505050505050505050565b600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600060019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461073a57336040517f4677a0d30000000000000000000000000000000000000000000000000000000081526004016107319190611942565b60405180910390fd5b610742611256565b565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60008060009054906101000a900460ff16905090565b600060019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461081257336040517f4677a0d30000000000000000000000000000000000000000000000000000000081526004016108099190611942565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161415610879576040517fe6c4247b00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b80600060016101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055507fd41d83655d484bdf299598751c371b2d92088667266fe3774b25a97bdd5d039733826040516108eb92919061195d565b60405180910390a150565b600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461098857336040517fe700765e00000000000000000000000000000000000000000000000000000000815260040161097f9190611942565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff16600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161415610a11576040517fe6c4247b00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16600260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550565b600060019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610b0857336040517f4677a0d3000000000000000000000000000000000000000000000000000000008152600401610aff9190611942565b60405180910390fd5b610b106112f7565b565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614158015610bbe5750600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614155b15610c0057336040517fcdfcef97000000000000000000000000000000000000000000000000000000008152600401610bf79190611942565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161415610c67576040517fe6c4247b00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b80600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055507fe79965b5c67dcfb2cf5fe152715e4a7256cee62a3d5dd8484fd8a8539eb8beff3382604051610cd992919061195d565b60405180910390a150565b610cec61076a565b15610d2c576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610d2390611b1d565b60405180910390fd5b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610dbe57336040517fff70ace2000000000000000000000000000000000000000000000000000000008152600401610db59190611942565b60405180910390fd5b60007f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663a9059cbb8b876040518363ffffffff1660e01b8152600401610e1b9291906119bd565b602060405180830381600087803b158015610e3557600080fd5b505af1158015610e49573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610e6d919061158e565b905080610ea6576040517f20878f6200000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6000848490501115610fe8578973ffffffffffffffffffffffffffffffffffffffff16633ff0693c6040518060c001604052808d73ffffffffffffffffffffffffffffffffffffffff1681526020018c81526020018b8b8080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f82011690508083019250505050505050815260200189815260200188815260200187878080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f820116905080830192505050505050508152506040518263ffffffff1660e01b8152600401610fb59190611b5f565b600060405180830381600087803b158015610fcf57600080fd5b505af1158015610fe3573d6000803e3d6000fd5b505050505b818888604051610ff9929190611929565b6040518091039020877f521fb0b407c2eb9b1375530e9b9a569889992140a688bc076aa72c1712012c888d8d8a8a8a6040516110399594939291906119e6565b60405180910390a450505050505050505050565b61105561076a565b15611095576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161108c90611b1d565b60405180910390fd5b60007f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff166323b872dd333085608001356040518463ffffffff1660e01b81526004016110f893929190611986565b602060405180830381600087803b15801561111257600080fd5b505af1158015611126573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061114a919061158e565b905080611183576040517f20878f6200000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b8180602001906111939190611b9c565b6040516111a1929190611929565b604051809103902082600001353373ffffffffffffffffffffffffffffffffffffffff167f7ec1c94701e09b1652f3e1d307e60c4b9ebf99aff8c2079fd1d8c585e031c4e432866080013587604001358880606001906112019190611b9c565b8a8060a001906112119190611b9c565b6040516112249796959493929190611a34565b60405180910390a45050565b600060019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b61125e61076a565b61129d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161129490611afd565b60405180910390fd5b60008060006101000a81548160ff0219169083151502179055507f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa6112e0611399565b6040516112ed9190611942565b60405180910390a1565b6112ff61076a565b1561133f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161133690611b1d565b60405180910390fd5b60016000806101000a81548160ff0219169083151502179055507f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258611382611399565b60405161138f9190611942565b60405180910390a1565b600033905090565b6000813590506113b081611d6c565b92915050565b6000815190506113c581611d83565b92915050565b6000813590506113da81611d9a565b92915050565b60008083601f8401126113f6576113f5611ce1565b5b8235905067ffffffffffffffff81111561141357611412611cdc565b5b60208301915083600182028301111561142f5761142e611cf5565b5b9250929050565b600060c0828403121561144c5761144b611ceb565b5b81905092915050565b60008135905061146481611db1565b92915050565b60008151905061147981611db1565b92915050565b60006020828403121561149557611494611d04565b5b60006114a3848285016113a1565b91505092915050565b600080600080600080600080600060e08a8c0312156114ce576114cd611d04565b5b60006114dc8c828d016113a1565b99505060206114ed8c828d01611455565b98505060408a013567ffffffffffffffff81111561150e5761150d611cff565b5b61151a8c828d016113e0565b9750975050606061152d8c828d01611455565b955050608061153e8c828d01611455565b94505060a08a013567ffffffffffffffff81111561155f5761155e611cff565b5b61156b8c828d016113e0565b935093505060c061157e8c828d016113cb565b9150509295985092959850929598565b6000602082840312156115a4576115a3611d04565b5b60006115b2848285016113b6565b91505092915050565b60008060008060008060008060c0898b0312156115db576115da611d04565b5b600089013567ffffffffffffffff8111156115f9576115f8611cff565b5b6116058b828c016113e0565b985098505060206116188b828c01611455565b96505060406116298b828c016113a1565b955050606061163a8b828c01611455565b945050608089013567ffffffffffffffff81111561165b5761165a611cff565b5b6116678b828c016113e0565b935093505060a061167a8b828c016113cb565b9150509295985092959890939650565b6000602082840312156116a05761169f611d04565b5b600082013567ffffffffffffffff8111156116be576116bd611cff565b5b6116ca84828501611436565b91505092915050565b6000602082840312156116e9576116e8611d04565b5b60006116f78482850161146a565b91505092915050565b61170981611c48565b82525050565b61171881611c48565b82525050565b61172781611c5a565b82525050565b60006117398385611c1b565b9350611746838584611c9a565b61174f83611d09565b840190509392505050565b60006117668385611c2c565b9350611773838584611c9a565b82840190509392505050565b600061178a82611bff565b6117948185611c0a565b93506117a4818560208601611ca9565b6117ad81611d09565b840191505092915050565b60006117c5601483611c37565b91506117d082611d1a565b602082019050919050565b60006117e8601083611c37565b91506117f382611d43565b602082019050919050565b600060a083016000830151848203600086015261181b828261177f565b9150506020830151611830602086018261190b565b5060408301516118436040860182611700565b506060830151611856606086018261190b565b506080830151848203608086015261186e828261177f565b9150508091505092915050565b600060c0830160008301516118936000860182611700565b5060208301516118a6602086018261190b565b50604083015184820360408601526118be828261177f565b91505060608301516118d3606086018261190b565b5060808301516118e6608086018261190b565b5060a083015184820360a08601526118fe828261177f565b9150508091505092915050565b61191481611c90565b82525050565b61192381611c90565b82525050565b600061193682848661175a565b91508190509392505050565b6000602082019050611957600083018461170f565b92915050565b6000604082019050611972600083018561170f565b61197f602083018461170f565b9392505050565b600060608201905061199b600083018661170f565b6119a8602083018561170f565b6119b5604083018461191a565b949350505050565b60006040820190506119d2600083018561170f565b6119df602083018461191a565b9392505050565b60006080820190506119fb600083018861170f565b611a08602083018761191a565b611a15604083018661191a565b8181036060830152611a2881848661172d565b90509695505050505050565b600060a082019050611a49600083018a61170f565b611a56602083018961191a565b611a63604083018861191a565b8181036060830152611a7681868861172d565b90508181036080830152611a8b81848661172d565b905098975050505050505050565b6000602082019050611aae600083018461171e565b92915050565b60006060820190508181036000830152611acf81878961172d565b9050611ade602083018661191a565b8181036040830152611af181848661172d565b90509695505050505050565b60006020820190508181036000830152611b16816117b8565b9050919050565b60006020820190508181036000830152611b36816117db565b9050919050565b60006020820190508181036000830152611b5781846117fe565b905092915050565b60006020820190508181036000830152611b79818461187b565b905092915050565b6000602082019050611b96600083018461191a565b92915050565b60008083356001602003843603038112611bb957611bb8611cf0565b5b80840192508235915067ffffffffffffffff821115611bdb57611bda611ce6565b5b602083019250600182023603831315611bf757611bf6611cfa565b5b509250929050565b600081519050919050565b600082825260208201905092915050565b600082825260208201905092915050565b600081905092915050565b600082825260208201905092915050565b6000611c5382611c70565b9050919050565b60008115159050919050565b6000819050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b82818337600083830152505050565b60005b83811015611cc7578082015181840152602081019050611cac565b83811115611cd6576000848401525b50505050565b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f5061757361626c653a206e6f7420706175736564000000000000000000000000600082015250565b7f5061757361626c653a2070617573656400000000000000000000000000000000600082015250565b611d7581611c48565b8114611d8057600080fd5b50565b611d8c81611c5a565b8114611d9757600080fd5b50565b611da381611c66565b8114611dae57600080fd5b50565b611dba81611c90565b8114611dc557600080fd5b5056fea2646970667358221220975e723ecb3cbe569f7876443db8c400c50e76f676a32036a85432c8ee756ba464736f6c63430008070033";

type ZetaConnectorEthConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ZetaConnectorEthConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class ZetaConnectorEth__factory extends ContractFactory {
  constructor(...args: ZetaConnectorEthConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    zetaToken_: string,
    tssAddress_: string,
    tssAddressUpdater_: string,
    pauserAddress_: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ZetaConnectorEth> {
    return super.deploy(
      zetaToken_,
      tssAddress_,
      tssAddressUpdater_,
      pauserAddress_,
      overrides || {}
    ) as Promise<ZetaConnectorEth>;
  }
  override getDeployTransaction(
    zetaToken_: string,
    tssAddress_: string,
    tssAddressUpdater_: string,
    pauserAddress_: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      zetaToken_,
      tssAddress_,
      tssAddressUpdater_,
      pauserAddress_,
      overrides || {}
    );
  }
  override attach(address: string): ZetaConnectorEth {
    return super.attach(address) as ZetaConnectorEth;
  }
  override connect(signer: Signer): ZetaConnectorEth__factory {
    return super.connect(signer) as ZetaConnectorEth__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ZetaConnectorEthInterface {
    return new utils.Interface(_abi) as ZetaConnectorEthInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ZetaConnectorEth {
    return new Contract(address, _abi, signerOrProvider) as ZetaConnectorEth;
  }
}
