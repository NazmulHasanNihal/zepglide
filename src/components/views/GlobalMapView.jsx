import React, { useState, useEffect, useRef, useMemo } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown, Shield, Smartphone, Download, Activity, Terminal, Globe, Cpu, RefreshCw, Zap, Database, Route, Lock } from 'lucide-react';
import { io } from 'socket.io-client';

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

// SVG Normalization Map
const NAME_MAPPING = {
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

const LiveTransferCounter = ({ totalTransfers }) => {
  return <div className="text-[var(--primary)] text-xl md:text-2xl font-black tracking-widest mt-2">{totalTransfers.toLocaleString()} TRANSFERS ON RECORD</div>;
};

const GlobalMapView = () => {
  const [worldData, setWorldData] = useState([]);
  const [countryUsers, setCountryUsers] = useState({});
  const [countryAnchors, setCountryAnchors] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [arcs, setArcs] = useState([]);
  const [activeLabels, setActiveLabels] = useState([]);
  const [hoverInfo, setHoverInfo] = useState({ name: '', visible: false, x: 0, y: 0, users: 0 });
  
  const [mapScale, setMapScale] = useState(1);
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const [isMapDragging, setIsMapDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, lastPanX: 0, lastPanY: 0, pinchDist: 0 });

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [touchStartY, setTouchStartY] = useState(null);
  
  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
  };
  
  const handleTouchMove = (e) => {
    if (touchStartY === null) return;
    const touchEndY = e.touches[0].clientY;
    const diff = touchStartY - touchEndY;
    
    // 30px threshold for swipe detection
    if (diff > 30) {
      setIsCollapsed(false); // Swipe Up -> Expand
      setTouchStartY(null);
    } else if (diff < -30) {
      setIsCollapsed(true); // Swipe Down -> Collapse
      setTouchStartY(null);
    }
  };
  
  const handleTouchEnd = () => {
    setTouchStartY(null);
  };
  
  const [recentFiles, setRecentFiles] = useState([]);
  const [globalStats, setGlobalStats] = useState({ activePeers: 0, bandwidth: 0, filesInFlight: 0, dataSynced: 0, distanceBridged: 0, totalTransfers: 0 });

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://zepglide.onrender.com' : 'http://localhost:3001');
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    
    socket.emit('join-hub');
    socket.on('hub-stats', (stats) => {
      setGlobalStats(stats);
    });

    return () => socket.disconnect();
  }, []);
  
  const svgRef = useRef(null);
  const [clickEffects, setClickEffects] = useState([]);

  const handleMapClick = (e) => {
    if (!svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
    
    const id = Date.now();
    setClickEffects(prev => [...prev, { id, x: svgP.x, y: svgP.y }]);
    
    setTimeout(() => {
       setClickEffects(prev => prev.filter(c => c.id !== id));
    }, 1000);
    
    // Also trigger tooltip logic for mobile tap support
    const target = e.target.closest('path[data-name]');
    if (target) {
      const rawName = target.getAttribute('data-name');
      let canonicalName = rawName;
      const normalizedRaw = rawName.trim().toLowerCase();
      for (const [userListNames, svgNames] of Object.entries(NAME_MAPPING)) {
        if (svgNames.trim().toLowerCase() === normalizedRaw) {
          canonicalName = userListNames;
          break;
        }
      }
      const users = countryUsers[canonicalName] || countryUsers[rawName] || 0;
      setHoverInfo({ 
        name: canonicalName, 
        visible: true, 
        x: e.clientX, 
        y: e.clientY, 
        users 
      });
    } else {
      setHoverInfo(prev => ({ ...prev, visible: false }));
    }
  };

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
        if (area < 15) return;

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

  useEffect(() => {
    if (!isLoaded || countryAnchors.length === 0) return;
    
    const fetchMapData = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://zepglide.onrender.com' : '')) + '/api/map');
        const data = await res.json();
        setCountryUsers(data);
      } catch (err) {
         console.error('Failed to fetch map data', err);
      }
    };
    
    fetchMapData();
    const interval = setInterval(fetchMapData, 10000);
    return () => clearInterval(interval);
  }, [isLoaded, countryAnchors]);

  // Generate Animated Arcs
  useEffect(() => {
     if (!isLoaded || countryAnchors.length < 2 || Object.keys(countryUsers).length === 0) return;
     
     // Build a list of active nodes based on countryUsers mapped properly (case-insensitive)
     const activeNodes = countryAnchors.filter(a => {
        const normalizedAnchor = a.name.trim().toLowerCase();
        let canonicalName = a.name;
        for (const [key, val] of Object.entries(NAME_MAPPING)) {
           if (val.trim().toLowerCase() === normalizedAnchor) {
              canonicalName = key;
              break;
           }
        }
        return countryUsers[canonicalName] || countryUsers[a.name];
     });

     if (activeNodes.length < 2) return;
     
     const generateArcs = () => {
       const newArcs = [];
       const labels = [];
       const numArcs = Math.min(15, activeNodes.length * 2);
       
       for(let i=0; i<numArcs; i++) {
          const from = activeNodes[Math.floor(Math.random() * activeNodes.length)];
          // Remove the while loop so it can randomly pick the same country
          let to = activeNodes[Math.floor(Math.random() * activeNodes.length)];
          
          let cx, cy;
          if (from === to) {
            // Draw a looping arc for same-country
            cx = from.x + 30 + (Math.random() * 20);
            cy = from.y - 40 - (Math.random() * 20);
          } else {
            cx = (from.x + to.x) / 2;
            const dist = Math.abs(from.x - to.x);
            cy = Math.min(from.y, to.y) - (dist * 0.3) - (Math.random() * 50);
          }

          newArcs.push({ 
            id: `arc-${i}-${Date.now()}`, 
            from, 
            to, 
            cx, 
            cy, 
            delay: Math.random() * 2, 
            duration: 1.5 + Math.random() * 1.5,
            color: Math.random() > 0.5 ? 'var(--primary)' : '#4ade80' // Add some color variety for fun
          });
          
          // Randomly show labels for some active nodes
          if (Math.random() > 0.7 && !labels.find(l => l.name === to.name)) {
              labels.push({ name: to.name, x: to.x, y: to.y });
          }
          if (Math.random() > 0.7 && !labels.find(l => l.name === from.name)) {
              labels.push({ name: from.name, x: from.x, y: from.y });
          }
       }
       setArcs(newArcs);
       setActiveLabels(labels.slice(0, 5));
     };

     generateArcs();
     const interval = setInterval(generateArcs, 8000);
     return () => clearInterval(interval);
  }, [isLoaded, countryUsers, countryAnchors]);

  const timelineBars = useMemo(() => {
    return Array.from({length: 30}).map((_, i) => {
       const height = 40 + Math.sin(i / 3) * 20 + (Math.random() * 10 - 5);
       return (
          <div key={i} className="flex-1 bg-[var(--primary)] transition-all duration-1000 border-r border-black/20" 
               style={{ height: `${height}%`, opacity: 0.15 }} />
       );
    });
  }, []);

  const handleMouseMove = (e) => {
    const target = e.target.closest('path[data-name]');
    if (target) {
      const rawName = target.getAttribute('data-name');
      let canonicalName = rawName;
      const normalizedRaw = rawName.trim().toLowerCase();
      for (const [userListNames, svgNames] of Object.entries(NAME_MAPPING)) {
        if (svgNames.trim().toLowerCase() === normalizedRaw) {
          canonicalName = userListNames;
          break;
        }
      }
      const users = countryUsers[canonicalName] || countryUsers[rawName] || 0;
      setHoverInfo({ 
        name: canonicalName, 
        visible: true, 
        x: e.clientX, 
        y: e.clientY, 
        users 
      });
    } else {
      setHoverInfo(prev => ({ ...prev, visible: false }));
    }
  };

  const handleMapPointerDown = (e) => {
    if (e.touches && e.touches.length === 2) {
       const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
       dragRef.current.pinchDist = dist;
       return;
    }
    
    setIsMapDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current.startX = clientX;
    dragRef.current.startY = clientY;
    dragRef.current.lastPanX = mapPan.x;
    dragRef.current.lastPanY = mapPan.y;
  };

  const handleMapPointerMove = (e) => {
    if (e.touches && e.touches.length === 2) {
       const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
       if (dragRef.current.pinchDist) {
         const delta = dist - dragRef.current.pinchDist;
         if (Math.abs(delta) > 5) {
            setMapScale(prev => Math.min(Math.max(1, prev + (delta > 0 ? 0.03 : -0.03)), 5));
            dragRef.current.pinchDist = dist;
         }
       }
       return;
    }

    if (!isMapDragging) {
       handleMouseMove(e);
       return;
    }
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const deltaX = (clientX - dragRef.current.startX) / mapScale;
    const deltaY = (clientY - dragRef.current.startY) / mapScale;
    
    setMapPan({
      x: dragRef.current.lastPanX + deltaX,
      y: dragRef.current.lastPanY + deltaY
    });
  };

  const handleMapPointerUp = () => {
    setIsMapDragging(false);
    dragRef.current.pinchDist = 0;
  };

  const handleMapWheel = (e) => {
    const delta = e.deltaY * -0.002;
    setMapScale(prev => Math.min(Math.max(1, prev + delta), 5));
  };

  return (
    <div 
       className="relative w-full h-[calc(100vh-80px)] overflow-hidden flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] font-sans touch-none select-none animate-in fade-in"
    >
        
       {/* Background Grid Ambience */}
       <div className="absolute inset-0 pointer-events-none opacity-20" 
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

       {/* Top Header Section */}
       <div className="absolute top-0 w-full z-45 pointer-events-none flex flex-col items-center pt-8 px-4">
           <h1 className="text-xl md:text-3xl font-black uppercase tracking-widest text-[var(--text-main)] text-center drop-shadow-md">Live Zepglide Transfer Map</h1>
           <LiveTransferCounter totalTransfers={globalStats.totalTransfers || 0} />
           
           {/* Top right button - hidden on small screens for responsiveness */}
           <div className="absolute top-6 right-6 border border-[var(--border-main)] bg-[var(--bg-surface)]/80 px-5 py-2 flex flex-col pointer-events-auto cursor-pointer hover:bg-[var(--bg-hover)] transition hidden lg:flex">
              <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-bold mb-0.5">High Velocity P2P Routing</span>
              <span className="text-sm uppercase font-black text-[var(--text-main)] flex items-center gap-1">Zero Cloud Storage Costs <span className="bg-[var(--primary)] text-[var(--primary-content)] px-1.5 leading-none py-0.5 ml-1 flex items-center justify-center">&gt;</span></span>
           </div>
       </div>

       {/* Map Layer */}
       <div 
         className={cn("flex-1 w-full h-full relative flex items-center justify-center", isMapDragging ? "cursor-grabbing" : "cursor-grab")}
         onMouseDown={handleMapPointerDown}
         onMouseMove={handleMapPointerMove}
         onMouseUp={handleMapPointerUp}
         onMouseLeave={handleMapPointerUp}
         onTouchStart={handleMapPointerDown}
         onTouchMove={handleMapPointerMove}
         onTouchEnd={handleMapPointerUp}
         onWheel={handleMapWheel}
         onClick={handleMapClick}
       >
           <svg 
              ref={svgRef}
              viewBox="0 0 2000 857" 
              className="w-[95%] h-[95%] object-contain mt-[-80px] md:mt-0 pointer-events-none drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]"
              preserveAspectRatio="xMidYMid meet"
              style={{ 
                 transform: `scale(${mapScale}) translate(${mapPan.x}px, ${mapPan.y}px)`, 
                 transition: isMapDragging ? 'none' : 'transform 0.1s ease-out' 
              }}
           >
              <defs>
                 <pattern id="dot-pattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.5" fill="var(--text-muted)" opacity="0.3" />
                 </pattern>
                 <linearGradient id="arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
                    <stop offset="50%" stopColor="var(--primary)" stopOpacity="1" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                 </linearGradient>
              </defs>
              
              {/* Landmass */}
              <g className="map-landmass">
                {worldData.map((p) => (
                   <path
                     key={`geo-path-${p.index}`}
                     d={p.d}
                     data-index={p.index}
                     data-name={p.name}
                     className="stroke-[var(--border-main)] stroke-[0.5px] transition-colors duration-500 hover:fill-[var(--primary)] hover:opacity-100 cursor-pointer pointer-events-auto"
                     fill="url(#dot-pattern)" 
                     style={{ opacity: 1 }}
                   />
                ))}
              </g>

              {/* Labels */}
              <g className="labels-layer">
                 {activeLabels.map((l, i) => (
                    <g key={`label-${i}`} transform={`translate(${l.x}, ${l.y - 10})`}>
                       <text fontSize="14" fill="var(--text-main)" textAnchor="middle" className="font-bold drop-shadow-md">{l.name}</text>
                    </g>
                 ))}
              </g>

              {/* Arcs and Nodes */}
              <g className="arcs-layer">
                 {clickEffects.map(effect => (
                    <circle 
                      key={effect.id} 
                      cx={effect.x} 
                      cy={effect.y} 
                      r="16" 
                      fill="transparent" 
                      stroke="var(--primary)" 
                      strokeWidth="3" 
                      className="animate-ping" 
                      style={{ animationDuration: '1s' }} 
                    />
                 ))}
                 {arcs.map(arc => (
                    <g key={arc.id}>
                        <path 
                          d={`M ${arc.from.x} ${arc.from.y} Q ${arc.cx} ${arc.cy} ${arc.to.x} ${arc.to.y}`}
                          fill="none"
                          stroke={arc.color}
                          strokeWidth="3.5"
                          className="animate-arc"
                          style={{ 
                             animationDelay: `${arc.delay}s`, 
                             animationDuration: `${arc.duration}s`,
                             strokeDasharray: '600', 
                             strokeDashoffset: '600',
                             filter: `drop-shadow(0 0 12px ${arc.color})`
                          }}
                       />
                       {/* Target nodes only, ping circle removed per user request */}
                       <circle cx={arc.from.x} cy={arc.from.y} r="4" fill={arc.color} style={{ filter: `drop-shadow(0 0 10px ${arc.color})` }} />
                       <circle cx={arc.to.x} cy={arc.to.y} r="4" fill={arc.color} style={{ filter: `drop-shadow(0 0 10px ${arc.color})` }} />
                    </g>
                 ))}
              </g>
           </svg>
       </div>

       {/* Zoom Controls (Mobile & Desktop) */}
       <div className="absolute right-4 bottom-24 md:bottom-32 flex flex-col gap-3 z-40">
         <button 
            onClick={() => setMapScale(prev => Math.min(5, prev + 0.5))} 
            className="w-12 h-12 bg-[var(--bg-surface)]/90 backdrop-blur-md border-2 border-[var(--border-main)] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform hover:border-[var(--primary)] hover:text-[var(--primary)] text-[var(--text-main)]"
         >
            <span className="text-2xl font-black mb-1">+</span>
         </button>
         <button 
            onClick={() => setMapScale(prev => Math.max(1, prev - 0.5))} 
            className="w-12 h-12 bg-[var(--bg-surface)]/90 backdrop-blur-md border-2 border-[var(--border-main)] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform hover:border-[var(--primary)] hover:text-[var(--primary)] text-[var(--text-main)]"
         >
            <span className="text-2xl font-black mb-1">-</span>
         </button>
       </div>

       {/* Bottom Dashboard Panel */}
       <div 
         className={cn(
           "absolute bottom-0 left-0 w-full bg-[var(--bg-surface)]/90 border-t border-[var(--border-main)] backdrop-blur-md z-50 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.1)]",
           isCollapsed ? "max-h-[60px]" : "max-h-[600px]"
         )}
       >
          {/* Clickable Header Area to Toggle Collapse (with mobile swipe support) */}
          <div 
            onClick={() => setIsCollapsed(!isCollapsed)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full h-[60px] flex items-center justify-between px-6 md:px-12 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors border-b border-[var(--border-main)] shrink-0 group relative z-50 touch-pan-y"
          >
             {/* Highly Visible Toggle Button Graphic */}
             <div className="absolute left-1/2 -top-[24px] -translate-x-1/2 w-16 h-6 rounded-t-xl border-t border-l border-r border-[var(--border-main)] bg-[var(--bg-surface)]/90 backdrop-blur-md shadow-[0_-5px_15px_rgba(0,0,0,0.1)] flex items-center justify-center group-hover:border-[var(--primary)] group-hover:bg-[var(--primary-10)] transition-all pointer-events-auto">
                <ChevronDown size={18} className={cn("text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-transform duration-500", isCollapsed ? "rotate-180" : "")} />
             </div>

             <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[var(--primary)] animate-pulse shadow-[0_0_8px_var(--primary)]" />
                <span className="text-xs md:text-sm font-black uppercase tracking-widest text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">
                  Global Zepglide Network
                </span>
             </div>
             
             <div className={cn("flex items-center gap-6 transition-opacity duration-500", isCollapsed ? "opacity-100" : "opacity-0 pointer-events-none")}>
                <span className="text-xs font-bold text-[var(--text-muted)] hidden sm:inline">Active Nodes: <span className="text-[var(--primary)]">{globalStats.activePeers.toLocaleString()}</span></span>
                <span className="text-xs font-bold text-[var(--text-muted)] hidden sm:inline">Speed: <span className="text-[var(--primary)]">{globalStats.bandwidth.toFixed(2)} MB/s</span></span>
             </div>
          </div>

          {/* Expanded View Content */}
          <div className={cn("flex flex-col p-6 md:p-8 relative min-h-0 transition-opacity duration-700 pb-8", isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100")}>
             
             {/* Timeline Background Overlay */}
             <div className="absolute inset-x-0 bottom-0 h-full pointer-events-none flex items-end opacity-[0.03] z-0">
                {timelineBars}
             </div>

             {/* Stats Section */}
             <div className="flex flex-col z-10 space-y-5">
                <div className="flex items-center justify-between mb-2">
                   <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Live Network Analytics</h3>
                   <span className="text-[9px] font-black uppercase bg-[var(--primary-10)] px-2 py-0.5 rounded text-[var(--primary)] flex items-center gap-1"><Lock size={10}/> E2E Secured</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                   <div className="bg-[var(--bg-main)] p-4 md:p-5 rounded-2xl border border-[var(--border-main)] hover:border-[var(--primary-30)] hover:bg-[var(--primary-10)] transition-all group flex flex-col justify-between items-start min-h-[100px]">
                      <div className="text-[10px] md:text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2"><Globe size={14}/> Global Peers</div>
                      <div className="text-2xl md:text-4xl font-black text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors mt-2">{globalStats.activePeers.toLocaleString()}</div>
                   </div>

                   <div className="bg-[var(--bg-main)] p-4 md:p-5 rounded-2xl border border-[var(--border-main)] hover:border-[var(--primary-30)] hover:bg-[var(--primary-10)] transition-all group flex flex-col justify-between items-start min-h-[100px]">
                      <div className="text-[10px] md:text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2"><Zap size={14}/> Throughput</div>
                      <div className="text-2xl md:text-4xl font-black text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors mt-2">{globalStats.bandwidth.toFixed(2)} <span className="text-xs md:text-sm text-[var(--text-muted)]">MB/s</span></div>
                   </div>

                   <div className="bg-[var(--bg-main)] p-4 md:p-5 rounded-2xl border border-[var(--border-main)] hover:border-[#4ade80]/30 hover:bg-[#4ade80]/10 transition-all group flex flex-col justify-between items-start min-h-[100px]">
                      <div className="text-[10px] md:text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2"><Database size={14}/> Data Synced</div>
                      <div className="text-2xl md:text-4xl font-black text-[var(--text-main)] group-hover:text-[#4ade80] transition-colors mt-2">{globalStats.dataSynced.toFixed(1)} <span className="text-xs md:text-sm text-[var(--text-muted)]">GB</span></div>
                   </div>

                   <div className="bg-[var(--bg-main)] p-4 md:p-5 rounded-2xl border border-[var(--border-main)] hover:border-[#a78bfa]/30 hover:bg-[#a78bfa]/10 transition-all group flex flex-col justify-between items-start min-h-[100px]">
                      <div className="text-[10px] md:text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2"><Route size={14}/> Bridge Distance</div>
                      <div className="text-2xl md:text-4xl font-black text-[var(--text-main)] group-hover:text-[#a78bfa] transition-colors mt-2">{(globalStats.distanceBridged / 1000).toFixed(0)}k <span className="text-xs md:text-sm text-[var(--text-muted)]">km</span></div>
                   </div>
                </div>
                
                <div className="bg-gradient-to-r from-[var(--primary-20)] to-[var(--bg-main)] p-4 md:p-6 rounded-2xl border border-[var(--primary-30)] flex flex-col sm:flex-row items-start sm:items-center justify-between w-full mt-2 gap-4">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-[var(--primary-10)] rounded-xl border border-[var(--primary-20)] shadow-inner">
                         <Activity className="text-[var(--primary)] animate-pulse" size={24} />
                      </div>
                      <div>
                         <div className="text-[10px] md:text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Files Currently In Transit</div>
                         <div className="text-2xl md:text-3xl font-black text-[var(--text-main)]">{globalStats.filesInFlight.toLocaleString()}</div>
                      </div>
                   </div>
                   <div className="px-5 py-2.5 bg-[var(--primary)] text-[var(--primary-content)] text-[10px] md:text-[11px] font-black uppercase rounded-full shadow-[0_0_15px_var(--primary-50)] flex items-center gap-2 whitespace-nowrap w-full sm:w-auto justify-center"><Activity size={14}/> Real-Time Sync</div>
                </div>
             </div>
          </div>
       </div>

       {/* Top Border Accent */}
       <div className="absolute top-0 left-0 w-full h-1 bg-[var(--primary)] shadow-[0_0_10px_var(--primary)] z-45" />

       {/* Interactive Tooltip */}
       <div 
         className={cn(
           "fixed pointer-events-none z-[1000] p-3 transition-opacity duration-100 bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--primary)] shadow-[0_0_15px_var(--primary-50)] rounded-md",
           hoverInfo.visible ? "opacity-100" : "opacity-0"
         )}
         style={{ left: hoverInfo.x + 20, top: hoverInfo.y - 40 }}
       >
         <div className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] mb-1">Region Status</div>
         <div className="text-sm font-bold text-[var(--text-main)]">{hoverInfo.name}</div>
         <div className="text-xs text-[var(--text-muted)] mt-1">Active Transfers: <span className="text-[var(--primary)] font-bold">{hoverInfo.users}</span></div>
       </div>

       <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shoot-arc {
           0% { stroke-dashoffset: 600; opacity: 0; }
           10% { opacity: 1; }
           80% { opacity: 1; }
           100% { stroke-dashoffset: -600; opacity: 0; }
        }
        .animate-arc {
           animation-name: shoot-arc;
           animation-timing-function: linear;
           animation-iteration-count: infinite;
        }
       `}} />
    </div>
  );
};

export default GlobalMapView;

