import React, { useState, useEffect, useMemo } from 'react';
import { File } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function HistoryView() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/history', {
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

  return (
    <div className="w-full max-w-5xl mx-auto py-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap responsive-table-grid">
            <thead>
              <tr className="bg-[var(--bg-main)] border-b border-[var(--border-main)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                <th className="p-6 pl-8">Identity</th>
                <th className="p-6">Size</th>
                <th className="p-6">Recipient</th>
                <th className="p-6 pr-8 text-right">State</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {isLoading ? (
                <tr><td colSpan="4" className="p-10 text-center text-[var(--text-muted)] animate-pulse">Scanning Cloud Nodes...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan="4" className="p-10 text-center text-[var(--text-muted)]">No historical logs found.</td></tr>
              ) : (
                history.map((item, idx) => (
                  <tr key={item.id} className="group border-b border-[var(--border-main)] hover:bg-[var(--bg-hover)] transition-colors duration-300 cursor-pointer animate-in fade-in fill-mode-both" style={{ animationDelay: `${idx * 100}ms` }}>
                    <td className="p-6 pl-8 flex items-center gap-4" data-label="Identity">
                      <div className="h-10 w-10 bg-[var(--bg-main)] rounded-2xl flex items-center justify-center text-[var(--primary)] border border-[var(--border-main)] shadow-sm group-hover:border-[var(--primary-20)] transition-all"><File size={20} /></div>
                      <span className="font-bold text-[var(--text-main)] text-base truncate">{item.name}</span>
                    </td>
                    <td className="p-6 text-[var(--text-muted)] font-bold" data-label="Size">{item.size || 'N/A'}</td>
                    <td className="p-6 text-[var(--text-muted)]" data-label="Recipient">{item.to || 'Unknown'}</td>
                    <td className="p-6 pr-8 text-right font-black text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors" data-label="State">{item.status}</td>
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
