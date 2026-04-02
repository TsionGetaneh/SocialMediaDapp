import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Edit3,
  Save,
  MapPin,
  Calendar,
  ExternalLink,
  Loader2,
  RefreshCw,
  Users,
  FileText,
  Heart,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { formatAddress, getIPFSUrl } from "../utils/contract";
import { ethers } from "ethers";
import { toast } from "react-toastify";

interface UserProfile {
  username: string;
  bio: string;
  profilePic: string;
  totalPosts: number;
  totalTipsReceived: bigint;
  registered: boolean;
  followersCount: number;
  followingCount: number;
}

interface ProfileProps {
  account: string | null;
  profile: UserProfile | null;
  onRegister: (
    username: string,
    bio: string,
    profilePic: string,
  ) => Promise<void>;
  loading: boolean;
  refreshProfile: () => void;
}

const Profile: React.FC<ProfileProps> = ({
  account,
  profile,
  onRegister,
  loading,
  refreshProfile,
}) => {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setBio(profile.bio);
      setProfilePic(profile.profilePic);
      if (profile.profilePic) {
        setPreviewUrl(getIPFSUrl(profile.profilePic));
      }
    }
  }, [profile]);

  const uploadToIPFS = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      setUploading(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setUploading(false);
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        setUploading(false);
        reject(error);
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreviewUrl(URL.createObjectURL(file));
      try {
        const hash = await uploadToIPFS(file);
        setProfilePic(hash);
        toast.success("Profile picture uploaded!");
      } catch (error) {
        toast.error("Failed to upload profile picture");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    await onRegister(username, bio, profilePic);
    setIsEditing(false);
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] shadow-sm border border-gray-100 mt-10">
        <div className="p-6 bg-blue-50 rounded-3xl mb-6 shadow-inner">
          <User size={64} className="text-blue-500" />
        </div>
        <h3 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
          Connect Your Wallet
        </h3>
        <p className="text-gray-400 max-w-xs text-center font-bold uppercase tracking-widest text-xs">
          Access your decentralized profile
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Top Identity Header */}
      {profile?.registered && (
        <div className="bg-white rounded-[40px] p-2 shadow-sm border border-gray-100 flex items-center space-x-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-20 h-20 rounded-[20px] overflow-hidden border-2 border-blue-500/20 p-1">
            {profile.profilePic ? (
              <img
                src={getIPFSUrl(profile.profilePic)}
                alt=""
                className="w-full h-full object-cover rounded-[15px]"
              />
            ) : (
              <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-black text-2xl rounded-[15px]">
                {profile.username.substring(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {profile.username}
            </h1>
            <p className="text-sm font-medium text-gray-500 leading-tight line-clamp-1">
              {profile.bio}
            </p>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition duration-500">
        <div className="h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>
        <div className="px-10 pb-10">
          <div className="relative flex justify-between items-end -mt-20 mb-8">
            <div className="relative group">
              <div className="w-40 h-40 rounded-[35px] bg-white p-2 shadow-2xl">
                {profile?.profilePic ? (
                  <img
                    src={getIPFSUrl(profile.profilePic)}
                    alt="Profile"
                    className="w-full h-full rounded-[28px] object-cover border-4 border-white shadow-inner"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/150?text=?";
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-[28px] bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-black border-4 border-white shadow-inner">
                    {profile?.username
                      ? profile.username.substring(0, 1).toUpperCase()
                      : "?"}
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-3 mb-4">
              <button
                onClick={refreshProfile}
                className="p-3 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-2xl transition shadow-sm"
              >
                <RefreshCw
                  size={24}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 hover:-translate-y-1 transition shadow-xl shadow-blue-100"
              >
                {isEditing ? <X size={18} /> : <Edit3 size={18} />}
                <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="space-y-6 flex-1">
              <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                  {profile?.username || "Anonymous User"}
                </h2>
                <div className="flex items-center mt-2 group cursor-pointer">
                  <span className="text-blue-500 font-bold text-sm bg-blue-50 px-3 py-1 rounded-lg group-hover:bg-blue-100 transition">
                    {formatAddress(account)}
                  </span>
                  <ExternalLink
                    size={14}
                    className="ml-2 text-gray-300 group-hover:text-blue-400 transition"
                  />
                </div>
              </div>

              {profile?.bio ? (
                <p className="text-gray-600 text-lg leading-relaxed max-w-2xl font-medium">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-gray-300 italic font-medium">
                  No bio added yet. Tell the world about yourself!
                </p>
              )}

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                  <MapPin size={16} className="text-blue-500" />
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                    Sepolia Testnet
                  </span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                  <Calendar size={16} className="text-blue-500" />
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                    Active Member
                  </span>
                </div>
              </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex flex-col items-center justify-center min-w-[150px] shadow-sm hover:shadow-md transition">
                <Users size={24} className="text-blue-500 mb-2" />
                <span className="text-3xl font-black text-blue-700 leading-none">
                  {profile?.followersCount.toString() || "0"}
                </span>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-2">
                  Followers
                </span>
              </div>
              <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex flex-col items-center justify-center min-w-[150px] shadow-sm hover:shadow-md transition">
                <Users size={24} className="text-indigo-500 mb-2" />
                <span className="text-3xl font-black text-indigo-700 leading-none">
                  {profile?.followingCount.toString() || "0"}
                </span>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2">
                  Following
                </span>
              </div>
              <div className="bg-purple-50/50 p-6 rounded-3xl border border-purple-100 flex flex-col items-center justify-center min-w-[150px] shadow-sm hover:shadow-md transition">
                <FileText size={24} className="text-purple-500 mb-2" />
                <span className="text-3xl font-black text-purple-700 leading-none">
                  {profile?.totalPosts.toString() || "0"}
                </span>
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest mt-2">
                  Posts
                </span>
              </div>
              <div className="bg-green-50/50 p-6 rounded-3xl border border-green-100 flex flex-col items-center justify-center min-w-[150px] shadow-sm hover:shadow-md transition">
                <Heart size={24} className="text-green-500 mb-2" />
                <span className="text-2xl font-black text-green-700 leading-none truncate max-w-[100px]">
                  {profile
                    ? ethers.formatEther(profile.totalTipsReceived.toString())
                    : "0"}
                </span>
                <span className="text-[10px] font-black text-green-400 uppercase tracking-widest mt-2">
                  Tips (ETH)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="bg-white rounded-[40px] shadow-2xl border-4 border-blue-500/10 p-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center space-x-4 mb-10 pb-4 border-b border-gray-50">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
              <Edit3 size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                Update Profile
              </h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Customize your digital identity
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-[30px] bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={48} className="text-gray-300" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-3 rounded-2xl shadow-lg hover:bg-blue-700 transition"
                  disabled={uploading}
                >
                  <ImageIcon size={20} />
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <p className="mt-4 text-xs font-black text-gray-400 uppercase tracking-widest">
                Profile Picture
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Username
              </label>
              <input
                className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl p-5 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition text-lg font-bold text-gray-900 shadow-inner"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a legendary username"
                required
                disabled={loading || uploading}
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Bio
              </label>
              <textarea
                className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl p-5 min-h-[150px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition text-lg font-medium text-gray-700 resize-none shadow-inner"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your story with the world..."
                disabled={loading || uploading}
              />
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading || uploading || !username.trim()}
                className={`
                  flex items-center space-x-3 px-12 py-4 rounded-2xl font-black text-lg shadow-2xl transition duration-300
                  ${
                    loading || uploading || !username.trim()
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed shadow-none"
                      : "bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 hover:shadow-blue-200"
                  }
                `}
              >
                {loading || uploading ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    <span>{uploading ? "Uploading..." : "Saving..."}</span>
                  </>
                ) : (
                  <>
                    <Save size={24} />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
