import { useState, useEffect } from 'react';
import { api, APIKeyResponse, ProviderInfo } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { getKeyStatusLabel, zhCN } from '@/locales/zh-CN';

export default function Settings() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKeyResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddKey, setShowAddKey] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<APIKeyResponse | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    document.title = `${zhCN.settings.title} - MediaRouter`;
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [providersData, keysData] = await Promise.all([
        api.listProviders(),
        api.listAPIKeys(),
      ]);
      setProviders(providersData);
      setApiKeys(keysData);
    } catch (err: any) {
      setError(zhCN.settings.failedToLoad);
    }
  };

  const handleAddKey = async () => {
    if (!selectedProvider || !newApiKey.trim()) {
      setError(zhCN.settings.selectProviderAndKey);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.addAPIKey({
        provider: selectedProvider,
        api_key: newApiKey.trim(),
      });

      setSuccess(zhCN.settings.keyAdded);
      setNewApiKey('');
      setShowAddKey(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || zhCN.settings.failedToAdd);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (keyId: number) => {
    setDeletingId(keyId);
    try {
      await api.deleteAPIKey(keyId);
      setSuccess(zhCN.settings.keyDeleted);
      await loadData();
    } catch (err: any) {
      setError(err.message || zhCN.settings.failedToDelete);
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const handleValidateKey = async (keyId: number) => {
    setLoading(true);
    setError('');

    try {
      const result = await api.validateAPIKey(keyId);
      if (result.valid) {
        setSuccess(zhCN.settings.keyValid);
      } else {
        setError(zhCN.settings.keyInvalid);
      }
      await loadData();
    } catch (err: any) {
      setError(err.message || zhCN.settings.failedToValidate);
    } finally {
      setLoading(false);
    }
  };

  const providersWithoutKeys = providers.filter(p => !p.has_key);

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{zhCN.settings.title}</h1>
        <p className="text-muted-foreground">
          {zhCN.settings.description}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
          {success}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{zhCN.settings.apiKeys}</CardTitle>
          <CardDescription>
            {zhCN.settings.apiKeysDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {zhCN.settings.emptyKeys}
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium capitalize">{key.provider}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            key.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {getKeyStatusLabel(key.status)}
                        </span>
                      </div>
                      {key.key_preview && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {key.key_preview}
                        </div>
                      )}
                      {key.last_validated && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {zhCN.settings.lastValidated}{new Date(key.last_validated).toLocaleString('zh-CN')}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleValidateKey(key.id)}
                        disabled={loading}
                      >
                        {zhCN.settings.test}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTarget(key)}
                        disabled={deletingId === key.id}
                      >
                        {zhCN.settings.delete}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!showAddKey && providersWithoutKeys.length > 0 && (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setShowAddKey(true)}
              >
                {zhCN.settings.addApiKey}
              </Button>
            )}

            {showAddKey && (
              <div className="border rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{zhCN.settings.provider}</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                  >
                    <option value="">{zhCN.settings.selectProvider}</option>
                    {providersWithoutKeys.map((provider) => (
                      <option key={provider.name} value={provider.name}>
                        {provider.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{zhCN.settings.apiKey}</label>
                  <Input
                    type="password"
                    placeholder={zhCN.settings.apiKeyPlaceholder}
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleAddKey}
                    disabled={loading}
                  >
                    {loading ? zhCN.settings.validating : zhCN.settings.addKey}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddKey(false);
                      setNewApiKey('');
                      setSelectedProvider('');
                      setError('');
                    }}
                  >
                    {zhCN.settings.cancel}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{zhCN.settings.availableProviders}</CardTitle>
          <CardDescription>
            {zhCN.settings.availableProvidersDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {providers.map((provider) => (
              <div
                key={provider.name}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{provider.display_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {zhCN.settings.models}{provider.models.join('、')}
                  </div>
                </div>
                {provider.has_key ? (
                  <span className="text-sm px-2 py-1 rounded bg-green-100 text-green-800">
                    {zhCN.settings.configured}
                  </span>
                ) : (
                  <span className="text-sm px-2 py-1 rounded bg-gray-100 text-gray-800">
                    {zhCN.settings.notConfigured}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={zhCN.settings.confirmDelete}
        description={zhCN.settings.deleteDescription}
        confirmLabel={zhCN.settings.delete}
        cancelLabel={zhCN.settings.cancel}
        busy={deleteTarget !== null && deletingId === deleteTarget.id}
        busyLabel={zhCN.settings.deleting}
        onCancel={() => {
          if (!deletingId) setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) void handleDeleteKey(deleteTarget.id);
        }}
      />
    </div>
  );
}
