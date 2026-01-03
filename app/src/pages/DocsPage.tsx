import type { FC } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface DocSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  levelLink: number;
  levelName: string;
  whatYouLearn: string[];
  vulnerable: string;
  secure: string;
  realWorld?: string;
}

const DOC_SECTIONS: DocSection[] = [
  {
    id: 'storage-visibility',
    title: 'Storage Visibility',
    subtitle: 'Level 1: Instance',
    description: 'In smart contracts, there are no secrets. Even "private" variables are stored on a public blockchain. Anyone can read raw storage slots directly via RPC calls. The "private" keyword only prevents other contracts from calling a getter - it does NOT hide data.',
    levelLink: 1,
    levelName: 'Instance',
    whatYouLearn: [
      'All blockchain data is publicly readable',
      'Private keyword ≠ hidden data',
      'How to read contract storage directly',
    ],
    vulnerable: `#[ink(storage)]
pub struct Instance {
    password: String,  // "Private" but readable!
    cleared: bool,
}

#[ink(message)]
pub fn get_password(&self) -> String {
    self.password.clone()  // Exposed via getter
}`,
    secure: `#[ink(storage)]
pub struct Instance {
    password_hash: [u8; 32],  // Store hash, not plaintext
    cleared: bool,
}

#[ink(message)]
pub fn authenticate(&mut self, password: String) {
    let hash = self.env().hash_bytes::<Keccak256>(password.as_bytes());
    assert_eq!(hash, self.password_hash, "Wrong password");
    self.cleared = true;
}`,
    realWorld: 'Never store passwords, API keys, or secrets on-chain. Use hash comparisons or zero-knowledge proofs.',
  },
  {
    id: 'fallback-exploit',
    title: 'Fallback Functions',
    subtitle: 'Level 2: Fallback',
    description: 'Fallback functions execute when a contract receives a call with no matching selector or receives native tokens. If a fallback function contains privileged logic (like changing ownership), attackers can trigger it by sending funds or calling with invalid selectors.',
    levelLink: 2,
    levelName: 'Fallback',
    whatYouLearn: [
      'How fallback/receive functions work',
      'Dangers of privileged logic in fallbacks',
      'Proper access control patterns',
    ],
    vulnerable: `#[ink(message, payable, selector = _)]
pub fn fallback(&mut self) {
    // Dangerous: Anyone sending funds becomes owner!
    if self.env().transferred_value() > 0 {
        self.owner = self.env().caller();
    }
}`,
    secure: `#[ink(message, payable, selector = _)]
pub fn fallback(&mut self) {
    // Safe: Only accept funds, no privileged logic
    // Or reject unexpected calls entirely:
    panic!("Unknown selector");
}

#[ink(message)]
pub fn transfer_ownership(&mut self, new_owner: AccountId) {
    assert_eq!(self.env().caller(), self.owner);
    self.owner = new_owner;
}`,
    realWorld: 'The Parity Wallet hack lost $30M due to unprotected initialization in a library contract.',
  },
  {
    id: 'reentrancy',
    title: 'Reentrancy Attacks',
    subtitle: 'Level 3: Reentrance',
    description: 'The most infamous smart contract vulnerability. When a contract transfers funds BEFORE updating its state, a malicious contract can recursively call back and drain funds. The attacker\'s contract re-enters the vulnerable function before the balance is set to zero.',
    levelLink: 3,
    levelName: 'Reentrance',
    whatYouLearn: [
      'How cross-contract calls enable reentrancy',
      'The Checks-Effects-Interactions pattern',
      'Why state must update BEFORE external calls',
    ],
    vulnerable: `#[ink(message)]
pub fn withdraw(&mut self) {
    let balance = self.balances.get(&caller).unwrap_or(0);

    // VULNERABLE: Transfer BEFORE state update
    self.env().transfer(caller, balance)?;

    // Attacker re-enters here, balance still shows old value!
    self.balances.insert(caller, &0);
}`,
    secure: `#[ink(message)]
pub fn withdraw(&mut self) {
    let balance = self.balances.get(&caller).unwrap_or(0);

    // SECURE: Update state FIRST (Checks-Effects-Interactions)
    self.balances.insert(caller, &0);

    // Then transfer - reentrancy now sees zero balance
    self.env().transfer(caller, balance)?;
}`,
    realWorld: 'The DAO hack (2016) exploited reentrancy to drain $60M in ETH, leading to the Ethereum hard fork.',
  },
  {
    id: 'randomness',
    title: 'Predictable Randomness',
    subtitle: 'Level 4: CoinFlip',
    description: 'Blockchain data is deterministic and public. Using block hashes, timestamps, or other on-chain data as randomness sources is insecure - miners/validators can manipulate these values, and anyone can predict the "random" outcome by reading the same data.',
    levelLink: 4,
    levelName: 'CoinFlip',
    whatYouLearn: [
      'Why on-chain data is not random',
      'How attackers predict block-based randomness',
      'Secure randomness sources (VRF, commit-reveal)',
    ],
    vulnerable: `#[ink(message)]
pub fn flip(&mut self, guess: bool) -> bool {
    // VULNERABLE: Block hash is public and predictable!
    let block_hash = self.env().block_number();
    let coin_flip = block_hash % 2 == 0;

    if guess == coin_flip {
        self.consecutive_wins += 1;
    }
    guess == coin_flip
}`,
    secure: `// SECURE: Use commit-reveal scheme
#[ink(message)]
pub fn commit(&mut self, hash: [u8; 32]) {
    self.commits.insert(self.env().caller(), &hash);
}

#[ink(message)]
pub fn reveal(&mut self, value: u64, salt: [u8; 32]) {
    // Verify commitment, then use value
    let hash = self.env().hash_encoded::<Keccak256>(&(value, salt));
    assert_eq!(hash, self.commits.get(&caller).unwrap());
    // Now use 'value' for randomness
}`,
    realWorld: 'Many gambling dApps have been exploited by predicting "random" outcomes using public block data.',
  },
  {
    id: 'dos',
    title: 'Denial of Service',
    subtitle: 'Level 5: King',
    description: 'When a contract relies on external calls succeeding (like transferring funds to an address), a malicious contract can permanently break the system by always reverting. If becoming "king" requires sending funds to the previous king, a contract that rejects transfers locks the throne forever.',
    levelLink: 5,
    levelName: 'King',
    whatYouLearn: [
      'How failed external calls can break contracts',
      'The pull-over-push payment pattern',
      'Defensive programming for external calls',
    ],
    vulnerable: `#[ink(message, payable)]
pub fn claim_throne(&mut self) {
    let value = self.env().transferred_value();
    assert!(value > self.prize);

    // VULNERABLE: If old king rejects, no one can claim!
    self.env().transfer(self.king, self.prize)?;

    self.king = self.env().caller();
    self.prize = value;
}`,
    secure: `#[ink(message, payable)]
pub fn claim_throne(&mut self) {
    let value = self.env().transferred_value();
    assert!(value > self.prize);

    // SECURE: Pull pattern - store pending withdrawals
    let old_prize = self.prize;
    self.pending_withdrawals.insert(self.king, &old_prize);

    self.king = self.env().caller();
    self.prize = value;
}

#[ink(message)]
pub fn withdraw(&mut self) {
    let amount = self.pending_withdrawals.get(&caller).unwrap_or(0);
    self.pending_withdrawals.insert(caller, &0);
    self.env().transfer(caller, amount)?;
}`,
    realWorld: 'King of the Ether (2016) was stuck when a contract became king and rejected all transfers.',
  },
  {
    id: 'private-storage',
    title: 'Private Storage Myth',
    subtitle: 'Level 6: Vault',
    description: 'Developers often believe that omitting a getter function hides data. This is false. All contract storage is stored on-chain in a public, readable format. Anyone can query the raw storage directly using RPC methods like state_getStorage, completely bypassing the contract\'s interface.',
    levelLink: 6,
    levelName: 'Vault',
    whatYouLearn: [
      'How to read raw contract storage',
      'Storage layout in ink! contracts',
      'Why "no getter" doesn\'t mean "hidden"',
    ],
    vulnerable: `#[ink(storage)]
pub struct Vault {
    locked: bool,
    password: String,  // No getter, but still readable!
}

// Developer thinks: "No getter = hidden data"
// Reality: Anyone can read storage slot directly`,
    secure: `#[ink(storage)]
pub struct Vault {
    locked: bool,
    password_hash: [u8; 32],  // Store hash only
}

#[ink(message)]
pub fn unlock(&mut self, password: String) {
    let hash = self.env().hash_bytes::<Keccak256>(password.as_bytes());
    assert_eq!(hash, self.password_hash);
    self.locked = false;
}

// Even better: Don't store secrets on-chain at all!
// Use off-chain verification or ZK proofs.`,
    realWorld: 'Blockchain explorers let anyone view all storage. Tools like Etherscan decode storage layouts automatically.',
  },
];

interface DocsPageProps {
  theme: 'dark' | 'light';
}

export const DocsPage: FC<DocsPageProps> = ({ theme }) => {
  const [activeDoc, setActiveDoc] = useState(DOC_SECTIONS[0]);
  const navigate = useNavigate();
  const isLight = theme === 'light';

  return (
    <div className={`flex-1 flex flex-col p-12 overflow-hidden ${
      isLight ? 'bg-white' : 'bg-[var(--bg-void)]'
    }`}>
      {/* Header */}
      <div className={`flex justify-between items-center mb-12 border-b pb-8 ${
        isLight ? 'border-zinc-200' : 'border-[var(--border-color)]'
      }`}>
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className={`w-14 h-14 border flex items-center justify-center transition-all group ${
              isLight
                ? 'border-black bg-white text-black hover:bg-black hover:text-white'
                : 'border-[var(--border-color)] hover:bg-ink-pink hover:text-white text-[var(--text-primary)]'
            }`}
          >
            <span className="text-lg group-hover:scale-110 transition-transform">←</span>
          </Link>
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

      {/* Content */}
      <div className="flex-1 flex gap-12 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 space-y-3 overflow-y-auto">
          {DOC_SECTIONS.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveDoc(section)}
              className={`w-full text-left p-5 border transition-all ${
                activeDoc.id === section.id
                  ? 'bg-ink-pink text-white border-ink-pink shadow-lg'
                  : `${isLight ? 'bg-zinc-50 border-zinc-200 text-black hover:border-black font-bold' : 'bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-ink-pink/10'}`
              }`}
            >
              <span className="text-[11px] font-black uppercase tracking-widest">{section.title}</span>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pr-8 custom-scrollbar">
          {/* Header with title and level badge */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="text-ink-pink text-[11px] font-black uppercase tracking-widest mb-2 block">
                {activeDoc.subtitle}
              </span>
              <h3 className={`text-4xl font-black uppercase tracking-tighter ${
                isLight ? 'text-black' : 'text-[var(--text-primary)]'
              }`}>{activeDoc.title}</h3>
            </div>
            <button
              onClick={() => navigate(`/level/${activeDoc.levelLink}`)}
              className="px-4 py-2 bg-ink-pink text-white text-[10px] font-black uppercase tracking-wider hover:brightness-110 transition-all"
            >
              Try {activeDoc.levelName} Level →
            </button>
          </div>

          <p className={`text-base font-medium leading-relaxed mb-8 max-w-3xl ${
            isLight ? 'text-zinc-600' : 'text-[var(--text-secondary)]'
          }`}>
            {activeDoc.description}
          </p>

          {/* What You'll Learn */}
          <div className={`p-5 border rounded-sm mb-8 ${
            isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/5 border-blue-500/20'
          }`}>
            <span className={`text-[11px] font-black uppercase tracking-widest mb-3 block ${
              isLight ? 'text-blue-700' : 'text-blue-400'
            }`}>
              What You'll Learn
            </span>
            <ul className="space-y-2">
              {activeDoc.whatYouLearn.map((item, i) => (
                <li key={i} className={`flex items-center gap-3 text-sm ${
                  isLight ? 'text-blue-900' : 'text-blue-300'
                }`}>
                  <span className="text-blue-500">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Code comparison */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            <div className="space-y-3">
              <span className="text-[11px] mono text-red-500 font-black uppercase tracking-[0.2em] flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500"></div> VULNERABLE_SOURCE
              </span>
              <div className={`border rounded-sm overflow-hidden ${
                isLight ? 'border-red-200' : 'border-red-500/30'
              }`}>
                <SyntaxHighlighter
                  language="rust"
                  style={isLight ? oneLight : oneDark}
                  customStyle={{
                    margin: 0,
                    padding: '1.25rem',
                    fontSize: '0.75rem',
                    background: isLight ? '#FEF2F2' : '#1a0a0a',
                    borderRadius: 0,
                  }}
                >
                  {activeDoc.vulnerable}
                </SyntaxHighlighter>
              </div>
            </div>
            <div className="space-y-3">
              <span className="text-[11px] mono text-emerald-500 font-black uppercase tracking-[0.2em] flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500"></div> SECURE_IMPLEMENTATION
              </span>
              <div className={`border rounded-sm overflow-hidden ${
                isLight ? 'border-emerald-200' : 'border-emerald-500/30'
              }`}>
                <SyntaxHighlighter
                  language="rust"
                  style={isLight ? oneLight : oneDark}
                  customStyle={{
                    margin: 0,
                    padding: '1.25rem',
                    fontSize: '0.75rem',
                    background: isLight ? '#F0FDF4' : '#0a1a0a',
                    borderRadius: 0,
                  }}
                >
                  {activeDoc.secure}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>

          {/* Real World Example */}
          {activeDoc.realWorld && (
            <div className={`p-5 border-l-4 mb-8 ${
              isLight ? 'bg-amber-50 border-amber-400' : 'bg-amber-500/5 border-amber-500'
            }`}>
              <span className={`text-[11px] font-black uppercase tracking-widest mb-2 block ${
                isLight ? 'text-amber-700' : 'text-amber-400'
              }`}>
                Real World Impact
              </span>
              <p className={`text-sm leading-relaxed ${
                isLight ? 'text-amber-900' : 'text-amber-200'
              }`}>
                {activeDoc.realWorld}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
