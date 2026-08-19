"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { VideoResponse } from "@/types";
import { Loader2, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

export default function StudioContent() {
  const [videos, setVideos] = useState<VideoResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVideos = () => {
    setLoading(true);
    fetchApi<VideoResponse[]>("/studio/videos")
      .then(setVideos)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video? This action cannot be undone.")) return;
    try {
      await fetchApi(`/videos/${id}`, { method: "DELETE" });
      loadVideos(); // Reload after delete
    } catch (err) {
      console.error("Failed to delete video", err);
      alert("Failed to delete video");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-6">
      <h1 className="text-3xl font-display font-bold text-content-primary mb-8">
        Channel content
      </h1>

      <div className="bg-surface-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-base text-content-secondary text-sm">
                <th className="py-3 px-4 font-semibold w-[400px]">Video</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Views</th>
                <th className="py-3 px-4 font-semibold">Likes</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-content-secondary">
                    No videos uploaded yet.
                  </td>
                </tr>
              ) : (
                videos.map((video) => (
                  <tr key={video.id} className="border-b border-border last:border-0 hover:bg-surface-elevated transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex gap-4 items-start">
                        <div className="w-32 aspect-video bg-surface-base rounded-md overflow-hidden relative flex-shrink-0">
                          {video.thumbnailUrl ? (
                            <Image
                              src={video.thumbnailUrl}
                              alt={video.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-content-secondary">
                              No thumbnail
                            </div>
                          )}
                          {video.isShort && (
                            <div className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                              SHORT
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-medium text-content-primary truncate">{video.title}</span>
                          <span className="text-sm text-content-secondary truncate">{video.description || "No description"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${video.status === 'READY' ? 'bg-green-500/10 text-green-500' :
                          video.status === 'FAILED' ? 'bg-red-500/10 text-red-500' :
                          'bg-yellow-500/10 text-yellow-500'}`}
                      >
                        {video.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-content-secondary">
                      {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                    </td>
                    <td className="py-3 px-4 text-sm text-content-primary">
                      {video.viewCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-content-primary">
                      {video.likeCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* We could navigate to a dedicated edit page, or open a modal. Let's just use alert/prompt for now or skip edit for MVP and focus on delete */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            const newTitle = prompt("Edit title:", video.title);
                            if (newTitle) {
                              fetchApi(`/videos/${video.id}`, {
                                method: "PATCH",
                                body: JSON.stringify({ title: newTitle, description: video.description })
                              }).then(() => loadVideos());
                            }
                          }}
                        >
                          <Edit2 className="w-4 h-4 text-content-secondary hover:text-content-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(video.id)}>
                          <Trash2 className="w-4 h-4 text-red-500 hover:text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
