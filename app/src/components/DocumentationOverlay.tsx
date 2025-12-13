import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const DOC_SECTIONS = [
  {
    id: 'reentrancy',
    title: 'Reentrancy Attacks',
    description: 'The most infamous vulnerability in smart contracts. In ink!, this occurs when a contract calls an external account (often another contract) before updating its own internal state, allowing recursive execution that bypasses balance checks.',
    vulnerable: `// VULNERABLE: State updated AFTER transfer
if self.env().transfer(caller, balance).is_ok() {
    self.balances.insert(caller, &0);
}`,
    secure: `// SECURE: Checks-Effects-Interactions pattern
self.balances.insert(caller, &0);
self.env().transfer(caller, balance).expect("Transfer failed");`
  },
  {
    id: 'access-control',
    title: 'Access Control',
    description: 'Ensuring that only authorized accounts can execute sensitive functions. Failing to check "self.env().caller()" against an owner address can lead to total contract takeover or premature termination.',
    vulnerable: `#[ink(message)]
pub fn drain_vault(&mut self) {
    // Missing ownership check!
    self.env().transfer(self.env().caller(), self.total_balance);
}`,
    secure: `#[ink(message)]
pub fn drain_vault(&mut self) {
    assert_eq!(self.env().caller(), self.owner, "Caller is not owner");
    self.env().transfer(self.owner, self.total_balance);
}`
  },
  {
    id: 'arithmetic',
    title: 'Integer Wraps',
    description: 'In Rust, depending on compilation profiles, integers can wrap around on overflow or underflow. Always use checked arithmetic (e.g. checked_add) or ink! built-ins to prevent balance manipulation.',
    vulnerable: `self.total_score -= points;`,
    secure: `self.total_score = self.total_score.checked_sub(points).expect("Underflow occurred");`
  }
];

export const DocumentationOverlay: React.FC<{ isOpen: boolean; onClose: () => void; theme?: 'dark' | 'light' }> = ({ isOpen, onClose, theme = 'dark' }) => {
  const [activeDoc, setActiveDoc] = useState(DOC_SECTIONS[0]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';

  useEffect(() => {
    if (isOpen) {
      gsap.to(overlayRef.current, { x: 0, duration: 0.8, ease: "expo.out" });
      gsap.fromTo(contentRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.4 });
    } else {
      gsap.to(overlayRef.current, { x: "100%", duration: 0.6, ease: "power3.in" });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      ref={overlayRef}
      className={`fixed inset-0 z-[100] translate-x-full flex flex-col p-12 overflow-hidden border-l ${
        isLight ? 'bg-white border-zinc-200' : 'bg-[var(--bg-void)] border-[var(--border-color)]'
      }`}
    >
      <div className={`flex justify-between items-center mb-16 border-b pb-10 ${
        isLight ? 'border-zinc-200' : 'border-[var(--border-color)]'
      }`}>
        <div className="flex items-center gap-8">
           <button 
            onClick={onClose} 
            className={`w-14 h-14 border flex items-center justify-center transition-all group ${
              isLight 
              ? 'border-black bg-white text-black hover:bg-black hover:text-white' 
              : 'border-[var(--border-color)] hover:bg-ink-pink hover:text-white text-[var(--text-primary)]'
            }`}
           >
             <span className="text-lg group-hover:scale-110 transition-transform">✕</span>
           </button>
           <div>
             <span className={`text-[10px] mono block tracking-[0.5em] mb-1 font-bold uppercase ${
               isLight ? 'text-zinc-400' : 'text-[var(--text-secondary)]'
             }`}>Archive_System_v.5</span>
             <h2 className={`text-3xl font-black uppercase tracking-tight ${
               isLight ? 'text-black' : 'text-[var(--text-primary)]'
             }`}>Security Protocol Library</h2>
           </div>
        </div>
      </div>

      <div className="flex-1 flex gap-16 overflow-hidden">
        <div className="w-80 space-y-4">
          {DOC_SECTIONS.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveDoc(section)}
              className={`w-full text-left p-6 border transition-all ${
                activeDoc.id === section.id 
                ? 'bg-ink-pink text-white border-ink-pink shadow-lg' 
                : `${isLight ? 'bg-zinc-50 border-zinc-200 text-black hover:border-black font-bold' : 'bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-ink-pink/10'}`
              }`}
            >
              <span className="text-[11px] font-black uppercase tracking-widest">{section.title}</span>
            </button>
          ))}
        </div>

        <div ref={contentRef} className="flex-1 overflow-y-auto pr-12 custom-scrollbar">
          <h3 className={`text-5xl font-black uppercase tracking-tighter mb-8 ${
            isLight ? 'text-black' : 'text-[var(--text-primary)]'
          }`}>{activeDoc.title}</h3>
          
          <p className={`text-xl font-medium leading-relaxed mb-16 max-w-4xl ${
            isLight ? 'text-zinc-600' : 'text-[var(--text-secondary)]'
          }`}>
            {activeDoc.description}
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 mb-20">
            <div className="space-y-6">
              <span className="text-[11px] mono text-red-600 font-black uppercase tracking-[0.2em] flex items-center gap-3">
                <div className="w-2 h-2 bg-red-600"></div> VULNERABLE_SOURCE
              </span>
              <div className={`border p-8 rounded-sm shadow-sm ${
                isLight ? 'border-red-200 bg-[#FFF9F9]' : 'border-red-500/20 bg-red-500/5'
              }`}>
                <pre className={`mono text-xs leading-relaxed overflow-x-auto ${isLight ? 'text-red-950 font-bold' : 'text-red-300/80'}`}>
                  <code>{activeDoc.vulnerable}</code>
                </pre>
              </div>
            </div>
            <div className="space-y-6">
              <span className="text-[11px] mono text-emerald-600 font-black uppercase tracking-[0.2em] flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-600"></div> SECURE_IMPLEMENTATION
              </span>
              <div className={`border p-8 rounded-sm shadow-sm ${
                isLight ? 'border-emerald-200 bg-[#F6FFF9]' : 'border-green-500/20 bg-green-500/5'
              }`}>
                <pre className={`mono text-xs leading-relaxed overflow-x-auto ${isLight ? 'text-emerald-950 font-bold' : 'text-green-300/80'}`}>
                  <code>{activeDoc.secure}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
