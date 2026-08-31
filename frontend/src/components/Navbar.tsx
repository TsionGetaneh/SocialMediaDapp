import React from "react";
import { Link } from "react-router-dom";
import { formatAddress, getIPFSUrl } from "../utils/contract";
import { Wallet,  Search } from "lucide-react";

interface NavbarProps {
  account: string | null;
  connectWallet: () => void;
  network: string | null;
  userProfile?: any;
  onSearch?: (query: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  account,
  connectWallet,
  network,
  userProfile,
  onSearch,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
  };
  return (
    <nav className="bg-white border-b border-gray-100 p-4 sticky top-0 z-50 backdrop-blur-md bg-white/80">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <Link
            to="/"
            className="text-2xl font-black tracking-tighter text-blue-600 flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
            <span>SocialDapp</span>
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link
              to="/"
              className="font-bold text-gray-500 hover:text-blue-600 transition text-sm uppercase tracking-widest"
            >
              Home
            </Link>
            <Link
              to="/profile"
              className="font-bold text-gray-500 hover:text-blue-600 transition text-sm uppercase tracking-widest"
            >
              Profile
            </Link>
            <Link
              to="/messages"
              className="font-bold text-gray-500 hover:text-blue-600 transition text-sm uppercase tracking-widest flex items-center space-x-1"
            >
              <span>Messages</span>
            </Link>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8">
          <form onSubmit={handleSearchSubmit} className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition"
              size={18}
            />
            <input
              type="text"
              placeholder="Search users or posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2.5 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition font-medium text-sm"
            />
          </form>
        </div>

        <div className="flex items-center space-x-4">
          {network && (
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                network === "Sepolia"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {network}
            </span>
          )}

          {account ? (
            <div className="flex items-center space-x-3 bg-gray-50 border border-gray-100 pl-4 pr-2 py-1.5 rounded-2xl shadow-sm">
              <span className="text-xs font-black text-gray-600 tracking-tight">
                {formatAddress(account)}
              </span>
              <div className="w-8 h-8 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                {userProfile?.profilePic ? (
                  <img
                    src={getIPFSUrl(userProfile.profilePic)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-black text-xs">
                    {userProfile?.username
                      ? userProfile.username.substring(0, 1).toUpperCase()
                      : "?"}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-2xl font-black text-sm hover:bg-blue-700 transition shadow-xl shadow-blue-100"
            >
              <Wallet size={18} />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
