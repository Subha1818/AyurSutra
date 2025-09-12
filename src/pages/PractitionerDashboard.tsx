import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  MessageSquare
} from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { NotesSummarizer } from '@/components/AIComponents';

export default function PractitionerDashboard() {
  const [activeTab, setActiveTab] = useState('sessions');
  const [currentSession, setCurrentSession] = useState(null);
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

  // Mock data
  const todaySessions = [
    { id: 1, time: '09:00', patient: 'Sarah Johnson', therapy: 'Vamana', status: 'scheduled' },
    { id: 2, time: '10:30', patient: 'Michael Chen', therapy: 'Basti', status: 'in-progress' },
    { id: 3, time: '14:00', patient: 'Priya Sharma', therapy: 'Nasya', status: 'scheduled' },
    { id: 4, time: '15:30', patient: 'David Wilson', therapy: 'Virechana', status: 'scheduled' },
  ];

  const patients = [
    { id: 1, name: 'Sarah Johnson', therapy: 'Vamana', sessions: 7, progress: 85 },
    { id: 2, name: 'Michael Chen', therapy: 'Basti', sessions: 5, progress: 62 },
    { id: 3, name: 'Priya Sharma', therapy: 'Nasya', sessions: 3, progress: 45 },
    { id: 4, name: 'David Wilson', therapy: 'Virechana', sessions: 8, progress: 90 },
  ];

  useEffect(() => {
    let interval;
    if (sessionTimer.isRunning) {
      interval = setInterval(() => {
        setSessionTimer(prev => ({ ...prev, time: prev.time + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionTimer.isRunning]);

  const startSession = (session) => {
    setCurrentSession(session);
    setSessionTimer({ isRunning: true, time: 0 });
    setSessionNotes('');
    setSessionChecklist({
      bloodPressure: false,
      temperature: false,
      pulseRate: false,
      preparation: false,
      therapy: false,
      postCare: false
    });
  };

  const toggleTimer = () => {
    setSessionTimer(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const completeSession = () => {
    setCurrentSession(null);
    setSessionTimer({ isRunning: false, time: 0 });
    // Trigger patient notification and feedback form
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChecklistChange = (item, checked) => {
    setSessionChecklist(prev => ({ ...prev, [item]: checked }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Practitioner Dashboard</h1>
              <Badge variant="secondary">Dr. Rajesh Sharma</Badge>
            </div>
            <div className="flex items-center gap-4">
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sessions">My Sessions</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            {/* Active Session */}
            {currentSession && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Active Session: {currentSession.patient}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-mono">{formatTime(sessionTimer.time)}</span>
                      <Button
                        onClick={toggleTimer}
                        variant={sessionTimer.isRunning ? "destructive" : "default"}
                        size="sm"
                      >
                        {sessionTimer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Session Checklist */}
                    <div>
                      <h4 className="font-medium mb-4">Session Checklist</h4>
                      <div className="space-y-3">
                        {[
                          { key: 'bloodPressure', label: 'Blood Pressure Check', icon: <Heart className="w-4 h-4" /> },
                          { key: 'temperature', label: 'Temperature Check', icon: <Thermometer className="w-4 h-4" /> },
                          { key: 'pulseRate', label: 'Pulse Rate Check', icon: <Activity className="w-4 h-4" /> },
                          { key: 'preparation', label: 'Patient Preparation', icon: <User className="w-4 h-4" /> },
                          { key: 'therapy', label: 'Therapy Administration', icon: <Stethoscope className="w-4 h-4" /> },
                          { key: 'postCare', label: 'Post-therapy Care', icon: <ClipboardList className="w-4 h-4" /> },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center space-x-3">
                            <Checkbox
                              id={item.key}
                              checked={sessionChecklist[item.key]}
                              onCheckedChange={(checked) => handleChecklistChange(item.key, checked)}
                            />
                            <label htmlFor={item.key} className="flex items-center gap-2 text-sm font-medium">
                              {item.icon}
                              {item.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Session Notes */}
                    <div>
                      <h4 className="font-medium mb-4">Session Notes</h4>
                      <Textarea
                        placeholder="Enter session observations, patient responses, etc..."
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        className="min-h-[200px]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Button onClick={completeSession} className="flex-1">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Session
                    </Button>
                    <Button variant="outline">
                      <Phone className="w-4 h-4 mr-2" />
                      Contact Patient
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Today's Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todaySessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="font-medium">{session.time}</div>
                          <Badge variant={
                            session.status === 'completed' ? 'default' :
                            session.status === 'in-progress' ? 'destructive' : 'secondary'
                          }>
                            {session.status}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="font-medium">{session.patient}</h4>
                          <p className="text-sm text-gray-600">{session.therapy} Therapy</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {session.status === 'scheduled' && (
                          <Button onClick={() => startSession(session)} size="sm">
                            Start Session
                          </Button>
                        )}
                        {session.status === 'in-progress' && (
                          <Badge variant="destructive">In Progress</Badge>
                        )}
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  My Patients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {patients.map((patient) => (
                    <Card key={patient.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-medium">{patient.name}</h4>
                            <p className="text-sm text-gray-600">{patient.therapy} Therapy</p>
                          </div>
                          <Badge variant="secondary">{patient.sessions} sessions</Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{patient.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${patient.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline" className="flex-1">
                            View History
                          </Button>
                          <Button size="sm" className="flex-1">
                            Add Notes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Notes Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Session Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter detailed session notes..."
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    className="min-h-[300px] mb-4"
                  />
                  <Button className="w-full">Save Notes</Button>
                </CardContent>
              </Card>

              {/* AI Notes Summarizer */}
              <NotesSummarizer
                notes={sessionNotes}
                onSummaryGenerated={(summary) => console.log('Generated summary:', summary)}
              />
            </div>

            {/* Recent Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { patient: 'Sarah Johnson', date: 'Dec 12', therapy: 'Vamana', excerpt: 'Patient responded well to therapy...' },
                    { patient: 'Michael Chen', date: 'Dec 11', therapy: 'Basti', excerpt: 'Slight discomfort initially, improved...' },
                    { patient: 'Priya Sharma', date: 'Dec 10', therapy: 'Nasya', excerpt: 'Excellent tolerance, no side effects...' },
                  ].map((note, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{note.patient}</h4>
                          <p className="text-sm text-gray-600">{note.therapy} • {note.date}</p>
                        </div>
                        <Button size="sm" variant="outline">Edit</Button>
                      </div>
                      <p className="text-sm text-gray-700">{note.excerpt}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Profile Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Dr. Rajesh Sharma</h3>
                      <p className="text-sm text-gray-600">Panchakarma Specialist</p>
                      <Badge variant="default" className="mt-1">Verified</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Specialization</label>
                      <p className="text-sm">Panchakarma Therapy, Ayurvedic Medicine</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Experience</label>
                      <p className="text-sm">15+ years</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Certification</label>
                      <p className="text-sm">BAMS, MD (Panchakarma)</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Languages</label>
                      <p className="text-sm">English, Hindi, Sanskrit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Performance Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Patients</span>
                      <span className="text-2xl font-bold text-green-600">247</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Sessions Completed</span>
                      <span className="text-2xl font-bold text-blue-600">1,456</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Rating</span>
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold text-yellow-600">4.9</span>
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Success Rate</span>
                      <span className="text-2xl font-bold text-purple-600">94%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Receive email updates about appointments</p>
                    </div>
                    <Checkbox defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">SMS Reminders</h4>
                      <p className="text-sm text-gray-600">Get SMS reminders for upcoming sessions</p>
                    </div>
                    <Checkbox defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto-Schedule</h4>
                      <p className="text-sm text-gray-600">Allow AI to suggest optimal scheduling</p>
                    </div>
                    <Checkbox />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}