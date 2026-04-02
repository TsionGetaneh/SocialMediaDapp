import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("SocialMedia Contract", function () {
  let socialMedia;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const SocialMedia = await ethers.getContractFactory("SocialMedia");
    socialMedia = await SocialMedia.deploy();
  });

  describe("User Registration", function () {
    it("Should register a new user", async function () {
      await socialMedia.connect(user1).registerUser("Alice", "Bio of Alice", "QmPic123");
      const profile = await socialMedia.getUser(user1.address);
      
      expect(profile.username).to.equal("Alice");
      expect(profile.bio).to.equal("Bio of Alice");
      expect(profile.profilePic).to.equal("QmPic123");
      expect(profile.registered).to.equal(true);
      expect(profile.followersCount).to.equal(0n);
      expect(profile.followingCount).to.equal(0n);
    });

    it("Should fail if username is empty", async function () {
      await expect(socialMedia.connect(user1).registerUser("", "Bio", "")).to.be.revertedWith("Username cannot be empty");
    });
  });

  describe("Creating Posts", function () {
    beforeEach(async function () {
      await socialMedia.connect(user1).registerUser("Alice", "Bio", "");
    });

    it("Should create a post", async function () {
      await socialMedia.connect(user1).createPost("Hello World!", "QmHash123");
      const postCount = await socialMedia.postCount();
      expect(postCount).to.equal(1n);
      
      const post = await socialMedia.posts(1);
      expect(post.author).to.equal(user1.address);
      expect(post.content).to.equal("Hello World!");
      expect(post.imageHash).to.equal("QmHash123");
    });
  });

  describe("Liking and Disliking Posts", function () {
    beforeEach(async function () {
      await socialMedia.connect(user1).registerUser("Alice", "Bio", "");
      await socialMedia.connect(user2).registerUser("Bob", "Bio", "");
      await socialMedia.connect(user1).createPost("Post 1", "");
    });

    it("Should toggle like a post", async function () {
      await socialMedia.connect(user2).toggleLike(1);
      let post = await socialMedia.posts(1);
      expect(post.likesCount).to.equal(1n);
      expect(await socialMedia.postLikes(1, user2.address)).to.equal(true);

      await socialMedia.connect(user2).toggleLike(1);
      post = await socialMedia.posts(1);
      expect(post.likesCount).to.equal(0n);
    });

    it("Should toggle dislike a post", async function () {
      await socialMedia.connect(user2).toggleDislike(1);
      let post = await socialMedia.posts(1);
      expect(post.dislikesCount).to.equal(1n);
      expect(await socialMedia.postDislikes(1, user2.address)).to.equal(true);

      await socialMedia.connect(user2).toggleDislike(1);
      post = await socialMedia.posts(1);
      expect(post.dislikesCount).to.equal(0n);
    });

    it("Should remove dislike if liking", async function () {
      await socialMedia.connect(user2).toggleDislike(1);
      await socialMedia.connect(user2).toggleLike(1);
      
      let post = await socialMedia.posts(1);
      expect(post.likesCount).to.equal(1n);
      expect(post.dislikesCount).to.equal(0n);
    });
  });

  describe("Comments", function () {
    beforeEach(async function () {
      await socialMedia.connect(user1).registerUser("Alice", "Bio", "");
      await socialMedia.connect(user2).registerUser("Bob", "Bio", "");
      await socialMedia.connect(user1).createPost("Post 1", "");
    });

    it("Should add a comment", async function () {
      await socialMedia.connect(user2).addComment(1, "Great post!");
      const comments = await socialMedia.getComments(1);
      
      expect(comments.length).to.equal(1);
      expect(comments[0].author).to.equal(user2.address);
      expect(comments[0].content).to.equal("Great post!");
    });
  });

  describe("Following System", function () {
    beforeEach(async function () {
      await socialMedia.connect(user1).registerUser("Alice", "Bio", "");
      await socialMedia.connect(user2).registerUser("Bob", "Bio", "");
    });

    it("Should follow and unfollow a user", async function () {
      await socialMedia.connect(user1).followUser(user2.address);
      
      expect(await socialMedia.isFollowing(user1.address, user2.address)).to.equal(true);
      
      let profile1 = await socialMedia.getUser(user1.address);
      let profile2 = await socialMedia.getUser(user2.address);
      
      expect(profile1.followingCount).to.equal(1n);
      expect(profile2.followersCount).to.equal(1n);

      await socialMedia.connect(user1).unfollowUser(user2.address);
      expect(await socialMedia.isFollowing(user1.address, user2.address)).to.equal(false);
    });
  });

  describe("Messaging System", function () {
    beforeEach(async function () {
      await socialMedia.connect(user1).registerUser("Alice", "Bio", "");
      await socialMedia.connect(user2).registerUser("Bob", "Bio", "");
    });

    it("Should send and receive messages", async function () {
      await socialMedia.connect(user1).sendMessage(user2.address, "Hi Bob!");
      await socialMedia.connect(user2).sendMessage(user1.address, "Hello Alice!");
      
      const messages1 = await socialMedia.connect(user1).getMessages(user2.address);
      expect(messages1.length).to.equal(2);
      expect(messages1[0].content).to.equal("Hi Bob!");
      expect(messages1[1].content).to.equal("Hello Alice!");

      const history = await socialMedia.connect(user1).getChatHistory();
      expect(history.length).to.equal(1);
      expect(history[0]).to.equal(user2.address);
    });
  });
});
