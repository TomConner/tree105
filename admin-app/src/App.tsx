// App.tsx
import React, { useState, useEffect } from 'react';
import PickupsDashboard from './PickupsDashboard';
import { Pickup } from './types';

function App() {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  
  useEffect(() => {
    const fetchPickups = async () => {
      try {
        const response = await fetch('/api/v1/pickups');
        const data = await response.json();
        setPickups(data);
      } catch (error) {
        console.error('Error fetching pickups:', error);
      }
    };
    
    fetchPickups();
  }, []);

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold my-4">Tree Collection Dashboard</h1>
      <PickupsDashboard pickups={pickups} />
    </div>
  );
}

export default App;
