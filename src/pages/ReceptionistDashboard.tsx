import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  UserPlus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Phone,
  Settings,
  LogOut,
  Bell,
  TrendingUp,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Check,
  RefreshCw,
  Search,
  Sparkles,
  Leaf
} from 'lucide-react';
import { SmartScheduler } from '@/components/AIComponents';
import {
  authService,
  receptionistService,
  bookingService,
  clinicService,
  notificationService
} from '@/lib/api';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';

export default function ReceptionistDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [receptionistProfile, setReceptionistProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('register');
  const [isLoading, setIsLoading] = useState(true);

  // Notifications
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(currentUser?.id);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Tab 1: Walk-In Patient Intake State
  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: 'male',
    therapyPackage: '7-day Panchakarma Complete',
  });
  const [isRegistering, setIsRegistering] = useState(false);

  // Tab 2: Manual Scheduling State
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [practitionersList, setPractitionersList] = useState<any[]>([]);
  const [therapiesList, setTherapiesList] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPractitionerId, setSelectedPractitionerId] = useState('');
  const [selectedTherapyId, setSelectedTherapyId] = useState('1');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('Room 1');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);

  // Appointments Feed
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [appointmentsFilterDate, setAppointmentsFilterDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Tab 3: Calendar State
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date());
  const [calendarDensity, setCalendarDensity] = useState<Record<string, number>>({});
  const [dateAppointments, setDateAppointments] = useState<any[]>([]);

  // Tab 4: Requests Queue State
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactPatientData, setContactPatientData] = useState<any>(null);

  // Tab 5: Clinic Stats & Directory State
  const [clinicStats, setClinicStats] = useState({
    totalPatients: 0,
    appointments: 0,
    completed: 0,
    scheduled: 0
  });
  const [staffDirectory, setStaffDirectory] = useState<{ practitioners: any[]; receptionists: any[] }>({
    practitioners: [],
    receptionists: []
  });

  const therapyPackages = [
    '7-day Panchakarma Complete',
    '14-day Detox Program',
    '21-day Wellness Package',
    'Single Session Therapy',
    'Consultation Only'
  ];

  // Initialize and load dashboard data
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          navigate('/auth');
          return;
        }
        setCurrentUser(user);

        // Fetch user profile
        const prof = await receptionistService.getStaffDirectory();
        setStaffDirectory(prof);
        setPractitionersList(prof.practitioners || []);

        // Load patients
        const pList = await receptionistService.getPatients();
        setPatientsList(pList);
        if (pList.length > 0) {
          setSelectedPatientId(pList[0].id);
        }

        // Load therapies
        const tList = await clinicService.getTherapies();
        setTherapiesList(tList);

        // Load today's appointments feed
        await loadAppointmentsFeed(new Date().toISOString().split('T')[0]);

        // Load pending requests
        const reqs = await receptionistService.getPendingRequests();
        setPendingRequests(reqs);

        // Load clinic stats
        const stats = await receptionistService.getClinicStats();
        setClinicStats(stats);

        // Load calendar density for current month
        await loadDensity(new Date().getFullYear(), new Date().getMonth() + 1);
      } catch (err) {
        console.error('ReceptionistDashboard init error:', err);
        toast.error('Failed to load clinic data.');
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [navigate]);

  // Load available slots whenever selectedDate or clinic changes
  useEffect(() => {
    async function fetchSlots() {
      if (!selectedDate) return;
      try {
        const slots = await bookingService.getAvailableSlots(1, selectedDate);
        setAvailableSlots(slots);
        if (slots.length > 0 && !slots.includes(selectedTime)) {
          setSelectedTime(slots[0]);
        }
      } catch (err) {
        console.error('fetchSlots error:', err);
      }
    }
    fetchSlots();
  }, [selectedDate]);

  // Load appointments feed for a specific date
  const loadAppointmentsFeed = async (dateStr: string) => {
    try {
      const apps = await receptionistService.getClinicAppointments(1, dateStr);
      setTodayAppointments(apps);
    } catch (err) {
      console.error('loadAppointmentsFeed error:', err);
    }
  };

  // Load calendar density
  const loadDensity = async (year: number, month: number) => {
    try {
      const density = await receptionistService.getCalendarDensity(1, year, month);
      setCalendarDensity(density);
    } catch (err) {
      console.error('loadDensity error:', err);
    }
  };

  // On calendar date select
  const handleCalendarDateSelect = async (date: Date | undefined) => {
    setSelectedCalendarDate(date);
    if (!date) return;
    const dateStr = date.toISOString().split('T')[0];
    try {
      const apps = await receptionistService.getClinicAppointments(1, dateStr);
      setDateAppointments(apps);
    } catch (err) {
      console.error('fetch date appointments error:', err);
    }
  };

  // Handle Walk-In Patient Registration
  const handlePatientRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.name.trim()) {
      toast.error('Patient name is required');
      return;
    }
    if (!newPatient.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await receptionistService.registerWalkInPatient({
        name: newPatient.name.trim(),
        email: newPatient.email.trim() || undefined,
        phone: newPatient.phone.trim(),
        age: newPatient.age,
        gender: newPatient.gender,
        therapyPackage: newPatient.therapyPackage,
        clinicCode: 'AYUR-KOL-01',
        clinicId: 1
      });

      toast.success(res.message || 'Patient registered successfully!');
      
      // Reset form
      setNewPatient({
        name: '',
        email: '',
        phone: '',
        age: '',
        gender: 'male',
        therapyPackage: '7-day Panchakarma Complete',
      });

      // Refresh patients list & stats
      const pList = await receptionistService.getPatients();
      setPatientsList(pList);
      const stats = await receptionistService.getClinicStats();
      setClinicStats(stats);
      await loadAppointmentsFeed(appointmentsFilterDate);
    } catch (err: any) {
      toast.error(err.message || 'Failed to register patient');
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle Manual Appointment Scheduling
  const handleScheduleAppointment = async () => {
    if (!selectedPatientId || !selectedDate || !selectedTime) {
      toast.error('Please select a patient, date, and time slot.');
      return;
    }

    setIsScheduling(true);
    try {
      await receptionistService.scheduleManualAppointment({
        patientId: selectedPatientId,
        practitionerId: selectedPractitionerId && selectedPractitionerId !== 'any' ? selectedPractitionerId : undefined,
        clinicId: 1,
        therapyId: parseInt(selectedTherapyId, 10) || 1,
        date: selectedDate,
        time: selectedTime,
        room: selectedRoom
      });

      toast.success('Appointment scheduled successfully!');
      
      // Refresh appointment feeds & stats
      await loadAppointmentsFeed(appointmentsFilterDate);
      const stats = await receptionistService.getClinicStats();
      setClinicStats(stats);
      if (selectedCalendarDate) {
        await handleCalendarDateSelect(selectedCalendarDate);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule appointment');
    } finally {
      setIsScheduling(false);
    }
  };

  // Handle Requests (Approve / Reject)
  const handleResolveRequest = async (requestId: string, action: 'approve' | 'reject', patientId?: string) => {
    try {
      await receptionistService.resolveRequest(requestId, action, patientId);
      toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'}. Patient has been notified.`);
      
      // Refresh requests list & feed
      const reqs = await receptionistService.getPendingRequests();
      setPendingRequests(reqs);
      await loadAppointmentsFeed(appointmentsFilterDate);
      const stats = await receptionistService.getClinicStats();
      setClinicStats(stats);
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve request');
    }
  };

  const handleContactPatient = (patient: any) => {
    setContactPatientData(patient);
    setContactDialogOpen(true);
  };

  const handleSendPatientNotice = async () => {
    if (!contactPatientData?.patient_id) return;
    try {
      await notificationService.sendNotification(
        contactPatientData.patient_id,
        `Update from Reception Desk: Regarding your Panchakarma appointment inquiry, please reach us at (+91 98765 43210).`,
        'update'
      );
      toast.success(`Notice sent to ${contactPatientData.patient}`);
      setContactDialogOpen(false);
    } catch (err) {
      toast.error('Failed to dispatch notification.');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      toast.success('Logged out successfully.');
      navigate('/auth');
    } catch (err) {
      navigate('/auth');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-amber-500 text-white animate-pulse">In Progress</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50/50">Scheduled</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'rescheduled':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Rescheduled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoomBadge = (room?: string) => {
    const r = room || 'Room 1';
    let colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
    if (r.includes('2')) colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    else if (r.includes('3')) colorClass = 'bg-purple-100 text-purple-800 border-purple-200';
    else if (r.includes('4')) colorClass = 'bg-amber-100 text-amber-800 border-amber-200';

    return (
      <Badge variant="outline" className={`text-xs font-medium ${colorClass}`}>
        {r}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-emerald-50/60 pb-12">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div
                onClick={() => navigate('/')}
                className="flex items-center gap-2.5 cursor-pointer group"
                title="Go to AyurSutra Home"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:bg-emerald-700 transition-colors">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-emerald-700 transition-colors">
                    AyurSutra
                  </h1>
                  <p className="text-[11px] text-emerald-700 font-semibold tracking-wide uppercase">Receptionist Desk</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 hidden sm:inline-flex">
                Ayur Wellness Clinic (Kolkata)
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotificationsOpen(true)}
                  className="relative p-2 text-gray-700 hover:text-emerald-700 hover:bg-emerald-50"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('settings')}
                className="text-gray-700 hover:text-emerald-700 hover:bg-emerald-50"
                title="Clinic Overview"
              >
                <Settings className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white border shadow-sm p-1">
            <TabsTrigger value="register" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Register Patient
            </TabsTrigger>
            <TabsTrigger value="scheduling" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Scheduling & Feed
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Calendar
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white relative">
              Requests
              {pendingRequests.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Clinic & Stats
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Register Walk-In Patient */}
          <TabsContent value="register" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-sm border-emerald-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-emerald-950 font-bold">
                    <UserPlus className="w-5 h-5 text-emerald-600" />
                    Walk-in Patient Intake & Course Creation
                  </CardTitle>
                  <CardDescription>
                    Register a new patient and automatically schedule consecutive treatment sessions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePatientRegistration} className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-xs font-semibold text-gray-700">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g. Ramesh Chandra"
                        value={newPatient.name}
                        onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                        required
                        className="text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="phone" className="text-xs font-semibold text-gray-700">Phone Number *</Label>
                        <Input
                          id="phone"
                          placeholder="+91 98765 43210"
                          value={newPatient.phone}
                          onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                          required
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="email" className="text-xs font-semibold text-gray-700">Email Address (Optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="patient@example.com"
                          value={newPatient.email}
                          onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="age" className="text-xs font-semibold text-gray-700">Age</Label>
                        <Input
                          id="age"
                          type="number"
                          placeholder="e.g. 42"
                          value={newPatient.age}
                          onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-gray-700">Gender</Label>
                        <Select
                          value={newPatient.gender}
                          onValueChange={(v) => setNewPatient({ ...newPatient, gender: v })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-700">Prescribed Therapy Package *</Label>
                      <Select
                        value={newPatient.therapyPackage}
                        onValueChange={(v) => setNewPatient({ ...newPatient, therapyPackage: v })}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select package" />
                        </SelectTrigger>
                        <SelectContent>
                          {therapyPackages.map((pkg) => (
                            <SelectItem key={pkg} value={pkg}>
                              {pkg}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-gray-500 pt-0.5">
                        Selecting 7-day, 14-day, or 21-day packages will automatically populate consecutive daily sessions starting tomorrow.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isRegistering}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 mt-2"
                    >
                      {isRegistering ? 'Registering & Scheduling...' : 'Register Patient & Schedule Course'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 2: Manual Scheduling & Smart Scheduler & Feed */}
          <TabsContent value="scheduling" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Manual Scheduling Form */}
              <Card className="shadow-sm border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    Book Individual Appointment
                  </CardTitle>
                  <CardDescription>
                    Assign specific time slots, practitioners, and clinical therapy rooms.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-gray-700">Select Patient *</Label>
                    <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Choose registered patient" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {patientsList.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} {p.phone ? `(${p.phone})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-700">Assign Practitioner</Label>
                      <Select value={selectedPractitionerId} onValueChange={setSelectedPractitionerId}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Any Available Doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any Available Doctor</SelectItem>
                          {practitionersList.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              Dr. {doc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-700">Therapy *</Label>
                      <Select value={selectedTherapyId} onValueChange={setSelectedTherapyId}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select therapy" />
                        </SelectTrigger>
                        <SelectContent>
                          {therapiesList.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>
                              {t.icon} {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-700">Date *</Label>
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-700">Time Slot *</Label>
                      <Select value={selectedTime} onValueChange={setSelectedTime}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSlots.length === 0 ? (
                            <SelectItem value="10:00" disabled>No slots</SelectItem>
                          ) : (
                            availableSlots.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-gray-700">Treatment Room</Label>
                      <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Room" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Room 1">Room 1 (Droni)</SelectItem>
                          <SelectItem value="Room 2">Room 2 (Sweda)</SelectItem>
                          <SelectItem value="Room 3">Room 3 (Shirodhara)</SelectItem>
                          <SelectItem value="Room 4">Room 4 (Basti)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleScheduleAppointment}
                    disabled={isScheduling}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
                  >
                    {isScheduling ? 'Scheduling...' : 'Confirm Appointment Booking'}
                  </Button>
                </CardContent>
              </Card>

              {/* AI Smart Scheduler Recommendations */}
              <div className="space-y-4">
                <SmartScheduler
                  availableSlots={availableSlots}
                  onScheduleSelect={(schedule) => {
                    const cleanTime = schedule.time.includes('AM') || schedule.time.includes('PM')
                      ? (schedule.time.includes('10:00') ? '10:30' : schedule.time.includes('2:00') ? '14:00' : '15:30')
                      : schedule.time;
                    setSelectedTime(cleanTime);
                    toast.info(`AI selected slot: ${cleanTime} (${schedule.reason})`);
                  }}
                />
              </div>
            </div>

            {/* Today's Appointments Feed */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-emerald-600" />
                    Clinic Appointment Schedule
                  </CardTitle>
                  <CardDescription>
                    All scheduled and ongoing Panchakarma treatments for the day.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={appointmentsFilterDate}
                    onChange={(e) => {
                      setAppointmentsFilterDate(e.target.value);
                      loadAppointmentsFeed(e.target.value);
                    }}
                    className="text-sm w-44"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadAppointmentsFeed(appointmentsFilterDate)}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {todayAppointments.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                    <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="font-medium text-gray-700">No appointments scheduled for this date</p>
                    <p className="text-sm text-gray-500">Use the manual scheduling form above to book a new appointment.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayAppointments.map((a) => (
                      <div
                        key={a.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl bg-white hover:border-emerald-300 transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[70px] bg-emerald-50/70 px-3 py-2 rounded-lg border border-emerald-100">
                            <div className="font-bold text-emerald-950 text-base">{a.time}</div>
                            {getRoomBadge(a.room)}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 text-base">{a.patient}</h4>
                              {getStatusBadge(a.status)}
                            </div>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {a.therapy} with <span className="font-medium text-emerald-800">{a.practitioner}</span>
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 sm:mt-0 flex gap-2">
                          {a.patient_phone && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleContactPatient({ patient_id: a.patient_id, patient: a.patient, phone: a.patient_phone })}
                              className="text-xs text-gray-700"
                            >
                              <Phone className="w-3.5 h-3.5 mr-1" />
                              Contact
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Calendar Density */}
          <TabsContent value="calendar" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Calendar Component */}
              <Card className="shadow-sm border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-emerald-600" />
                    Appointment Density
                  </CardTitle>
                  <CardDescription>
                    Select a date to inspect scheduled sessions
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedCalendarDate}
                    onSelect={handleCalendarDateSelect}
                    className="rounded-md border p-3"
                  />
                </CardContent>
              </Card>

              {/* Sessions on Selected Date */}
              <Card className="md:col-span-2 shadow-sm border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Appointments for {selectedCalendarDate ? selectedCalendarDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Selected Date'}
                  </CardTitle>
                  <CardDescription>
                    {dateAppointments.length} appointment(s) registered on this day.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dateAppointments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                      <p className="text-sm">No appointments found on this date.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dateAppointments.map((a) => (
                        <div key={a.id} className="p-3 border rounded-lg flex justify-between items-center bg-gray-50/50">
                          <div>
                            <div className="font-semibold text-gray-900">{a.patient}</div>
                            <div className="text-xs text-gray-600">{a.therapy} • {a.practitioner}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-medium">{a.time}</span>
                            {getRoomBadge(a.room)}
                            {getStatusBadge(a.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 4: Requests Queue */}
          <TabsContent value="requests" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-emerald-950">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Pending Patient Requests
                </CardTitle>
                <CardDescription>
                  Review and resolve rescheduling and cancellation requests submitted by patients.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="font-medium text-gray-700">All caught up!</p>
                    <p className="text-sm text-gray-500">There are no pending reschedule or cancellation requests at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((r) => (
                      <div key={r.id} className="p-4 border rounded-xl bg-white hover:border-amber-300 transition-colors shadow-2xs space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-900 text-base">{r.patient}</h4>
                              <Badge className={r.type === 'reschedule' ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'}>
                                {r.type.toUpperCase()} REQUEST
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Therapy: <span className="font-medium">{r.therapy}</span> • Appointment: <span className="font-semibold text-emerald-800">{r.appointment}</span>
                            </p>
                          </div>
                        </div>

                        {r.reason && (
                          <div className="text-xs bg-amber-50/70 border border-amber-200 p-2.5 rounded-lg text-amber-900">
                            <span className="font-semibold">Patient Note:</span> {r.reason}
                          </div>
                        )}

                        <div className="flex gap-2 pt-1 border-t">
                          <Button
                            size="sm"
                            onClick={() => handleResolveRequest(r.id, 'approve', r.patient_id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleResolveRequest(r.id, 'reject', r.patient_id)}
                          >
                            <XCircle className="w-4 h-4 mr-1.5" />
                            Reject
                          </Button>
                          {r.patient_phone && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleContactPatient(r)}
                              className="text-gray-700"
                            >
                              <Phone className="w-4 h-4 mr-1.5" />
                              Contact Patient
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Clinic Stats & Staff Directory */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Clinic Operational Analytics
                </CardTitle>
                <CardDescription>Live clinic metrics computed across treatments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                    <span className="text-xs font-semibold text-emerald-800 uppercase block">Total Patients</span>
                    <span className="text-3xl font-extrabold text-emerald-700 mt-1 block">
                      {clinicStats.totalPatients}
                    </span>
                    <span className="text-[11px] text-emerald-600 mt-1 block">Registered in clinic</span>
                  </div>

                  <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl">
                    <span className="text-xs font-semibold text-blue-800 uppercase block">Total Sessions</span>
                    <span className="text-3xl font-extrabold text-blue-700 mt-1 block">
                      {clinicStats.appointments}
                    </span>
                    <span className="text-[11px] text-blue-600 mt-1 block">Booked all-time</span>
                  </div>

                  <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-xl">
                    <span className="text-xs font-semibold text-purple-800 uppercase block">Completed Treatments</span>
                    <span className="text-3xl font-extrabold text-purple-700 mt-1 block">
                      {clinicStats.completed}
                    </span>
                    <span className="text-[11px] text-purple-600 mt-1 block">Successfully finished</span>
                  </div>

                  <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-xl">
                    <span className="text-xs font-semibold text-amber-800 uppercase block">Active / Scheduled</span>
                    <span className="text-3xl font-extrabold text-amber-700 mt-1 block">
                      {clinicStats.scheduled}
                    </span>
                    <span className="text-[11px] text-amber-700 mt-1 block">In current pipeline</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Staff Directory */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Clinic Staff Directory
                </CardTitle>
                <CardDescription>Clinical team and front desk personnel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Practitioners On Duty</h4>
                    {staffDirectory.practitioners.length === 0 ? (
                      <p className="text-xs text-gray-500">No practitioners found.</p>
                    ) : (
                      staffDirectory.practitioners.map((doc) => (
                        <div key={doc.id} className="p-3 border rounded-lg flex justify-between items-center bg-gray-50/50">
                          <div>
                            <div className="font-semibold text-sm text-gray-900">Dr. {doc.name}</div>
                            <div className="text-xs text-emerald-700">{doc.specialization || 'Panchakarma Specialist'}</div>
                          </div>
                          {doc.phone && (
                            <span className="text-xs font-mono text-gray-600">{doc.phone}</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Reception Team</h4>
                    {staffDirectory.receptionists.length === 0 ? (
                      <p className="text-xs text-gray-500">No receptionists found.</p>
                    ) : (
                      staffDirectory.receptionists.map((rec) => (
                        <div key={rec.id} className="p-3 border rounded-lg flex justify-between items-center bg-gray-50/50">
                          <div>
                            <div className="font-semibold text-sm text-gray-900">{rec.name}</div>
                            <div className="text-xs text-gray-500">Front Desk Coordinator</div>
                          </div>
                          {rec.phone && (
                            <span className="text-xs font-mono text-gray-600">{rec.phone}</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Contact Patient Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600" />
              Contact Patient
            </DialogTitle>
            <DialogDescription>
              Reach out directly to {contactPatientData?.patient}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg border">
              <span className="text-xs text-gray-500 font-semibold block">Phone Number</span>
              <span className="font-mono text-base font-medium text-gray-900">
                {contactPatientData?.patient_phone || contactPatientData?.phone || 'No phone number provided'}
              </span>
            </div>

            <Button
              onClick={handleSendPatientNotice}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Send Clinic Notification
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Drawer / Modal */}
      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex justify-between items-center pr-6">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                Notifications
              </DialogTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs text-emerald-700 hover:bg-emerald-50 h-7 px-2"
                >
                  Mark all as read
                </Button>
              )}
            </div>
            <DialogDescription>
              Realtime updates regarding clinic appointments and session completions.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto space-y-2 mt-2">
            {notifications.length === 0 ? (
              <p className="text-center py-8 text-gray-500 text-sm">No notifications.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={`p-3 rounded-lg border text-sm transition-colors cursor-pointer ${
                    !n.read ? 'bg-emerald-50/70 border-emerald-300 font-medium' : 'bg-white border-gray-100 text-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm">{n.message}</p>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1"></span>
                    )}
                  </div>
                  {n.created_at && (
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
