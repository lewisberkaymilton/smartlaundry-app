import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, RefreshCw, Settings2, Trash2 } from 'lucide-react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import useToast from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';

const MACHINE_STATUSES = ['Available', 'Washing', 'Out of Order'];
const BLOCKS = ['A', 'B', 'C'];
const TYPES = ['Washer', 'Dryer'];

const AdminMachines = () => {
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [machineDraft, setMachineDraft] = useState({ name: '', block: 'A', type: 'Washer' });
  const [machineStatusDrafts, setMachineStatusDrafts] = useState({});
  const [busyMachineId, setBusyMachineId] = useState(null);
  const [creatingMachine, setCreatingMachine] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState('all');

  const fetchMachines = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await api.get('/machines');
      setMachines(Array.isArray(data.data) ? data.data : []);
      setError('');
    } catch {
      setError('Failed to load machines');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  const visibleMachines = useMemo(() => {
    const source = Array.isArray(machines) ? machines : [];
    return source.filter((machine) => selectedBlock === 'all' || machine.block === selectedBlock);
  }, [machines, selectedBlock]);

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

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <Navbar />
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Machine Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Create, update and delete campus machines in one place.
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

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <PlusCircle size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Create Machine</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={machineDraft.name}
              onChange={(e) => setMachineDraft((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Machine name (e.g. Washer D-1)"
              className="input-field md:col-span-2"
            />
            <select
              value={machineDraft.block}
              onChange={(e) => setMachineDraft((prev) => ({ ...prev, block: e.target.value }))}
              className="input-field"
            >
              {BLOCKS.map((block) => (
                <option key={block} value={block}>Block {block}</option>
              ))}
            </select>
            <select
              value={machineDraft.type}
              onChange={(e) => setMachineDraft((prev) => ({ ...prev, type: e.target.value }))}
              className="input-field"
            >
              {TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={handleCreateMachine} disabled={creatingMachine} className="btn-primary text-sm">
              <PlusCircle size={14} />
              {creatingMachine ? 'Creating...' : 'Create Machine'}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Settings2 size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">Machines</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedBlock('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  selectedBlock === 'all'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                All
              </button>
              {BLOCKS.map((block) => (
                <button
                  key={block}
                  onClick={() => setSelectedBlock(block)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    selectedBlock === block
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  Block {block}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading machines...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : visibleMachines.length === 0 ? (
            <p className="text-sm text-slate-500">No machines found in this filter.</p>
          ) : (
            <div className="overflow-x-auto">
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
                  {visibleMachines.map((machine) => {
                    const selectedStatus = machineStatusDrafts[machine._id] ?? machine.status;
                    const isBusy = busyMachineId === machine._id;
                    return (
                      <tr key={machine._id} className="border-b border-slate-100 last:border-b-0">
                        <td className="py-2 pr-2 font-medium text-slate-700">{machine.name}</td>
                        <td className="py-2 pr-2 text-slate-500">{machine.block}</td>
                        <td className="py-2 pr-2 text-slate-500">{machine.type}</td>
                        <td className="py-2 pr-2">
                          <select
                            value={selectedStatus}
                            onChange={(e) => setMachineStatusDrafts((prev) => ({ ...prev, [machine._id]: e.target.value }))}
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
                              onClick={() => handleUpdateMachineStatus(machine._id)}
                              disabled={isBusy || selectedStatus === machine.status}
                              className="btn-secondary text-xs px-3 py-2"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => handleDeleteMachine(machine._id)}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMachines;
