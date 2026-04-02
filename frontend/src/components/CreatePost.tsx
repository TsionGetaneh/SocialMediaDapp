import React, { useState, useRef } from "react";
import { Send, Image as ImageIcon, Loader2, X, FilePlus } from "lucide-react";
import { toast } from "react-toastify";

interface CreatePostProps {
  onCreatePost: (content: string, imageHash: string) => Promise<void>;
  loading: boolean;
}

const CreatePost: React.FC<CreatePostProps> = ({ onCreatePost, loading }) => {
  const [content, setContent] = useState("");
  const [imageHash, setImageHash] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    let finalImageHash = imageHash;
    if (selectedFile) {
      try {
        toast.info("Uploading image to IPFS...");
        finalImageHash = await uploadToIPFS(selectedFile);
      } catch (error) {
        toast.error("Image upload failed");
        return;
      }
    }

    await onCreatePost(content, finalImageHash);
    setContent("");
    setImageHash("");
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 hover:shadow-md transition duration-300">
      <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-gray-50">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-100">
          S
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">
            Create Post
          </h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Share your thoughts
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative group">
          <textarea
            className="w-full border-2 border-gray-50 rounded-2xl p-5 min-h-[160px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition text-gray-800 resize-none shadow-inner bg-gray-50/30 text-lg font-medium"
            placeholder="What's happening in the decentralized world?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading || uploading}
          />
        </div>

        {previewUrl && (
          <div className="relative rounded-2xl overflow-hidden border-4 border-gray-50 shadow-sm animate-in zoom-in-95 duration-300">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-64 object-cover"
            />
            <button
              type="button"
              onClick={removeSelectedFile}
              className="absolute top-3 right-3 bg-black/50 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur-md transition duration-200"
            >
              <X size={20} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="text-white text-xs font-bold uppercase tracking-widest">
                Image Selected: {selectedFile?.name}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div className="flex space-x-2">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 text-blue-600 font-bold text-sm hover:bg-blue-50 transition px-4 py-2 rounded-xl"
              disabled={loading || uploading}
            >
              <ImageIcon size={20} />
              <span>{previewUrl ? "Change Image" : "Add Image"}</span>
            </button>

            {!previewUrl && (
              <button
                type="button"
                onClick={() => {
                  const hash = prompt("Enter IPFS Hash manually:");
                  if (hash) setImageHash(hash);
                }}
                className="flex items-center space-x-2 text-gray-500 font-bold text-sm hover:bg-gray-100 transition px-4 py-2 rounded-xl"
                disabled={loading || uploading}
              >
                <FilePlus size={20} />
                <span>Manual Hash</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || uploading || !content.trim()}
            className={`
              flex items-center space-x-2 px-10 py-3 rounded-2xl font-black text-lg shadow-xl transition duration-300
              ${
                loading || uploading || !content.trim()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 hover:shadow-blue-200"
              }
            `}
          >
            {loading || uploading ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                <span>{uploading ? "Uploading..." : "Posting..."}</span>
              </>
            ) : (
              <>
                <Send size={24} />
                <span>Post Now</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
