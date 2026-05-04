const BrandMark = ({ size = 'md', className = '' }) => {
  const map = {
    sm: { outer: 'w-9 h-9', stroke: 1.8 },
    md: { outer: 'w-12 h-12', stroke: 1.8 },
    lg: { outer: 'w-16 h-16', stroke: 1.6 },
  };

  const s = map[size] || map.md;

  return (
    <div
      className={`relative ${s.outer} ${className} rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-300/50`}
      aria-hidden="true"
    >
      <div className="absolute inset-0.5 rounded-[14px] border border-white/30" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[72%] w-[72%] rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm p-[12%]">
          <svg viewBox="0 0 24 24" className="h-full w-full text-white fill-none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3.5" width="18" height="17.5" rx="3" stroke="currentColor" strokeWidth={s.stroke} />
            <circle cx="12" cy="12.5" r="4.6" stroke="currentColor" strokeWidth={s.stroke} />
            <path d="M10.6 12.2c.8-1.5 2.8-2 4.3-1.1" stroke="currentColor" strokeWidth={s.stroke} strokeLinecap="round" />
            <circle cx="7.2" cy="7.2" r="1" fill="currentColor" stroke="none" />
            <circle cx="10.2" cy="7.2" r="1" fill="currentColor" stroke="none" />
          </svg>
        </div>
      </div>
      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-cyan-300 border border-white/80 shadow-sm" />
      <div className="absolute -bottom-1 -left-1 h-2.5 w-2.5 rounded-full bg-blue-100/70" />
      <div className="absolute top-1.5 left-1.5 h-2 w-2 rounded-full bg-white/35" />
      <div className="absolute top-[22%] left-[25%] h-[28%] w-[28%] rounded-full bg-white/10 blur-[1px]" />
      <div className="absolute bottom-[20%] right-[20%] h-[18%] w-[18%] rounded-full bg-cyan-200/20 blur-[1px]" />
      <div className="absolute top-[47%] right-[26%] h-[10%] w-[10%] rounded-full bg-white/50" />
      <div className="absolute bottom-[28%] left-[28%] h-[8%] w-[8%] rounded-full bg-cyan-100/60" />
      <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10" />
      <div className="absolute inset-0 rounded-2xl pointer-events-none">
        <div className="absolute left-[12%] top-[12%] h-[18%] w-[18%] rounded-full bg-white/8 blur-[2px]" />
        <div className="absolute right-[8%] top-[36%] h-[14%] w-[14%] rounded-full bg-cyan-200/10 blur-[2px]" />
        <div className="absolute left-[18%] bottom-[10%] h-[15%] w-[15%] rounded-full bg-blue-100/12 blur-[2px]" />
      </div>
    </div>
  );
};

export default BrandMark;
