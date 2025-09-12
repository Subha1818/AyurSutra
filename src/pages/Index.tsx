import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Heart, 
  Leaf, 
  MapPin, 
  Star, 
  Users, 
  Calendar, 
  TrendingUp, 
  Shield,
  ArrowRight,
  CheckCircle,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram
} from 'lucide-react';
import { AIChatbot, TherapySuggestions } from '@/components/AIComponents';
import { mockResponses, locationService, aiService } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [nearbyClinicss, setNearbyClinics] = useState(mockResponses.clinics);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % mockResponses.testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Load nearby clinics based on location
  useEffect(() => {
    const loadNearbyClinics = async () => {
      try {
        const location = await locationService.getCurrentLocation();
        const clinics = await locationService.getNearbyClinicss(location.lat, location.lng);
        setNearbyClinics(clinics);
      } catch (error) {
        console.log('Using default clinics - location access denied');
      }
    };
    loadNearbyClinics();
  }, []);

  const symptoms = [
    'Chronic Pain', 'Digestive Issues', 'Stress & Anxiety', 'Sleep Problems',
    'Low Energy', 'Joint Pain', 'Skin Issues', 'Respiratory Problems'
  ];

  const healthGoals = [
    'Detoxification', 'Pain Relief', 'Stress Management', 'Better Sleep',
    'Weight Management', 'Improved Digestion', 'Mental Clarity', 'Overall Wellness'
  ];

  const handleSymptomChange = (symptom: string, checked: boolean) => {
    if (checked) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    } else {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    }
  };

  const handleGoalChange = (goal: string, checked: boolean) => {
    if (checked) {
      setSelectedGoals([...selectedGoals, goal]);
    } else {
      setSelectedGoals(selectedGoals.filter(g => g !== goal));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-orange-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Leaf className="w-8 h-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">Panchakarma</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Login
              </Button>
              <Button onClick={() => navigate('/auth')} className="bg-green-600 hover:bg-green-700">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Transform Your Health with
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-orange-500 block">
              Ancient Panchakarma Wisdom
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            Experience personalized Ayurvedic healing through our comprehensive platform connecting you with certified practitioners and AI-guided wellness journeys.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3">
              <Calendar className="w-5 h-5 mr-2" />
              Book Therapy
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="text-lg px-8 py-3">
              <Users className="w-5 h-5 mr-2" />
              Patient Login
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="text-lg px-8 py-3">
              <Shield className="w-5 h-5 mr-2" />
              Register Clinic
            </Button>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-bounce delay-1000">
          <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center">
            <Leaf className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="absolute top-32 right-10 animate-bounce delay-2000">
          <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </section>

      {/* About Panchakarma */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">The Five Sacred Therapies</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Panchakarma represents the pinnacle of Ayurvedic healing, offering five powerful detoxification and rejuvenation therapies tailored to your unique constitution.
            </p>
          </div>
          
          <div className="grid md:grid-cols-5 gap-6">
            {mockResponses.therapies.map((therapy, index) => (
              <Card key={therapy.id} className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">{therapy.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{therapy.name}</h3>
                  <p className="text-sm text-gray-600">{therapy.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Discover Panchakarma - Interactive Questionnaire */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-50 to-orange-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ✨ Discover Your Perfect Therapy
            </h2>
            <p className="text-lg text-gray-600">
              Answer a few questions to get AI-powered therapy recommendations tailored just for you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Symptoms Selection */}
            <Card>
              <CardHeader>
                <CardTitle>What symptoms are you experiencing?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {symptoms.map((symptom) => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox
                        id={symptom}
                        checked={selectedSymptoms.includes(symptom)}
                        onCheckedChange={(checked) => handleSymptomChange(symptom, checked as boolean)}
                      />
                      <label htmlFor={symptom} className="text-sm font-medium">
                        {symptom}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Goals Selection */}
            <Card>
              <CardHeader>
                <CardTitle>What are your health goals?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {healthGoals.map((goal) => (
                    <div key={goal} className="flex items-center space-x-2">
                      <Checkbox
                        id={goal}
                        checked={selectedGoals.includes(goal)}
                        onCheckedChange={(checked) => handleGoalChange(goal, checked as boolean)}
                      />
                      <label htmlFor={goal} className="text-sm font-medium">
                        {goal}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Therapy Suggestions */}
          {(selectedSymptoms.length > 0 || selectedGoals.length > 0) && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <TherapySuggestions
                symptoms={selectedSymptoms}
                goals={selectedGoals}
                onSuggestionSelect={(therapy) => {
                  console.log('Selected therapy:', therapy);
                  // Navigate to booking with pre-selected therapy
                }}
              />
            </div>
          )}

          {/* Nearby Clinics */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Nearby Certified Clinics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {nearbyClinicss.map((clinic) => (
                  <div key={clinic.id} className="p-4 border rounded-lg hover:bg-green-50 transition-colors">
                    <h4 className="font-medium">{clinic.name}</h4>
                    <p className="text-sm text-gray-600">{clinic.location}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm">{clinic.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">• {clinic.distance}</span>
                    </div>
                    <Button size="sm" className="mt-3 w-full">
                      Book Session
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Your journey to wellness in four simple steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Choose Therapy', desc: 'Select from personalized AI recommendations', icon: <Heart className="w-8 h-8" /> },
              { step: '2', title: 'Consult Expert', desc: 'Connect with certified Panchakarma practitioners', icon: <Users className="w-8 h-8" /> },
              { step: '3', title: 'Attend Sessions', desc: 'Experience healing at clinic or home', icon: <Calendar className="w-8 h-8" /> },
              { step: '4', title: 'Track Progress', desc: 'Monitor your wellness journey with AI insights', icon: <TrendingUp className="w-8 h-8" /> },
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="relative">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                    <div className="text-green-600">{item.icon}</div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                  {index < 3 && (
                    <ArrowRight className="hidden md:block absolute top-6 -right-12 w-6 h-6 text-gray-300" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Platform Features</h2>
            <p className="text-lg text-gray-600">Everything you need for your Panchakarma journey</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'AI-Powered Recommendations',
                desc: 'Get personalized therapy suggestions based on your symptoms and goals',
                icon: <Heart className="w-8 h-8 text-red-500" />,
                features: ['Smart therapy matching', 'Symptom analysis', 'Progress predictions']
              },
              {
                title: 'Comprehensive Dashboards',
                desc: 'Separate interfaces for patients, practitioners, and clinic staff',
                icon: <Users className="w-8 h-8 text-blue-500" />,
                features: ['Patient progress tracking', 'Practitioner tools', 'Clinic management']
              },
              {
                title: 'Smart Scheduling',
                desc: 'AI-optimized appointment booking with conflict detection',
                icon: <Calendar className="w-8 h-8 text-green-500" />,
                features: ['Auto-scheduling', 'Reminder system', 'Easy rescheduling']
              }
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.desc}</p>
                  <ul className="space-y-1">
                    {feature.features.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-12">What Our Patients Say</h2>
          
          <div className="relative">
            <Card className="p-8 border-none shadow-lg">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-xl text-gray-700 mb-6 italic">
                "{mockResponses.testimonials[currentTestimonial].text}"
              </blockquote>
              <cite className="font-semibold text-gray-900">
                - {mockResponses.testimonials[currentTestimonial].name}
              </cite>
            </Card>

            {/* Testimonial indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {mockResponses.testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-8 h-8 text-green-400" />
                <span className="text-xl font-bold">Panchakarma</span>
              </div>
              <p className="text-gray-400 mb-4">
                Transforming lives through authentic Ayurvedic healing and modern technology.
              </p>
              <div className="flex gap-4">
                <Facebook className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                <Twitter className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
                <Instagram className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Panchakarma</a></li>
                <li><a href="#" className="hover:text-white">Find Practitioners</a></li>
                <li><a href="#" className="hover:text-white">Book Session</a></li>
                <li><a href="#" className="hover:text-white">Health Blog</a></li>
              </ul>
            </div>

            {/* For Professionals */}
            <div>
              <h4 className="font-semibold mb-4">For Professionals</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Register Clinic</a></li>
                <li><a href="#" className="hover:text-white">Practitioner Login</a></li>
                <li><a href="#" className="hover:text-white">Certification</a></li>
                <li><a href="#" className="hover:text-white">Resources</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>hello@panchakarma.com</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Panchakarma Platform. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </div>
      </footer>

      {/* AI Chatbot Widget */}
      <AIChatbot />
    </div>
  );
}