import { useState } from 'react';
import { useWallet, type Account } from '../lib/polkadot-provider';
import Identicon from '@polkadot/react-identicon';

// Truncate address for display
function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Wallet icons mapping
const WALLET_ICONS: Record<string, string> = {
  'polkadot-js': 'https://polkadot.js.org/docs/img/logo.svg',
  'talisman': 'https://talisman.xyz/favicon.ico',
  'subwallet-js': 'https://subwallet.app/favicon.ico',
};

export function WalletConnect() {
  const {
    selectedAccount,
    setSelectedAccount,
    accounts,
    wallets,
    isConnecting,
    isConnected,
    connectWallet,
    disconnect,
  } = useWallet();

  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (walletName: string) => {
    setError(null);
    try {
      await connectWallet(walletName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  };

  const handleSelectAccount = (account: Account) => {
    setSelectedAccount(account);
    setIsOpen(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setIsOpen(false);
  };

  // Connected state - show account
  if (isConnected && selectedAccount) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--ink-pink)]/30 hover:border-[var(--ink-pink)] transition-colors"
        >
          <Identicon
            value={selectedAccount.address}
            size={24}
            theme="polkadot"
          />
          <span className="text-sm font-mono text-[var(--text-primary)]">
            {selectedAccount.name || truncateAddress(selectedAccount.address)}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-lg bg-[var(--bg-void)] border border-[var(--text-secondary)]/20 shadow-xl z-50">
            {/* Current Account */}
            <div className="p-3 border-b border-[var(--text-secondary)]/20">
              <p className="text-xs text-[var(--text-secondary)] mb-1">Connected Account</p>
              <div className="flex items-center gap-2">
                <Identicon value={selectedAccount.address} size={32} theme="polkadot" />
                <div>
                  <p className="text-sm font-medium">{selectedAccount.name || 'Account'}</p>
                  <p className="text-xs font-mono text-[var(--text-secondary)]">
                    {truncateAddress(selectedAccount.address, 8)}
                  </p>
                </div>
              </div>
            </div>

            {/* Switch Account */}
            {accounts.length > 1 && (
              <div className="p-2 border-b border-[var(--text-secondary)]/20">
                <p className="text-xs text-[var(--text-secondary)] px-2 mb-1">Switch Account</p>
                {accounts
                  .filter((a) => a.address !== selectedAccount.address)
                  .map((account) => (
                    <button
                      key={account.address}
                      onClick={() => handleSelectAccount(account)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--card-bg)] transition-colors"
                    >
                      <Identicon value={account.address} size={24} theme="polkadot" />
                      <span className="text-sm">{account.name || truncateAddress(account.address)}</span>
                    </button>
                  ))}
              </div>
            )}

            {/* Disconnect */}
            <div className="p-2">
              <button
                onClick={handleDisconnect}
                className="w-full px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Not connected - show connect button
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isConnecting}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--ink-pink)] text-white font-medium hover:bg-[var(--ink-pink)]/80 transition-colors disabled:opacity-50"
      >
        {isConnecting ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Connecting...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Connect Wallet
          </>
        )}
      </button>

      {/* Wallet Selection Dropdown */}
      {isOpen && !isConnecting && (
        <div className="absolute right-0 mt-2 w-72 rounded-lg bg-[var(--bg-void)] border border-[var(--text-secondary)]/20 shadow-xl z-50">
          <div className="p-3 border-b border-[var(--text-secondary)]/20">
            <h3 className="font-medium">Connect a Wallet</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Select a wallet to connect to InkCTF
            </p>
          </div>

          {error && (
            <div className="mx-3 mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="p-2">
            {wallets.length === 0 ? (
              <div className="p-4 text-center text-[var(--text-secondary)]">
                <p className="text-sm">No wallets detected</p>
                <p className="text-xs mt-1">
                  Install{' '}
                  <a
                    href="https://polkadot.js.org/extension/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--ink-pink)] hover:underline"
                  >
                    Polkadot.js
                  </a>
                  {' '}or{' '}
                  <a
                    href="https://talisman.xyz/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--ink-pink)] hover:underline"
                  >
                    Talisman
                  </a>
                </p>
              </div>
            ) : (
              wallets.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => handleConnect(wallet.name)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--card-bg)] transition-colors"
                >
                  <img
                    src={WALLET_ICONS[wallet.name] || '/wallet-icon.svg'}
                    alt={wallet.name}
                    className="w-8 h-8 rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23E6007A"><rect width="24" height="24" rx="4"/></svg>';
                    }}
                  />
                  <div className="text-left">
                    <p className="font-medium capitalize">
                      {wallet.name.replace('-js', '').replace('-', ' ')}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {wallet.installed ? 'Detected' : 'Not installed'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Account selection if accounts available but none selected */}
          {accounts.length > 0 && !selectedAccount && (
            <div className="p-2 border-t border-[var(--text-secondary)]/20">
              <p className="text-xs text-[var(--text-secondary)] px-2 mb-1">Select Account</p>
              {accounts.map((account) => (
                <button
                  key={account.address}
                  onClick={() => handleSelectAccount(account)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--card-bg)] transition-colors"
                >
                  <Identicon value={account.address} size={24} theme="polkadot" />
                  <div className="text-left">
                    <p className="text-sm">{account.name || 'Account'}</p>
                    <p className="text-xs font-mono text-[var(--text-secondary)]">
                      {truncateAddress(account.address)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
