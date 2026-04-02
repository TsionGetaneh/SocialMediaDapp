import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  // Use first account from hardhat local node
  const [owner, user1] = await ethers.getSigners();
  
  // Deploy for interaction if not already deployed
  const SocialMedia = await ethers.getContractFactory("SocialMedia");
  const socialMedia = await SocialMedia.deploy();
  await socialMedia.waitForDeployment();
  const address = await socialMedia.getAddress();
  console.log("SocialMedia deployed to:", address);

  // Register users
  console.log("Registering Alice...");
  await socialMedia.connect(user1).registerUser("Alice", "Dapp Enthusiast", "mock-alice-pic");
  
  // Create a post
  console.log("Creating post...");
  await socialMedia.connect(user1).createPost("First decentralized post!", "mock-post-image");
  
  // Like the post
  console.log("Liking post...");
  await socialMedia.connect(owner).toggleLike(1);

  // Dislike the post
  console.log("Disliking post (should remove like)...");
  await socialMedia.connect(owner).toggleDislike(1);
  
  // Add comment
  console.log("Adding comment...");
  await socialMedia.connect(owner).addComment(1, "This is awesome!");

  // Follow
  console.log("Following Alice...");
  await socialMedia.connect(owner).followUser(user1.address);
  
  // Tip the post
  console.log("Tipping post...");
  await socialMedia.connect(owner).tipPost(1, { value: ethers.parseEther("0.1") });
  
  // Send message
  console.log("Sending message...");
  await socialMedia.connect(owner).sendMessage(user1.address, "Hello Alice, nice post!");
  
  // Get post details
  const post = await socialMedia.getPost(1);
  console.log("Post details:", post);
  
  // Get user profile
  const profile = await socialMedia.getUser(user1.address);
  console.log("Alice profile:", profile);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
