import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Square, AlertTriangle, CheckCircle, Clock, User,
  Zap, Sparkles, Wind, Flame,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// ---------------------------------------------------------------------------
// Programme catalogues (per machine type)
// ---------------------------------------------------------------------------
const WASHER_PROGRAMMES = [
  { id: 'standard', label: 'Standard Wash', shortLabel: 'Standard', duration: '1h 30m', seconds: 90 * 60,  icon: Zap,      color: 'blue'   },
  { id: 'deep',     label: 'Deep Clean',    shortLabel: 'Deep',     duration: '2h 00m', seconds: 120 * 60, icon: Sparkles, color: 'violet' },
];

const DRYER_PROGRAMMES = [
  { id: 'quick', label: 'Quick Dry', shortLabel: 'Quick', duration: '45m',     seconds: 45 * 60, icon: Zap,   color: 'orange' },
  { id: 'full',  label: 'Full Dry',  shortLabel: 'Full',  duration: '1h 00m',  seconds: 60 * 60, icon: Flame, color: 'amber'  },
];

const programmesByType = { Washer: WASHER_PROGRAMMES, Dryer: DRYER_PROGRAMMES };

// ---------------------------------------------------------------------------
// Washer drum — spinning circles
// ---------------------------------------------------------------------------
const WasherDrum = ({ running, done }) => (
  <div className="relative w-24 h-24 mx-auto">
    <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${
      running ? 'border-blue-400 bg-blue-50 shadow-lg shadow-blue-200'
      : done   ? 'border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-200'
               : 'border-slate-200 bg-slate-50'
    }`}>
      <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center ${
        running ? 'border-blue-300 drum-spin' : done ? 'border-emerald-300' : 'border-slate-200'
      }`}>
        <div className="relative w-10 h-10">
          <div className={`absolute top-1 left-1 w-3 h-3 rounded-full ${running ? 'bg-blue-300' : done ? 'bg-emerald-300' : 'bg-slate-200'}`} />
          <div className={`absolute top-1 right-1 w-3 h-3 rounded-full ${running ? 'bg-blue-200' : done ? 'bg-emerald-200' : 'bg-slate-200'}`} />
          <div className={`absolute bottom-1 left-3 w-3 h-3 rounded-full ${running ? 'bg-blue-300' : done ? 'bg-emerald-300' : 'bg-slate-200'}`} />
        </div>
      </div>
    </div>

    {done && (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
        className="absolute -top-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
        <CheckCircle size={16} className="text-white" />
      </motion.div>
    )}

    {running && (
      <div className="absolute inset-0 rounded-full border-4 border-blue-400 border-t-transparent drum-spin-slow opacity-40 pointer-events-none" />
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Dryer drum — vibration + expanding heat-wave rings
// ---------------------------------------------------------------------------
const DryerDrum = ({ running, done }) => (
  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
    {/* Expanding heat-wave rings */}
    {running && [0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute inset-0 rounded-full border-2 border-orange-300 pointer-events-none"
        initial={{ scale: 1, opacity: 0.6 }}
        animate={{ scale: 1.55, opacity: 0 }}
        transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.53, ease: 'easeOut' }}
      />
    ))}

    {/* Drum body — vibrates when running */}
    <motion.div
      animate={running ? { y: [0, -1.5, 0, 1.5, 0, -1, 0, 1, 0] } : {}}
      transition={running ? { duration: 0.25, repeat: Infinity, ease: 'easeInOut' } : {}}
      className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${
        running ? 'border-orange-400 bg-orange-50 shadow-lg shadow-orange-200'
        : done   ? 'border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-200'
                 : 'border-slate-200 bg-slate-50'
      }`}
    >
      {/* Inner ring with grid pattern */}
      <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center ${
        running ? 'border-orange-300' : done ? 'border-emerald-300' : 'border-slate-200'
      }`}>
        <Wind
          size={28}
          className={`transition-colors duration-500 ${
            running ? 'text-orange-400' : done ? 'text-emerald-400' : 'text-slate-300'
          }`}
          style={running ? { filter: 'drop-shadow(0 0 4px #fb923c)' } : {}}
        />
      </div>
    </motion.div>

    {done && (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
        className="absolute -top-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-md z-10">
        <CheckCircle size={16} className="text-white" />
      </motion.div>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Status config — dryers show "Drying" instead of "In Use"
// ---------------------------------------------------------------------------
const getStatusCfg = (status, type) => {
  if (status === 'Available')    return { label: 'Available',    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', card: 'border-emerald-100', dot: 'bg-emerald-400' };
  if (status === 'Out of Order') return { label: 'Out of Order', badge: 'bg-red-100 text-red-700 border-red-200',             card: 'border-red-100',     dot: 'bg-red-400' };
  // Washing / running
  if (type === 'Dryer') return { label: 'Drying',  badge: 'bg-orange-100 text-orange-700 border-orange-200', card: 'border-orange-100', dot: 'bg-orange-400 animate-pulse' };
  return                       { label: 'Washing', badge: 'bg-blue-100 text-blue-700 border-blue-200',       card: 'border-blue-100',   dot: 'bg-blue-400 animate-pulse' };
};

// Colour tokens per programme colour name
const progBtnActive = {
  blue:   'bg-blue-600   border-blue-600   text-white shadow-md shadow-blue-200',
  violet: 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-200',
  orange: 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200',
  amber:  'bg-amber-600  border-amber-600  text-white shadow-md shadow-amber-200',
};

const timerColor = { Washer: 'text-blue-700', Dryer: 'text-orange-600' };
const progressColor = { Washer: 'bg-blue-500', Dryer: 'bg-orange-400' };
const sessionBgColor = { Washer: 'bg-blue-50', Dryer: 'bg-orange-50' };
const sessionTextColor = { Washer: 'text-blue-700', Dryer: 'text-orange-700' };
const sessionIconColor = { Washer: 'text-blue-500', Dryer: 'text-orange-400' };

// ---------------------------------------------------------------------------
// Programme selector button group
// ---------------------------------------------------------------------------
const ProgrammeSelector = ({ programmes, selected, onChange }) => (
  <div className="w-full">
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Programme</p>
    <div className="flex gap-2">
      {programmes.map((p) => {
        const Icon = p.icon;
        const isSelected = selected === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all duration-200 ${
              isSelected ? progBtnActive[p.color] : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Icon size={14} />
            <span>{p.shortLabel}</span>
            <span className={`font-mono text-xs ${isSelected ? 'opacity-80' : 'text-slate-400'}`}>{p.duration}</span>
          </button>
        );
      })}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// MachineCard
// ---------------------------------------------------------------------------
const MachineCard = ({ machine: initialMachine, onSessionComplete }) => {
  const { user } = useAuth();
  const [machine, setMachine] = useState(initialMachine);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isDone, setIsDone] = useState(false);
  const [activeSessionKey, setActiveSessionKey] = useState(null);
  const [completionNotified, setCompletionNotified] = useState(false);
  const [autoCompleting, setAutoCompleting] = useState(false);

  const programmes = programmesByType[machine.type] ?? WASHER_PROGRAMMES;
  const [selectedProgramme, setSelectedProgramme] = useState(programmes[0].id);

  const isMySession =
    machine.status === 'Washing' &&
    machine.currentUser &&
    (machine.currentUser._id || machine.currentUser) === user?.id;

  const calculateTimeLeft = useCallback(() => {
    if (!machine.currentUsageEnd) return null;
    const diff = new Date(machine.currentUsageEnd) - new Date();
    return diff > 0 ? Math.ceil(diff / 1000) : 0;
  }, [machine.currentUsageEnd]);

  const autoCompleteSession = useCallback(async () => {
    if (autoCompleting) return;
    setAutoCompleting(true);
    try {
      const { data } = await api.patch(`/sessions/machine/${machine._id}/complete`);
      setMachine(data.data);
      setIsDone(false);
      setTimeLeft(null);
      setActiveSessionKey(null);
      setCompletionNotified(false);
    } catch {
      // Ignore temporary auto-complete failures and allow manual completion fallback.
    } finally {
      setAutoCompleting(false);
    }
  }, [autoCompleting, machine._id]);

  useEffect(() => {
    setMachine(initialMachine);

    const nextSessionKey =
      initialMachine.currentSession?._id ||
      initialMachine.currentSession ||
      (initialMachine.currentUsageStart ? `${initialMachine._id}-${initialMachine.currentUsageStart}` : null);

    if (nextSessionKey !== activeSessionKey) {
      setActiveSessionKey(nextSessionKey);
      setCompletionNotified(false);
    }

    if (initialMachine.status !== 'Washing') {
      setIsDone(false);
      setTimeLeft(null);
      return;
    }

    if (initialMachine.currentUsageEnd && new Date(initialMachine.currentUsageEnd) <= new Date()) {
      setIsDone(true);
    }
  }, [initialMachine, activeSessionKey]);

  useEffect(() => {
    if (machine.status !== 'Washing') { setTimeLeft(null); return; }

    const tick = () => {
      const secs = calculateTimeLeft();
      setTimeLeft(secs);
      if (secs === 0 && !completionNotified) {
        setIsDone(true);
        setCompletionNotified(true);
        if (isMySession) {
          onSessionComplete?.(machine.name, machine.type, activeSessionKey || machine._id);
          autoCompleteSession();
        }
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [
    machine.status,
    machine.currentUsageEnd,
    isMySession,
    calculateTimeLeft,
    onSessionComplete,
    machine.name,
    machine.type,
    completionNotified,
    activeSessionKey,
    machine._id,
    autoCompleteSession,
  ]);

  // HH:MM:SS
  const formatTime = (secs) => {
    if (secs === null || secs === undefined) return '--:--:--';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = useCallback(() => {
    if (!machine.currentUsageStart || !machine.currentUsageEnd || timeLeft === null) return 0;
    const total   = new Date(machine.currentUsageEnd) - new Date(machine.currentUsageStart);
    const elapsed = total - timeLeft * 1000;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }, [machine.currentUsageStart, machine.currentUsageEnd, timeLeft]);

  const handleStart = async () => {
    const prog = programmes.find((p) => p.id === selectedProgramme);
    setLoading(true);
    try {
      const { data } = await api.post('/sessions/start', {
        machineId: machine._id,
        durationSeconds: prog.seconds,
        programme: prog.label,
      });
      setMachine(data.data);
      setIsDone(false);
      const nextSessionKey =
        data.data.currentSession?._id ||
        data.data.currentSession ||
        (data.data.currentUsageStart ? `${data.data._id}-${data.data.currentUsageStart}` : null);
      setActiveSessionKey(nextSessionKey);
      setCompletionNotified(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not start session');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      const { data } = await api.patch(`/sessions/machine/${machine._id}/complete`);
      setMachine(data.data);
      setIsDone(false);
      setTimeLeft(null);
      setActiveSessionKey(null);
      setCompletionNotified(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not stop session');
    } finally {
      setLoading(false);
    }
  };

  const cfg         = getStatusCfg(machine.status, machine.type);
  const isRunning   = machine.status === 'Washing' && !isDone;
  const isOutOfOrder = machine.status === 'Out of Order';
  const activeProg  = programmes.find((p) => p.id === selectedProgramme);
  const machineType = machine.type ?? 'Washer';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`bg-white rounded-2xl border-2 ${cfg.card} shadow-sm hover:shadow-md transition-shadow duration-300 p-5 flex flex-col items-center gap-4`}
    >
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-sm leading-tight">{machine.name}</h3>
          <span className="text-xs text-slate-400 font-medium">Block {machine.block} · {machineType}</span>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Drum visual */}
      <AnimatePresence mode="wait">
        {isOutOfOrder ? (
          <motion.div key="oor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="w-24 h-24 rounded-full border-4 border-red-200 bg-red-50 flex items-center justify-center">
            <AlertTriangle size={36} className="text-red-400" />
          </motion.div>
        ) : machineType === 'Dryer' ? (
          <DryerDrum key="dryer" running={isRunning} done={isDone} />
        ) : (
          <WasherDrum key="washer" running={isRunning} done={isDone} />
        )}
      </AnimatePresence>

      {/* Timer + progress bar */}
      {machine.status === 'Washing' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex flex-col items-center gap-2">
          {isDone ? (
            <span className="text-emerald-600 font-bold text-sm flex items-center gap-1">
              <CheckCircle size={14} /> Done!
            </span>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Clock size={14} className={timerColor[machineType]} />
                <span className={`font-mono font-bold text-xl tracking-widest ${timerColor[machineType]}`}>
                  {formatTime(timeLeft)}
                </span>
                <span className="text-xs text-slate-400">remaining</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${progressColor[machineType]}`}
                  animate={{ width: `${progressPercent()}%` }}
                  transition={{ duration: 0.8, ease: 'linear' }}
                />
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Session info pill */}
      {machine.status === 'Washing' && machine.currentUser && (
        <div className={`w-full flex items-center gap-2 px-3 py-2 ${sessionBgColor[machineType]} rounded-xl`}>
          <User size={12} className={`${sessionIconColor[machineType]} flex-shrink-0`} />
          <span className={`text-xs ${sessionTextColor[machineType]} font-medium truncate`}>
            {isMySession ? `Your session · ${machine.programme ?? ''}` : 'In use'}
          </span>
        </div>
      )}

      {/* Programme selector — only when available */}
      <AnimatePresence>
        {machine.status === 'Available' && !isOutOfOrder && (
          <motion.div
            key="prog-sel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full overflow-hidden"
          >
            <ProgrammeSelector
              programmes={programmes}
              selected={selectedProgramme}
              onChange={setSelectedProgramme}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="w-full">
        {machine.status === 'Available' && (
          <button
            onClick={handleStart}
            disabled={loading}
            className={`btn-primary w-full ${
              activeProg?.color === 'violet' ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-200'
              : activeProg?.color === 'orange' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
              : activeProg?.color === 'amber'  ? 'bg-amber-600  hover:bg-amber-700  shadow-amber-200'
              : ''
            }`}
          >
            <Play size={15} />
            {loading ? 'Starting…' : `Start ${activeProg?.shortLabel}`}
          </button>
        )}

        {isMySession && !isDone && (
          <button onClick={handleStop} disabled={loading} className="btn-danger w-full">
            <Square size={15} />
            {loading ? 'Stopping…' : 'End Session'}
          </button>
        )}

        {isDone && isMySession && (
          <button onClick={handleStop} disabled={loading} className="btn-primary w-full bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle size={15} />
            {loading ? 'Finishing…' : 'Mark Complete'}
          </button>
        )}

        {machine.status === 'Washing' && !isMySession && (
          <div className="text-center text-sm text-slate-400 py-2">Occupied</div>
        )}

        {isOutOfOrder && (
          <div className="text-center text-sm text-red-400 py-2 font-medium">Under maintenance</div>
        )}
      </div>
    </motion.div>
  );
};

export default MachineCard;
