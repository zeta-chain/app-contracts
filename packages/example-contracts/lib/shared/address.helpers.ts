import { getAddress as getAddressLib, NetworkName, ZetaAddress, ZetaNetworkName } from "@zetachain/addresses";
import { network } from "hardhat";

const MissingZetaNetworkError = new Error(
  "ZETA_NETWORK is not defined, please set the environment variable (e.g.: ZETA_NETWORK=athens <command>)"
);

export const getAddress = (
  address: ZetaAddress,
  {
    customNetworkName,
    customZetaNetwork
  }: { customNetworkName?: NetworkName; customZetaNetwork?: ZetaNetworkName } = {}
): string => {
  const { name: _networkName } = network;
  const networkName = customNetworkName || _networkName;

  const { ZETA_NETWORK: _ZETA_NETWORK } = process.env;
  const zetaNetwork = customZetaNetwork || _ZETA_NETWORK;

  if (!zetaNetwork) throw MissingZetaNetworkError;
  return getAddressLib({ address, networkName, zetaNetwork });
};
