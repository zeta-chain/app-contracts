import { run } from "hardhat";

export const verifyContract = async (contractAddress: string, constructorArguments: any[], contract?: string) => {
  // Verification process
  console.log(`Verifying contract ${contractAddress}...`);
  try {
    if (contract) {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments,
        contract,
      });
    } else {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments,
      });
    }
    console.log("Verification successful");
  } catch (error) {
    console.error("Verification failed:", error);
  }
};
