import React, { useState, useEffect, useRef, useMemo } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// 196-Country Registry (Source of Truth)
const COUNTRY_REGISTRY = {
  Africa: ["Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", "Cameroon", "Central African Republic (CAR)", "Chad", "Comoros", "Congo, Democratic Republic of the", "Congo, Republic of the", "Cote d'Ivoire", "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "Sao Tome and Principe", "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe"],
  Asia: ["Afghanistan", "Armenia", "Azerbaijan", "Bahrain", "Bangladesh", "Bhutan", "Brunei", "Cambodia", "China", "Cyprus", "Georgia", "India", "Indonesia", "Iran", "Iraq", "Israel", "Japan", "Jordan", "Kazakhstan", "Kuwait", "Kyrgyzstan", "Laos", "Lebanon", "Malaysia", "Maldives", "Mongolia", "Myanmar", "Nepal", "North Korea", "Oman", "Pakistan", "Palestine", "Philippines", "Qatar", "Saudi Arabia", "Singapore", "South Korea", "Sri Lanka", "Syria", "Taiwan", "Tajikistan", "Thailand", "Timor-Leste", "Turkey", "Turkmenistan", "United Arab Emirates (UAE)", "Uzbekistan", "Vietnam", "Yemen"],
  Europe: ["Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Czechia (Czech Republic)", "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco", "Montenegro", "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal", "Romania", "Russia", "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", "Ukraine", "United Kingdom (UK)", "Vatican City"],
  NorthAmerica: ["Antigua and Barbuda", "Bahamas", "Barbados", "Belize", "Canada", "Costa Rica", "Cuba", "Dominica", "Dominican Republic", "El Salvador", "Grenada", "Guatemala", "Haiti", "Honduras", "Jamaica", "Mexico", "Nicaragua", "Panama", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Trinidad and Tobago", "United States of America (USA)"],
  SouthAmerica: ["Argentina", "Bolivia", "Brazil", "Chile", "Colombia", "Ecuador", "Guyana", "Paraguay", "Peru", "Suriname", "Uruguay", "Venezuela"],
  Oceania: ["Australia", "Fiji", "Kiribati", "Marshall Islands", "Micronesia", "Nauru", "New Zealand", "Palau", "Papua New Guinea", "Samoa", "Solomon Islands", "Tonga", "Tuvalu", "Vanuatu"]
};

// SVG Normalization Map (Bridges User List to SVG Attributes)
const NAME_MAPPING = {
  // User List Name : SVG Name
  "United States of America (USA)": "United States",
  "Russia": "Russian Federation",
  "Congo, Democratic Republic of the": "Democratic Republic of the Congo",
  "Congo, Republic of the": "Republic of Congo",
  "Cote d'Ivoire": "Côte d'Ivoire",
  "Czechia (Czech Republic)": "Czech Republic",
  "United Kingdom (UK)": "United Kingdom",
  "Taiwan": "Taiwan",
  "Central African Republic (CAR)": "Central African Republic",
  "North Korea": "Dem. Rep. Korea",
  "South Korea": "Republic of Korea",
  "Vietnam": "Viet Nam",
  "Laos": "Lao People's Democratic Republic",
  "Brunei": "Brunei Darussalam",
  "Iran": "Islamic Republic of Iran",
  "Syria": "Syrian Arab Republic",
  "Tanzania": "United Republic of Tanzania",
  "Venezuela": "Venezuela (Bolivarian Republic of)",
  "Moldova": "Republic of Moldova",
  "Palestine": "Palestine, State of",
  "The Gambia": "Gambia",
  "Togo": "Togo",
  "Tonga": "Tonga",
  "Tuvalu": "Tuvalu",
  "Saint Vincent and the Grenadines": "St. Vin. and Grend.",
  "Saint Kitts and Nevis": "St. Kitts and Nevis",
  "Saint Lucia": "St. Lucia",
  "Antigua and Barbuda": "Ant. and Barb.",
  "Bosnia and Herzegovina": "Bosnia and Herz.",
  "United Arab Emirates (UAE)": "United Arab Emirates"
};

const GlobalMapView = ({ isDarkMode, activeTheme, userCountry }) => {
  const [worldData, setWorldData] = useState([]);
  const [countryUsers, setCountryUsers] = useState({}); // { [name]: count }
  const [hoverInfo, setHoverInfo] = useState({ name: '', x: 0, y: 0, visible: false, stats: {} });
  const [countryAnchors, setCountryAnchors] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const svgRef = useRef(null);
  const pinchRef = useRef({ distance: 0, baseScale: 1 });

  // Phase 1: Load and Parse SVG
  useEffect(() => {
    fetch('/world.svg')
      .then(res => res.text())
      .then(text => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "image/svg+xml");
        const paths = doc.querySelectorAll('path');
        const data = [];

        paths.forEach((path, index) => {
          const d = path.getAttribute('d');
          const id = path.getAttribute('id');
          // Use normalization logic for accurate lookup
          let rawName = (path.getAttribute('name') || path.getAttribute('class') || '').trim();
          
          if (d) {
            data.push({ 
              d, 
              id: id || `geo-${index}`, 
              name: rawName || 'Zone', 
              index 
            });
          }
        });

        setWorldData(data);
      });
  }, []);

  // Phase 2: Centroid Anchor Calculation (Memoized result)
  useEffect(() => {
    if (worldData.length === 0 || !svgRef.current) return;

    const svg = svgRef.current;
    const groupedPaths = {};

    const domPaths = svg.querySelectorAll('path');
    domPaths.forEach(path => {
      const name = (path.getAttribute('data-name') || '').trim();
      const idx = path.getAttribute('data-index');
      if (!name) return;
      
      try {
        const bbox = path.getBBox();
        const area = bbox.width * bbox.height;
        if (area < 15) return; // Lower threshold to include smaller countries (e.g. Singapore)

        if (!groupedPaths[name]) groupedPaths[name] = [];
        groupedPaths[name].push({
          name: name,
          index: parseInt(idx),
          area: area,
          x: bbox.x + bbox.width / 2,
          y: bbox.y + bbox.height / 2
        });
      } catch (e) {}
    });

    const anchors = [];
    Object.keys(groupedPaths).forEach(name => {
      const paths = groupedPaths[name];
      const mainPath = paths.reduce((prev, current) => (prev.area > current.area) ? prev : current);
      anchors.push(mainPath);
    });

    setCountryAnchors(anchors);
    setIsLoaded(true);
  }, [worldData]);

  // Phase 3: Network Data Fetch (Active User Data)
  useEffect(() => {
    if (!isLoaded || countryAnchors.length === 0) return;
    
    const fetchMapData = async () => {
      try {
        const res = await fetch('/api/map');
        const data = await res.json();
        setCountryUsers(data);
      } catch (err) {
         console.error('Failed to fetch map data', err);
      }
    };
    
    fetchMapData();
    const interval = setInterval(fetchMapData, 10000); // Check every 10s for new nodes
    return () => clearInterval(interval);
  }, [isLoaded, countryAnchors]);

  // Performance: Memoize the entire map layer
  const mapLayer = useMemo(() => {
    return worldData.map((p) => {
      const isActive = countryUsers[p.name] > 0;
      return (
        <path
          key={`geo-path-${p.index}`}
          d={p.d}
          data-index={p.index}
          data-name={p.name}
          className={cn(
            "transition-all duration-300 ease-out fill-land stroke-land outline-none pointer-events-auto",
            isActive && "fill-land-active stroke-accent stroke-[0.8px] active-pulse-land"
          )}
        />
      );
    });
  }, [worldData, countryUsers]);

  // Phase 4: Handle Responsiveness & Zoom logic
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTouchStart = (e) => {
    if (!isMobile) return;
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      pinchRef.current = { distance: dist, baseScale: transform.scale };
    }
  };

  const handleTouchMove = (e) => {
    if (!isMobile) return;
    if (e.touches.length === 2 && pinchRef.current.distance > 0) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const ratio = dist / pinchRef.current.distance;
      const newScale = Math.min(Math.max(pinchRef.current.baseScale * ratio, 1), 4);
      setTransform(prev => ({ ...prev, scale: newScale }));
    }
  };

  const handleTouchEnd = () => {
    pinchRef.current.distance = 0;
  };

  const handleMouseMove = (e) => {
    // Robust targeting: Find the closest path element that has a data-name
    const target = e.target.closest('path[data-name]');
    if (target) {
      const rawName = target.getAttribute('data-name');
      let canonicalName = rawName;
      for (const [userListNames, svgNames] of Object.entries(NAME_MAPPING)) {
        if (svgNames === rawName) {
          canonicalName = userListNames;
          break;
        }
      }

      const users = countryUsers[rawName] || 0;
      setHoverInfo({ 
        name: canonicalName, 
        x: e.clientX, 
        y: e.clientY, 
        visible: true,
        stats: {
          latency: users > 0 ? Math.floor(Math.random() * 12 + 2) : '--',
          nodes: users
        }
      });
    } else {
      setHoverInfo(prev => ({ ...prev, visible: false }));
    }
  };

  const totalUsers = Object.values(countryUsers).reduce((a, b) => a + b, 0);

  // Continental Stats Calculation
  const continentalStats = useMemo(() => {
    const stats = {};
    Object.entries(COUNTRY_REGISTRY).forEach(([continent, countries]) => {
      let count = 0;
      countries.forEach(c => {
        const svgName = NAME_MAPPING[c] || c;
        count += countryUsers[svgName] || 0;
      });
      stats[continent] = count;
    });
    return stats;
  }, [countryUsers]);

  return (
    <div 
      className={cn(
        "relative w-full h-[calc(100vh-80px)] overflow-hidden flex items-center justify-center p-0 transition-colors duration-700 font-mono touch-none",
        isDarkMode ? "bg-[var(--bg-main)] text-[var(--primary)]" : "bg-[var(--bg-main)] text-slate-800"
      )}
      style={{
        '--land-fill': isDarkMode ? 'var(--bg-surface)' : '#F1F5F9',
        '--land-stroke': isDarkMode ? 'var(--primary-20)' : '#CBD5E1',
        '--land-active': 'var(--primary)',
        '--accent': 'var(--primary)',
        '--map-land': 'var(--land-fill)',
        '--map-land-hover': isDarkMode ? 'var(--primary-20)' : '#E2E8F0'
      }}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(0,186,255,0.05)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(0,186,255,0.05)_0%,transparent_70%)]" />
      </div>

      {/* World Map Container */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden transition-opacity duration-1000">
        <svg 
          ref={svgRef}
          viewBox="0 0 2000 857" 
          className="w-[95%] h-[85%] object-contain pointer-events-auto drop-shadow-[0_0_30px_rgba(0,0,0,0.3)]"
          preserveAspectRatio="xMidYMid meet"
        >
          <g 
            style={{ 
              transform: `scale(${transform.scale})`,
              transformOrigin: 'center center',
              transition: 'transform 0.1s linear'
            }}
          >
            {mapLayer}
            
            {/* Active User Nodes Layer */}
            <g className="badges-layer pointer-events-none">
              {countryAnchors
                .filter(a => countryUsers[a.name] > 0)
                .map((node) => (
                  <g 
                    key={`badge-${node.name}`}
                    transform={`translate(${node.x}, ${node.y})`}
                  >
                    <circle r="4" fill="var(--accent)" className="animate-pulse" />
                    <circle r="14" fill="none" stroke="var(--accent)" strokeWidth="0.5" className="opacity-10 animate-[ping_4s_infinite]" />
                    
                    {/* The Numeric Badge */}
                    <g transform="translate(0, -18)">
                      <rect 
                        x="-20" y="-10" width="40" height="20" rx="4" 
                        className="fill-[var(--bg-surface)] stroke-[var(--primary)] stroke-[2px] shadow-[0_0_20px_var(--primary-20)]" 
                      />
                      <text 
                        fontSize="12" 
                        textAnchor="middle" 
                        className="fill-[var(--text-main)] font-[900]" 
                        y="5"
                      >
                        {countryUsers[node.name]}
                      </text>
                    </g>
                  </g>
              ))}
            </g>
          </g>
        </svg>
      </div>

      {/* Futuristic HUD Components */}
      {/* Top HUD Container: Stacks on mobile, flows horizontally on desktop */}
      <div className={cn(
        "absolute top-4 md:top-8 left-0 w-full px-4 md:px-8 pointer-events-none flex flex-col md:flex-row justify-between gap-4 md:gap-0 z-[60]"
      )}>
        {/* HUD 1: System Telemetry */}
        <div className={cn(
          "p-4 border-l-2 border-[var(--accent)] bg-opacity-20 backdrop-blur-md flex flex-col gap-0.5 pointer-events-auto",
          isDarkMode ? "bg-slate-900/40" : "bg-white/40"
        )}>
          <span className="text-[10px] uppercase tracking-[0.4em] opacity-40">Zepglide.Network.Mesh</span>
          <div className="flex items-center gap-4">
            <span className="text-xl md:text-2xl font-bold tracking-tighter tabular-nums text-[var(--accent)]">ACTIVE_SYNC</span>
            <div className="flex flex-col">
              <span className="text-[8px] opacity-60 uppercase">Protocols</span>
              <span className="text-[10px] font-bold text-green-500">196 CO_ACC</span>
            </div>
          </div>
          {/* Infographic: Mini Graph */}
          <div className="flex items-end gap-0.5 h-6 mt-2 opacity-60">
            {[4, 7, 2, 8, 5, 9, 3, 6, 4, 2].map((h, i) => (
              <div key={i} className="w-1 bg-[var(--accent)] animate-pulse" style={{ height: `${h * 10}%`, animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        </div>

        {/* HUD 2: Live Nodes Counter */}
        <div className={cn(
          "p-4 border-r-2 border-[var(--accent)] text-left md:text-right bg-opacity-20 backdrop-blur-md flex flex-col gap-0.5 pointer-events-auto",
          isDarkMode ? "bg-slate-900/40" : "bg-white/40"
        )}>
          <span className="text-[10px] uppercase tracking-[0.4em] opacity-40">Live.Global.Users</span>
          <div className="flex items-baseline justify-start md:justify-end gap-2">
            <span className="text-3xl md:text-4xl font-bold tracking-tighter tabular-nums text-[var(--accent)]">
              {isLoaded ? totalUsers.toLocaleString() : '----'}
            </span>
            <span className="text-[10px] opacity-60">USERS</span>
          </div>
          <div className="flex items-center justify-start md:justify-end gap-1 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[8px] uppercase tracking-widest opacity-80">Encryption Verified</span>
          </div>
        </div>
      </div>

      {/* HUD 3: Live Access Ticker (Bottom Bar) */}
      <div className={cn(
        "absolute bottom-0 w-full h-8 overflow-hidden backdrop-blur-xl border-t border-[var(--accent)]/10 flex items-center px-8 z-[50]",
        isDarkMode ? "bg-slate-950/80" : "bg-white/80"
      )}>
        <div className="flex items-center gap-12 whitespace-nowrap animate-[marquee_45s_linear_infinite]">
          {Object.entries(countryUsers).map(([name, count], i) => {
             let canonicalName = name;
             for (const [userListNames, svgNames] of Object.entries(NAME_MAPPING)) {
               if (svgNames === name) {
                 canonicalName = userListNames;
                 break;
               }
             }
             return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[8px] opacity-40">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">{canonicalName}</span>
                <span className="text-[10px] text-accent font-bold">+{count} Peers</span>
                <span className="text-[8px] text-green-500 opacity-60">Uplink_OK</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* NEW HUD HUD 4: PERSISTENT CONTINENTAL BAR (Visible on Mobile & Desktop) */}
      <div className={cn(
        "absolute bottom-10 left-0 w-full overflow-hidden backdrop-blur-md border-t border-b border-[var(--accent)]/10 py-2 flex items-center z-40 transition-opacity duration-1000",
        isLoaded ? "opacity-100" : "opacity-0",
        isDarkMode ? "bg-slate-900/40" : "bg-white/40"
      )}>
        <div className="flex items-center justify-around w-full max-w-[1440px] mx-auto px-4 gap-4 overflow-x-auto scrollbar-none">
          {Object.entries(continentalStats).map(([continent, count]) => {
            const label = continent === "NorthAmerica" ? "N. America" : 
                          continent === "SouthAmerica" ? "S. America" : 
                          continent;
            return (
              <div key={continent} className="flex items-center gap-3 min-w-fit border-l border-accent/20 pl-4 py-1">
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-40 whitespace-nowrap">{label}</span>
                <span className="text-[12px] md:text-[14px] font-bold text-accent tabular-nums">{count.toLocaleString()}</span>
                {/* Micro sparkline */}
                <div className="w-12 h-1 bg-slate-800/20 md:flex hidden overflow-hidden rounded-full">
                  <div 
                    className="h-full bg-accent transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (count / (totalUsers || 1)) * 300)}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive HUD: Magnetic Tooltip Card */}
      <div 
        className={cn(
          "fixed pointer-events-none z-[1000] p-4 transition-opacity transition-transform duration-100 transform",
          hoverInfo.visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-10"
        )}
        style={{ 
          left: isMobile ? '50%' : hoverInfo.x + (hoverInfo.x > window.innerWidth / 2 ? -280 : 25), 
          top: isMobile ? '100px' : hoverInfo.y + (hoverInfo.y < 250 ? 50 : -140),
          transform: isMobile ? 'translateX(-50%) skew-x(-12deg)' : 'skew-x(-12deg)',
          willChange: 'transform, left, top' 
        }}
      >
        <div className={cn(
          "min-w-[200px] md:min-w-[240px] p-4 md:p-5 border-2 border-[var(--primary)]/50 shadow-[0_0_50px_rgba(0,0,0,0.5)]",
          isDarkMode ? "bg-[var(--bg-surface)]" : "bg-[var(--bg-surface)]"
        )}>
          <div className={cn("flex flex-col gap-3", !isMobile && "skew-x-[12deg]")}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--primary)] opacity-60">Uplink.Analytics</span>
              <div className="w-2.5 h-2.5 bg-[var(--primary)] rotate-45 animate-pulse shadow-[0_0_10px_var(--primary)]" />
            </div>
            <span className="text-2xl font-[900] tracking-tighter uppercase leading-none border-b-2 border-[var(--primary)]/20 pb-3 mb-2 text-[var(--text-main)]">{hoverInfo.name}</span>
            <div className="grid grid-cols-2 gap-6 mt-1">
              <div className="flex flex-col">
                <span className="text-[8px] font-black opacity-40 uppercase tracking-widest">Latency</span>
                <span className="text-sm font-black text-[var(--primary)]">{hoverInfo.stats.latency}ms</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black opacity-40 uppercase tracking-widest">Active Peers</span>
                <span className="text-sm font-black text-[var(--primary)]">{hoverInfo.stats.nodes}</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Global CSS for animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes loading-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .badges-layer text {
          user-select: none;
          pointer-events: none;
        }
      `}} />

      <style dangerouslySetInnerHTML={{ __html: `
        .fill-land { fill: var(--land-fill); }
        .stroke-land { stroke: var(--land-stroke); }
        .fill-land-active { fill: var(--land-active); }
        .stroke-accent { stroke: var(--accent); }
      `}} />
    </div>
  );
};

export default GlobalMapView;
