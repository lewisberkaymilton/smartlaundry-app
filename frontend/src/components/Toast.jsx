import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const icons = {
  success: <CheckCircle size={20} className="text-emerald-500" />,
  error: <XCircle size={20} className="text-red-500" />,
  info: <Info size={20} className="text-blue-500" />,
};

const bgMap = {
  success: 'bg-emerald-50 border-emerald-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
};

const Toast = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-80">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`flex items-start gap-3 p-4 rounded-2xl border shadow-lg ${bgMap[toast.type]}`}
          >
            <span className="mt-0.5 flex-shrink-0">{icons[toast.type]}</span>
            <p className="flex-1 text-sm font-medium text-slate-800">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
