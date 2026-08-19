// Shared frontend types for the Seamlis web app

export interface ChannelPreview {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isVerified: boolean;
}

export interface VideoResponse {
  id: string;
  title: string;
  description?: string;
  status: string;
  processedVideoKey?: string;
  thumbnailUrl?: string;
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  isShort: boolean;
  uploader: ChannelPreview;
  createdAt: string;
  updatedAt: string;
}
