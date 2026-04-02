import React, { useState } from "react";
import {
  Heart,
  HeartOff,
  MessageCircle,
  DollarSign,
  ExternalLink,
  UserPlus,
  UserMinus,
  Send,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import { formatAddress, getIPFSUrl } from "../utils/contract";
import { ethers } from "ethers";

interface Comment {
  author: string;
  content: string;
  timestamp: number;
}

interface Post {
  id: number;
  author: string;
  authorUsername: string;
  authorProfilePic: string;
  content: string;
  imageHash: string;
  likesCount: number;
  dislikesCount: number;
  tipAmount: bigint;
  timestamp: number;
  comments: Comment[];
  userLiked: boolean;
  userDisliked: boolean;
  isFollowingAuthor: boolean;
}

interface PostListProps {
  posts: Post[];
  onLike: (postId: number) => void;
  onDislike: (postId: number) => void;
  onTip: (postId: number) => void;
  onComment: (postId: number, content: string) => void;
  onFollow: (userAddress: string) => void;
  onDelete: (postId: number) => void;
  currentAccount: string | null;
  loading: boolean;
}

const PostList: React.FC<PostListProps> = ({
  posts,
  onLike,
  onDislike,
  onTip,
  onComment,
  onFollow,
  onDelete,
  currentAccount,
  loading,
}) => {
  const [commentText, setCommentText] = useState<{ [key: number]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: number]: boolean }>(
    {},
  );

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const handleShare = (postId: number) => {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-2xl h-12 w-12 border-4 border-blue-600 border-t-transparent shadow-xl"></div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400 bg-white rounded-3xl shadow-sm border border-gray-100 mt-8">
        <p className="text-2xl font-black tracking-tight">Your feed is empty</p>
        <p className="text-sm font-bold uppercase tracking-widest mt-2">
          Be the first to share something!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition duration-500 group"
        >
          <div className="p-8">
            {/* Header: Author Info */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-lg shadow-blue-100 overflow-hidden">
                  {post.authorProfilePic ? (
                    <img
                      src={getIPFSUrl(post.authorProfilePic)}
                      alt="Author"
                      className="w-full h-full rounded-xl object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://via.placeholder.com/150?text=?";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl">
                      {post.authorUsername
                        ? post.authorUsername.substring(0, 1).toUpperCase()
                        : "?"}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-black text-gray-900 leading-tight text-lg">
                    {post.authorUsername || formatAddress(post.author)}
                  </h4>
                  <div className="flex items-center space-x-2 text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                    <span>{formatAddress(post.author)}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(post.timestamp)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {currentAccount &&
                  currentAccount.toLowerCase() !==
                    post.author.toLowerCase() && (
                    <button
                      onClick={() => onFollow(post.author)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-sm ${
                        post.isFollowingAuthor
                          ? "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                      }`}
                    >
                      {post.isFollowingAuthor ? (
                        <UserMinus size={14} />
                      ) : (
                        <UserPlus size={14} />
                      )}
                      <span>
                        {post.isFollowingAuthor ? "Unfollow" : "Follow"}
                      </span>
                    </button>
                  )}

                {currentAccount &&
                  currentAccount.toLowerCase() ===
                    post.author.toLowerCase() && (
                    <button
                      onClick={() => onDelete(post.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}

                <button
                  onClick={() => handleShare(post.id)}
                  className="p-2 text-gray-300 hover:text-blue-500 transition"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <p className="text-gray-800 text-xl mb-8 leading-relaxed font-medium">
              {post.content}
            </p>

            {/* Optional Image */}
            {post.imageHash && (
              <div className="mb-8 rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 shadow-inner group-hover:shadow-md transition duration-500">
                <img
                  src={getIPFSUrl(post.imageHash)}
                  alt="Post content"
                  className="w-full object-cover max-h-[500px]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/800x400?text=Image+Unavailable";
                  }}
                />
              </div>
            )}

            {/* Interaction Bar */}
            <div className="flex items-center justify-between border-t border-gray-50 pt-6 mt-4">
              <div className="flex items-center space-x-2 md:space-x-4">
                <div className="flex items-center bg-gray-50 rounded-2xl p-1">
                  <button
                    onClick={() => onLike(post.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition font-black text-sm ${
                      post.userLiked
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-400 hover:text-blue-500"
                    }`}
                  >
                    <ThumbsUp
                      size={18}
                      fill={post.userLiked ? "currentColor" : "none"}
                    />
                    <span>{post.likesCount}</span>
                  </button>
                  <button
                    onClick={() => onDislike(post.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition font-black text-sm ${
                      post.userDisliked
                        ? "bg-white text-red-600 shadow-sm"
                        : "text-gray-400 hover:text-red-500"
                    }`}
                  >
                    <ThumbsDown
                      size={18}
                      fill={post.userDisliked ? "currentColor" : "none"}
                    />
                    <span>{post.dislikesCount}</span>
                  </button>
                </div>

                <button
                  onClick={() =>
                    setShowComments({
                      ...showComments,
                      [post.id]: !showComments[post.id],
                    })
                  }
                  className="flex items-center space-x-2 px-4 py-3 rounded-2xl text-gray-400 hover:bg-gray-50 hover:text-blue-600 transition font-black text-sm"
                >
                  <MessageCircle size={18} />
                  <span>{post.comments.length}</span>
                </button>

                <div className="hidden md:flex items-center space-x-2 px-4 py-3 rounded-2xl bg-green-50 text-green-600 font-black text-sm">
                  <DollarSign size={18} />
                  <span>{ethers.formatEther(post.tipAmount)} ETH</span>
                </div>
              </div>

              <button
                onClick={() => onTip(post.id)}
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 hover:-translate-y-1 transition flex items-center space-x-2 shadow-xl shadow-blue-100"
              >
                <DollarSign size={16} />
                <span>Tip</span>
              </button>
            </div>

            {/* Comments Section */}
            {showComments[post.id] && (
              <div className="mt-8 pt-8 border-t border-gray-50 space-y-6 animate-in slide-in-from-top-4 duration-300">
                <div className="space-y-4">
                  {post.comments.map((comment, idx) => (
                    <div
                      key={idx}
                      className="flex space-x-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs">
                        {comment.author.substring(2, 4).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-gray-900 uppercase tracking-tight">
                            {formatAddress(comment.author)}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {new Date(
                              comment.timestamp * 1000,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {currentAccount && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (commentText[post.id]) {
                        onComment(post.id, commentText[post.id]);
                        setCommentText({ ...commentText, [post.id]: "" });
                      }
                    }}
                    className="flex space-x-3"
                  >
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentText[post.id] || ""}
                      onChange={(e) =>
                        setCommentText({
                          ...commentText,
                          [post.id]: e.target.value,
                        })
                      }
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-medium"
                    />
                    <button
                      type="submit"
                      disabled={!commentText[post.id]}
                      className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition disabled:bg-gray-200 shadow-sm"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostList;
