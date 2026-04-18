import React, { useState, useRef, useEffect } from "react";
import { Image, Video, Type, X, Upload, Palette, Sparkles } from "lucide-react";
import api from "../utils/api";

export default function AddPostModal({ isOpen, onClose, onPostAdded }) {
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  // New states for text post mode
  const [postMode, setPostMode] = useState("media"); // or 'text'
  const [backgroundColor, setBackgroundColor] = useState("#FFD700");
  const [textColor, setTextColor] = useState("#222222"); // default text color
  const [textContent, setTextContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setMediaFile(null);
      setMediaPreview(null);
      setCaption("");
      setUploading(false);
      setPostMode("media");
      setBackgroundColor("#FFD700");
      setTextColor("#222222");
      setTextContent("");
      setIsDragging(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!mediaFile) {
      setMediaPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(mediaFile);
    setMediaPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [mediaFile]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        alert("Only image and video files are allowed.");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        alert("File size must be under 20MB.");
        return;
      }
      setMediaFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        alert("Only image and video files are allowed.");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        alert("File size must be under 20MB.");
        return;
      }
      setMediaFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      if (postMode === "media") {
        if (!mediaFile) {
          setUploading(false);
          return alert("Please select an image or video.");
        }
        const formData = new FormData();
        formData.append("media", mediaFile);
        formData.append("caption", caption);

        const response = await api.post("/posts", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.status === 201) {
          onPostAdded(response.data.post);
          setMediaFile(null);
          setMediaPreview(null);
          setCaption("");
          onClose();
        } else {
          alert("Failed to add post");
        }
      } else if (postMode === "text") {
        if (!textContent.trim()) {
          setUploading(false);
          return alert("Post text is required.");
        }

        const response = await api.post("/posts", {
          text_content: textContent,
          background_color: backgroundColor,
          text_color: textColor,
          caption, // optional
        });

        if (response.status === 201) {
          onPostAdded(response.data.post);
          setTextContent("");
          setBackgroundColor("#FFD700");
          setTextColor("#222222");
          onClose();
        } else {
          alert("Failed to add text post");
        }
      }
    } catch (err) {
      console.error("Post creation error:", err);
      alert("Server error");
      if (err.response) {
        console.error("Error response:", err.response.data);
      } else if (err.request) {
        console.error("No response received:", err.request);
      } else {
        console.error("Request setup error:", err.message);
      }
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <form
        ref={modalRef}
        onSubmit={handleSubmit}
        className="bg-white shadow-2xl w-full max-w-full sm:max-w-xl md:max-w-2xl h-full sm:h-auto sm:rounded-2xl flex flex-col overflow-hidden max-h-screen sm:max-h-[95vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="addPostTitle"
      >
        {/* Header */}
        <div className="relative px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <h2 id="addPostTitle" className="text-center pr-8 text-base sm:text-lg font-semibold">
            <Sparkles className="inline-block w-5 h-5 text-purple-500 mr-2 mb-1" />
            Create New Post
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all duration-200"
            disabled={uploading}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Mode Toggle Buttons */}
          <div className="flex flex-row justify-center gap-2 sm:gap-3 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg transition-all duration-200 ${
                postMode === "media"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105"
                  : "bg-transparent text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setPostMode("media")}
            >
              <Image className="w-4 h-4" />
              <span className="font-medium">Media Post</span>
            </button>
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg transition-all duration-200 ${
                postMode === "text"
                  ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md transform scale-105"
                  : "bg-transparent text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setPostMode("text")}
            >
              <Type className="w-4 h-4" />
              <span className="font-medium">Text Post</span>
            </button>
          </div>

          {/* Media Post UI */}
          {postMode === "media" && (
            <>
              <div
                className={`relative border-2 border-dashed rounded-xl h-52 sm:h-64 md:h-80 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden group ${
                  isDragging
                    ? "border-blue-500 bg-blue-50 scale-[1.02]"
                    : mediaPreview
                    ? "border-gray-300"
                    : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                }`}
                onClick={() => !mediaPreview && fileInputRef.current.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !mediaPreview) {
                    e.preventDefault();
                    fileInputRef.current.click();
                  }
                }}
                aria-label="Drag and drop media here or click to select"
              >
                {!mediaPreview && (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                      <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-4">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2 font-medium">
                      {isDragging ? "Drop your file here" : "Drop your media here"}
                    </p>
                    <p className="text-gray-500 text-sm mb-4">
                      or click to browse
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Image className="w-4 h-4" />
                        <span>Images</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                      <div className="flex items-center gap-1">
                        <Video className="w-4 h-4" />
                        <span>Videos</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                      <span>Max 20MB</span>
                    </div>
                  </div>
                )}

                {mediaPreview && mediaFile.type.startsWith("image/") && (
                  <div className="relative w-full h-full group">
                    <img
                      src={mediaPreview}
                      alt="Selected preview"
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                    {caption && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 text-white">
                        <p className="line-clamp-2">{caption}</p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMediaFile(null);
                        setMediaPreview(null);
                      }}
                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                      aria-label="Remove media"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {mediaPreview && mediaFile.type.startsWith("video/") && (
                  <div className="relative w-full h-full group">
                    <video
                      src={mediaPreview}
                      controls
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMediaFile(null);
                        setMediaPreview(null);
                      }}
                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                      aria-label="Remove media"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Caption input textarea */}
              <div className="relative">
                <textarea
                  placeholder="Write a caption..."
                  className="w-full border-2 border-gray-200 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 text-sm sm:text-base"
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={2200}
                  aria-label="Caption"
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {caption.length}/2200
                </div>
              </div>
            </>
          )}

          {/* Text Post UI */}
          {postMode === "text" && (
            <div className="space-y-4">
              {/* Color Pickers */}
              <div className="flex flex-wrap items-center gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-600 font-medium">Colors:</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Background</label>
                  <div className="relative">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
                      aria-label="Select background color"
                    />
                  </div>
                  <span className="text-xs text-gray-500 font-mono">{backgroundColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Text</label>
                  <div className="relative">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
                      aria-label="Select text color"
                    />
                  </div>
                  <span className="text-xs text-gray-500 font-mono">{textColor}</span>
                </div>
              </div>

              {/* Text Content Preview */}
              <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 shadow-inner">
                <textarea
                  placeholder="Write something…"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full p-4 sm:p-6 resize-none focus:outline-none transition-all duration-200 min-h-[160px] sm:min-h-[200px] text-sm sm:text-base"
                  style={{ backgroundColor, color: textColor }}
                  maxLength={220}
                  rows={6}
                  aria-label="Text content for post"
                />
                <div 
                  className="absolute bottom-3 right-3 text-xs px-2 py-1 rounded-md bg-black/20 backdrop-blur-sm"
                  style={{ color: textColor }}
                >
                  {textContent.length}/220
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-end gap-3">
  <button
    type="button"
    onClick={onClose}
    disabled={uploading}
    className="
      w-full sm:w-auto
      px-6 py-3 sm:py-2.5
      text-sm sm:text-base
      rounded-lg
      text-gray-700 bg-white
      border-2 border-gray-300
      hover:bg-gray-50 hover:border-gray-400
      transition-all duration-200
      font-medium
    "
  >
    Cancel
  </button>

  <button
    type="submit"
    disabled={
      uploading ||
      (postMode === 'media' && !mediaFile) ||
      (postMode === 'text' && !textContent.trim())
    }
    className={`
      w-full sm:w-auto
      px-6 py-3 sm:py-2.5
      text-sm sm:text-base
      rounded-lg
      font-medium
      transition-all duration-200
      flex items-center justify-center gap-2
      ${
        uploading ||
        (postMode === 'media' && !mediaFile) ||
        (postMode === 'text' && !textContent.trim())
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
      }
    `}
  >
    {uploading && (
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    )}
    {uploading ? 'Posting...' : 'Post'}
  </button>
</div>
      </form>
    </div>
  );
}