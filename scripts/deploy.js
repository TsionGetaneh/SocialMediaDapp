import pkg from "hardhat";
const { ethers, run } = pkg;

async function main() {
  console.log("Deploying SocialMedia contract...");

  const SocialMedia = await ethers.getContractFactory("SocialMedia");
  const socialMedia = await SocialMedia.deploy();

  await socialMedia.waitForDeployment();

  const address = await socialMedia.getAddress();
  console.log("SocialMedia deployed to:", address);

  // Automatically update the frontend config
  const fs = await import("fs");
  const configPath = "./frontend/src/contracts-config.json";
  
  // Read the artifact to get the ABI
  const artifactPath = "./artifacts/contracts/SocialMedia.sol/SocialMedia.json";
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  const config = {
    address: address,
    abi: artifact.abi
  };
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("Updated frontend/src/contracts-config.json with new address and ABI.");

  // Wait for few confirmations before verification
  if (pkg.network.name !== "hardhat" && pkg.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await socialMedia.deploymentTransaction().wait(6);

    console.log("Verifying contract on Etherscan...");
    try {
      await run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.error("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
