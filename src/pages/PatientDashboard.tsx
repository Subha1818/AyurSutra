import React, { useState, useEffect } from 'react';
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
  MessageSquare,
  Home,
  Building2,
  Heart,
  Activity,
  Target,
  User,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AIChatbot, TherapySuggestions } from '@/components/AIComponents';
import { mockResponses, bookingService, progressService, notificationService } from '@/lib/api';

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);
  const [progressData, setProgressData] = useState(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [selectedTherapy, setSelectedTherapy] = useState('');
  const [bookingType, setBookingType] = useState<'clinic' | 'home'>('clinic');
  const [feedbackData, setFeedbackData] = useState({
    painLevel: 5,
    sideEffects: '',
    improvements: '',
    rating: 5
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [notifs, progress] = await Promise.all([
        notificationService.getNotifications('patient-1'),
        progressService.getProgressData('patient-1')
      ]);
      setNotifications(notifs);
      setProgressData(progress);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleBooking = async () => {
    const bookingData = {
      clinicId: selectedClinic?.id,
      therapy: selectedTherapy,
      type: bookingType,
      date: new Date().toISOString().split('T')[0],
      time: '10:00'
    };

    try {
      const result = await bookingService.bookSession(bookingData);
      if (result.success) {
        setBookingStep(1);
        setSelectedClinic(null);
        setSelectedTherapy('');
        // Show success message
      }
    } catch (error) {
      console.error('Booking error:', error);
    }
  };

  const submitFeedback = async () => {
    try {
      await progressService.submitFeedback('session-1', feedbackData);
      // Show success message
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  const chartData = progressData ? progressData.dates.map((date, index) => ({
    week: date,
    pain: progressData.painLevels[index],
    energy: progressData.energyLevels[index],
    sessions: progressData.sessionCompletion[index]
  })) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
              <Badge variant="secondary">Welcome back, Sarah!</Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1">
                    {notifications.length}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="booking">Book Session</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="sessions">My Sessions</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-full">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Next Session</p>
                      <p className="text-lg font-semibold">Tomorrow, 10:00 AM</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Progress Score</p>
                      <p className="text-lg font-semibold">85%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Heart className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Wellness Score</p>
                      <p className="text-lg font-semibold">Good</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Recent Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Bell className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notification.message}</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Therapy Suggestions */}
            <TherapySuggestions
              symptoms={['pain', 'stress']}
              goals={['wellness', 'energy']}
              onSuggestionSelect={(therapy) => {
                setSelectedTherapy(therapy.name);
                setActiveTab('booking');
              }}
            />
          </TabsContent>

          {/* Booking Tab */}
          <TabsContent value="booking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Book Your Next Session</CardTitle>
              </CardHeader>
              <CardContent>
                {bookingStep === 1 && (
                  <div className="space-y-6">
                    {/* Booking Type Selection */}
                    <div>
                      <h3 className="font-medium mb-4">Choose Session Type</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div
                          onClick={() => setBookingType('clinic')}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            bookingType === 'clinic' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className="w-6 h-6 text-green-600" />
                            <div>
                              <h4 className="font-medium">Clinic Visit</h4>
                              <p className="text-sm text-gray-600">Visit our certified clinic</p>
                            </div>
                          </div>
                        </div>
                        <div
                          onClick={() => setBookingType('home')}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            bookingType === 'home' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Home className="w-6 h-6 text-green-600" />
                            <div>
                              <h4 className="font-medium">Home Service</h4>
                              <p className="text-sm text-gray-600">Practitioner visits you</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Therapy Selection */}
                    <div>
                      <h3 className="font-medium mb-4">Select Therapy</h3>
                      <Select value={selectedTherapy} onValueChange={setSelectedTherapy}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose your therapy" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockResponses.therapies.map((therapy) => (
                            <SelectItem key={therapy.id} value={therapy.name}>
                              {therapy.icon} {therapy.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location/Clinic Selection */}
                    {bookingType === 'clinic' && (
                      <div>
                        <h3 className="font-medium mb-4">Choose Clinic</h3>
                        <div className="space-y-3">
                          {mockResponses.clinics.map((clinic) => (
                            <div
                              key={clinic.id}
                              onClick={() => setSelectedClinic(clinic)}
                              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                selectedClinic?.id === clinic.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{clinic.name}</h4>
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {clinic.location} • {clinic.distance}
                                  </p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                    <span className="text-sm">{clinic.rating}</span>
                                  </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => setBookingStep(2)}
                      disabled={!selectedTherapy || (bookingType === 'clinic' && !selectedClinic)}
                      className="w-full"
                    >
                      Continue to Date & Time
                    </Button>
                  </div>
                )}

                {bookingStep === 2 && (
                  <div className="space-y-6">
                    <h3 className="font-medium">Select Date & Time</h3>
                    {/* Date/Time picker would go here */}
                    <div className="grid grid-cols-4 gap-2">
                      {['09:00', '10:30', '14:00', '15:30'].map((time) => (
                        <Button key={time} variant="outline" size="sm">
                          {time}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setBookingStep(1)}>
                        Back
                      </Button>
                      <Button onClick={handleBooking} className="flex-1">
                        Confirm Booking
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Progress Charts */}
              <Card>
                <CardHeader>
                  <CardTitle>Health Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="pain" stroke="#ef4444" name="Pain Level" />
                        <Line type="monotone" dataKey="energy" stroke="#22c55e" name="Energy Level" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Session Completion */}
              <Card>
                <CardHeader>
                  <CardTitle>Session Completion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Vamana Therapy</span>
                      <span>7/10 sessions</span>
                    </div>
                    <Progress value={70} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Virechana Therapy</span>
                      <span>5/8 sessions</span>
                    </div>
                    <Progress value={62.5} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Basti Therapy</span>
                      <span>3/6 sessions</span>
                    </div>
                    <Progress value={50} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Goals Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Your Wellness Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { goal: 'Reduce Pain', current: 3, target: 1, unit: '/10' },
                    { goal: 'Increase Energy', current: 8, target: 9, unit: '/10' },
                    { goal: 'Better Sleep', current: 7, target: 8, unit: 'hrs' }
                  ].map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">{item.goal}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-green-600">{item.current}</span>
                        <span className="text-sm text-gray-500">/ {item.target}{item.unit}</span>
                      </div>
                      <Progress value={(item.current / item.target) * 100} className="h-2 mt-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { date: 'Tomorrow', time: '10:00 AM', therapy: 'Vamana', practitioner: 'Dr. Sharma', type: 'clinic' },
                    { date: 'Dec 15', time: '2:00 PM', therapy: 'Basti', practitioner: 'Dr. Patel', type: 'home' }
                  ].map((session, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{session.therapy} Therapy</h4>
                          <p className="text-sm text-gray-600">with {session.practitioner}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {session.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {session.time}
                            </span>
                            <Badge variant={session.type === 'home' ? 'secondary' : 'default'}>
                              {session.type === 'home' ? 'Home Service' : 'Clinic Visit'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Reschedule
                          </Button>
                          <Button size="sm">
                            <Phone className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Past Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: 'Dec 10', therapy: 'Nasya', rating: 5, status: 'completed' },
                    { date: 'Dec 8', therapy: 'Virechana', rating: 4, status: 'completed' },
                    { date: 'Dec 5', therapy: 'Vamana', rating: 5, status: 'completed' }
                  ].map((session, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{session.therapy}</span>
                        <span className="text-sm text-gray-500 ml-2">{session.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < session.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <Badge variant="secondary">Completed</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pain Level */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Current Pain Level (1-10)
                  </label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="range"
                      min="1"
                      max="10"
                      value={feedbackData.painLevel}
                      onChange={(e) => setFeedbackData(prev => ({ ...prev, painLevel: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="font-medium text-lg">{feedbackData.painLevel}</span>
                  </div>
                </div>

                {/* Side Effects */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Any Side Effects?
                  </label>
                  <Textarea
                    placeholder="Describe any side effects you experienced..."
                    value={feedbackData.sideEffects}
                    onChange={(e) => setFeedbackData(prev => ({ ...prev, sideEffects: e.target.value }))}
                  />
                </div>

                {/* Improvements */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Improvements Noticed
                  </label>
                  <Textarea
                    placeholder="What improvements have you noticed?"
                    value={feedbackData.improvements}
                    onChange={(e) => setFeedbackData(prev => ({ ...prev, improvements: e.target.value }))}
                  />
                </div>

                {/* Overall Rating */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Rate Your Session
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Star
                        key={rating}
                        className={`w-8 h-8 cursor-pointer ${
                          rating <= feedbackData.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                        onClick={() => setFeedbackData(prev => ({ ...prev, rating }))}
                      />
                    ))}
                  </div>
                </div>

                <Button onClick={submitFeedback} className="w-full">
                  Submit Feedback
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Chatbot */}
      <AIChatbot />
    </div>
  );
}