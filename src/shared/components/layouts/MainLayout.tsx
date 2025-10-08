import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
  HomeIcon,
  BriefcaseIcon,
  CpuChipIcon,
  ServerIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';

export function MainLayout() {
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Jobs', href: '/jobs', icon: BriefcaseIcon },
    { name: 'Executors', href: '/executors', icon: CpuChipIcon },
    { name: 'Agents', href: '/agents', icon: ServerIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar */}
      <div className="w-72 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 shadow-2xl">
        {/* Logo/Header */}
        <div className="flex h-20 items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <CommandLineIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text font-mono">
                JenKinds
              </h1>
              <p className="text-xs text-slate-500 font-mono">DevOps Control Center</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 mt-4">
          {navigation.map(item => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-transparent animate-pulse" />
                )}
                <item.icon className={`h-5 w-5 mr-3 relative z-10 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-500 group-hover:text-primary-400'
                }`} />
                <span className="relative z-10">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-white shadow-lg shadow-white/50 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* System Status Mini Widget */}
        <div className="mx-4 mt-6 p-4 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">System Status</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">API Status</span>
              <div className="flex items-center gap-1.5">
                <div className="status-online" />
                <span className="text-xs text-success-400 font-semibold">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Build Queue</span>
              <span className="text-xs text-slate-300 font-mono font-semibold">3 jobs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Active Agents</span>
              <span className="text-xs text-slate-300 font-mono font-semibold">5 / 7</span>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="absolute bottom-0 w-72 p-4 border-t border-slate-800 bg-slate-950/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/30 font-mono">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200 font-mono">{user?.username}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={clearAuth}
              className="p-2 text-slate-500 hover:text-error-400 hover:bg-slate-900 rounded-lg transition-all"
              title="Sign out"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Outlet />
      </div>
    </div>
  );
}
