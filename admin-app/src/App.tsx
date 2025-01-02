// App.tsx
import { AuthProvider, useAuth } from './AuthContext';
import { Login } from './Login';
import { useState, useEffect } from 'react';
import PickupsDashboard from './PickupsDashboard';
import { Pickup } from './types';

function AppContent() {
  const { isAuthenticated, logout } = useAuth();
  const [pickups, setPickups] = useState<Pickup[]>([]); // Moved to top level
  
  useEffect(() => {
    if (!isAuthenticated) return; // Early return if not authenticated
    
    const fetchPickups = async () => {
      const auth = localStorage.getItem('auth');
      try {
        const response = await fetch('/api/v1/pickups', {
          headers: {
            'Authorization': 'Basic ' + auth
          }
        });
        const data = await response.json();
        setPickups(data);
      } catch (error) {
        console.error('Error fetching pickups:', error);
      }
    };
    
    fetchPickups();
  }, [isAuthenticated]); // Add isAuthenticated as dependency

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div>
      <button onClick={logout} className="p-2 bg-red-500 text-white rounded">
        Logout
      </button>
      <PickupsDashboard pickups={pickups} />
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

