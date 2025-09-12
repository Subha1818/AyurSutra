import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { 
  UserPlus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Phone,
  Filter,
  Settings,
  LogOut,
  Bell,
  TrendingUp
} from 'lucide-react';
import { SmartScheduler } from '@/components/AIComponents';

export default function ReceptionistDashboard() {
  const [activeTab, setActiveTab] = useState('register');
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [newPatient, setNewPatient] = useState({
    name: '', email: '', phone: '', age: '', gender: '', therapyPackage: ''
  });
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedPractitioner, setSelectedPractitioner] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());

  const practitioners = [
    'Dr. Sharma', 'Dr. Patel', 'Dr. Kumar'
  ];

  const therapyPackages = [
    '7-day Panchakarma Complete',
    '14-day Detox Program',
    '21-day Wellness Package',
    'Single Session Therapy',
    'Consultation Only'
  ];

  const requests = [
    { id: 1, type: 'reschedule', patient: 'Emma Davis', from: 'Dec 15, 10:00 AM', to: 'Dec 16, 2:00 PM', reason: 'Work conflict' },
    { id: 2, type: 'cancel', patient: 'John Smith', appointment: 'Dec 14, 3:00 PM', reason: 'Personal emergency' },
    { id: 3, type: 'reschedule', patient: 'Lisa Wang', from: 'Dec 17, 9:00 AM', to: 'Dec 18, 11:00 AM', reason: 'Travel delay' },
  ];

  // Register patient
  const handlePatientRegistration = (e) => {
    e.preventDefault();
    if (!newPatient.name) return alert('Name is required');
    const patient = { ...newPatient, id: Date.now() };
    setPatients([...patients, patient]);
    setNewPatient({ name: '', email: '', phone: '', age: '', gender: '', therapyPackage: '' });
    alert('Patient registered successfully');
  };

  // Manual scheduling
  const handleScheduleAppointment = () => {
    if (!selectedPatient || !selectedPractitioner || !selectedDate || !selectedTime) {
      return alert('Please fill all fields');
    }
    const appointment = {
      id: Date.now(),
      patient: selectedPatient,
      practitioner: selectedPractitioner,
      date: selectedDate,
      time: selectedTime,
      status: 'confirmed',
      room: 'Room 1'
    };
    setAppointments([...appointments, appointment]);
    alert('Appointment scheduled successfully');
  };

  // Helper for status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoomColor = (room) => {
    const colors = {
      'Room 1': 'bg-blue-500',
      'Room 2': 'bg-green-500',
      'Room 3': 'bg-purple-500',
      'Room 4': 'bg-orange-500'
    };
    return colors[room] || 'bg-gray-500';
  };

  const handleRequest = (requestId, action) => {
    alert(`${action} request ${requestId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Receptionist Dashboard</h1>
              <Badge variant="secondary">Ayur Wellness Center</Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm"><Bell className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm"><Settings className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm"><LogOut className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="register">Register Patient</TabsTrigger>
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Register Patient */}
          <TabsContent value="register" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" />Register New Patient</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handlePatientRegistration} className="space-y-4">
                  <Input placeholder="Name *" value={newPatient.name} onChange={e=>setNewPatient({...newPatient,name:e.target.value})} required />
                  <Input placeholder="Email" value={newPatient.email} onChange={e=>setNewPatient({...newPatient,email:e.target.value})} />
                  <Input placeholder="Phone" value={newPatient.phone} onChange={e=>setNewPatient({...newPatient,phone:e.target.value})} />
                  <Input type="number" placeholder="Age" value={newPatient.age} onChange={e=>setNewPatient({...newPatient,age:e.target.value})} />
                  <Select value={newPatient.gender} onValueChange={v=>setNewPatient({...newPatient,gender:v})}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newPatient.therapyPackage} onValueChange={v=>setNewPatient({...newPatient,therapyPackage:v})}>
                    <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                    <SelectContent>
                      {therapyPackages.map(pkg => <SelectItem key={pkg} value={pkg}>{pkg}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="submit" className="w-full">Register Patient</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduling */}
          <TabsContent value="scheduling" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Manual Scheduling */}
              <Card>
                <CardHeader><CardTitle>Manual Scheduling</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {patients.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={selectedPractitioner} onValueChange={setSelectedPractitioner}>
                    <SelectTrigger><SelectValue placeholder="Select practitioner" /></SelectTrigger>
                    <SelectContent>
                      {practitioners.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} />
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                    <SelectContent>
                      {['09:00','10:30','12:00','14:00','15:30','17:00'].map(t=> <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button className="w-full" onClick={handleScheduleAppointment}>Schedule Appointment</Button>
                </CardContent>
              </Card>

              {/* AI Smart Scheduler */}
              <SmartScheduler onScheduleSelect={(schedule)=>alert(`AI schedule: ${JSON.stringify(schedule)}`)} />
            </div>

            {/* Today's Appointments */}
            <Card>
              <CardHeader><CardTitle>Today's Appointments</CardTitle></CardHeader>
              <CardContent>
                {appointments.length === 0 ? <p>No appointments.</p> :
                  appointments.map(a => (
                    <div key={a.id} className="flex justify-between border p-2 mb-2 rounded">
                      <span>{a.date} {a.time} - {a.patient} with {a.practitioner}</span>
                      <Badge className={getStatusColor(a.status)}>{a.status}</Badge>
                    </div>
                  ))
                }
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar */}
          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Calendar</CardTitle></CardHeader>
              <CardContent>
                <Calendar selected={selectedCalendarDate} onSelect={setSelectedCalendarDate} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests */}
          <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5"/>Pending Requests</CardTitle></CardHeader>
              <CardContent>
                {requests.map(r => (
                  <div key={r.id} className="border p-3 mb-2 rounded">
                    <div className="flex justify-between">
                      <span>{r.type} request - {r.patient}</span>
                      <Badge>{r.type}</Badge>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={()=>handleRequest(r.id,'approve')}><CheckCircle className="w-4 h-4 mr-1"/>Approve</Button>
                      <Button size="sm" onClick={()=>handleRequest(r.id,'reject')}><XCircle className="w-4 h-4 mr-1"/>Reject</Button>
                      <Button size="sm" variant="outline"><Phone className="w-4 h-4 mr-1"/>Contact</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5"/>Clinic Statistics</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center"><div className="text-3xl font-bold text-blue-600">{patients.length}</div><p>Total Patients</p></div>
                  <div className="text-center"><div className="text-3xl font-bold text-green-600">{appointments.length}</div><p>Appointments</p></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
