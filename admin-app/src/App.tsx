// App.tsx
// @ts-expect-error
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Address {
  id: number;
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  created: string;
  lookup: {
    code: string;
    id: number;
  };
}

interface Order {
  id: number;
  created: string;
  numtrees: number;
  extra: number;
  comment: string;
  lookup: {
    code: string;
    id: number;
  };
}

interface Pickup {
  code: string;
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_created: string;
  numtrees: number;
  extra: number;
  comment: string;
  order_created: string;
  method: string;
  intent_created: string;
}

interface SortConfig {
  key: keyof Order | 'lookup.code';
  direction: 'asc' | 'desc';
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatPhone = (phone: string) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[2] + ') ' + match[3] + '-' + match[4];
  }
  return phone;
};

function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [filterText, setFilterText] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created', direction: 'desc' });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [
        ordersRes, 
        addressesRes,
        pickupsRes
      ] = await Promise.all([
        fetch('/api/v1/orders'),
        fetch('/api/v1/addresses'),
        fetch('/api/v1/pickups')
      ]);
      const ordersData = await ordersRes.json();
      const addressesData = await addressesRes.json();
      const pickupsData = await pickupsRes.json();
      setOrders(ordersData);
      setAddresses(addressesData);
      setPickups(pickupsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSort = (key: SortConfig['key']) => {
    let direction: SortConfig['direction'] = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getAddressForOrder = (order: Order) => {
    return addresses.find(addr => addr.lookup.code === order.lookup.code);
  };

  const sortedOrders = [...orders].sort((a, b) => {
    if (sortConfig.key === 'created') {
      return sortConfig.direction === 'asc' 
        ? new Date(a.created).getTime() - new Date(b.created).getTime()
        : new Date(b.created).getTime() - new Date(a.created).getTime();
    }
    if (sortConfig.key === 'lookup.code') {
      return sortConfig.direction === 'asc'
        ? a.lookup.code.localeCompare(b.lookup.code)
        : b.lookup.code.localeCompare(a.lookup.code);
    }
    
    return sortConfig.direction === 'asc' // @ts-expect-error TS2362
      ? a[sortConfig.key] - b[sortConfig.key] // @ts-expect-error TS2362
      : b[sortConfig.key] - a[sortConfig.key];
  });

  const filteredOrders = sortedOrders.filter(order => {
    const address = getAddressForOrder(order);
    const searchText = filterText.toLowerCase();
    return (
      order.lookup.code.toLowerCase().includes(searchText) ||
      order.comment.toLowerCase().includes(searchText) ||
      order.id.toString().includes(searchText) ||
      (address && address.name.toLowerCase().includes(searchText)) ||
      (address && address.email.toLowerCase().includes(searchText))
    );
  });

  // Calculate totals
  const totalTrees = orders.reduce((sum, order) => sum + order.numtrees, 0);
  const totalExtra = orders.reduce((sum, order) => sum + order.extra, 0);
  const totalOrders = orders.length;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Orders Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="py-4">
            <h2 className="text-sm font-semibold text-gray-500">Total Orders</h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <h2 className="text-sm font-semibold text-gray-500">Total Trees</h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalTrees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <h2 className="text-sm font-semibold text-gray-500">Total Extra Amount</h2>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalExtra}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        {selectedOrder && (
          <CardContent className="pt-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Order Details</h3>
              {getAddressForOrder(selectedOrder) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold">{getAddressForOrder(selectedOrder)?.name}</p>
                    <p>{getAddressForOrder(selectedOrder)?.line1}</p>
                    {getAddressForOrder(selectedOrder)?.line2 && (
                      <p>{getAddressForOrder(selectedOrder)?.line2}</p>
                    )}
                    <p>{getAddressForOrder(selectedOrder)?.city}, {getAddressForOrder(selectedOrder)?.state} {getAddressForOrder(selectedOrder)?.postal_code}</p>
                  </div>
                  <div>
                    <p>Email: {getAddressForOrder(selectedOrder)?.email}</p>
                    <p>Phone: {formatPhone(getAddressForOrder(selectedOrder)?.phone || '')}</p>
                    <p>Order Code: {selectedOrder.lookup.code}</p>
                    <p>Created: {formatDate(selectedOrder.created)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Orders</h2>
            <Input
              type="text"
              placeholder="Search orders..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('created')}
                  >
                    Created {sortConfig.key === 'created' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('lookup.code')}
                  >
                    Code {sortConfig.key === 'lookup.code' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Trees</TableHead>
                  <TableHead>Extra</TableHead>
                  <TableHead>Comment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const address = getAddressForOrder(order);
                  return (
                    <TableRow 
                      key={order.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedOrder(order === selectedOrder ? null : order)}
                    >
                      <TableCell>{formatDate(order.created)}</TableCell>
                      <TableCell>
                        {address ? (
                          <div>
                            <div className="font-medium">{address.name}, {address.line1}</div>
                            <div className="text-sm text-gray-500">{address.city}</div>
                          </div>
                      ) : (
                          <Badge variant="outline">No Address</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">{order.lookup.code}</TableCell>
                      <TableCell>{order.numtrees}</TableCell>
                      <TableCell>${order.extra}</TableCell>
                      <TableCell>{order.comment}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
