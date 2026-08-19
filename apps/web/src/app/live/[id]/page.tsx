import { AppShell } from '@/components/layout/AppShell';
import VideoPlayer from '@/components/VideoPlayer';
import { LiveChat } from '@/components/live/LiveChat';

export default async function ViewerLivePage({ params }: { params: { id: string } }) {
  // In a real app, we'd fetch stream data server-side
  // For now, we assume the stream exists and is live on Nginx at 8088
  const hlsUrl = `http://localhost:8088/hls/${params.id}.m3u8`;

  return (
    <AppShell>
      <div className="max-w-[1800px] mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 relative">
              <div className="absolute top-4 left-4 z-10 bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold tracking-wider">
                LIVE
              </div>
              <VideoPlayer src={hlsUrl} poster="" isLive={true} />
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Live Stream</h1>
              <p className="text-gray-500 mt-1">Watching live broadcast</p>
            </div>
          </div>

          <div className="h-[600px] lg:h-auto border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
            <LiveChat streamId={params.id} viewerCount={0} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
