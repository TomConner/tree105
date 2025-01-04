import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import PickupsDashboard from './PickupsDashboard';
import { Pickup } from './types';

interface EmailHistory {
  email: string;
  name: string;
  address2024: string | null;
  numtrees2024: string | null;
  address2025: string | null;
  numtrees2025: number | null;
  stripe2025: number | null;
}

interface TabbedDashboardProps {
  pickups: Pickup[];
  emailHistory: EmailHistory[];
}

const TabbedDashboard = ({ pickups, emailHistory }: TabbedDashboardProps) => {
  const [filterText, setFilterText] = useState('');

  const filteredHistory = emailHistory.filter(record => {
    const searchText = filterText.toLowerCase();
    return (
      (record.email?.toLowerCase().includes(searchText) || false) ||
      (record.name?.toLowerCase().includes(searchText) || false) ||
      (record.address2024?.toLowerCase().includes(searchText) || false) ||
      (record.address2025?.toLowerCase().includes(searchText) || false)
    );
  });

  return (
    <div className="space-y-4">
      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">Current Pickups</TabsTrigger>
          <TabsTrigger value="history">Pickup History</TabsTrigger>
          <TabsTrigger value="routes">Route Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <PickupsDashboard pickups={pickups} />
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tree Pickup History</CardTitle>
                <Input
                  placeholder="Search history..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="max-w-xs"
                />
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>2024 Address</TableHead>
                        <TableHead>2024 Trees</TableHead>
                        <TableHead>2025 Address</TableHead>
                        <TableHead>2025 Trees</TableHead>
                        <TableHead>2025 Payment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((record, index) => (
                        <TableRow key={index}>
                          <TableCell>{record.name || '-'}</TableCell>
                          <TableCell>{record.email}</TableCell>
                          <TableCell>{record.address2024 || '-'}</TableCell>
                          <TableCell>{record.numtrees2024 || '-'}</TableCell>
                          <TableCell>{record.address2025 || '-'}</TableCell>
                          <TableCell>{record.numtrees2025 || '-'}</TableCell>
                          <TableCell>
                            {record.stripe2025 ? `$${record.stripe2025.toFixed(2)}` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TabbedDashboard;
