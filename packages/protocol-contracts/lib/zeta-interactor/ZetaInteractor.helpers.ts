import { ZetaInteractorMock, ZetaInteractorMock__factory } from "../../typechain-types";
import { getContract } from "../contracts.helpers";

export const getZetaInteractorMock = async (zetaToken: string) =>
  getContract<ZetaInteractorMock__factory, ZetaInteractorMock>({
    contractName: "ZetaInteractorMock",
    deployParams: [zetaToken],
  });
