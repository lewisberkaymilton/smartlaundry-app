import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, WashingMachine, CheckCircle, AlertTriangle,
  Zap, Wind, LayoutGrid, Building2,
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

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
const Dashboard = () => {
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const notifiedSessionKeysRef = useRef(new Set());

  const [allMachines, setAllMachines] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState('all');
  const [selectedType, setSelectedType]   = useState('all');

  const fetchMachines = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await api.get('/machines');
      setAllMachines(data.data);
      setError('');
    } catch {
      setError('Failed to load machines. Is the server running?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMachines();
    const interval = setInterval(() => fetchMachines(true), 15000);
    return () => clearInterval(interval);
  }, [fetchMachines]);

  // Reset type filter when switching blocks so grid never looks empty unexpectedly
  const handleBlockChange = (block) => {
    setSelectedBlock(block);
    setSelectedType('all');
  };

  // Derived: machines visible in this view
  const visibleMachines = useMemo(() => {
    return allMachines
      .filter((m) => selectedBlock === 'all' || m.block === selectedBlock)
      .filter((m) => selectedType === 'all'  || m.type  === selectedType);
  }, [allMachines, selectedBlock, selectedType]);

  // Stats scoped to current block+type selection
  const scopedMachines = useMemo(() => {
    return allMachines
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
    addToast(
      `🎉 Your ${verb} in "${machineName}" is done! Please collect your items.`,
      'success',
      8000
    );
    setTimeout(() => fetchMachines(true), 800);
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
