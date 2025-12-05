import { AuthProvider, useAuth } from './AuthContext';
import { Login } from './Login';
import { useState, useEffect } from 'react';
import { Pickup } from './types';
import TabbedDashboard from './TabbedDashboard';

interface EmailHistory {
  email: string;
  name: string;
  address2024: string | null;
  numtrees2024: string | null;
  address2025: string | null;
  numtrees2025: number | null;
  stripe2025: number | null;
}

function AppContent() {
  const { isAuthenticated, logout } = useAuth();
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchData = async () => {
      const auth = localStorage.getItem('auth');
      try {
        const [pickupsRes, historyRes] = await Promise.all([
          fetch('/api/v1/pickups', {
            headers: {
              'Authorization': 'Basic ' + auth
            }
          }),
          fetch('/api/v1/email_history', {
            headers: {
              'Authorization': 'Basic ' + auth
            }
          })
        ]);
        
        const pickupsData = await pickupsRes.json();
        const historyData = await historyRes.json();
        
        setPickups(pickupsData);
        setEmailHistory(historyData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 bg-white shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tree Collection Dashboard</h1>
          <button 
            onClick={logout} 
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="container mx-auto py-6">
        <TabbedDashboard pickups={pickups} emailHistory={emailHistory} />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
