import React, { useState, useEffect, useCallback } from 'react';
import { User, Order } from './types';
import { INITIAL_USERS } from './mockData';
import { 
  fetchOrders, 
  getOfflineQueue, 
  syncOfflineQueue, 
  loginWithUserId, 
  loginWithCredentials,
  getAuthToken, 
  setAuthToken,
  fetchCurrentUser,
  logout
} from './services/api';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { OrderBoard } from './components/OrderBoard';
import { SupervisorMobileView } from './components/SupervisorMobileView';
import { BuyerPortal } from './components/BuyerPortal';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { RunRateModal } from './components/RunRateModal';
import { AIReviewModal } from './components/AIReviewModal';
import { DateChangeModal } from './components/DateChangeModal';
import { OrderSetupModal } from './components/OrderSetupModal';
import { DocumentationHub } from './components/DocumentationHub';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  const [allUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'board' | 'supervisor' | 'buyer' | 'executive' | 'tdd'>('board');

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [selectedMathOrder, setSelectedMathOrder] = useState<Order | null>(null);
  const [selectedAIReviewOrder, setSelectedAIReviewOrder] = useState<Order | null>(null);
  const [selectedDateChangeOrder, setSelectedDateChangeOrder] = useState<Order | null>(null);
  const [isOrderSetupOpen, setIsOrderSetupOpen] = useState<boolean>(false);

  // Offline queue
  const [offlineCount, setOfflineCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Determine initial dashboard destination based on role
  const getDestinationTab = (role: string): 'board' | 'supervisor' | 'buyer' | 'executive' => {
    switch (role) {
      case 'supervisor':
        return 'supervisor';
      case 'buyer':
        return 'buyer';
      case 'md':
        return 'executive';
      case 'merchandiser':
      default:
        return 'board';
    }
  };

  const authenticateAndLoad = useCallback(async (targetUserId: string) => {
    setIsLoadingOrders(true);
    setErrorMsg(null);
    try {
      const auth = await loginWithUserId(targetUserId);
      setCurrentUser(auth.user);
      setIsAuthenticated(true);
      const data = await fetchOrders();
      setOrders(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate and load production orders.');
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    async function initSession() {
      setIsCheckingSession(true);
      const token = getAuthToken();
      if (token) {
        try {
          const user = await fetchCurrentUser();
          setCurrentUser(user);
          setIsAuthenticated(true);
          setActiveTab(getDestinationTab(user.role));
          setIsLoadingOrders(true);
          const data = await fetchOrders();
          setOrders(data);
          setIsLoadingOrders(false);
          setOfflineCount(getOfflineQueue().length);
          setIsCheckingSession(false);
          return;
        } catch {
          // Token invalid or expired, clear and prompt login
          setAuthToken(null);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsCheckingSession(false);
      setOfflineCount(getOfflineQueue().length);
    }

    initSession();
  }, []);

  const handleLoginWithCredentials = async (email: string, password?: string): Promise<User> => {
    const auth = await loginWithCredentials(email, password);
    return auth.user;
  };

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setActiveTab(getDestinationTab(user.role));
    setErrorMsg(null);
    setIsLoadingOrders(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load orders.');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setAuthToken(null);
      setIsAuthenticated(false);
      setOrders([]);
      setErrorMsg(null);
    }
  };

  const handleSwitchUser = async (newUser: User) => {
    await authenticateAndLoad(newUser.id);
    setActiveTab(getDestinationTab(newUser.role));
  };

  const handleSyncOffline = async () => {
    setIsSyncing(true);
    try {
      await syncOfflineQueue();
      setOfflineCount(getOfflineQueue().length);
      const data = await fetchOrders();
      setOrders(data);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOrderCreated = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleOrderUpdated = (updatedOrder: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
    if (selectedMathOrder?.id === updatedOrder.id) setSelectedMathOrder(updatedOrder);
    if (selectedAIReviewOrder?.id === updatedOrder.id) setSelectedAIReviewOrder(updatedOrder);
    if (selectedDateChangeOrder?.id === updatedOrder.id) setSelectedDateChangeOrder(updatedOrder);
  };

  const refreshOrders = async () => {
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to refresh orders.');
    }
  };

  // Checking session spinner
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-900" />
        <span className="text-xs font-semibold">Initializing TexTrack KnitTrack Session...</span>
      </div>
    );
  }

  // Not authenticated: Show Login Screen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onLoginWithCredentials={handleLoginWithCredentials}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Top Bar Contract (1-line wordmark, nav links, 1 action, buyer lock, sign out) */}
      <Navbar
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        allUsers={allUsers}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        offlineCount={offlineCount}
        onSyncOffline={handleSyncOffline}
        isSyncing={isSyncing}
        onOpenNewOrder={() => setIsOrderSetupOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error notification */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => authenticateAndLoad(currentUser.id)}
              className="underline hover:text-rose-950 font-bold cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoadingOrders ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-600" />
            <span className="text-xs font-medium">Loading Tiruppur production data...</span>
          </div>
        ) : (
          <>
            {/* View Tab 1: Merchandiser Order Board */}
            {activeTab === 'board' && (
              <OrderBoard
                orders={orders}
                onOpenMathModal={(o) => setSelectedMathOrder(o)}
                onOpenAIReviewModal={(o) => setSelectedAIReviewOrder(o)}
                onOpenDateChangeModal={(o) => setSelectedDateChangeOrder(o)}
                onOpenNewOrder={() => setIsOrderSetupOpen(true)}
              />
            )}

            {/* View Tab 2: Supervisor Mobile Floor Interface */}
            {activeTab === 'supervisor' && (
              <SupervisorMobileView
                orders={orders}
                onUpdateSubmitted={() => {
                  refreshOrders();
                  setOfflineCount(getOfflineQueue().length);
                }}
                currentSupervisorName={currentUser.name}
              />
            )}

            {/* View Tab 3: Strict Multi-Tenant Buyer Portal */}
            {activeTab === 'buyer' && (
              <BuyerPortal
                orders={orders}
                buyerName={currentUser.name}
                buyerOrganization={currentUser.organization}
              />
            )}

            {/* View Tab 4: Executive Managing Director Dashboard */}
            {activeTab === 'executive' && (
              <ExecutiveDashboard
                orders={orders}
                onSelectOrderForInspection={(o) => setSelectedMathOrder(o)}
              />
            )}

            {/* View Tab 5: Technical Design Document & deployment.md */}
            {activeTab === 'tdd' && <DocumentationHub />}
          </>
        )}
      </main>

      {/* Modals */}
      <RunRateModal
        order={selectedMathOrder}
        onClose={() => setSelectedMathOrder(null)}
        isMerchandiser={currentUser.role === 'merchandiser'}
        onConfirmWarning={(o) => {
          setSelectedMathOrder(null);
          setSelectedAIReviewOrder(o);
        }}
      />

      <AIReviewModal
        order={selectedAIReviewOrder}
        onClose={() => setSelectedAIReviewOrder(null)}
        onOrderUpdated={handleOrderUpdated}
      />

      <DateChangeModal
        order={selectedDateChangeOrder}
        onClose={() => setSelectedDateChangeOrder(null)}
        onOrderUpdated={handleOrderUpdated}
        authorizedByName={currentUser.name}
      />

      <OrderSetupModal
        isOpen={isOrderSetupOpen}
        onClose={() => setIsOrderSetupOpen(false)}
        onOrderCreated={handleOrderCreated}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">TexTrack Tiruppur</span>
            <span>·</span>
            <span>Knitwear Production Order-Tracking & TNA Engine</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Units 1, 2, 3 & Subcontract Processing</span>
            <span>·</span>
            <span className="font-mono">Reference Date: 2026-11-06</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
