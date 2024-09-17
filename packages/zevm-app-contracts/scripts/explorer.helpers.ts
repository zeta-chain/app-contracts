import { run } from "hardhat";

export const verifyContract = async (contractAddress: string, constructorArguments: any[]) => {
  // Verification process
  console.log(`Verifying contract ${contractAddress}...`);
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments,
    });
    console.log("Verification successful");
  } catch (error) {
    console.error("Verification failed:", error);
  }
};
