'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Copy, Radio, Activity } from 'lucide-react';
import { LiveChat } from '@/components/live/LiveChat';

export default function StudioLivePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stream, setStream] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('My Awesome Livestream');

  useEffect(() => {
    fetchApi('/live/me')
      .then(setStream)
      .catch(() => setStream(null))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    try {
      const res = await fetchApi('/live/initiate', {
        method: 'POST',
        body: JSON.stringify({ title }),
      });
      setStream(res);
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center mb-8">
        <Radio className="w-8 h-8 text-red-500 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Control Room</h1>
      </div>

      {!stream ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 max-w-md">
          <h2 className="text-xl font-bold mb-4">Go Live</h2>
          <p className="text-gray-500 mb-6">Start a new livestream to interact with your audience in real time.</p>
          <Input 
            label="Stream Title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
          />
          <div className="mt-6">
            <Button onClick={handleCreate} className="w-full">Create Stream</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Stream Preview Area (in a real app, uses a player) */}
            <div className="aspect-video bg-black rounded-xl border border-gray-800 flex items-center justify-center overflow-hidden relative">
              {stream.status === 'LIVE' ? (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-md text-sm font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  LIVE
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Waiting for video input...</p>
                  <p className="text-sm">Connect your streaming software to go live</p>
                </div>
              )}
            </div>

            {/* Stream Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-lg mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Stream Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stream URL</label>
                  <div className="flex gap-2">
                    <Input readOnly value="rtmp://localhost:1935/live" className="flex-1" />
                    <Button variant="secondary" onClick={() => copyToClipboard('rtmp://localhost:1935/live')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stream Key</label>
                  <div className="flex gap-2">
                    <Input type="password" readOnly value={stream.streamKey} className="flex-1" />
                    <Button variant="secondary" onClick={() => copyToClipboard(stream.streamKey)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Keep this key secret. Anyone with it can stream to your channel.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[600px] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <LiveChat streamId={stream.id} viewerCount={stream.viewerCount} />
          </div>
        </div>
      )}
    </div>
  );
}
