import { useState } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { trpc } from '@/core/api/trpc';

export function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('jenkins');
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    username: '',
    apiToken: '',
    clusterId: '',
    priority: 10,
  });

  const { data: instances, refetch } = trpc.jenkins.getInstances.useQuery();
  const createInstance = trpc.jenkins.createInstance.useMutation({
    onSuccess: () => {
      refetch();
      setFormData({ name: '', url: '', username: '', apiToken: '', clusterId: '', priority: 10 });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createInstance.mutate(formData);
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-6">
        <div className="card text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You need admin privileges to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('jenkins')}
          className={`px-4 py-2 rounded-md ${activeTab === 'jenkins' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
        >
          Jenkins Instances
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-md ${activeTab === 'general' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
        >
          General
        </button>
      </div>

      {activeTab === 'jenkins' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add Jenkins Instance</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instance Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                  placeholder="Production Jenkins"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenkins URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="input"
                  required
                  placeholder="https://jenkins.example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Token</label>
                  <input
                    type="password"
                    value={formData.apiToken}
                    onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cluster ID (Optional)</label>
                  <input
                    type="text"
                    value={formData.clusterId}
                    onChange={(e) => setFormData({ ...formData, clusterId: e.target.value })}
                    className="input"
                    placeholder="production"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full" disabled={createInstance.isPending}>
                {createInstance.isPending ? 'Adding...' : 'Add Instance'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Configured Instances</h2>
            {instances && instances.length > 0 ? (
              <div className="space-y-3">
                {instances.map((instance) => (
                  <div key={instance.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{instance.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{instance.url}</p>
                      </div>
                      <span className={`badge ${instance.isActive ? 'badge-success' : 'badge-error'}`}>
                        {instance.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No instances configured yet.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'general' && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">General Settings</h2>
          <p className="text-gray-600 dark:text-gray-400">General settings coming soon...</p>
        </div>
      )}
    </div>
  );
}
