import { exec, spawn } from "node:child_process";
import path from "node:path";
import util from "node:util";

const projectRoot = path.join(__dirname, "../");
const packageName = "example-contracts";
const solcVersion = "0.8.12";

const dockerCommand = `cd /home/trufflecon/packages/${packageName} && \
solc-select use ${solcVersion} && \
slither ./
`;

const execPromise = util.promisify(exec);

const run = async (command: string) => {
  try {
    console.log("STARTING");
    const { stdout, stderr } = await execPromise(command);
    console.log("STARTING2");

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log("STARTING3");

    console.log(`stdout:\n${stdout}`);
  } catch (error: any) {
    console.log("STARTING34");
    if (error?.message) console.error(`error: ${error.message}`);
  }
};

const runSlither = () =>
  run(`docker run -v "${projectRoot}":/home/trufflecon trailofbits/eth-security-toolbox  -c "${dockerCommand}"`);

async function main() {
  // await run("slither ");
  await runSlither();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
