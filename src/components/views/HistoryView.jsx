import React, { useState, useEffect, useMemo } from 'react';
import { File, Search, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Inbox, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function HistoryView() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const res = await fetch((import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://zepglide.onrender.com' : '')) + '/api/history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setHistory(data);
      } catch (e) {
        console.error("Failed to fetch history", e);
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    return history.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.to || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: 'numeric'
    }).format(date);
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'complete' || s === 'success') {
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--success-10)] text-[var(--success)] text-xs font-black uppercase tracking-widest border border-[var(--success-20)]"><CheckCircle2 size={14} /> {status}</span>;
    } else if (s === 'failed' || s === 'error' || s === 'cancelled') {
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--danger-10)] text-[var(--danger)] text-xs font-black uppercase tracking-widest border border-[var(--danger-20)]"><XCircle size={14} /> {status}</span>;
    } else {
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--warning-10)] text-[var(--warning)] text-xs font-black uppercase tracking-widest border border-[var(--warning-30)]"><Activity size={14} /> {status}</span>;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4 flex flex-col gap-6">
      
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-surface)] p-6 rounded-[2rem] border border-[var(--border-main)] shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Transfer Log</h2>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">History of all your P2P transfers</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input 
            type="text" 
            placeholder="Search transfers..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] transition-all shadow-inner"
          />
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap responsive-table-grid">
            <thead>
              <tr className="bg-[var(--bg-main)] border-b border-[var(--border-main)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                <th className="p-6 pl-8">File Identity</th>
                <th className="p-6">Size</th>
                <th className="p-6">Recipient</th>
                <th className="p-6">Date</th>
                <th className="p-6 pr-8 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {isLoading ? (
                <tr><td colSpan="5" className="p-20 text-center text-[var(--text-muted)]">
                  <div className="flex flex-col items-center gap-4">
                    <Activity size={32} className="animate-spin text-[var(--primary)]" />
                    <span className="font-black uppercase tracking-widest text-xs">Scanning Cloud Nodes...</span>
                  </div>
                </td></tr>
              ) : filteredHistory.length === 0 ? (
                <tr><td colSpan="5" className="p-20 text-center">
                  <div className="flex flex-col items-center gap-4 text-[var(--text-muted)]">
                    <Inbox size={48} className="opacity-20" />
                    <div>
                      <h4 className="font-black text-[var(--text-main)] text-lg mb-1">{searchTerm ? 'No matches found' : 'No history yet'}</h4>
                      <p className="font-bold text-xs uppercase tracking-widest">{searchTerm ? 'Try adjusting your search criteria' : 'Your future transfers will appear here'}</p>
                    </div>
                  </div>
                </td></tr>
              ) : (
                filteredHistory.map((item, idx) => (
                  <tr key={item.id} className="group border-b border-[var(--border-main)] hover:bg-[var(--bg-hover)] transition-colors duration-300 cursor-pointer animate-in fade-in fill-mode-both" style={{ animationDelay: `${idx * 50}ms` }}>
                    <td className="p-6 pl-8 flex items-center gap-4" data-label="File Identity">
                      <div className="h-10 w-10 bg-[var(--bg-main)] rounded-2xl flex items-center justify-center text-[var(--primary)] border border-[var(--border-main)] shadow-sm group-hover:border-[var(--primary-20)] transition-all shrink-0">
                        <File size={20} />
                      </div>
                      <span className="font-bold text-[var(--text-main)] text-base truncate max-w-[200px] sm:max-w-[300px]" title={item.name}>{item.name}</span>
                    </td>
                    <td className="p-6 text-[var(--text-muted)] font-bold text-xs" data-label="Size">{item.size || 'N/A'}</td>
                    <td className="p-6 text-[var(--text-muted)] text-sm" data-label="Recipient">{item.to || 'Unknown'}</td>
                    <td className="p-6 text-[var(--text-muted)] text-xs font-bold" data-label="Date">
                      <div className="flex items-center gap-2">
                         <Calendar size={14} className="opacity-50" />
                         {formatDate(item.created_at)}
                      </div>
                    </td>
                    <td className="p-6 pr-8 text-right" data-label="Status">
                      {getStatusBadge(item.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
