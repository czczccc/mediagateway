import { useState, useEffect } from 'react';
import { api, VideoGenerationResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { getStatusLabel, zhCN } from '@/locales/zh-CN';
import { CircleDollarSign, Clock3, Download, Film, RefreshCw, Trash2 } from 'lucide-react';

export default function Gallery() {
  const [generations, setGenerations] = useState<VideoGenerationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProvider, setFilterProvider] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<VideoGenerationResponse | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadGenerations();
  }, [filterProvider, filterStatus]);

  const loadGenerations = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listVideoGenerations({
        limit: 50,
        provider: filterProvider || undefined,
        status: filterStatus || undefined,
      });
      setGenerations(data);
    } catch (err: any) {
      console.error('Failed to load generations:', err);
      setError(err.message || '视频列表加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (generationId: string) => {
    setDeletingId(generationId);
    try {
      await api.deleteVideoGeneration(generationId);
      await loadGenerations();
    } catch (err: any) {
      setError(zhCN.gallery.deleteError + err.message);
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const providers = Array.from(new Set(generations.map(g => g.provider)));
  const statuses = Array.from(new Set(generations.map(g => g.status)));

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Film className="h-4 w-4" aria-hidden="true" />
            {zhCN.gallery.title}
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{zhCN.gallery.title}</h1>
          <p className="mt-3 text-muted-foreground">{zhCN.gallery.description}</p>
        </div>
        <Button variant="outline" onClick={loadGenerations} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          {zhCN.gallery.refresh}
        </Button>
      </div>

      <Card className="mb-6 border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
        <div>
          <label htmlFor="gallery-provider" className="mb-2 block text-sm font-semibold">{zhCN.gallery.filterProvider}</label>
          <select
            id="gallery-provider"
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
          <label htmlFor="gallery-status" className="mb-2 block text-sm font-semibold">{zhCN.gallery.filterStatus}</label>
          <select
            id="gallery-status"
            className="h-10 rounded-md border border-input bg-background px-3 py-2"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">{zhCN.gallery.allStatuses}</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-muted-foreground sm:ml-auto sm:pb-2">
          {generations.length} {zhCN.gallery.results}
        </div>
        </CardContent>
      </Card>

      {error && (
        <div role="alert" className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-dashed bg-card py-16 text-center text-muted-foreground">
          <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin text-primary" aria-hidden="true" />
          {zhCN.gallery.loading}
        </div>
      ) : generations.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
          <Film className="mx-auto mb-4 h-10 w-10 text-muted-foreground/60" aria-hidden="true" />
          <h2 className="text-lg font-semibold">{zhCN.gallery.emptyTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{zhCN.gallery.emptyDescription}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {generations.map((generation) => (
            <Card key={generation.id} className="group overflow-hidden border-slate-200 shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-0">
                {generation.status === 'completed' && generation.video?.url ? (
                  <video
                    className="aspect-video w-full bg-slate-950 object-cover"
                    src={generation.video.url}
                    controls
                  />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-slate-950">
                    <span className={`rounded-full px-3 py-1 text-sm ${
                      generation.status === 'processing' || generation.status === 'queued'
                        ? 'bg-cyan-400/15 text-cyan-200'
                        : 'bg-red-400/15 text-red-200'
                    }`}>
                      {getStatusLabel(generation.status)}
                    </span>
                  </div>
                )}

                <div className="space-y-4 p-5">
                  <div>
                    <p className="line-clamp-2 text-sm font-medium leading-6">
                      {generation.prompt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span className="truncate font-mono">{generation.model}</span>
                    <span className="shrink-0">{zhCN.gallery.createdAt} {new Date(generation.created * 1000).toLocaleDateString('zh-CN')}</span>
                  </div>

                  {generation.usage && (
                    <div className="flex items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
                      {generation.usage.cost !== undefined && (
                        <span className="flex items-center gap-1"><CircleDollarSign className="h-3.5 w-3.5" aria-hidden="true" />${generation.usage.cost.toFixed(2)}</span>
                      )}
                      {generation.usage.time_seconds !== undefined && (
                        <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{generation.usage.time_seconds.toFixed(1)} 秒</span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    {generation.status === 'completed' && generation.video?.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(generation.video?.url, '_blank', 'noopener,noreferrer')}
                        disabled={deletingId === generation.id}
                      >
                        <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                        {zhCN.gallery.download}
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => setDeleteTarget(generation)}
                      disabled={deletingId === generation.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                      {zhCN.gallery.delete}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={zhCN.gallery.confirmDelete}
        description={zhCN.gallery.deleteDescription}
        confirmLabel={zhCN.gallery.delete}
        cancelLabel="取消"
        busy={deleteTarget !== null && deletingId === deleteTarget.id}
        busyLabel={zhCN.gallery.deleting}
        onCancel={() => {
          if (!deletingId) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) void handleDelete(deleteTarget.id);
        }}
      />
    </div>
  );
}
