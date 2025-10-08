import { useState } from 'react';
import {
  ServerIcon,
  SignalIcon,
  SignalSlashIcon,
  ClockIcon,
  CpuChipIcon,
  CircleStackIcon,
  CommandLineIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface Agent {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'idle';
  labels: string[];
  executors: number;
  busyExecutors: number;
  os: string;
  architecture: string;
  javaVersion: string;
  uptime: number;
  lastSeen: Date;
  offlineReason?: string;
  offlineSince?: Date;
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
  };
  disk: {
    used: number;
    total: number;
  };
  currentJobs: Array<{
    id: string;
    name: string;
    buildNumber: number;
  }>;
}

// Mock data - replace with real API call
const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'jenkins-agent-01',
    status: 'online',
    labels: ['linux', 'docker', 'maven', 'node'],
    executors: 4,
    busyExecutors: 2,
    os: 'Linux',
    architecture: 'amd64',
    javaVersion: 'OpenJDK 17.0.8',
    uptime: 86400000 * 7, // 7 days
    lastSeen: new Date(),
    cpu: { usage: 67, cores: 8 },
    memory: { used: 12.5, total: 16 },
    disk: { used: 245, total: 500 },
    currentJobs: [
      { id: 'j1', name: 'frontend-build', buildNumber: 42 },
      { id: 'j2', name: 'api-tests', buildNumber: 156 },
    ],
  },
  {
    id: '2',
    name: 'jenkins-agent-02',
    status: 'online',
    labels: ['linux', 'python', 'terraform'],
    executors: 2,
    busyExecutors: 0,
    os: 'Linux',
    architecture: 'amd64',
    javaVersion: 'OpenJDK 17.0.8',
    uptime: 86400000 * 3,
    lastSeen: new Date(),
    cpu: { usage: 12, cores: 4 },
    memory: { used: 3.2, total: 8 },
    disk: { used: 89, total: 200 },
    currentJobs: [],
  },
  {
    id: '3',
    name: 'jenkins-agent-03',
    status: 'offline',
    labels: ['windows', 'dotnet', 'msbuild'],
    executors: 2,
    busyExecutors: 0,
    os: 'Windows Server 2022',
    architecture: 'amd64',
    javaVersion: 'OpenJDK 17.0.8',
    uptime: 0,
    lastSeen: new Date(Date.now() - 3600000 * 4), // 4 hours ago
    offlineReason: 'Connection timeout - Agent stopped responding',
    offlineSince: new Date(Date.now() - 3600000 * 4),
    cpu: { usage: 0, cores: 4 },
    memory: { used: 0, total: 8 },
    disk: { used: 156, total: 300 },
    currentJobs: [],
  },
  {
    id: '4',
    name: 'jenkins-agent-04',
    status: 'idle',
    labels: ['macos', 'ios', 'xcode'],
    executors: 2,
    busyExecutors: 0,
    os: 'macOS 14.0',
    architecture: 'arm64',
    javaVersion: 'OpenJDK 17.0.8',
    uptime: 86400000 * 14,
    lastSeen: new Date(),
    cpu: { usage: 5, cores: 10 },
    memory: { used: 4.1, total: 16 },
    disk: { used: 412, total: 1000 },
    currentJobs: [],
  },
  {
    id: '5',
    name: 'jenkins-agent-05',
    status: 'offline',
    labels: ['linux', 'docker', 'kubernetes'],
    executors: 8,
    busyExecutors: 0,
    os: 'Linux',
    architecture: 'amd64',
    javaVersion: 'OpenJDK 17.0.8',
    uptime: 0,
    lastSeen: new Date(Date.now() - 86400000), // 1 day ago
    offlineReason: 'Agent terminated - Host maintenance',
    offlineSince: new Date(Date.now() - 86400000),
    cpu: { usage: 0, cores: 16 },
    memory: { used: 0, total: 32 },
    disk: { used: 890, total: 2000 },
    currentJobs: [],
  },
];

export function AgentsPage() {
  const [agents] = useState<Agent[]>(mockAgents);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'idle'>('all');

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.labels.some(label => label.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: agents.length,
    online: agents.filter(a => a.status === 'online').length,
    offline: agents.filter(a => a.status === 'offline').length,
    idle: agents.filter(a => a.status === 'idle').length,
    totalExecutors: agents.reduce((sum, a) => sum + a.executors, 0),
    busyExecutors: agents.reduce((sum, a) => sum + a.busyExecutors, 0),
  };

  const formatUptime = (ms: number) => {
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const formatOfflineTime = (date: Date) => {
    const ms = Date.now() - date.getTime();
    const hours = Math.floor(ms / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-100 mb-2 flex items-center gap-3">
              <ServerIcon className="h-10 w-10 text-primary-500" />
              Agent Monitoring
            </h1>
            <p className="text-slate-400 text-sm font-mono">
              Real-time monitoring of Jenkins build agents and executors
            </p>
          </div>
          <button className="btn-primary">
            <ArrowPathIcon className="h-5 w-5" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <span className="metric-label">Total Agents</span>
              <ServerIcon className="h-5 w-5 text-primary-500" />
            </div>
            <div className="metric-value">{stats.total}</div>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-success-400">{stats.online} online</span>
              <span className="text-slate-600">•</span>
              <span className="text-error-400">{stats.offline} offline</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <span className="metric-label">Executors</span>
              <CpuChipIcon className="h-5 w-5 text-info-500" />
            </div>
            <div className="metric-value">{stats.busyExecutors}/{stats.totalExecutors}</div>
            <div className="text-xs text-slate-400 mt-2">
              {((stats.busyExecutors / stats.totalExecutors) * 100).toFixed(1)}% utilization
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <span className="metric-label">Online</span>
              <CheckCircleIcon className="h-5 w-5 text-success-500" />
            </div>
            <div className="metric-value text-success-400">{stats.online}</div>
            <div className="text-xs text-slate-400 mt-2">
              {((stats.online / stats.total) * 100).toFixed(0)}% availability
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <span className="metric-label">Offline</span>
              <ExclamationTriangleIcon className="h-5 w-5 text-error-500" />
            </div>
            <div className="metric-value text-error-400">{stats.offline}</div>
            <div className="text-xs text-slate-400 mt-2">
              Requires attention
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search agents by name or label..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`btn-ghost ${statusFilter === 'all' ? 'bg-slate-700 text-white' : ''}`}
            >
              <FunnelIcon className="h-4 w-4" />
              All ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('online')}
              className={`btn-ghost ${statusFilter === 'online' ? 'bg-success-950 text-success-400 border-success-700' : ''}`}
            >
              <SignalIcon className="h-4 w-4" />
              Online ({stats.online})
            </button>
            <button
              onClick={() => setStatusFilter('offline')}
              className={`btn-ghost ${statusFilter === 'offline' ? 'bg-error-950 text-error-400 border-error-700' : ''}`}
            >
              <SignalSlashIcon className="h-4 w-4" />
              Offline ({stats.offline})
            </button>
            <button
              onClick={() => setStatusFilter('idle')}
              className={`btn-ghost ${statusFilter === 'idle' ? 'bg-warning-950 text-warning-400 border-warning-700' : ''}`}
            >
              <ClockIcon className="h-4 w-4" />
              Idle ({stats.idle})
            </button>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAgents.map((agent) => (
          <div key={agent.id} className="card-interactive group">
            {/* Agent Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 group-hover:border-primary-500 transition-colors">
                  <ServerIcon className="h-6 w-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100 font-mono">{agent.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`status-${agent.status === 'online' ? 'online' : agent.status === 'offline' ? 'offline' : 'idle'}`} />
                    <span className={`text-sm font-semibold ${
                      agent.status === 'online' ? 'text-success-400' :
                      agent.status === 'offline' ? 'text-error-400' : 'text-warning-400'
                    }`}>
                      {agent.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {agent.status === 'online' && (
                  <span className="badge-success">
                    <SignalIcon className="h-3 w-3" />
                    Active
                  </span>
                )}
                {agent.status === 'offline' && (
                  <span className="badge-error">
                    <SignalSlashIcon className="h-3 w-3" />
                    Down
                  </span>
                )}
                {agent.status === 'idle' && (
                  <span className="badge-warning">
                    <ClockIcon className="h-3 w-3" />
                    Idle
                  </span>
                )}
              </div>
            </div>

            {/* Offline Info */}
            {agent.status === 'offline' && agent.offlineReason && (
              <div className="mb-4 p-3 rounded-lg bg-error-950/30 border border-error-800/50">
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-error-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-error-300 font-medium mb-1">Offline Reason:</p>
                    <p className="text-xs text-error-400 font-mono">{agent.offlineReason}</p>
                    {agent.offlineSince && (
                      <p className="text-xs text-error-500 mt-1">
                        Down for {formatOfflineTime(agent.offlineSince)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* System Info */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">OS / Arch</div>
                <div className="text-sm text-slate-200 font-mono">{agent.os}</div>
                <div className="text-xs text-slate-500">{agent.architecture}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Java Version</div>
                <div className="text-sm text-slate-200 font-mono">{agent.javaVersion}</div>
              </div>
            </div>

            {/* Executors */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Executors</span>
                <span className="text-sm font-mono text-slate-300">
                  {agent.busyExecutors} / {agent.executors} busy
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-500"
                  style={{ width: `${(agent.busyExecutors / agent.executors) * 100}%` }}
                />
              </div>
            </div>

            {/* Resource Usage */}
            {agent.status !== 'offline' && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="p-2 rounded bg-slate-900/50 border border-slate-700">
                  <div className="flex items-center gap-1 mb-1">
                    <CpuChipIcon className="h-3 w-3 text-primary-500" />
                    <span className="text-xs text-slate-400">CPU</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-slate-200">{agent.cpu.usage}%</div>
                  <div className="text-xs text-slate-500">{agent.cpu.cores} cores</div>
                </div>
                <div className="p-2 rounded bg-slate-900/50 border border-slate-700">
                  <div className="flex items-center gap-1 mb-1">
                    <CircleStackIcon className="h-3 w-3 text-info-500" />
                    <span className="text-xs text-slate-400">RAM</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-slate-200">
                    {agent.memory.used.toFixed(1)}GB
                  </div>
                  <div className="text-xs text-slate-500">/ {agent.memory.total}GB</div>
                </div>
                <div className="p-2 rounded bg-slate-900/50 border border-slate-700">
                  <div className="flex items-center gap-1 mb-1">
                    <CircleStackIcon className="h-3 w-3 text-success-500" />
                    <span className="text-xs text-slate-400">Disk</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-slate-200">
                    {agent.disk.used}GB
                  </div>
                  <div className="text-xs text-slate-500">/ {agent.disk.total}GB</div>
                </div>
              </div>
            )}

            {/* Current Jobs */}
            {agent.currentJobs.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                  Running Jobs ({agent.currentJobs.length})
                </div>
                <div className="space-y-2">
                  {agent.currentJobs.map((job) => (
                    <div key={job.id} className="flex items-center gap-2 p-2 rounded bg-slate-900/50 border border-slate-700">
                      <CommandLineIcon className="h-4 w-4 text-primary-500" />
                      <span className="text-sm text-slate-300 font-mono flex-1">{job.name}</span>
                      <span className="badge-info">#{job.buildNumber}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Labels */}
            <div className="mb-4">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Labels</div>
              <div className="flex flex-wrap gap-2">
                {agent.labels.map((label) => (
                  <span key={label} className="badge-slate">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                {agent.status === 'online' ? (
                  <span>Uptime: {formatUptime(agent.uptime)}</span>
                ) : (
                  <span>Last seen: {formatOfflineTime(agent.lastSeen)}</span>
                )}
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost text-xs py-1 px-3">
                  Configure
                </button>
                <button className="btn-ghost text-xs py-1 px-3">
                  View Logs
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-16">
          <ServerIcon className="h-16 w-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No agents found</h3>
          <p className="text-slate-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
