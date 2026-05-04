import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import BrandMark from './BrandMark';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <BrandMark size="sm" className="group-hover:scale-105 transition-transform duration-200" />
          <span className="text-lg font-bold text-slate-800 tracking-tight">
            Smart<span className="text-blue-600">Laundry</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/history"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          >
            <History size={16} />
            <span className="hidden sm:inline">History</span>
          </Link>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
              <User size={14} className="text-blue-600" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-none">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
