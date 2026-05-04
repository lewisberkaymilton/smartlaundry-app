import { Droplets, Sparkles } from 'lucide-react';

const BrandMark = ({ size = 'md', className = '' }) => {
  const map = {
    sm: { outer: 'w-9 h-9', inner: 'w-6 h-6', icon: 14, spark: 10 },
    md: { outer: 'w-12 h-12', inner: 'w-8 h-8', icon: 18, spark: 12 },
    lg: { outer: 'w-16 h-16', inner: 'w-10 h-10', icon: 22, spark: 14 },
  };

  const s = map[size] || map.md;

  return (
    <div className={`relative ${s.outer} ${className}`}>
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-300/60`} />
      <div className={`absolute inset-0.5 rounded-[14px] border border-white/25`} />
      <div className={`absolute inset-0 flex items-center justify-center`}>
        <div className={`${s.inner} rounded-xl bg-white/14 border border-white/25 backdrop-blur-sm flex items-center justify-center`}>
          <Droplets size={s.icon} className="text-white" />
        </div>
      </div>
      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-300 border border-white/70 flex items-center justify-center shadow-sm">
        <Sparkles size={s.spark} className="text-blue-700" />
      </div>
    </div>
  );
};

export default BrandMark;
