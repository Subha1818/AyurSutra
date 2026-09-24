import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar,
  MapPin,
  Bell,
  TrendingUp,
  Star,
  Clock,
  Phone,
  Home,
  Building2,
  Heart,
  Target,
  Settings,
  LogOut,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw
} from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AIChatbot, TherapySuggestions } from '@/components/AIComponents';
import { 
  clinicService, 
  bookingService, 
  progressService, 
  notificationService, 
  sessionService, 
  authService,
  locationService,
  Therapy,
  Clinic
} from '@/lib/api';
import { toast } from 'sonner';

export default function PatientDashboard() {
  const navigate = useNavigate();

  // Authentication & Profile State
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Overview Tab State
  const [nextSession, setNextSession] = useState<any>(null);
  const [progressScore, setProgressScore] = useState<number>(0);
  const [wellnessLabel, setWellnessLabel] = useState<string>('Good');
  const [completedSessionsCount, setCompletedSessionsCount] = useState<number>(0);
  const [totalSessionsCount, setTotalSessionsCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Booking Tab State
  const [bookingStep, setBookingStep] = useState(1);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [therapies, setTherapies] = useState<Therapy[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [selectedTherapy, setSelectedTherapy] = useState<string>('');
  const [bookingType, setBookingType] = useState<'clinic' | 'home'>('clinic');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isBooking, setIsBooking] = useState<boolean>(false);

  // Progress Tab State
  const [progressData, setProgressData] = useState<any>(null);
  const [sessionCompletion, setSessionCompletion] = useState<any[]>([]);
  const [wellnessGoals, setWellnessGoals] = useState<any[]>([]);

  // My Sessions Tab State
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [completedSessions, setCompletedSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);

  // Reschedule State
  const [reschedulingSession, setReschedulingSession] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [rescheduleTime, setRescheduleTime] = useState<string>('');
  const [isLoadingRescheduleSlots, setIsLoadingRescheduleSlots] = useState<boolean>(false);
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);

  // Feedback Tab State
  const [selectedFeedbackSessionId, setSelectedFeedbackSessionId] = useState<string>('');
  const [feedbackData, setFeedbackData] = useState({
    painLevel: 5,
    sideEffects: '',
    improvements: '',
    rating: 5
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);

  // Initial Load
  useEffect(() => {
    initDashboard();
  }, []);

  const initDashboard = async () => {
    setIsLoadingUser(true);
    try {
      const userRes = await authService.getCurrentUser();
      if (!userRes?.user) {
        toast.error('Session expired. Please log in.');
        navigate('/auth');
        return;
      }

      const userData = {
        id: userRes.user.id,
        name: userRes.profile?.name || userRes.user.user_metadata?.name || userRes.user.email?.split('@')[0] || 'Patient',
        email: userRes.user.email || '',
      };
      setCurrentUser(userData);

      // Load Clinics & Therapies catalog
      loadCatalog();

      // Load patient dashboard live records
      await loadUserData(userData.id);
    } catch (error) {
      console.error('Error initializing patient dashboard:', error);
      toast.error('Failed to load dashboard data.');
    } finally {
      setIsLoadingUser(false);
    }
  };

  const loadCatalog = async () => {
    try {
      let userLat: number | undefined;
      let userLng: number | undefined;
      try {
        const pos = await locationService.getCurrentLocation();
        userLat = pos.lat;
        userLng = pos.lng;
      } catch {
        // Geolocation denied or not available; fallback to default list
      }

      const [loadedClinics, loadedTherapies] = await Promise.all([
        clinicService.getClinics(userLat, userLng),
        clinicService.getTherapies(),
      ]);

      setClinics(loadedClinics);
      setTherapies(loadedTherapies);
    } catch (err) {
      console.error('Error loading catalog:', err);
    }
  };

  const loadUserData = async (userId: string) => {
    setIsLoadingSessions(true);
    try {
      const [
        nextSess,
        scores,
        notifs,
        upcoming,
        completed,
        progress,
        completion,
        goals
      ] = await Promise.all([
        sessionService.getNextSession(userId),
        sessionService.getScores(userId),
        notificationService.getNotifications(userId),
        sessionService.getUpcomingSessions(userId),
        sessionService.getCompletedSessions(userId),
        progressService.getProgressData(userId),
        progressService.getSessionCompletion(userId),
        progressService.getWellnessGoals(userId),
      ]);

      setNextSession(nextSess);
      setProgressScore(scores.progressScore);
      setWellnessLabel(scores.wellnessLabel);
      setCompletedSessionsCount(scores.completedCount);
      setTotalSessionsCount(scores.totalCount);
      setNotifications(notifs);
      setUpcomingSessions(upcoming);
      setCompletedSessions(completed);
      setProgressData(progress);
      setSessionCompletion(completion);
      setWellnessGoals(goals);

      // Auto-select first completed session for feedback if not selected yet
      if (completed.length > 0 && !selectedFeedbackSessionId) {
        const withoutFeedback = completed.find(c => !c.hasFeedback);
        setSelectedFeedbackSessionId(withoutFeedback ? withoutFeedback.id : completed[0].id);
      }
    } catch (error) {
      console.error('Error loading user dashboard data:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Fetch slots whenever booking date or clinic changes
  useEffect(() => {
    if (selectedDate) {
      fetchBookingSlots(selectedClinic?.id, selectedDate);
    }
  }, [selectedDate, selectedClinic]);

  const fetchBookingSlots = async (clinicId?: number | null, date?: string) => {
    if (!date) return;
    setIsLoadingSlots(true);
    try {
      const slots = await bookingService.getAvailableSlots(clinicId, date);
      setAvailableSlots(slots);
      if (slots.length > 0 && (!selectedTime || !slots.includes(selectedTime))) {
        setSelectedTime(slots[0]);
      } else if (slots.length === 0) {
        setSelectedTime('');
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Handle Session Booking Submission
  const handleBooking = async () => {
    if (!currentUser) {
      toast.error('Please log in to book a session.');
      return;
    }
    if (!selectedTherapy) {
      toast.error('Please select a therapy.');
      return;
    }
    if (bookingType === 'clinic' && !selectedClinic) {
      toast.error('Please choose a clinic for your visit.');
      return;
    }
    if (!selectedDate) {
      toast.error('Please select a session date.');
      return;
    }
    if (!selectedTime) {
      toast.error('No available slot selected for this date.');
      return;
    }

    const therapyObj = therapies.find(t => t.name === selectedTherapy);

    setIsBooking(true);
    try {
      const result = await bookingService.bookSession({
        patientId: currentUser.id,
        clinicId: bookingType === 'clinic' ? selectedClinic?.id : undefined,
        therapyId: therapyObj?.id,
        therapy: selectedTherapy,
        type: bookingType,
        date: selectedDate,
        time: selectedTime,
      });

      if (result.success) {
        toast.success(`Booking confirmed for ${selectedTherapy}!`);
        setBookingStep(1);
        setSelectedClinic(null);
        setSelectedTherapy('');
        await loadUserData(currentUser.id);
        setActiveTab('sessions');
      }
    } catch (error: any) {
      console.error('Booking failed:', error);
      toast.error(error.message || 'Booking failed. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  // Open Reschedule Modal / Panel
  const openReschedule = async (session: any) => {
    setReschedulingSession(session);
    setRescheduleDate(session.date);
    setIsLoadingRescheduleSlots(true);
    try {
      const slots = await bookingService.getAvailableSlots(session.clinic_id, session.date);
      setRescheduleSlots(slots);
      setRescheduleTime(slots[0] || '');
    } catch (err) {
      console.error('Error loading reschedule slots:', err);
    } finally {
      setIsLoadingRescheduleSlots(false);
    }
  };

  // Handle Reschedule Date Change
  const handleRescheduleDateChange = async (newDate: string) => {
    setRescheduleDate(newDate);
    if (!newDate || !reschedulingSession) return;
    setIsLoadingRescheduleSlots(true);
    try {
      const slots = await bookingService.getAvailableSlots(reschedulingSession.clinic_id, newDate);
      setRescheduleSlots(slots);
      if (slots.length > 0) {
        setRescheduleTime(slots[0]);
      } else {
        setRescheduleTime('');
      }
    } catch (err) {
      console.error('Error loading reschedule slots:', err);
    } finally {
      setIsLoadingRescheduleSlots(false);
    }
  };

  // Confirm Reschedule
  const handleConfirmReschedule = async () => {
    if (!reschedulingSession || !rescheduleDate || !rescheduleTime) {
      toast.error('Please select both a date and time.');
      return;
    }

    setIsRescheduling(true);
    try {
      await bookingService.rescheduleSession(reschedulingSession.id, rescheduleDate, rescheduleTime);
      toast.success('Session rescheduled successfully!');
      setReschedulingSession(null);
      if (currentUser) {
        await loadUserData(currentUser.id);
      }
    } catch (err: any) {
      console.error('Reschedule failed:', err);
      toast.error(err.message || 'Failed to reschedule session.');
    } finally {
      setIsRescheduling(false);
    }
  };

  // Handle Feedback Session Selection
  const handleSelectFeedbackSession = (sessionId: string) => {
    setSelectedFeedbackSessionId(sessionId);
    const chosen = completedSessions.find(s => s.id === sessionId);
    if (chosen?.feedback) {
      setFeedbackData({
        painLevel: chosen.feedback.pain_level || 5,
        sideEffects: chosen.feedback.side_effects || '',
        improvements: chosen.feedback.improvements || '',
        rating: chosen.feedback.rating || 5,
      });
    } else {
      setFeedbackData({
        painLevel: 5,
        sideEffects: '',
        improvements: '',
        rating: 5,
      });
    }
  };

  // Handle Feedback Submission
  const submitFeedback = async () => {
    if (!currentUser) return;
    if (!selectedFeedbackSessionId) {
      toast.error('Please select a completed session to give feedback.');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      await progressService.submitFeedback(selectedFeedbackSessionId, currentUser.id, feedbackData);
      toast.success('Feedback recorded successfully! Thank you for sharing your experience.');
      await loadUserData(currentUser.id);
    } catch (error: any) {
      console.error('Feedback submission error:', error);
      toast.error(error.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Notification Click (Mark read)
  const handleNotificationClick = async (notif: any) => {
    if (!notif.read) {
      await notificationService.markRead(notif.id);
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
      );
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await authService.signOut();
      toast.success('Signed out successfully.');
      navigate('/auth');
    } catch {
      navigate('/auth');
    }
  };

  // Helpers
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(target);
  };

  const formatDisplayTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${mStr || '00'} ${ampm}`;
  };

  const todayIso = new Date().toISOString().split('T')[0];
  const unreadCount = notifications.filter(n => !n.read).length;

  const chartData = progressData?.dates ? progressData.dates.map((date: string, index: number) => ({
    week: date,
    pain: progressData.painLevels?.[index] ?? 5,
    energy: progressData.energyLevels?.[index] ?? 7,
    sessions: progressData.sessionCompletion?.[index] ?? index + 1,
  })) : [];

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm text-gray-600 font-medium">Loading your Ayurvedic Wellness Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50 text-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌿</span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">AyurSutra</h1>
              </div>
              <Badge variant="secondary" className="hidden sm:inline-flex bg-emerald-100 text-emerald-800 border-emerald-200">
                Welcome back, {currentUser?.name || 'Patient'}!
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative" 
                onClick={() => setActiveTab('overview')}
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => currentUser && loadUserData(currentUser.id)}
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4 text-gray-700" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                title="Sign Out"
                className="text-gray-600 hover:text-red-600"
              >
                <LogOut className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline text-xs">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white border border-gray-200 p-1 shadow-sm rounded-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="booking" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Book Session
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Progress
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              My Sessions
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Feedback
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Quick Stats: Next Session */}
              <Card className="bg-emerald-100/90 border-emerald-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-full shadow-sm">
                        <Calendar className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Next Session</p>
                        {nextSession ? (
                          <>
                            <p className="text-lg font-bold text-gray-900 mt-1">
                              {formatDisplayDate(nextSession.date)}, {formatDisplayTime(nextSession.time)}
                            </p>
                            <p className="text-xs text-emerald-900 font-medium">
                              {nextSession.therapy} • {nextSession.clinic}
                            </p>
                          </>
                        ) : (
                          <div className="mt-1">
                            <p className="text-sm font-medium text-gray-700">No upcoming sessions</p>
                            <button
                              onClick={() => setActiveTab('booking')}
                              className="text-xs text-emerald-700 underline font-semibold mt-1 block hover:text-emerald-900"
                            >
                              Book your next therapy →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats: Progress Score */}
              <Card className="bg-emerald-100/90 border-emerald-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-full shadow-sm">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Progress Score</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{progressScore}%</p>
                      <p className="text-xs text-gray-600">
                        {completedSessionsCount} of {totalSessionsCount || 0} sessions completed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats: Wellness Score */}
              <Card className="bg-emerald-100/90 border-emerald-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-full shadow-sm">
                      <Heart className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Wellness State</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{wellnessLabel}</p>
                      <p className="text-xs text-gray-600">Based on recent health feedback</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notifications Card */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                    <Bell className="w-5 h-5 text-emerald-600" />
                    Notifications & Reminders
                  </CardTitle>
                  {unreadCount > 0 && (
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
                      {unreadCount} unread
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-70" />
                    No notifications right now. You are all caught up!
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                          !notification.read
                            ? 'bg-emerald-50/80 border-emerald-200'
                            : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                        }`}
                      >
                        <div className={`p-2 rounded-full mt-0.5 ${
                          notification.type === 'alert'
                            ? 'bg-red-100 text-red-600'
                            : notification.type === 'update'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          <Bell className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {notification.message}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {notification.created_at ? new Date(notification.created_at).toLocaleString() : 'Recent'}
                          </p>
                        </div>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 mt-2" title="Unread" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Therapy Suggestions */}
            <TherapySuggestions
              symptoms={['stress', 'fatigue', 'back pain']}
              goals={['deep relaxation', 'detoxification', 'rejuvenation']}
              onSuggestionSelect={(therapy) => {
                setSelectedTherapy(therapy.name);
                setActiveTab('booking');
              }}
            />
          </TabsContent>

          {/* BOOKING TAB */}
          <TabsContent value="booking" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="border-b bg-emerald-50/50">
                <CardTitle className="text-xl text-gray-900">Book Your Ayurvedic Session</CardTitle>
                <p className="text-xs text-gray-600">Choose your therapy, provider, and preferred schedule</p>
              </CardHeader>
              <CardContent className="pt-6">
                {bookingStep === 1 && (
                  <div className="space-y-6">
                    {/* Booking Type Selection */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3 text-sm uppercase tracking-wide">
                        1. Choose Session Setting
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div
                          onClick={() => setBookingType('clinic')}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            bookingType === 'clinic'
                              ? 'border-emerald-600 bg-emerald-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
                              <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Certified Clinic Visit</h4>
                              <p className="text-xs text-gray-600">Full treatment setup with specialized equipment</p>
                            </div>
                          </div>
                        </div>

                        <div
                          onClick={() => setBookingType('home')}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            bookingType === 'home'
                              ? 'border-emerald-600 bg-emerald-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
                              <Home className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Home Visit Care</h4>
                              <p className="text-xs text-gray-600">Certified practitioner visits your residence</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Therapy Selection */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3 text-sm uppercase tracking-wide">
                        2. Select Therapy
                      </h3>
                      <Select value={selectedTherapy} onValueChange={setSelectedTherapy}>
                        <SelectTrigger className="w-full bg-white h-11 border-gray-300">
                          <SelectValue placeholder="Choose a Panchakarma therapy" />
                        </SelectTrigger>
                        <SelectContent>
                          {therapies.map((therapy) => (
                            <SelectItem key={therapy.id} value={therapy.name}>
                              <span className="font-medium mr-2">{therapy.icon}</span>
                              <span className="font-medium text-gray-900">{therapy.name}</span>
                              <span className="text-xs text-gray-500 ml-2">({therapy.dosha_target || 'Ayurvedic Treatment'})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location/Clinic Selection */}
                    {bookingType === 'clinic' && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3 text-sm uppercase tracking-wide">
                          3. Choose Clinic Location
                        </h3>
                        <div className="space-y-3">
                          {clinics.map((clinic) => (
                            <div
                              key={clinic.id}
                              onClick={() => setSelectedClinic(clinic)}
                              className={`p-4 border rounded-xl cursor-pointer transition-all ${
                                selectedClinic?.id === clinic.id
                                  ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold text-gray-900">{clinic.name}</h4>
                                  <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-1">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                    {clinic.address || clinic.location}
                                    {clinic.distance && (
                                      <span className="font-medium text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded ml-1">
                                        {clinic.distance}
                                      </span>
                                    )}
                                  </p>
                                  <div className="flex items-center gap-1 mt-1.5">
                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                                    <span className="text-xs font-semibold text-gray-700">{clinic.rating}</span>
                                    <span className="text-xs text-gray-400">• Certified Center</span>
                                  </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 mt-2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => setBookingStep(2)}
                      disabled={!selectedTherapy || (bookingType === 'clinic' && !selectedClinic)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 h-auto"
                    >
                      Continue to Date & Time Selection →
                    </Button>
                  </div>
                )}

                {bookingStep === 2 && (
                  <div className="space-y-6">
                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="text-xs font-bold uppercase text-emerald-800">Booking Summary</p>
                      <p className="text-base font-semibold text-gray-900 mt-0.5">{selectedTherapy}</p>
                      <p className="text-xs text-gray-600">
                        {bookingType === 'clinic' ? `At ${selectedClinic?.name}` : 'Home Service Visit'}
                      </p>
                    </div>

                    {/* Date Picker */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Select Appointment Date
                      </label>
                      <Input
                        type="date"
                        min={todayIso}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-white border-gray-300 max-w-sm"
                      />
                    </div>

                    {/* Available Time Slots */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-gray-900">
                          Available Time Slots
                        </label>
                        {isLoadingSlots && (
                          <span className="text-xs text-emerald-700 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
                          </span>
                        )}
                      </div>

                      {availableSlots.length === 0 && !isLoadingSlots ? (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                          No slots available for this date. Please pick another date.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                          {availableSlots.map((time) => (
                            <Button
                              key={time}
                              type="button"
                              variant={selectedTime === time ? 'default' : 'outline'}
                              onClick={() => setSelectedTime(time)}
                              className={`h-11 font-medium ${
                                selectedTime === time 
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                  : 'border-gray-300 text-gray-700 hover:bg-emerald-50'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5 mr-1.5" />
                              {formatDisplayTime(time)}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4 pt-4 border-t">
                      <Button variant="outline" onClick={() => setBookingStep(1)} className="border-gray-300">
                        ← Back
                      </Button>
                      <Button 
                        onClick={handleBooking} 
                        disabled={isBooking || !selectedTime || availableSlots.length === 0}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      >
                        {isBooking ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Confirming Booking...
                          </>
                        ) : (
                          'Confirm Appointment'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROGRESS TAB */}
          <TabsContent value="progress" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Progress Charts */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    Recovery & Energy Trends
                  </CardTitle>
                  <p className="text-xs text-gray-500">
                    Pain level (red) vs Energy level (green) tracked over sessions
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-64 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="week" stroke="#6b7280" fontSize={12} />
                        <YAxis domain={[0, 10]} stroke="#6b7280" fontSize={12} />
                        <Tooltip />
                        <Line type="monotone" dataKey="pain" stroke="#ef4444" strokeWidth={2.5} name="Pain Level" dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={2.5} name="Energy Score" dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Session Completion */}
              <Card className="bg-emerald-100/90 border-emerald-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gray-900">Session Completion by Therapy</CardTitle>
                  <p className="text-xs text-gray-600">Target sessions per Ayurvedic course</p>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  {sessionCompletion.map((item, idx) => (
                    <div key={idx} className="bg-white/80 p-3 rounded-lg border border-emerald-200">
                      <div className="flex justify-between text-sm font-medium mb-1.5 text-gray-800">
                        <span>{item.therapy}</span>
                        <span className="text-emerald-800 font-semibold">
                          {item.completed} / {item.target} sessions ({item.percentage}%)
                        </span>
                      </div>
                      <Progress value={item.percentage} className="h-2 bg-emerald-200" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Goals Tracking */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <Target className="w-5 h-5 text-emerald-600" />
                  Your Wellness Objectives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {wellnessGoals.map((item, index) => (
                    <div key={index} className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                      <h4 className="font-semibold text-gray-900 mb-1">{item.goal}</h4>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-emerald-700">{item.current}</span>
                        <span className="text-xs text-gray-500">Target: {item.target}{item.unit}</span>
                      </div>
                      <Progress 
                        value={Math.min(100, Math.round((item.current / item.target) * 100))} 
                        className="h-2 mt-3 bg-emerald-200" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MY SESSIONS TAB */}
          <TabsContent value="sessions" className="space-y-6">
            {/* Inline Reschedule Dialog/Card */}
            {reschedulingSession && (
              <Card className="border-2 border-emerald-500 bg-white shadow-md">
                <CardHeader className="pb-3 border-b bg-emerald-50/70 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base text-gray-900 font-bold">
                      Reschedule Session: {reschedulingSession.therapy}
                    </CardTitle>
                    <p className="text-xs text-gray-600">
                      Currently scheduled for {formatDisplayDate(reschedulingSession.date)} at {formatDisplayTime(reschedulingSession.time)}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setReschedulingSession(null)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">
                        Select New Date
                      </label>
                      <Input
                        type="date"
                        min={todayIso}
                        value={rescheduleDate}
                        onChange={(e) => handleRescheduleDateChange(e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">
                        Select New Slot
                      </label>
                      {isLoadingRescheduleSlots ? (
                        <p className="text-xs text-emerald-700 flex items-center gap-1 py-2">
                          <Loader2 className="w-3 h-3 animate-spin" /> Checking slots...
                        </p>
                      ) : rescheduleSlots.length === 0 ? (
                        <p className="text-xs text-amber-700 py-2">No slots on this date.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {rescheduleSlots.map((slot) => (
                            <Button
                              key={slot}
                              type="button"
                              size="sm"
                              variant={rescheduleTime === slot ? 'default' : 'outline'}
                              onClick={() => setRescheduleTime(slot)}
                              className={`h-9 ${rescheduleTime === slot ? 'bg-emerald-600 text-white' : ''}`}
                            >
                              {formatDisplayTime(slot)}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={() => setReschedulingSession(null)}>
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleConfirmReschedule} 
                      disabled={isRescheduling || !rescheduleTime}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      {isRescheduling ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                        </>
                      ) : (
                        'Confirm Reschedule'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Sessions List */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg text-gray-900">Upcoming Appointments</CardTitle>
                  <Button 
                    size="sm" 
                    onClick={() => setActiveTab('booking')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                  >
                    + Book New
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoadingSessions ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
                    <p className="text-xs text-gray-500 mt-2">Loading sessions...</p>
                  </div>
                ) : upcomingSessions.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Calendar className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="font-semibold text-gray-800 text-sm">No upcoming appointments</p>
                    <p className="text-xs text-gray-500 mt-1 mb-4">Book a Panchakarma treatment session to stay on schedule</p>
                    <Button 
                      size="sm" 
                      onClick={() => setActiveTab('booking')}
                      className="bg-emerald-600 text-white"
                    >
                      Book Session
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingSessions.map((session) => (
                      <div key={session.id} className="p-4 border rounded-xl bg-gray-50/60 hover:bg-gray-50 transition-all">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{session.therapy_icon || '🌿'}</span>
                              <h4 className="font-bold text-gray-900">{session.therapy}</h4>
                              <Badge variant={session.type === 'home' ? 'secondary' : 'default'} className="text-[11px]">
                                {session.type === 'home' ? 'Home Visit' : 'Clinic Visit'}
                              </Badge>
                              {session.status === 'rescheduled' && (
                                <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200">
                                  Rescheduled
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              Practitioner: <span className="font-semibold text-gray-800">{session.practitioner}</span> • {session.clinic}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 font-medium">
                              <span className="flex items-center gap-1 text-emerald-800">
                                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                {formatDisplayDate(session.date)}
                              </span>
                              <span className="flex items-center gap-1 text-emerald-800">
                                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                {formatDisplayTime(session.time)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => openReschedule(session)}
                              className="border-gray-300 text-xs h-9"
                            >
                              Reschedule
                            </Button>
                            {session.practitioner_phone ? (
                              <a href={`tel:${session.practitioner_phone}`} title={`Call ${session.practitioner}`}>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-9">
                                  <Phone className="w-3.5 h-3.5 mr-1" /> Call
                                </Button>
                              </a>
                            ) : (
                              <Button size="sm" variant="ghost" disabled title="Practitioner contact not available" className="h-9">
                                <Phone className="w-3.5 h-3.5 mr-1 text-gray-300" />
                                <span className="text-xs text-gray-400">No contact</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Completed Sessions */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg text-gray-900">Completed Sessions History</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {completedSessions.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-xs">
                    No completed sessions recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {completedSessions.map((session) => (
                      <div key={session.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900">{session.therapy}</span>
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                              Completed
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500 mt-0.5 block">{formatDisplayDate(session.date)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((sVal) => (
                              <Star
                                key={sVal}
                                className={`w-3.5 h-3.5 ${
                                  sVal <= session.rating ? 'text-amber-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              handleSelectFeedbackSession(session.id);
                              setActiveTab('feedback');
                            }}
                            className="text-xs text-emerald-700 hover:text-emerald-900"
                          >
                            {session.hasFeedback ? 'Edit Review' : 'Add Review'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FEEDBACK TAB */}
          <TabsContent value="feedback" className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="border-b bg-emerald-50/50">
                <CardTitle className="text-xl text-gray-900">Post-Treatment Feedback</CardTitle>
                <p className="text-xs text-gray-600">
                  Help your practitioner tailor your therapy plan by sharing your treatment outcomes
                </p>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Session Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Select Completed Session to Review
                  </label>
                  {completedSessions.length === 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                      <p className="font-semibold">No completed sessions available for feedback yet.</p>
                      <p className="text-xs mt-1">Feedback can be submitted once a treatment session is marked completed by your clinic.</p>
                    </div>
                  ) : (
                    <Select value={selectedFeedbackSessionId} onValueChange={handleSelectFeedbackSession}>
                      <SelectTrigger className="w-full bg-white border-gray-300">
                        <SelectValue placeholder="Select completed session" />
                      </SelectTrigger>
                      <SelectContent>
                        {completedSessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            {session.therapy} — {formatDisplayDate(session.date)} {session.hasFeedback ? '(Feedback Submitted)' : '(Awaiting Review)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {completedSessions.length > 0 && (
                  <>
                    {/* Pain Level */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-semibold text-gray-900">
                          Current Pain Level (1 = None, 10 = Severe)
                        </label>
                        <span className={`text-base font-bold px-2 py-0.5 rounded ${
                          feedbackData.painLevel > 6 ? 'bg-red-100 text-red-700' :
                          feedbackData.painLevel > 3 ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {feedbackData.painLevel} / 10
                        </span>
                      </div>
                      <Input
                        type="range"
                        min="1"
                        max="10"
                        value={feedbackData.painLevel}
                        onChange={(e) => setFeedbackData(prev => ({ ...prev, painLevel: parseInt(e.target.value, 10) }))}
                        className="cursor-pointer accent-emerald-600"
                      />
                    </div>

                    {/* Side Effects */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Any Side Effects or Discomfort?
                      </label>
                      <Textarea
                        placeholder="e.g. Mild dizziness, slight nausea, dry throat (or leave blank if none)"
                        value={feedbackData.sideEffects}
                        onChange={(e) => setFeedbackData(prev => ({ ...prev, sideEffects: e.target.value }))}
                        className="bg-white border-gray-300 min-h-[90px]"
                      />
                    </div>

                    {/* Improvements */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Improvements Noticed
                      </label>
                      <Textarea
                        placeholder="e.g. Better sleep quality, reduced joint stiffness, improved digestion"
                        value={feedbackData.improvements}
                        onChange={(e) => setFeedbackData(prev => ({ ...prev, improvements: e.target.value }))}
                        className="bg-white border-gray-300 min-h-[90px]"
                      />
                    </div>

                    {/* Overall Rating */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Rate Your Experience (1 - 5 Stars)
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-8 h-8 cursor-pointer transition-transform hover:scale-110 ${
                              star <= feedbackData.rating
                                ? 'text-amber-400 fill-current'
                                : 'text-gray-300'
                            }`}
                            onClick={() => setFeedbackData(prev => ({ ...prev, rating: star }))}
                          />
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={submitFeedback} 
                      disabled={isSubmittingFeedback || !selectedFeedbackSessionId}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 h-auto"
                    >
                      {isSubmittingFeedback ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting Feedback...
                        </>
                      ) : (
                        'Submit Post-Treatment Feedback'
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Chatbot Assistant */}
      <AIChatbot />
    </div>
  );
}