import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ethers } from "ethers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar";
import PostList from "./components/PostList";
import CreatePost from "./components/CreatePost";
import Profile from "./components/Profile";
import Messages from "./components/Messages";
import { getContract, SEPOLIA_CHAIN_ID } from "./utils/contract";
import config from "./contracts-config.json";

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = posts.filter(
    (post) =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.authorUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask!");
      return;
    }

    try {
      setLoading(true);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const chainId = await window.ethereum.request({ method: "eth_chainId" });

      if (chainId !== SEPOLIA_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            toast.error(
              "Sepolia network not found in MetaMask. Please add it.",
            );
          } else {
            toast.error("Failed to switch to Sepolia network.");
          }
          return;
        }
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      console.log("Connected account:", accounts[0]);
      console.log("Contract address from config:", config.address);

      if (
        !config.address ||
        config.address === "YOUR_DEPLOYED_CONTRACT_ADDRESS" ||
        !ethers.isAddress(config.address)
      ) {
        throw new Error(
          "Invalid or missing contract address in contracts-config.json",
        );
      }

      const socialMediaContract = getContract(signer);

      // Verify the contract has the expected functions
      if (!socialMediaContract.registerUser) {
        throw new Error(
          "ABI mismatch: registerUser not found in contract instance",
        );
      }

      setAccount(accounts[0]);
      setNetwork("Sepolia");
      setContract(socialMediaContract);

      toast.success("Wallet connected!");
    } catch (error: any) {
      console.error("Wallet Connection Error:", error);
      const errorMessage =
        error.code === 4001
          ? "Please approve the connection in MetaMask."
          : error.reason || error.message || "Unknown error";
      toast.error("Connection failed: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = useCallback(async () => {
    if (!contract) return;
    try {
      setLoading(true);
      const totalPosts = await contract.getTotalPosts();
      if (totalPosts > 0n) {
        const postsData = await contract.getPosts(0, totalPosts - 1n);
        const formattedPosts = await Promise.all(
          postsData
            .filter((post: any) => post.author !== ethers.ZeroAddress)
            .map(async (post: any) => {
              const comments = await contract.getComments(post.id);
              const userLiked = account
                ? await contract.postLikes(post.id, account)
                : false;
              const userDisliked = account
                ? await contract.postDislikes(post.id, account)
                : false;
              const authorProfile = await contract.getUser(post.author);
              const isFollowingAuthor = account
                ? await contract.isFollowing(account, post.author)
                : false;

              return {
                id: Number(post.id),
                author: post.author,
                authorUsername: authorProfile.username,
                authorProfilePic: authorProfile.profilePic,
                content: post.content,
                imageHash: post.imageHash,
                likesCount: Number(post.likesCount),
                dislikesCount: Number(post.dislikesCount),
                tipAmount: post.tipAmount,
                timestamp: Number(post.timestamp),
                comments: comments.map((c: any) => ({
                  author: c.author,
                  content: c.content,
                  timestamp: Number(c.timestamp),
                })),
                userLiked,
                userDisliked,
                isFollowingAuthor,
              };
            }),
        );
        setPosts(formattedPosts);
      } else {
        setPosts([]);
      }
    } catch (error: any) {
      console.error("Fetch posts error:", error);
    } finally {
      setLoading(false);
    }
  }, [contract, account]);

  const fetchProfile = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const profile = await contract.getUser(account);
      setUserProfile({
        username: profile.username,
        bio: profile.bio,
        profilePic: profile.profilePic,
        totalPosts: Number(profile.totalPosts),
        totalTipsReceived: profile.totalTipsReceived,
        registered: profile.registered,
        followersCount: Number(profile.followersCount),
        followingCount: Number(profile.followingCount),
      });
    } catch (error: any) {
      console.error("Fetch profile error:", error);
    }
  }, [contract, account]);

  useEffect(() => {
    if (contract) {
      fetchPosts();
      fetchProfile();

      // Listen for events
      const onPostCreated = () => fetchPosts();
      const onPostLiked = () => fetchPosts();
      const onPostDeleted = () => fetchPosts();
      const onUserRegistered = () => fetchProfile();
      const onUserFollowed = () => {
        fetchProfile();
        fetchPosts();
      };

      contract.on("PostCreated", onPostCreated);
      contract.on("PostLiked", onPostLiked);
      contract.on("PostDeleted", onPostDeleted);
      contract.on("UserRegistered", onUserRegistered);
      contract.on("UserFollowed", onUserFollowed);
      contract.on("UserUnfollowed", onUserFollowed);

      return () => {
        contract.off("PostCreated", onPostCreated);
        contract.off("PostLiked", onPostLiked);
        contract.off("PostDeleted", onPostDeleted);
        contract.off("UserRegistered", onUserRegistered);
        contract.off("UserFollowed", onUserFollowed);
        contract.off("UserUnfollowed", onUserFollowed);
      };
    }
  }, [contract, account, fetchPosts, fetchProfile]);

  const handleCreatePost = async (content: string, imageHash: string) => {
    if (!contract || !userProfile?.registered) {
      toast.warning("Please register your profile first!");
      return;
    }
    try {
      setLoading(true);
      const tx = await contract.createPost(content, imageHash);
      toast.info("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      toast.success("Post created successfully!");
      fetchPosts();
      fetchProfile();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to create post: " + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    if (!contract || !userProfile?.registered) {
      toast.warning("Please register your profile first!");
      return;
    }
    try {
      const tx = await contract.toggleLike(postId);
      await tx.wait();
      fetchPosts();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to toggle like");
    }
  };

  const handleDislike = async (postId: number) => {
    if (!contract || !userProfile?.registered) {
      toast.warning("Please register your profile first!");
      return;
    }
    try {
      const tx = await contract.toggleDislike(postId);
      await tx.wait();
      fetchPosts();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to toggle dislike");
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!contract) return;
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      setLoading(true);
      const tx = await contract.deletePost(postId);
      await tx.wait();
      toast.success("Post deleted successfully!");
      fetchPosts();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to delete post");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (postId: number, content: string) => {
    if (!contract || !userProfile?.registered) {
      toast.warning("Please register your profile first!");
      return;
    }
    try {
      const tx = await contract.addComment(postId, content);
      await tx.wait();
      toast.success("Comment added!");
      fetchPosts();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to add comment");
    }
  };

  const handleFollow = async (userAddress: string) => {
    if (!contract || !userProfile?.registered) {
      toast.warning("Please register your profile first!");
      return;
    }
    try {
      const isCurrentlyFollowing = await contract.isFollowing(
        account,
        userAddress,
      );
      const tx = isCurrentlyFollowing
        ? await contract.unfollowUser(userAddress)
        : await contract.followUser(userAddress);
      await tx.wait();
      toast.success(isCurrentlyFollowing ? "Unfollowed!" : "Followed!");
      fetchProfile();
      fetchPosts();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to update follow status");
    }
  };

  const handleTip = async (postId: number) => {
    if (!contract) return;
    const amount = prompt("Enter tip amount in ETH:");
    if (!amount || isNaN(Number(amount))) return;

    try {
      setLoading(true);
      const tx = await contract.tipPost(postId, {
        value: ethers.parseEther(amount),
      });
      toast.info("Sending tip...");
      await tx.wait();
      toast.success("Tip sent successfully!");
      fetchPosts();
      fetchProfile();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to send tip: " + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (
    username: string,
    bio: string,
    profilePic: string,
  ) => {
    if (!contract) return;
    try {
      setLoading(true);
      const tx = await contract.registerUser(username, bio, profilePic);
      toast.info("Updating profile...");
      await tx.wait();
      toast.success("Profile updated successfully!");
      fetchProfile();
    } catch (error: any) {
      console.error(error);
      toast.error(
        "Failed to update profile: " + (error.reason || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        <Navbar
          account={account}
          connectWallet={connectWallet}
          network={network}
          userProfile={userProfile}
          onSearch={setSearchQuery}
        />

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Routes>
            <Route
              path="/"
              element={
                <div className="space-y-12">
                  <div className="space-y-4">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center space-x-3">
                      <span className="bg-blue-600 w-2 h-10 rounded-full inline-block"></span>
                      <span>Recent Feed</span>
                    </h1>
                    <p className="text-gray-500 text-lg font-medium pl-5">
                      See what's happening in the decentralized world.
                    </p>
                  </div>

                  {account && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                      <CreatePost
                        onCreatePost={handleCreatePost}
                        loading={loading}
                      />
                    </div>
                  )}

                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <PostList
                      posts={filteredPosts}
                      onLike={handleLike}
                      onDislike={handleDislike}
                      onTip={handleTip}
                      onComment={handleAddComment}
                      onFollow={handleFollow}
                      onDelete={handleDeletePost}
                      currentAccount={account}
                      loading={loading && posts.length === 0}
                    />
                  </div>
                </div>
              }
            />

            <Route
              path="/profile"
              element={
                <div className="animate-in zoom-in-95 duration-300">
                  <Profile
                    account={account}
                    profile={userProfile}
                    onRegister={handleRegister}
                    loading={loading}
                    refreshProfile={fetchProfile}
                  />
                </div>
              }
            />

            <Route
              path="/messages"
              element={<Messages contract={contract} account={account} />}
            />
          </Routes>
        </main>

        <footer className="border-t border-gray-100 mt-20 py-10 bg-white">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-400 font-bold tracking-widest text-xs uppercase">
              Built on Ethereum Sepolia • 2024 SocialDapp
            </p>
          </div>
        </footer>

        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </Router>
  );
}

export default App;
