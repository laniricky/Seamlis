"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchApi } from "@/lib/api";
import { UploadCloud, CheckCircle, XCircle } from "lucide-react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isShort, setIsShort] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.type.startsWith("video/")) {
        setErrorMessage("Please select a valid video file.");
        setStatus("error");
        return;
      }
      setFile(selectedFile);
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, "")); // Default title is filename
      setStatus("idle");
      setErrorMessage("");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setUploading(true);
    setProgress(0);
    setStatus("idle");

    try {
      // 1. Get pre-signed URL from our backend
      const res = await fetchApi<{ uploadUrl: string }>("/videos/upload-url", {
        method: "POST",
        body: JSON.stringify({ title, description, isShort }),
      });

      const { uploadUrl } = res;

      // 2. Upload directly to MinIO/S3 using the pre-signed URL
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setStatus("success");
          setFile(null);
          setTitle("");
          setDescription("");
          setIsShort(false);
        } else {
          setStatus("error");
          setErrorMessage(`Upload failed with status: ${xhr.status}`);
        }
        setUploading(false);
      };

      xhr.onerror = () => {
        setStatus("error");
        setErrorMessage("Network error occurred during upload.");
        setUploading(false);
      };

      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);

    } catch (err: unknown) {
      console.error(err);
      setStatus("error");
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to initialize upload");
      }
      setUploading(false);
    }
  };

  return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-display font-bold text-content-primary mb-8">
          Upload Video
        </h1>

        <form onSubmit={handleUpload} className="space-y-6">
          {/* File Dropzone / Selector */}
          <div 
            className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center bg-surface-card hover:bg-surface-elevated transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="video/*" 
              onChange={handleFileChange}
            />
            {file ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-brand-primary" />
                </div>
                <p className="text-content-primary font-medium">{file.name}</p>
                <p className="text-content-secondary text-sm mt-1">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-surface-base rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                  <UploadCloud className="w-8 h-8 text-content-secondary" />
                </div>
                <p className="text-content-primary font-medium">Select a video to upload</p>
                <p className="text-content-secondary text-sm mt-1">MP4, WebM or OGG (Max 2GB)</p>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-surface-card p-6 rounded-xl border border-border space-y-4">
            <h2 className="text-xl font-bold font-display text-content-primary">Details</h2>
            
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your video a catchy title"
              required
              disabled={uploading}
            />

            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your video"
                disabled={uploading}
                rows={4}
                className="w-full bg-surface-base border border-border rounded-lg px-4 py-2.5 text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all disabled:opacity-50 resize-none"
              />
            </div>

            <div className="flex items-center gap-3 mt-4 p-4 bg-surface-base border border-border rounded-lg">
              <input 
                type="checkbox" 
                id="isShortCheckbox"
                checked={isShort} 
                onChange={(e) => setIsShort(e.target.checked)}
                disabled={uploading}
                className="w-5 h-5 accent-brand-primary rounded focus:ring-brand-primary cursor-pointer"
              />
              <label htmlFor="isShortCheckbox" className="text-sm font-medium text-content-primary cursor-pointer select-none">
                Upload as a Short
                <p className="text-xs text-content-secondary mt-0.5 font-normal">Vertical 9:16 videos under 60 seconds.</p>
              </label>
            </div>
          </div>

          {/* Status Messages */}
          {status === "error" && (
            <div className="flex items-center gap-3 p-4 bg-[var(--status-error)]/10 text-status-error rounded-xl border border-[var(--status-error)]/20">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex items-center gap-3 p-4 bg-[var(--status-success)]/10 text-status-success rounded-xl border border-[var(--status-success)]/20">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">Video uploaded successfully! It is now processing.</p>
            </div>
          )}

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-content-secondary">Uploading...</span>
                <span className="text-content-primary font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-surface-base rounded-full h-2 overflow-hidden border border-border">
                <div 
                  className="bg-brand-primary h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="secondary" 
              disabled={uploading}
              onClick={() => {
                setFile(null);
                setTitle("");
                setDescription("");
                setIsShort(false);
                setStatus("idle");
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={!file || !title || uploading}
              loading={uploading}
            >
              Upload Video
            </Button>
          </div>
        </form>
      </div>
  );
}
