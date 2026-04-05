import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

export default function PricingView() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [checkoutState, setCheckoutState] = useState('idle'); // idle, processing, done

  const handleCheckout = () => {
    setCheckoutState('processing');
    setTimeout(() => {
      setCheckoutState('done');
      setTimeout(() => setCheckoutState('idle'), 3000);
    }, 2500);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto mt-4 md:mt-8 pb-12 animate-in fade-in duration-700 relative">
      
      {checkoutState !== 'idle' && (
        <div className="fixed inset-0 z-[500] bg-[var(--bg-main)]/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in">
           <div className="bg-[var(--bg-surface)] border-2 border-[var(--primary)] rounded-[3rem] p-12 flex flex-col items-center shadow-2xl scale-110">
              {checkoutState === 'processing' ? (
                <>
                  <div className="h-16 w-16 mb-6 rounded-full border-4 border-[var(--bg-main)] border-t-[var(--primary)] animate-spin"></div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--text-main)]">Initializing Secure Checkout</h3>
                  <p className="text-xs font-bold text-[var(--primary)] mt-2 uppercase tracking-widest animate-pulse">Contacting Payment Gateway...</p>
                </>
              ) : (
                <>
                  <div className="h-16 w-16 mb-6 rounded-full bg-[var(--warning-10)] text-[var(--warning)] flex items-center justify-center border-2 border-[var(--warning-20)]"><Check size={32} strokeWidth={3} /></div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-[var(--text-main)]">Stripe Integration Pending</h3>
                  <p className="text-xs font-bold text-[var(--text-muted)] mt-2 uppercase tracking-widest text-center max-w-xs">The UI is fully prepared. Connect your Stripe keys to complete real transactions.</p>
                </>
              )}
           </div>
        </div>
      )}

      <header className="text-center mb-16 px-4 w-full">
        <h2 className="text-4xl md:text-5xl font-black text-[var(--text-main)] mb-6 tracking-tighter uppercase">Velocity Plans</h2>
        <div className="flex items-center justify-center gap-4 mt-8">
          <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${billingCycle === 'monthly' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>Monthly</span>
          <button onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')} className="w-16 h-8 bg-[var(--bg-surface)] rounded-full relative focus:ring-2 focus:ring-[var(--primary)] border-2 border-[var(--border-main)] shadow-inner">
            <div className={`w-6 h-6 bg-[var(--primary)] rounded-full absolute top-0.5 transition-all duration-500 shadow-lg ${billingCycle === 'yearly' ? 'left-9' : 'left-0.5'}`}></div>
          </button>
          <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${billingCycle === 'yearly' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>Yearly <span className="ml-2 bg-[var(--primary-10)] text-[var(--primary)] px-3 py-1 rounded-full border border-[var(--primary-20)] text-[9px]">-20%</span></span>
        </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full px-4 md:px-0 items-end">
        <PricingCard title="Base" price="$0" features={["Unlimited P2P Handshakes", "Standard Routing", "Ad-Supported Transfer", "Basic WebRTC"]} buttonText="Current Plan" isCurrent />
        <PricingCard title="Pro" price={billingCycle === 'monthly' ? "$10" : "$8.00"} features={["50GB Cloud Bridge", "Priority TURN Relays", "WebGPU Compression", "Zero-Wait Media Streaming", "Ad-Free Experience"]} buttonText="Upgrade Now" primary onAction={handleCheckout} />
        <PricingCard title="Enterprise" price={billingCycle === 'monthly' ? "$25" : "$20"} features={["1TB Cloud Bridge", "Delta-Patch Syncing", "Dedicated Relay Servers", "Custom Branded UI", "Full Audit Logs"]} buttonText="Contact Sales" onAction={handleCheckout} />
      </div>
    </div>
  );
}

const PricingCard = ({ title, price, features, buttonText, primary, isCurrent, onAction }) => (
  <div className={`bg-[var(--bg-surface)] border-[3px] rounded-[2.5rem] p-10 flex flex-col shadow-2xl transition-all duration-500 hover:-translate-y-3 ${primary ? 'border-[var(--primary)] scale-105 relative z-10 my-6 lg:my-0' : 'border-[var(--border-main)]'}`}>
    {primary && <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[var(--primary)] text-[var(--primary-content)] text-[10px] font-black uppercase tracking-[0.3em] px-6 py-2 rounded-full shadow-xl border-2 border-[var(--bg-surface)] z-20">Most Popular</div>}
    <h3 className="text-2xl font-black text-[var(--text-main)] mb-1 tracking-tighter uppercase">{title}</h3>
    <div className="mb-10 flex items-baseline gap-2">
      <span className="text-5xl font-black text-[var(--text-main)] tracking-tighter leading-none">{price}</span>
      <span className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">/mo</span>
    </div>
    <div className="flex flex-col gap-4 flex-1 mb-10">
      {features.map((f, i) => <PricingFeature key={i} text={f} included />)}
    </div>
    <button onClick={onAction} disabled={isCurrent} className={`w-full font-black py-4 rounded-2xl transition-all duration-300 shadow-xl uppercase tracking-widest text-[11px] disabled:opacity-50 disabled:cursor-not-allowed ${primary ? 'bg-[var(--primary)] text-[var(--primary-content)] hover:brightness-110 active:scale-95' : 'bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] active:scale-95'}`}>{buttonText}</button>
  </div>
);

function PricingFeature({ text, included = false }) {
  return (
    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm border-2 ${included ? 'bg-[var(--primary-10)] text-[var(--primary)] border-[var(--primary-30)] shadow-[0_0_15px_var(--primary-10)]' : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-main)] opacity-50'}`}>
        {included ? <Check size={18} strokeWidth={4} /> : <X size={18} strokeWidth={4} />}
      </div>
      <span className="text-[11px] font-black text-[var(--text-main)] tracking-tight uppercase leading-snug">{text}</span>
    </div>
  );
}
