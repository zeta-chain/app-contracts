import inquirer from "inquirer";
import { execSync } from "node:child_process";
import path from "node:path";

// Root directory of the project
const projectRoot = path.join(__dirname, "../");

// Solidity compiler version
const solcVersion = "0.8.7";

// Timestamp for unique file naming
const timestamp = Date.now();

// List of package names to choose from
const packageNames = ["protocol-contracts", "example-contracts"];

// Function to get the package name based on user input
async function getPackageName() {
  let packageName;

  if (process.env.CI) {
    packageName = process.argv[2];

    if (!packageNames.includes(packageName)) {
      console.error(`${packageName} is not a valid package name.`);
      console.error(`Valid package names are: ${packageNames.join(", ")}`);
      process.exit(1);
    }

    return packageName;
  } else {
    const { contracts } = await inquirer.prompt([
      {
        choices: packageNames,
        message: "Which set of contracts would you like to test?",
        name: "contracts",
        type: "list",
      },
    ]);

    return contracts;
  }
}

// Function to get the filter paths based on user input
async function getFilterPaths() {
  if (process.env.CI) return "";

  const { includeLibraries } = await inquirer.prompt([
    {
      message: "Do you want to include OpenZeppelin & Uniswap libraries in this scan?",
      name: "includeLibraries",
      type: "confirm",
    },
  ]);

  return includeLibraries ? "" : `--filter-paths "node_modules/@openzeppelin/","node_modules/@uniswap/"`;
}

// Function to execute a shell command
const run = async (command) => {
  try {
    console.log("Starting -- This may take a few minutes...");

    execSync(command, {
      encoding: "utf-8",
      stdio: "inherit",
    });

    console.log("Results output to the console and saved to slither-output/ in Markdown, JSON, and SARIF formats.");
  } catch (error) {
    console.error("Error: Docker Failed To Run");
    console.error(`${error}`);
  }
};

// Function to run Slither analysis
function runSlither(packageName, filterPaths) {
  const dockerCommand = `cd /home/trufflecon/packages/${packageName} && \
  solc-select use ${solcVersion} && \
  slither --json ../../scripts/slither-results/${packageName}-${timestamp}.json \
  --sarif ../../scripts/slither-results/${packageName}-${timestamp}.sarif \
  --checklist  ./ ${filterPaths} | tee ../../scripts/slither-results/${packageName}-${timestamp}.md`;

  run(`docker run -v "${projectRoot}":/home/trufflecon trailofbits/eth-security-toolbox  -c "${dockerCommand}"`);
}

// Main function to orchestrate Slither analysis
async function main() {
  runSlither(await getPackageName(), await getFilterPaths());
}

// Execute the main function and handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
