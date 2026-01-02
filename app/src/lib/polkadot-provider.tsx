import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CHAINS } from './chain-config';

// Types
export interface Account {
  address: string;
  name?: string;
  polkadotSigner: any;
  source?: string;
}

export interface Wallet {
  name: string;
  installed: boolean;
  enable: () => Promise<any>;
}

interface WalletContextType {
  selectedAccount: Account | null;
  setSelectedAccount: (account: Account | null) => void;
  accounts: Account[];
  wallets: Wallet[];
  isConnecting: boolean;
  isConnected: boolean;
  connectWallet: (walletName: string) => Promise<void>;
  disconnect: () => void;
}

// Create context
const WalletContext = createContext<WalletContextType | null>(null);

// Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    },
  },
});

const STORAGE_KEY = 'inkctf-selected-account';

// Detect available wallets
function getAvailableWallets(): Wallet[] {
  if (typeof window === 'undefined') return [];

  const injectedWeb3 = (window as any).injectedWeb3 || {};
  const walletNames = Object.keys(injectedWeb3);

  return walletNames.map((name) => ({
    name,
    installed: true,
    enable: async () => {
      const wallet = injectedWeb3[name];
      if (wallet && wallet.enable) {
        return wallet.enable('InkCTF');
      }
      throw new Error(`Wallet ${name} not found`);
    },
  }));
}

// Wallet Provider
function WalletContextProvider({ children }: { children: ReactNode }) {
  const [selectedAccount, setSelectedAccountState] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  // Detect wallets on mount
  useEffect(() => {
    // Small delay to let wallet extensions inject
    const timer = setTimeout(() => {
      setWallets(getAvailableWallets());
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Restore account from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && accounts.length > 0) {
      try {
        const { address } = JSON.parse(stored);
        const found = accounts.find((a) => a.address === address);
        if (found) {
          setSelectedAccountState(found);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [accounts]);

  // Connect to wallet
  const connectWallet = async (walletName: string) => {
    setIsConnecting(true);
    try {
      const injectedWeb3 = (window as any).injectedWeb3 || {};
      const wallet = injectedWeb3[walletName];

      if (!wallet) {
        throw new Error(`Wallet ${walletName} not found`);
      }

      const extension = await wallet.enable('InkCTF');
      const injectedAccounts = await extension.accounts.get();

      const newAccounts: Account[] = injectedAccounts.map((acc: any) => ({
        address: acc.address,
        name: acc.name,
        polkadotSigner: extension.signer,
        source: walletName,
      }));

      setAccounts((prev) => {
        // Merge accounts, avoiding duplicates
        const existing = new Set(prev.map((a) => a.address));
        const unique = newAccounts.filter((a: Account) => !existing.has(a.address));
        return [...prev, ...unique];
      });

      // Auto-select first account if none selected
      if (!selectedAccount && newAccounts.length > 0) {
        setSelectedAccountState(newAccounts[0]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ address: newAccounts[0].address }));
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Set selected account with persistence
  const setSelectedAccount = (account: Account | null) => {
    setSelectedAccountState(account);
    if (account) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ address: account.address, name: account.name }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Disconnect
  const disconnect = () => {
    setSelectedAccount(null);
    setAccounts([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <WalletContext.Provider
      value={{
        selectedAccount,
        setSelectedAccount,
        accounts,
        wallets,
        isConnecting,
        isConnected: !!selectedAccount,
        connectWallet,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// Main provider component
export function PolkadotProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletContextProvider>{children}</WalletContextProvider>
    </QueryClientProvider>
  );
}

// Hook to use wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within PolkadotProvider');
  }
  return context;
}

// Chain info
export { CHAINS };
