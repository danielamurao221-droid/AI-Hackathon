// A calm, simple illustration for each chapter. Pure SVG, no image files.

function Kite({ x, y, color, patch, rot = 0 }: { x: number; y: number; color: string; patch?: boolean; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d="M0 -22 16 0 0 26 -16 0Z" fill={color} />
      {patch && <path d="M-16 0 0 -22 0 0Z" fill="#e86f51" />}
      <path d="M0 -22v48M-16 0h32" stroke="#fff8ec" strokeWidth="1.6" />
      <path d="M0 26c-6 8 6 12 0 20s6 12 0 20" stroke="#6b4b2f" strokeWidth="1.4" fill="none" />
    </g>
  );
}

export function Scene({ level, page = 0 }: { level: number; page?: number }) {
  return (
    <svg className="scene" viewBox="0 0 360 150" preserveAspectRatio="xMidYMid slice" role="img" aria-label="">
      <rect width="360" height="150" fill="#cfe9f0" />
      <circle cx={300 - page * 8} cy="34" r="18" fill="#f6c445" />
      <path d="M0 108c40-8 80-8 120 0s80 8 120 0 80-8 120 0v42H0z" fill="#7fbfd6" />
      <path d="M0 122c40-6 80-6 120 0s80 6 120 0 80-6 120 0v28H0z" fill="#5ea8c4" />
      <path d="M0 132h360v18H0z" fill="#ead6ae" />
      {/* palm tree */}
      <path d="M40 132c2-24 6-40 14-56" stroke="#8a5a36" strokeWidth="5" fill="none" />
      <path d="M54 76c-14-4-24 2-30 10 10-4 20-6 30-10zM54 76c12-8 24-6 30 0-10-2-20-2-30 0zM54 76c-4-10 0-18 6-22-2 8-4 14-6 22z" fill="#3fa36b" />
      {level === 1 && (
        <>
          <Kite x={200} y={70} color="#d94a3a" rot={-8} />
          <rect x="250" y="108" width="40" height="24" rx="3" fill="#c98b2b" />
          <path d="M248 108l22-14 22 14z" fill="#a8652e" />
        </>
      )}
      {level === 2 && (
        <>
          <rect x="226" y="86" width="8" height="46" fill="#8a5a36" />
          <circle cx="230" cy="78" r="26" fill="#4cb87a" />
          <circle cx="214" cy="88" r="12" fill="#3fa36b" />
          <Kite x={244} y={72} color="#b8bec6" rot={24} patch={page >= 2} />
          <Kite x={150} y={58} color="#d94a3a" rot={-10} />
        </>
      )}
      {level === 3 && (
        <>
          <Kite x={170} y={52} color="#d94a3a" rot={-6} />
          <Kite x={226} y={60} color="#b8bec6" rot={8} patch />
          <Kite x={110} y={40} color="#5b7fd6" rot={-14} />
          <Kite x={290} y={84} color="#f2b33d" rot={12} />
        </>
      )}
    </svg>
  );
}
