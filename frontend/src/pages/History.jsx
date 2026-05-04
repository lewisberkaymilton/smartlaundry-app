import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History as HistoryIcon, WashingMachine, Clock, Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/sessions/history/me');
        setHistory(data.data);
      } catch {
        setError('Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <Link
            to="/dashboard"
            className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <HistoryIcon size={22} className="text-blue-600" />
              Usage History
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Your past laundry sessions</p>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 rounded-full border-4 border-blue-400 border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <div className="card text-center py-12 text-red-500">{error}</div>
        ) : history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card flex flex-col items-center py-16 gap-3 text-center"
          >
            <WashingMachine size={48} className="text-blue-100" />
            <p className="text-slate-600 font-semibold">No sessions yet</p>
            <p className="text-slate-400 text-sm">Start your first laundry session on the dashboard.</p>
            <Link to="/dashboard" className="btn-primary text-sm mt-2">
              Go to Dashboard
            </Link>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card hover:shadow-md transition-shadow duration-200 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <WashingMachine size={22} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{entry.machineName}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {formatDate(entry.startTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {formatTime(entry.startTime)} — {formatTime(entry.endTime)}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                    {entry.durationMinutes} min
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
