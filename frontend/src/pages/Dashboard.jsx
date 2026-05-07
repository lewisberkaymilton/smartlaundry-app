import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, WashingMachine, CheckCircle, AlertTriangle,
  Zap, Wind, LayoutGrid, Building2, PlusCircle, Trash2,
  Settings2, ClipboardList, BellRing,
} from 'lucide-react';
import api from '../api/axios';
import MachineCard from '../components/MachineCard';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import useToast from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BLOCKS = [
  { id: 'all', label: 'All Blocks', icon: LayoutGrid },
  { id: 'A',   label: 'Block A',    icon: Building2 },
  { id: 'B',   label: 'Block B',    icon: Building2 },
  { id: 'C',   label: 'Block C',    icon: Building2 },
];

const TYPE_FILTERS = [
  { id: 'all',    label: 'All',     icon: LayoutGrid },
  { id: 'Washer', label: 'Washers', icon: WashingMachine },
  { id: 'Dryer',  label: 'Dryers',  icon: Wind },
];

const MACHINE_STATUSES = ['Available', 'Washing', 'Out of Order'];
const REPORT_STATUSES = ['open', 'in_progress', 'resolved'];

const playCompletionSound = () => {
  if (typeof window === 'undefined' || !window.AudioContext) return;
  try {
    const audioCtx = new window.AudioContext();
    const now = audioCtx.currentTime;
    const gain = audioCtx.createGain();
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    const oscA = audioCtx.createOscillator();
    oscA.type = 'sine';
    oscA.frequency.setValueAtTime(740, now);
    oscA.connect(gain);
    oscA.start(now);
    oscA.stop(now + 0.2);

    const oscB = audioCtx.createOscillator();
    oscB.type = 'sine';
    oscB.frequency.setValueAtTime(988, now + 0.18);
    oscB.connect(gain);
    oscB.start(now + 0.18);
    oscB.stop(now + 0.5);
  } catch {
    // Ignore audio errors on unsupported/blocked environments.
  }
};

const pushBrowserNotification = (title, body) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
    return;
  }
  if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(title, { body });
      }
    });
  }
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const StatCard = ({ icon: Icon, label, value, colorClass }) => (
  <div className={`card flex items-center gap-3 ${colorClass}`}>
    <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shadow-sm flex-shrink-0">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-xs font-medium opacity-60 mt-0.5">{label}</p>
    </div>
  </div>
);

const BlockTabs = ({ selected, onChange }) => (
  <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1 w-fit">
    {BLOCKS.map(({ id, label, icon: Icon }) => {
      const active = selected === id;
      return (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            active ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {active && (
            <motion.div
              layoutId="block-active-pill"
              className="absolute inset-0 bg-white rounded-xl shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <Icon size={14} />
            {label}
          </span>
        </button>
      );
    })}
  </div>
);

const TypeFilter = ({ selected, onChange }) => (
  <div className="flex items-center gap-2">
    {TYPE_FILTERS.map(({ id, label, icon: Icon }) => {
      const active = selected === id;
      return (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
            active
              ? id === 'Dryer'
                ? 'bg-orange-50 border-orange-300 text-orange-700'
                : 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
          }`}
        >
          <Icon size={12} />
          {label}
        </button>
      );
    })}
  </div>
);

const AdminMachineForm = ({ draft, onChange, onSubmit, creating }) => (
  <div className="card">
    <div className="flex items-center gap-2 mb-4">
      <PlusCircle size={16} className="text-blue-600" />
      <h3 className="text-sm font-bold text-slate-800">Create Machine</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <input
        value={draft.name}
        onChange={(e) => onChange('name', e.target.value)}
        placeholder="Machine name (e.g. Washer D-1)"
        className="input-field md:col-span-2"
      />
      <select value={draft.block} onChange={(e) => onChange('block', e.target.value)} className="input-field">
        <option value="A">Block A</option>
        <option value="B">Block B</option>
        <option value="C">Block C</option>
      </select>
      <select value={draft.type} onChange={(e) => onChange('type', e.target.value)} className="input-field">
        <option value="Washer">Washer</option>
        <option value="Dryer">Dryer</option>
      </select>
    </div>
    <div className="mt-3 flex justify-end">
      <button onClick={onSubmit} disabled={creating} className="btn-primary text-sm">
        <PlusCircle size={14} />
        {creating ? 'Creating...' : 'Create Machine'}
      </button>
    </div>
  </div>
);

const AdminMachineTable = ({
  machines,
  statusDrafts,
  onStatusDraft,
  onUpdateStatus,
  onDelete,
  busyMachineId,
}) => (
  <div className="card overflow-x-auto">
    <div className="flex items-center gap-2 mb-4">
      <Settings2 size={16} className="text-blue-600" />
      <h3 className="text-sm font-bold text-slate-800">Machine Management</h3>
    </div>
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-slate-500 border-b border-slate-100">
          <th className="py-2 pr-2">Name</th>
          <th className="py-2 pr-2">Block</th>
          <th className="py-2 pr-2">Type</th>
          <th className="py-2 pr-2">Status</th>
          <th className="py-2 pr-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {machines.map((machine) => {
          const selectedStatus = statusDrafts[machine._id] ?? machine.status;
          const isBusy = busyMachineId === machine._id;
          return (
            <tr key={machine._id} className="border-b border-slate-100 last:border-b-0">
              <td className="py-2 pr-2 font-medium text-slate-700">{machine.name}</td>
              <td className="py-2 pr-2 text-slate-500">{machine.block}</td>
              <td className="py-2 pr-2 text-slate-500">{machine.type}</td>
              <td className="py-2 pr-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => onStatusDraft(machine._id, e.target.value)}
                  className="input-field py-2 px-3 min-w-40"
                >
                  {MACHINE_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </td>
              <td className="py-2 pr-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdateStatus(machine._id)}
                    disabled={isBusy || selectedStatus === machine.status}
                    className="btn-secondary text-xs px-3 py-2"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => onDelete(machine._id)}
                    disabled={isBusy}
                    className="btn-danger text-xs px-3 py-2"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const AdminReportsPanel = ({ reports, reportDrafts, onDraftChange, onApplyStatus, busyReportId }) => {
  const counts = {
    open: reports.filter((r) => r.status === 'open').length,
    in_progress: reports.filter((r) => r.status === 'in_progress').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
  };

  return (
    <div className="card overflow-x-auto">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList size={16} className="text-blue-600" />
        <h3 className="text-sm font-bold text-slate-800">Report Management</h3>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2">
          <p className="text-xs text-red-500 font-semibold uppercase tracking-wide">Open</p>
          <p className="text-xl font-bold text-red-700">{counts.open}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
          <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">In Progress</p>
          <p className="text-xl font-bold text-amber-700">{counts.in_progress}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Resolved</p>
          <p className="text-xl font-bold text-emerald-700">{counts.resolved}</p>
        </div>
      </div>

      {reports.length === 0 ? (
        <p className="text-sm text-slate-500">No reports submitted yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="py-2 pr-2">Machine</th>
              <th className="py-2 pr-2">Issue</th>
              <th className="py-2 pr-2">Severity</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2 pr-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => {
              const selectedStatus = reportDrafts[report._id] ?? report.status;
              const isBusy = busyReportId === report._id;
              return (
                <tr key={report._id} className="border-b border-slate-100 last:border-b-0">
                  <td className="py-2 pr-2 text-slate-700">
                    {report.machine?.name || 'Unknown'} ({report.machine?.block || '-'})
                  </td>
                  <td className="py-2 pr-2 text-slate-600">
                    <p className="font-semibold">{report.title}</p>
                    <p className="text-xs text-slate-400 truncate max-w-64">{report.description}</p>
                  </td>
                  <td className="py-2 pr-2 capitalize text-slate-600">{report.severity}</td>
                  <td className="py-2 pr-2">
                    <select
                      value={selectedStatus}
                      onChange={(e) => onDraftChange(report._id, e.target.value)}
                      className="input-field py-2 px-3 min-w-40"
                    >
                      {REPORT_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    <button
                      onClick={() => onApplyStatus(report._id)}
                      disabled={isBusy || selectedStatus === report.status}
                      className="btn-secondary text-xs px-3 py-2"
                    >
                      Apply
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
const Dashboard = () => {
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const notifiedSessionKeysRef = useRef(new Set());
  const isAdmin = user?.role === 'admin';

  const [allMachines, setAllMachines] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState('all');
  const [selectedType, setSelectedType]   = useState('all');
  const [machineDraft, setMachineDraft] = useState({ name: '', block: 'A', type: 'Washer' });
  const [machineStatusDrafts, setMachineStatusDrafts] = useState({});
  const [busyMachineId, setBusyMachineId] = useState(null);
  const [creatingMachine, setCreatingMachine] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [reportStatusDrafts, setReportStatusDrafts] = useState({});
  const [busyReportId, setBusyReportId] = useState(null);

  const fetchMachines = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await api.get('/machines');
      setAllMachines(Array.isArray(data.data) ? data.data : []);
      setError('');
    } catch {
      setError('Failed to load machines. Is the server running?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchReports = useCallback(async (silent = false) => {
    if (!isAdmin) return;
    if (!silent) setReportsLoading(true);
    try {
      const { data } = await api.get('/reports');
      setReports(Array.isArray(data.data) ? data.data : []);
      setReportsError('');
    } catch {
      setReportsError('Failed to load reports');
    } finally {
      setReportsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchMachines();
    if (isAdmin) fetchReports();
    const interval = setInterval(() => fetchMachines(true), 15000);
    return () => clearInterval(interval);
  }, [fetchMachines, fetchReports, isAdmin]);

  // Reset type filter when switching blocks so grid never looks empty unexpectedly
  const handleBlockChange = (block) => {
    setSelectedBlock(block);
    setSelectedType('all');
  };

  // Derived: machines visible in this view
  const visibleMachines = useMemo(() => {
    const source = Array.isArray(allMachines) ? allMachines : [];
    return source
      .filter((m) => selectedBlock === 'all' || m.block === selectedBlock)
      .filter((m) => selectedType === 'all'  || m.type  === selectedType);
  }, [allMachines, selectedBlock, selectedType]);

  // Stats scoped to current block+type selection
  const scopedMachines = useMemo(() => {
    const source = Array.isArray(allMachines) ? allMachines : [];
    return source
      .filter((m) => selectedBlock === 'all' || m.block === selectedBlock)
      .filter((m) => selectedType === 'all'  || m.type  === selectedType);
  }, [allMachines, selectedBlock, selectedType]);

  const stats = useMemo(() => ({
    available:  scopedMachines.filter((m) => m.status === 'Available').length,
    inUse:      scopedMachines.filter((m) => m.status === 'Washing').length,
    outOfOrder: scopedMachines.filter((m) => m.status === 'Out of Order').length,
  }), [scopedMachines]);

  const handleSessionComplete = (machineName, machineType, sessionKey) => {
    if (sessionKey && notifiedSessionKeysRef.current.has(sessionKey)) return;
    if (sessionKey) notifiedSessionKeysRef.current.add(sessionKey);

    const verb = machineType === 'Dryer' ? 'drying' : 'laundry';
    playCompletionSound();
    pushBrowserNotification('SmartLaundry Session Completed', `${machineName} finished ${verb}.`);
    addToast(
      `🎉 Your ${verb} in "${machineName}" is done! Please collect your items.`,
      'success',
      8000
    );
    setTimeout(() => fetchMachines(true), 800);
  };

  const handleCreateMachine = async () => {
    if (!machineDraft.name.trim()) {
      addToast('Machine name is required', 'error');
      return;
    }

    setCreatingMachine(true);
    try {
      await api.post('/machines', {
        name: machineDraft.name.trim(),
        block: machineDraft.block,
        type: machineDraft.type,
        status: 'Available',
      });
      setMachineDraft({ name: '', block: machineDraft.block, type: machineDraft.type });
      addToast('Machine created successfully', 'success');
      fetchMachines(true);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create machine', 'error');
    } finally {
      setCreatingMachine(false);
    }
  };

  const handleUpdateMachineStatus = async (machineId) => {
    const status = machineStatusDrafts[machineId];
    if (!status) return;
    setBusyMachineId(machineId);
    try {
      await api.patch(`/machines/${machineId}/status`, { status });
      addToast('Machine status updated', 'success');
      fetchMachines(true);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update machine status', 'error');
    } finally {
      setBusyMachineId(null);
    }
  };

  const handleDeleteMachine = async (machineId) => {
    const confirmed = window.confirm('Delete this machine? This action cannot be undone.');
    if (!confirmed) return;

    setBusyMachineId(machineId);
    try {
      await api.delete(`/machines/${machineId}`);
      addToast('Machine deleted', 'success');
      fetchMachines(true);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete machine', 'error');
    } finally {
      setBusyMachineId(null);
    }
  };

  const handleApplyReportStatus = async (reportId) => {
    const status = reportStatusDrafts[reportId];
    if (!status) return;
    setBusyReportId(reportId);
    try {
      await api.patch(`/reports/${reportId}/status`, { status });
      addToast(`Report moved to "${status}"`, 'success');
      fetchReports(true);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update report status', 'error');
    } finally {
      setBusyReportId(null);
    }
  };

  const blockLabel = BLOCKS.find((b) => b.id === selectedBlock)?.label ?? 'All Blocks';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <Navbar />
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Hey {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Campus laundry · real-time availability
            </p>
          </div>
          <button
            onClick={() => fetchMachines(true)}
            disabled={refreshing}
            className="btn-secondary text-sm self-start sm:self-auto"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </motion.div>

        {/* ── Block tabs ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6"
        >
          <BlockTabs selected={selectedBlock} onChange={handleBlockChange} />
          <TypeFilter selected={selectedType}  onChange={setSelectedType}  />
        </motion.div>

        {/* ── Stats row ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          <StatCard icon={CheckCircle}   label="Available"    value={stats.available}  colorClass="bg-emerald-50 text-emerald-700 border-emerald-100" />
          <StatCard icon={WashingMachine} label="In Use"       value={stats.inUse}      colorClass="bg-blue-50 text-blue-700 border-blue-100" />
          <StatCard icon={AlertTriangle}  label="Out of Order" value={stats.outOfOrder} colorClass="bg-red-50 text-red-700 border-red-100" />
        </motion.div>

        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 mb-8"
          >
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 flex items-center gap-2 text-blue-800">
              <BellRing size={16} />
              <p className="text-sm font-medium">
                Admin mode: you can create machines, update/delete machines, and manage maintenance reports.
              </p>
            </div>

            <AdminMachineForm
              draft={machineDraft}
              creating={creatingMachine}
              onChange={(field, value) => setMachineDraft((prev) => ({ ...prev, [field]: value }))}
              onSubmit={handleCreateMachine}
            />

            <AdminMachineTable
              machines={Array.isArray(allMachines) ? allMachines : []}
              statusDrafts={machineStatusDrafts}
              busyMachineId={busyMachineId}
              onStatusDraft={(machineId, status) =>
                setMachineStatusDrafts((prev) => ({ ...prev, [machineId]: status }))
              }
              onUpdateStatus={handleUpdateMachineStatus}
              onDelete={handleDeleteMachine}
            />

            {reportsLoading ? (
              <div className="card text-sm text-slate-500">Loading reports...</div>
            ) : reportsError ? (
              <div className="card text-sm text-red-500">{reportsError}</div>
            ) : (
              <AdminReportsPanel
                reports={Array.isArray(reports) ? reports : []}
                reportDrafts={reportStatusDrafts}
                busyReportId={busyReportId}
                onDraftChange={(reportId, status) =>
                  setReportStatusDrafts((prev) => ({ ...prev, [reportId]: status }))
                }
                onApplyStatus={handleApplyReportStatus}
              />
            )}
          </motion.div>
        )}

        {/* ── Machine grid ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-blue-400 border-t-transparent animate-spin" />
            <p className="text-slate-500 text-sm">Loading machines…</p>
          </div>
        ) : error ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertTriangle size={40} className="text-red-300" />
            <p className="text-slate-600 font-medium">{error}</p>
            <button onClick={() => fetchMachines()} className="btn-primary text-sm">Try Again</button>
          </motion.div>
        ) : visibleMachines.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <Zap size={40} className="text-blue-200" />
            <p className="text-slate-700 font-semibold">No machines match this filter</p>
            <p className="text-slate-400 text-sm max-w-xs">
              Try selecting a different block or machine type.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Section label */}
            <motion.p
              key={`${selectedBlock}-${selectedType}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4"
            >
              {blockLabel}
              {selectedType !== 'all' ? ` · ${selectedType}s` : ''}
              {' '}— {visibleMachines.length} machine{visibleMachines.length !== 1 ? 's' : ''}
            </motion.p>

            <AnimatePresence mode="popLayout">
              <motion.div
                key={`${selectedBlock}-${selectedType}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              >
                {visibleMachines.map((machine) => (
                  <MachineCard
                    key={machine._id}
                    machine={machine}
                    onSessionComplete={handleSessionComplete}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
