import { useState, useEffect } from 'react';
import { api, VideoGenerationRequest, VideoGenerationResponse, ProviderInfo } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getStatusLabel, zhCN } from '@/locales/zh-CN';
import { Clock3, Coins, Film, Sparkles, Wand2 } from 'lucide-react';

export default function Playground() {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [seed, setSeed] = useState('');
  const [generating, setGenerating] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState<VideoGenerationResponse | null>(null);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [error, setError] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    // Estimate cost when parameters change
    if (selectedModel && duration) {
      estimateCost();
    }
  }, [selectedModel, duration, aspectRatio]);

  const estimateCost = async () => {
    if (!selectedModel) return;

    try {
      const response = await fetch('/v1/usage/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt: 'dummy',
          duration,
          aspect_ratio: aspectRatio,
        }),
      });

      const data = await response.json();
      setEstimatedCost(data.estimated_cost);
    } catch (err) {
      console.error('Failed to estimate cost:', err);
    }
  };

  const loadProviders = async () => {
    try {
      const data = await api.listProviders();
      const activeProviders = data.filter(p => p.has_key && p.key_status === 'active');
      setProviders(activeProviders);

      if (activeProviders.length > 0 && activeProviders[0].models.length > 0) {
        setSelectedModel(activeProviders[0].models[0]);
      }
    } catch (err: any) {
      console.error('Failed to load providers:', err);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError(zhCN.playground.enterPrompt);
      return;
    }

    if (!selectedModel) {
      setError(zhCN.playground.noActiveProvidersError);
      return;
    }

    setError('');
    setGenerating(true);
    setCurrentGeneration(null);

    try {
      const request: VideoGenerationRequest = {
        model: selectedModel,
        prompt: prompt.trim(),
        duration,
        aspect_ratio: aspectRatio,
        seed: seed ? parseInt(seed) : undefined,
      };

      const response = await api.createVideoGeneration(request);
      setCurrentGeneration(response);

      // Poll for status
      pollGenerationStatus(response.id);
    } catch (err: any) {
      setError(err.message || zhCN.playground.failedToGenerate);
      setGenerating(false);
    }
  };

  const pollGenerationStatus = async (generationId: string) => {
    const maxAttempts = 120; // 10 minutes
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await api.getVideoGeneration(generationId);
        setCurrentGeneration(status);

        if (status.status === 'completed') {
          setGenerating(false);
          return;
        } else if (status.status === 'failed') {
          setError(status.error || zhCN.playground.generationFailed);
          setGenerating(false);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          setError(zhCN.playground.generationTimeout);
          setGenerating(false);
        }
      } catch (err: any) {
        setError(err.message || zhCN.playground.failedToCheckStatus);
        setGenerating(false);
      }
    };

    poll();
  };

  const availableModels = providers.flatMap(p =>
    p.models.map(m => ({ provider: p.display_name, model: m }))
  );
  const generationCost = currentGeneration?.usage?.cost;
  const generationTime = currentGeneration?.usage?.time_seconds;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {zhCN.playground.eyebrow}
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{zhCN.playground.title}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {zhCN.playground.description} · {zhCN.playground.workspaceHint}
          </p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {zhCN.playground.activeModel}
          </div>
          <div className="mt-1 max-w-[18rem] truncate font-mono text-sm font-semibold text-foreground">
            {selectedModel || '—'}
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
        <Card className="overflow-hidden border-slate-200 shadow-md shadow-slate-900/5">
          <CardHeader className="border-b bg-white/80">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wand2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>{zhCN.playground.cardTitle}</CardTitle>
                <CardDescription className="mt-1">
                  {zhCN.playground.cardDescription}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
          <div>
            <label htmlFor="video-prompt" className="mb-2 block text-sm font-semibold">{zhCN.playground.prompt}</label>
            <Textarea
              id="video-prompt"
              placeholder={zhCN.playground.promptPlaceholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[136px] resize-none"
              rows={5}
              disabled={generating}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="video-model" className="mb-2 block text-sm font-semibold">{zhCN.playground.model}</label>
              <select
                id="video-model"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={generating || availableModels.length === 0}
              >
                {availableModels.length === 0 ? (
                  <option>{zhCN.playground.noActiveProviders}</option>
                ) : (
                  availableModels.map(({ provider, model }) => (
                    <option key={model} value={model}>
                      {provider} - {model}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label htmlFor="video-aspect-ratio" className="mb-2 block text-sm font-semibold">{zhCN.playground.aspectRatio}</label>
              <select
                id="video-aspect-ratio"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                disabled={generating}
              >
                <option value="16:9">16:9（{zhCN.playground.landscape}）</option>
                <option value="9:16">9:16（{zhCN.playground.portrait}）</option>
                <option value="1:1">1:1（{zhCN.playground.square}）</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="video-duration" className="mb-2 block text-sm font-semibold">{zhCN.playground.duration}</label>
              <Input
                id="video-duration"
                type="number"
                min="1"
                max="10"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
                disabled={generating}
              />
            </div>

            <div>
              <label htmlFor="video-seed" className="mb-2 block text-sm font-semibold">{zhCN.playground.seed}</label>
              <Input
                id="video-seed"
                type="number"
                placeholder={zhCN.playground.random}
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                disabled={generating}
              />
            </div>
          </div>

          {estimatedCost !== null && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-sm font-semibold text-amber-950">
                  <Coins className="h-4 w-4" aria-hidden="true" />
                  {zhCN.playground.estimatedCost}
                </span>
                <span className="text-lg font-bold text-amber-700">
                  ${estimatedCost.toFixed(4)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {zhCN.playground.basedOn
                  .replace('{duration}', String(duration))
                  .replace('{aspectRatio}', aspectRatio)}
              </p>
            </div>
          )}

          {error && (
            <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            className="h-12 w-full text-base shadow-sm shadow-primary/20"
            size="lg"
            onClick={handleGenerate}
            disabled={generating || availableModels.length === 0}
          >
            {generating ? zhCN.playground.generating : zhCN.playground.generateVideo}
          </Button>
          </CardContent>
        </Card>

        {currentGeneration ? (
          <Card className="overflow-hidden border-slate-200 shadow-md shadow-slate-900/5">
            <CardHeader className="border-b bg-slate-950 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-cyan-300">
                    <Film className="h-4 w-4" aria-hidden="true" />
                    {zhCN.playground.generationStatus}
                  </div>
                  <CardTitle className="text-xl text-white">
                    {currentGeneration.status === 'completed' ? zhCN.playground.resultReady : zhCN.playground.generationStatus}
                  </CardTitle>
                </div>
                <span
                  role="status"
                  aria-live="polite"
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    currentGeneration.status === 'completed' ? 'bg-emerald-400/20 text-emerald-200' :
                    currentGeneration.status === 'failed' ? 'bg-red-400/20 text-red-200' :
                    'bg-cyan-400/20 text-cyan-200'
                  }`}
                >
                  {getStatusLabel(currentGeneration.status)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-5">
              {currentGeneration.status === 'completed' && currentGeneration.video?.url ? (
                <div className="overflow-hidden rounded-xl border bg-slate-950">
                  <video
                    controls
                    className="aspect-video w-full"
                    src={currentGeneration.video.url}
                  >
                    {zhCN.playground.browserUnsupported}
                  </video>
                </div>
              ) : (
                <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed bg-muted/50 p-6 text-center">
                  <p className="max-w-xs text-sm text-muted-foreground">{zhCN.playground.noResultYet}</p>
                </div>
              )}

              <div className="space-y-3 rounded-xl bg-muted/60 p-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{zhCN.playground.model}</span>
                  <span className="max-w-[14rem] truncate font-mono text-xs font-semibold">{currentGeneration.model}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">{zhCN.playground.taskId}</span>
                  <span className="font-mono text-xs">{currentGeneration.id}</span>
                </div>
                {currentGeneration.video?.duration !== undefined && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 text-muted-foreground"><Clock3 className="h-4 w-4" aria-hidden="true" />{zhCN.playground.outputDuration}</span>
                    <span>{currentGeneration.video.duration.toFixed(1)} 秒</span>
                  </div>
                )}
              </div>

              {currentGeneration.status === 'completed' && currentGeneration.video?.url && (
                <Button className="w-full" variant="outline" onClick={() => window.open(currentGeneration.video?.url)}>
                  {zhCN.playground.downloadVideo}
                </Button>
              )}

              {currentGeneration.usage && (
                <div className="grid grid-cols-2 gap-3 border-t pt-4">
                  {generationCost !== undefined && (
                    <div>
                      <div className="text-xs text-muted-foreground">{zhCN.playground.actualCost}</div>
                      <div className="mt-1 font-semibold">${generationCost.toFixed(2)}</div>
                    </div>
                  )}
                  {generationTime !== undefined && (
                    <div>
                      <div className="text-xs text-muted-foreground">{zhCN.playground.generationTime}</div>
                      <div className="mt-1 font-semibold">{generationTime.toFixed(1)} 秒</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200 bg-slate-950 text-white shadow-md shadow-slate-900/10">
            <CardHeader>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
                <Film className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="text-xl text-white">{zhCN.playground.workflowTitle}</CardTitle>
              <CardDescription className="text-slate-300">{zhCN.playground.resultHint}</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-5">
                {[zhCN.playground.workflowStepPrompt, zhCN.playground.workflowStepTune, zhCN.playground.workflowStepResult].map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-300/30 text-xs font-semibold text-cyan-300">0{index + 1}</span>
                    <span className="pt-1 text-sm text-slate-200">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">{zhCN.playground.activeModel}</div>
                <div className="mt-2 truncate font-mono text-sm text-cyan-100">{selectedModel || '—'}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
