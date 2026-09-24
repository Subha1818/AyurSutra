import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  Users,
  FileText,
  User,
  Settings,
  LogOut,
  Play,
  Pause,
  CheckCircle,
  Activity,
  Heart,
  Thermometer,
  Stethoscope,
  ClipboardList,
  TrendingUp,
  Star,
  Phone,
  MessageSquare,
  Bell,
  Search,
  Check,
  RefreshCw,
  Sparkles,
  Leaf
} from 'lucide-react';
import { NotesSummarizer } from '@/components/AIComponents';
import { authService, practitionerService, notificationService } from '@/lib/api';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';

export default function PractitionerDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('sessions');
  const [isLoading, setIsLoading] = useState(true);

  // Notifications
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(currentUser?.id);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Sessions Tab State
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionChecklist, setSessionChecklist] = useState({
    bloodPressure: false,
    temperature: false,
    pulseRate: false,
    preparation: false,
    therapy: false,
    postCare: false
  });
  const [sessionTimer, setSessionTimer] = useState({ isRunning: false, time: 0 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Patients Tab State
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState<any[]>([]);
  const [historyPatientName, setHistoryPatientName] = useState('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactPatient, setContactPatient] = useState<any>(null);

  // Notes Tab State
  const [notesArchive, setNotesArchive] = useState<any[]>([]);
  const [notesSearch, setNotesSearch] = useState('');
  const [notesSessionId, setNotesSessionId] = useState<string>('');
  const [standaloneNotes, setStandaloneNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [recentAISummary, setRecentAISummary] = useState('');

  // Profile Tab State
  const [kpis, setKpis] = useState({
    totalPatients: 0,
    sessionsCompleted: 0,
    averageRating: 4.9,
    successRate: 94
  });
  const [preferences, setPreferences] = useState({
    email: true,
    sms: true,
    autoSchedule: false
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Initialize and load user data
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

        // Load profile and preferences
        const prof = await practitionerService.getPractitionerProfile(user.id);
        if (prof) {
          setProfile(prof);
          if (prof.preferences) {
            setPreferences(prof.preferences);
          }
        }

        // Load today's sessions
        await loadTodaySessions(user.id);

        // Load patients
        const pList = await practitionerService.getPractitionerPatients(user.id);
        setPatients(pList);

        // Load KPIs
        const kpiData = await practitionerService.getPerformanceKPIs(user.id);
        setKpis(kpiData);

        // Load notes archive
        const notesList = await practitionerService.getNotesArchive(user.id);
        setNotesArchive(notesList);
      } catch (err) {
        console.error('PractitionerDashboard init error:', err);
        toast.error('Failed to load practitioner dashboard data.');
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [navigate]);

  const loadTodaySessions = async (userId: string) => {
    try {
      const sessions = await practitionerService.getTodaySessions(userId);
      setTodaySessions(sessions);

      // Check if an in-progress session already exists
      const inProgress = sessions.find((s: any) => s.status === 'in-progress');
      if (inProgress && !currentSession) {
        setCurrentSession(inProgress);
        setSessionTimer({
          isRunning: true,
          time: inProgress.duration_seconds || 0
        });
        if (inProgress.record) {
          if (inProgress.record.notes) setSessionNotes(inProgress.record.notes);
          if (inProgress.record.checklist_completed) {
            setSessionChecklist(prev => ({ ...prev, ...inProgress.record.checklist_completed }));
          }
        }
      }
    } catch (err) {
      console.error('loadTodaySessions error:', err);
    }
  };

  // Timer Tick and periodic persistence
  useEffect(() => {
    if (sessionTimer.isRunning) {
      timerRef.current = setInterval(() => {
        setSessionTimer(prev => {
          const newTime = prev.time + 1;
          // Persist every 15 seconds silently
          if (newTime % 15 === 0 && currentSession?.id) {
            practitionerService.updateSessionTimer(currentSession.id, newTime);
          }
          return { ...prev, time: newTime };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionTimer.isRunning, currentSession?.id]);

  const handleStartSession = async (session: any) => {
    try {
      const res = await practitionerService.startSession(session.id);
      setCurrentSession({ ...session, ...res.session });
      setSessionTimer({ isRunning: true, time: session.duration_seconds || 0 });
      
      const record = res.record || {};
      setSessionNotes(record.notes || '');
      setSessionChecklist(prev => ({
        ...prev,
        ...(record.checklist_completed || {})
      }));

      // Update today's list
      setTodaySessions(prev =>
        prev.map(s => s.id === session.id ? { ...s, status: 'in-progress' } : s)
      );
      toast.success(`Session started for ${session.patient}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start session');
    }
  };

  const toggleTimer = async () => {
    const nextState = !sessionTimer.isRunning;
    setSessionTimer(prev => ({ ...prev, isRunning: nextState }));
    if (!nextState && currentSession?.id) {
      await practitionerService.updateSessionTimer(currentSession.id, sessionTimer.time);
    }
  };

  const handleChecklistChange = async (item: string, checked: boolean) => {
    const updated = { ...sessionChecklist, [item]: checked };
    setSessionChecklist(updated);
    if (currentSession?.id) {
      await practitionerService.updateChecklist(currentSession.id, updated);
    }
  };

  const handleSaveActiveNotes = async () => {
    if (!currentSession?.id) return;
    try {
      await practitionerService.saveSessionNotes(currentSession.id, sessionNotes);
      toast.success('Session notes saved.');
    } catch (err: any) {
      toast.error('Failed to save notes.');
    }
  };

  const handleCompleteSession = async () => {
    if (!currentSession?.id) return;
    try {
      // Final duration save & status update
      await practitionerService.completeSession(
        currentSession.id,
        sessionTimer.time,
        currentSession.patient_id,
        currentSession.therapy,
        profile?.name || currentUser?.user_metadata?.name || 'Practitioner'
      );

      // Save latest notes if any
      if (sessionNotes.trim()) {
        await practitionerService.saveSessionNotes(currentSession.id, sessionNotes);
      }

      toast.success(`Session completed! Patient ${currentSession.patient} has been notified.`);

      // Reset active session
      setCurrentSession(null);
      setSessionTimer({ isRunning: false, time: 0 });
      setSessionNotes('');
      setSessionChecklist({
        bloodPressure: false,
        temperature: false,
        pulseRate: false,
        preparation: false,
        therapy: false,
        postCare: false
      });

      // Reload sessions and KPIs
      if (currentUser?.id) {
        await loadTodaySessions(currentUser.id);
        const pList = await practitionerService.getPractitionerPatients(currentUser.id);
        setPatients(pList);
        const kpiData = await practitionerService.getPerformanceKPIs(currentUser.id);
        setKpis(kpiData);
        const notesList = await practitionerService.getNotesArchive(currentUser.id);
        setNotesArchive(notesList);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete session');
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleViewPatientHistory = async (patient: any) => {
    setHistoryPatientName(patient.name);
    try {
      const history = await practitionerService.getPatientHistory(patient.id);
      setSelectedPatientHistory(history);
      setHistoryDialogOpen(true);
    } catch (err) {
      toast.error('Failed to load patient history.');
    }
  };

  const handleContactPatient = (patient: any) => {
    setContactPatient(patient);
    setContactDialogOpen(true);
  };

  const handleSendReminderToPatient = async () => {
    if (!contactPatient?.id) return;
    try {
      await notificationService.sendNotification(
        contactPatient.id,
        `Reminder from Dr. ${profile?.name || 'your practitioner'}: Please ensure you follow pre-therapy guidelines and stay well hydrated.`,
        'reminder'
      );
      toast.success(`Reminder sent to ${contactPatient.name}`);
      setContactDialogOpen(false);
    } catch (err) {
      toast.error('Failed to send reminder.');
    }
  };

  const handleSaveStandaloneNotes = async () => {
    if (!notesSessionId) {
      toast.error('Please select an appointment or patient session first.');
      return;
    }
    if (!standaloneNotes.trim()) {
      toast.error('Notes cannot be empty.');
      return;
    }
    setIsSavingNotes(true);
    try {
      await practitionerService.saveSessionNotes(notesSessionId, standaloneNotes);
      toast.success('Notes saved to session records!');
      if (currentUser?.id) {
        const notesList = await practitionerService.getNotesArchive(currentUser.id);
        setNotesArchive(notesList);
      }
    } catch (err) {
      toast.error('Failed to save notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleSaveAISummary = async () => {
    if (!notesSessionId) {
      toast.error('Please select a session to associate this AI summary with.');
      return;
    }
    if (!recentAISummary) return;
    try {
      await practitionerService.saveAISummary(notesSessionId, recentAISummary);
      toast.success('AI summary attached to session records.');
      if (currentUser?.id) {
        const notesList = await practitionerService.getNotesArchive(currentUser.id);
        setNotesArchive(notesList);
      }
    } catch (err) {
      toast.error('Failed to save AI summary.');
    }
  };

  const handleUpdatePreference = async (key: 'email' | 'sms' | 'autoSchedule', value: boolean) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    if (!currentUser?.id) return;
    try {
      setIsSavingPrefs(true);
      await practitionerService.updatePreferences(currentUser.id, updated);
      toast.success('Preferences updated.');
    } catch (err) {
      toast.error('Failed to update preference.');
    } finally {
      setIsSavingPrefs(false);
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

  // Filter notes archive
  const filteredNotes = notesArchive.filter(n => {
    if (!notesSearch.trim()) return true;
    const term = notesSearch.toLowerCase();
    return (
      n.patient?.toLowerCase().includes(term) ||
      n.therapy?.toLowerCase().includes(term) ||
      n.notes?.toLowerCase().includes(term)
    );
  });

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
                  <p className="text-[11px] text-emerald-700 font-semibold tracking-wide uppercase">Practitioner Suite</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 hidden sm:inline-flex">
                {profile?.name ? `Dr. ${profile.name}` : (currentUser?.user_metadata?.name || 'Dr. Practitioner')}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Notifications Bell */}
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
                onClick={() => setActiveTab('profile')}
                className="text-gray-700 hover:text-emerald-700 hover:bg-emerald-50"
                title="Settings & Profile"
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
          <TabsList className="grid w-full grid-cols-4 bg-white border shadow-sm p-1">
            <TabsTrigger value="sessions" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              My Sessions
            </TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Patients
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Notes & AI
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Profile & KPIs
            </TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            {/* Active Session Card */}
            {currentSession && (
              <Card className="border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-md">
                <CardHeader className="border-b border-emerald-100/70 pb-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-600 hover:bg-emerald-700">Active Live Session</Badge>
                        <Badge variant="outline" className="border-emerald-400 text-emerald-800">
                          {currentSession.room || 'Room 1'}
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl mt-1 text-emerald-950 font-bold">
                        {currentSession.patient}
                      </CardTitle>
                      <CardDescription className="text-emerald-800">
                        Therapy: <span className="font-semibold">{currentSession.therapy}</span> • Scheduled: {currentSession.time}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-4 bg-white/80 px-4 py-2 rounded-xl border border-emerald-200 shadow-sm">
                      <Clock className="w-5 h-5 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
                      <span className="text-3xl font-mono font-bold text-gray-900 tracking-wider">
                        {formatTime(sessionTimer.time)}
                      </span>
                      <Button
                        onClick={toggleTimer}
                        variant={sessionTimer.isRunning ? "destructive" : "default"}
                        size="sm"
                        className={sessionTimer.isRunning ? "" : "bg-emerald-600 hover:bg-emerald-700"}
                      >
                        {sessionTimer.isRunning ? (
                          <>
                            <Pause className="w-4 h-4 mr-1" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-1" /> Resume
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Session Checklist */}
                    <div className="bg-white p-5 rounded-lg border shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-emerald-600" />
                        Clinical Session Checklist
                      </h4>
                      <div className="space-y-3">
                        {[
                          { key: 'bloodPressure', label: 'Blood Pressure & Vitals Check', icon: <Heart className="w-4 h-4 text-rose-500" /> },
                          { key: 'temperature', label: 'Temperature & Prakriti Pulse Check', icon: <Thermometer className="w-4 h-4 text-amber-500" /> },
                          { key: 'pulseRate', label: 'Nadi Pariksha / Pulse Rate', icon: <Activity className="w-4 h-4 text-blue-500" /> },
                          { key: 'preparation', label: 'Patient Poorvakarma Preparation', icon: <User className="w-4 h-4 text-indigo-500" /> },
                          { key: 'therapy', label: 'Pradhanakarma Administration', icon: <Stethoscope className="w-4 h-4 text-emerald-600" /> },
                          { key: 'postCare', label: 'Paschatkarma & Rest Protocols', icon: <ClipboardList className="w-4 h-4 text-teal-600" /> },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 transition-colors">
                            <Checkbox
                              id={item.key}
                              checked={(sessionChecklist as any)[item.key] || false}
                              onCheckedChange={(checked) => handleChecklistChange(item.key, !!checked)}
                            />
                            <label htmlFor={item.key} className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer flex-1">
                              {item.icon}
                              {item.label}
                            </label>
                            {(sessionChecklist as any)[item.key] && (
                              <Badge variant="outline" className="text-emerald-700 border-emerald-300 text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Session Notes */}
                    <div className="bg-white p-5 rounded-lg border shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-600" />
                            Session Observations & Notes
                          </h4>
                          <Button variant="ghost" size="sm" onClick={handleSaveActiveNotes} className="text-xs text-emerald-700">
                            Save Draft
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Document pulse response, oil temperature, patient tolerance, signs of proper purification (Samyak Snigdha / Swinna lakshana)..."
                          value={sessionNotes}
                          onChange={(e) => setSessionNotes(e.target.value)}
                          className="min-h-[190px] text-sm"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Notes will be auto-saved and synced into the patient's electronic health record upon session completion.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-emerald-200/80">
                    <Button onClick={handleCompleteSession} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Complete Session & Request Feedback
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleContactPatient({ id: currentSession.patient_id, name: currentSession.patient, phone: currentSession.patient_phone })}
                      className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Contact Patient
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Sessions Feed */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    Today's Session Schedule
                  </CardTitle>
                  <CardDescription>
                    Realtime appointments assigned to you for today.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => currentUser?.id && loadTodaySessions(currentUser.id)}
                  className="text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {todaySessions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium text-gray-700">No sessions scheduled for today</p>
                    <p className="text-sm text-gray-500">Upcoming appointments will automatically appear here when scheduled by the reception desk.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todaySessions.map((session) => (
                      <div
                        key={session.id}
                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl transition-all ${
                          session.status === 'in-progress'
                            ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                            : session.status === 'completed'
                            ? 'border-gray-200 bg-gray-50/60 opacity-90'
                            : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/20'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[70px] bg-white px-3 py-2 rounded-lg border shadow-xs">
                            <div className="font-semibold text-gray-900">{session.time}</div>
                            <div className="text-[11px] text-gray-500">{session.room || 'Room 1'}</div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 text-base">{session.patient}</h4>
                              <Badge
                                variant={
                                  session.status === 'completed' ? 'secondary' :
                                  session.status === 'in-progress' ? 'destructive' : 'outline'
                                }
                                className={
                                  session.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : session.status === 'in-progress'
                                    ? 'bg-amber-500 text-white animate-pulse'
                                    : 'border-blue-300 text-blue-700'
                                }
                              >
                                {session.status === 'in-progress' ? 'In Progress' : session.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-0.5">
                              <span className="mr-1">{session.therapy_icon}</span>
                              {session.therapy} Therapy
                              {session.duration_seconds > 0 && ` • Logged: ${formatTime(session.duration_seconds)}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3 sm:mt-0 w-full sm:w-auto justify-end">
                          {session.status === 'scheduled' && (
                            <Button
                              onClick={() => handleStartSession(session)}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <Play className="w-3.5 h-3.5 mr-1" />
                              Start Session
                            </Button>
                          )}
                          {session.status === 'in-progress' && (
                            <Button
                              onClick={() => {
                                setCurrentSession(session);
                                setSessionTimer({ isRunning: true, time: session.duration_seconds || 0 });
                              }}
                              size="sm"
                              variant="outline"
                              className="border-emerald-600 text-emerald-700"
                            >
                              Open Live Active
                            </Button>
                          )}
                          {session.status === 'completed' && (
                            <Badge variant="outline" className="text-emerald-700 border-emerald-300 flex items-center gap-1 py-1 px-2.5">
                              <Check className="w-3.5 h-3.5" />
                              Finished
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleContactPatient({ id: session.patient_id, name: session.patient, phone: session.patient_phone })}
                            title="Contact Patient"
                          >
                            <Phone className="w-4 h-4 text-gray-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="w-5 h-5 text-emerald-600" />
                  My Panchakarma Patients
                </CardTitle>
                <CardDescription>
                  Tracking patient adherence, completed protocols, and clinical history.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patients.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium text-gray-700">No patients assigned yet</p>
                    <p className="text-sm text-gray-500">Patients booked for your clinical therapies will show here.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {patients.map((patient) => (
                      <Card key={patient.id} className="border border-gray-200 hover:border-emerald-300 transition-all shadow-xs">
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg">{patient.name}</h4>
                              <p className="text-sm text-emerald-800 font-medium">{patient.therapy} Course</p>
                              {patient.phone && (
                                <p className="text-xs text-gray-500 mt-0.5">{patient.phone}</p>
                              )}
                            </div>
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 border-emerald-200">
                              {patient.completedSessions} / {patient.totalNonCancelled || patient.targetSessions} sessions
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 mb-5">
                            <div className="flex justify-between text-xs font-semibold text-gray-600">
                              <span>Course Progress</span>
                              <span className="text-emerald-700">{patient.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${patient.progress}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                              onClick={() => handleViewPatientHistory(patient)}
                            >
                              <FileText className="w-3.5 h-3.5 mr-1.5" />
                              View History
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => {
                                setNotesSessionId(patient.latestSessionId || '');
                                setActiveTab('notes');
                              }}
                            >
                              <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
                              Add Notes
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleContactPatient(patient)}
                              title="Contact"
                            >
                              <Phone className="w-4 h-4 text-gray-600" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes & AI Tab */}
          <TabsContent value="notes" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Clinical Notes Editor */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Clinical Session Notes
                  </CardTitle>
                  <CardDescription>
                    Document symptoms, dosage, patient observations, and Ayurvedic parameters.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                      Target Patient / Session Reference
                    </label>
                    <select
                      value={notesSessionId}
                      onChange={(e) => setNotesSessionId(e.target.value)}
                      className="w-full text-sm border rounded-md p-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select a patient session to associate notes...</option>
                      {todaySessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.patient} - {s.therapy} ({s.time})
                        </option>
                      ))}
                      {patients.map((p) => (
                        p.latestSessionId ? (
                          <option key={`p-${p.id}`} value={p.latestSessionId}>
                            {p.name} - {p.therapy} (Latest Course Record)
                          </option>
                        ) : null
                      ))}
                    </select>
                  </div>

                  <Textarea
                    placeholder="Enter detailed clinical notes, e.g.: Patient showed good sweating after Sarvangasveda. Vamana vega observed with clear pitta-kapha expulsion. Advised Samsarjana Krama diet with Peya and Vilepi for 3 days."
                    value={standaloneNotes}
                    onChange={(e) => setStandaloneNotes(e.target.value)}
                    className="min-h-[220px] text-sm"
                  />
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSaveStandaloneNotes}
                      disabled={isSavingNotes}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isSavingNotes ? 'Saving...' : 'Save Notes to EHR'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* AI Summarizer Component */}
              <div className="space-y-4">
                <NotesSummarizer
                  notes={standaloneNotes || sessionNotes}
                  onSummaryGenerated={(summary) => setRecentAISummary(summary)}
                />

                {recentAISummary && (
                  <Card className="border-purple-200 bg-purple-50/50">
                    <CardContent className="pt-4 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-purple-900 text-sm">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        AI Summary ready to persist to database
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSaveAISummary}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                      >
                        Attach to EHR Record
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Recent Notes Archive */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <CardTitle className="text-xl">Clinical Notes Archive</CardTitle>
                  <CardDescription>Past clinical observations recorded across sessions</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <Input
                    placeholder="Search by patient, therapy..."
                    value={notesSearch}
                    onChange={(e) => setNotesSearch(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {filteredNotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <p className="text-sm">No notes found matching your search.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredNotes.map((note) => (
                      <div key={note.id} className="p-4 border rounded-xl bg-white hover:border-emerald-200 transition-colors shadow-2xs">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{note.patient}</h4>
                            <p className="text-xs text-emerald-800 font-medium">
                              {note.therapy} • {note.date || new Date(note.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {note.ai_summary && (
                            <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50 text-[11px]">
                              AI Summarized
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.notes}</p>
                        {note.ai_summary && (
                          <div className="mt-3 p-3 bg-purple-50/70 border border-purple-100 rounded-lg text-xs text-purple-900">
                            <span className="font-semibold block mb-1">Key Takeaways:</span>
                            {note.ai_summary}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile & KPIs Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Profile Card */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-600" />
                    Practitioner Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-2xl shadow-xs">
                      {profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'DR'}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {profile?.name ? `Dr. ${profile.name}` : (currentUser?.user_metadata?.name || 'Dr. Practitioner')}
                      </h3>
                      <p className="text-sm text-emerald-700 font-medium">
                        {profile?.specialization || 'Panchakarma Specialist'}
                      </p>
                      <Badge variant="outline" className="mt-1 border-emerald-400 text-emerald-800 text-xs">
                        Verified Practitioner
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t text-sm">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Specialization</label>
                      <p className="font-medium text-gray-900 mt-0.5">
                        {profile?.specialization || 'Panchakarma & Kayachikitsa'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Experience</label>
                      <p className="font-medium text-gray-900 mt-0.5">10+ Years Practice</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Clinic Affiliation</label>
                      <p className="font-medium text-gray-900 mt-0.5">{profile?.clinic_code || 'AYUR-KOL-01'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Contact Email</label>
                      <p className="font-medium text-gray-900 mt-0.5 truncate">{currentUser?.email || 'doctor@ayursutra.local'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Live Performance Statistics KPIs */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Performance Statistics
                  </CardTitle>
                  <CardDescription>
                    Real metrics computed from patient treatments and feedback
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                      <span className="text-xs font-semibold text-emerald-800 uppercase block">Total Patients</span>
                      <span className="text-3xl font-extrabold text-emerald-700 mt-1 block">
                        {kpis.totalPatients}
                      </span>
                      <span className="text-[11px] text-emerald-600 mt-1 block">Under direct care</span>
                    </div>

                    <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl">
                      <span className="text-xs font-semibold text-blue-800 uppercase block">Sessions Completed</span>
                      <span className="text-3xl font-extrabold text-blue-700 mt-1 block">
                        {kpis.sessionsCompleted}
                      </span>
                      <span className="text-[11px] text-blue-600 mt-1 block">Logged to database</span>
                    </div>

                    <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-xl">
                      <span className="text-xs font-semibold text-amber-800 uppercase block">Average Rating</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-3xl font-extrabold text-amber-700">{kpis.averageRating}</span>
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      </div>
                      <span className="text-[11px] text-amber-700 mt-1 block">From verified feedback</span>
                    </div>

                    <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-xl">
                      <span className="text-xs font-semibold text-purple-800 uppercase block">Success Rate</span>
                      <span className="text-3xl font-extrabold text-purple-700 mt-1 block">
                        {kpis.successRate}%
                      </span>
                      <span className="text-[11px] text-purple-700 mt-1 block">Positive outcomes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Practitioner Preferences & Settings */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Practitioner Preferences</CardTitle>
                <CardDescription>Custom settings saved directly to your profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">Email Notifications</h4>
                    <p className="text-xs text-gray-500">Receive schedule updates and clinical alerts by email</p>
                  </div>
                  <Checkbox
                    checked={preferences.email}
                    disabled={isSavingPrefs}
                    onCheckedChange={(checked) => handleUpdatePreference('email', !!checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">SMS Reminders</h4>
                    <p className="text-xs text-gray-500">Receive instant SMS alerts when an appointment starts</p>
                  </div>
                  <Checkbox
                    checked={preferences.sms}
                    disabled={isSavingPrefs}
                    onCheckedChange={(checked) => handleUpdatePreference('sms', !!checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900">Auto-Schedule Suggestions</h4>
                    <p className="text-xs text-gray-500">Allow AI smart scheduler to recommend open slots to the desk</p>
                  </div>
                  <Checkbox
                    checked={preferences.autoSchedule}
                    disabled={isSavingPrefs}
                    onCheckedChange={(checked) => handleUpdatePreference('autoSchedule', !!checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Patient History Modal */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-600" />
              Treatment History: {historyPatientName}
            </DialogTitle>
            <DialogDescription>
              Complete record of completed Panchakarma sessions and clinical responses.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {selectedPatientHistory.length === 0 ? (
              <p className="text-center py-6 text-gray-500 text-sm">No historical sessions recorded for this patient yet.</p>
            ) : (
              selectedPatientHistory.map((s, idx) => (
                <div key={idx} className="p-4 border rounded-xl bg-gray-50/70 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">{s.therapies?.name || 'Therapy Session'}</h4>
                      <p className="text-xs text-gray-500">{s.scheduled_date} at {s.scheduled_time?.slice(0, 5)} • {s.session_type}</p>
                    </div>
                    <Badge variant={s.status === 'completed' ? 'secondary' : 'outline'}>
                      {s.status}
                    </Badge>
                  </div>

                  {s.session_records?.[0]?.notes && (
                    <div className="text-xs text-gray-700 bg-white p-2.5 rounded border">
                      <span className="font-semibold text-emerald-800 block mb-0.5">Practitioner Notes:</span>
                      {s.session_records[0].notes}
                    </div>
                  )}

                  {s.patient_feedback?.[0] && (
                    <div className="flex gap-4 text-xs bg-emerald-50/80 p-2.5 rounded border border-emerald-100 text-emerald-900">
                      <div><span className="font-semibold">Rating:</span> {s.patient_feedback[0].rating}/5 ⭐</div>
                      <div><span className="font-semibold">Pain:</span> {s.patient_feedback[0].pain_level}/10</div>
                      {s.patient_feedback[0].improvements && (
                        <div><span className="font-semibold">Outcome:</span> {s.patient_feedback[0].improvements}</div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Patient Modal */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600" />
              Patient Contact Info
            </DialogTitle>
            <DialogDescription>
              Reach out directly to {contactPatient?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg border">
              <span className="text-xs text-gray-500 font-semibold block">Phone Number</span>
              <span className="font-mono text-base font-medium text-gray-900">
                {contactPatient?.phone || 'No phone number provided'}
              </span>
            </div>

            <Button
              onClick={handleSendReminderToPatient}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Preparation Protocol Reminder
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
              Realtime updates regarding appointments, sessions, and clinical alerts.
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