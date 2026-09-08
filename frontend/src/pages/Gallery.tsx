import { useState, useEffect } from 'react';
import { api, VideoGenerationResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getStatusLabel, zhCN } from '@/locales/zh-CN';

export default function Gallery() {
  const [generations, setGenerations] = useState<VideoGenerationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProvider, setFilterProvider] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadGenerations();
  }, [filterProvider, filterStatus]);

  const loadGenerations = async () => {
    setLoading(true);
    try {
      const data = await api.listVideoGenerations({
        limit: 50,
        provider: filterProvider || undefined,
        status: filterStatus || undefined,
      });
      setGenerations(data);
    } catch (err) {
      console.error('Failed to load generations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (generationId: string) => {
    if (!confirm(zhCN.gallery.confirmDelete)) {
      return;
    }

    try {
      await api.deleteVideoGeneration(generationId);
      await loadGenerations();
    } catch (err: any) {
      alert(zhCN.gallery.failedToDelete + err.message);
    }
  };

  const providers = Array.from(new Set(generations.map(g => g.provider)));
  const statuses = Array.from(new Set(generations.map(g => g.status)));

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{zhCN.gallery.title}</h1>
        <p className="text-muted-foreground">
          {zhCN.gallery.description}
        </p>
      </div>

      <div className="mb-6 flex gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">{zhCN.gallery.filterProvider}</label>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2"
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
          >
            <option value="">{zhCN.gallery.allProviders}</option>
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{zhCN.gallery.filterStatus}</label>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">{zhCN.gallery.allStatuses}</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          {zhCN.gallery.loading}
        </div>
      ) : generations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {zhCN.gallery.empty}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generations.map((generation) => (
            <Card key={generation.id}>
              <CardContent className="p-0">
                {generation.status === 'completed' && generation.video?.url ? (
                  <video
                    className="w-full aspect-video object-cover rounded-t-lg"
                    src={generation.video.url}
                    controls
                  />
                ) : (
                  <div className="w-full aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                    <span className={`text-sm px-3 py-1 rounded ${
                      generation.status === 'processing' || generation.status === 'queued'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {getStatusLabel(generation.status)}
                    </span>
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium line-clamp-2">
                      {generation.prompt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{generation.model}</span>
                    <span>{new Date(generation.created * 1000).toLocaleDateString('zh-CN')}</span>
                  </div>

                  {generation.usage && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                      {generation.usage.cost && (
                        <span>{zhCN.gallery.cost}：${generation.usage.cost.toFixed(2)}</span>
                      )}
                      {generation.usage.time_seconds && (
                        <span>{zhCN.gallery.time}：{generation.usage.time_seconds.toFixed(1)} 秒</span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {generation.status === 'completed' && generation.video?.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(generation.video?.url)}
                      >
                        {zhCN.gallery.download}
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(generation.id)}
                    >
                      {zhCN.gallery.delete}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
