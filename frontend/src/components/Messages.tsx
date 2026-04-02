import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Send, User, MessageSquare, Loader2, ArrowLeft } from 'lucide-react';
import { formatAddress } from '../utils/contract';
import { toast } from 'react-toastify';

interface Message {
  sender: string;
  receiver: string;
  content: string;
  timestamp: number;
}

interface MessagesProps {
  contract: ethers.Contract | null;
  account: string | null;
}

const Messages: React.FC<MessagesProps> = ({ contract, account }) => {
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchChatHistory = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const history = await contract.getChatHistory();
      setChatHistory(history);
    } catch (error) {
      console.error('Fetch chat history error:', error);
    }
  }, [contract, account]);

  const fetchMessages = useCallback(async (otherUser: string) => {
    if (!contract) return;
    try {
      setLoadingMessages(true);
      const msgs = await contract.getMessages(otherUser);
      setMessages(msgs.map((m: any) => ({
        sender: m.sender,
        receiver: m.receiver,
        content: m.content,
        timestamp: Number(m.timestamp)
      })));
    } catch (error) {
      console.error('Fetch messages error:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, [contract]);

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser);
      const interval = setInterval(() => fetchMessages(selectedUser), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedUser, fetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !selectedUser || !newMessage.trim()) return;

    try {
      setLoading(true);
      const tx = await contract.sendMessage(selectedUser, newMessage);
      setNewMessage('');
      await tx.wait();
      fetchMessages(selectedUser);
      fetchChatHistory();
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    const address = prompt('Enter the wallet address to message:');
    if (address && ethers.isAddress(address)) {
      setSelectedUser(address);
    } else if (address) {
      toast.error('Invalid Ethereum address');
    }
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 mt-10">
        <div className="p-4 bg-blue-50 rounded-full mb-4">
          <MessageSquare size={48} className="text-blue-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Connect Your Wallet</h3>
        <p className="text-gray-500 max-w-xs text-center">
          Connect your wallet to start messaging other users.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 flex h-[700px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/50">
        <div className="p-6 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Messages</h2>
            <button 
              onClick={startNewChat}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-200"
            >
              <MessageSquare size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {chatHistory.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-400 font-medium">No conversations yet</p>
            </div>
          ) : (
            chatHistory.map((user) => (
              <button
                key={user}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-4 flex items-center space-x-4 hover:bg-white transition border-l-4 ${
                  selectedUser === user ? 'bg-white border-blue-600' : 'border-transparent'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {user.substring(2, 4).toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-900">{formatAddress(user)}</p>
                  <p className="text-xs text-gray-500 truncate">Click to view messages</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center space-x-4">
                <button onClick={() => setSelectedUser(null)} className="md:hidden p-2 text-gray-400">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-sm">
                  {selectedUser.substring(2, 4).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 tracking-tight">{formatAddress(selectedUser)}</h3>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Online</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="animate-spin text-blue-500" />
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender.toLowerCase() === account.toLowerCase() ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${
                        msg.sender.toLowerCase() === account.toLowerCase()
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                      }`}
                    >
                      <p className="text-sm leading-relaxed font-medium">{msg.content}</p>
                      <p className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${
                        msg.sender.toLowerCase() === account.toLowerCase() ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-white border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-medium"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:bg-gray-200 disabled:shadow-none"
                >
                  {loading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6">
              <MessageSquare size={40} className="text-blue-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Your Conversations</h3>
            <p className="text-gray-500 max-w-xs font-medium">
              Select a chat from the sidebar or start a new conversation to begin messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
