import inquirer from "inquirer";
import { execSync } from "node:child_process";
import path from "node:path";

const projectRoot = path.join(__dirname, "../");
const solcVersion = "0.8.7";
const timestamp = Date.now();
const packageNames = ["protocol-contracts", "example-contracts"];

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
    packageName = await inquirer.prompt([
      {
        choices: packageNames,
        message: "Which set of contracts would you like to test?",
        name: "contracts",
        type: "list",
      },
    ]);

    return packageName.contracts;
  }
}

async function getFilterPaths() {
  if (process.env.CI) return "";

  const { confirm: includeLibraries } = await inquirer.prompt([
    {
      message: "Do you want to include OpenZeppelin & Uniswap libraries in this scan?",
      name: "confirm",
      type: "confirm",
    },
  ]);

  return includeLibraries ? "" : `--filter-paths "node_modules/@openzeppelin/","node_modules/@uniswap/"`;
}

const run = async (command: string) => {
  try {
    console.log("Starting -- This may take a few minutes...");

    execSync(command, {
      encoding: "utf-8",
      stdio: "inherit",
    });

    console.log("Results output to the console and saved to slither-output/ in Markdown, JSON, and SARIF formats.");
  } catch (error: any) {
    console.error("Error: Docker Failed To Run");
    console.error(`${error}`);
  }
};
function runSlither(packageName: string, filterPaths: string) {
  const dockerCommand = `cd /home/trufflecon/packages/${packageName} && \
  solc-select use ${solcVersion} && \
  slither --json ../../scripts/slither-results/${packageName}-${timestamp}.json \
  --sarif ../../scripts/slither-results/${packageName}-${timestamp}.sarif \
  --checklist  ./ ${filterPaths} | tee ../../scripts/slither-results/${packageName}-${timestamp}.md`;
  run(`docker run -v "${projectRoot}":/home/trufflecon trailofbits/eth-security-toolbox  -c "${dockerCommand}"`);
}

async function main() {
  runSlither(await getPackageName(), await getFilterPaths());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
