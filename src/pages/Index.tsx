import React, { useState, useEffect, useRef } from 'react';
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
  Instagram,
  Menu,
  X,
  CalendarCheck
} from 'lucide-react';
import { AIChatbot, TherapySuggestions } from '@/components/AIComponents';
import { mockResponses, locationService, aiService, authService } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string; dashboardPath: string } | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [nearbyClinicss, setNearbyClinics] = useState(mockResponses.clinics);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Slideshow state
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroImages = [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1600&q=80",
    "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=1600&q=80",
    "https://images.unsplash.com/photo-1591343395082-e120087004b4?w=1600&q=80"
  ];

  // Scroll and Navbar State
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Stats count state
  const [counts, setCounts] = useState({ patients: 0, rating: 0, sessions: 0, years: 0 });

  // Intersection Observer State
  const [therapiesVisible, setTherapiesVisible] = useState(false);

  const therapiesRef = useRef<HTMLDivElement>(null);

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

  // Check if user is already signed in
  useEffect(() => {
    async function loadActiveUser() {
      try {
        const res = await authService.getCurrentUser();
        if (res?.user) {
          const role = res.profile?.role || res.user.user_metadata?.role || 'patient';
          const name = res.profile?.name || res.user.user_metadata?.name || 'User';
          let dashboardPath = '/patient-dashboard';
          if (role === 'practitioner') dashboardPath = '/practitioner-dashboard';
          else if (role === 'receptionist') dashboardPath = '/receptionist-dashboard';
          setCurrentUser({ name, role, dashboardPath });
        } else {
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      }
    }
    loadActiveUser();
  }, []);

  // Slideshow interval (5 seconds)
  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % 3), 5000);
    return () => clearInterval(timer);
  }, []);

  // Scroll listener for parallax blur/fade and floating navbar pill
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for stats count-up trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTherapiesVisible(true);
        }
      },
      { threshold: 0.08 }
    );
    if (therapiesRef.current) observer.observe(therapiesRef.current);
    return () => observer.disconnect();
  }, []);

  // Stats count-up animation
  useEffect(() => {
    if (!therapiesVisible) return;
    const targets = { patients: 10000, rating: 49, sessions: 5000, years: 25 };
    const duration = 1500;
    const steps = 60;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setCounts({
        patients: Math.round(targets.patients * progress),
        rating: Math.round(targets.rating * progress),
        sessions: Math.round(targets.sessions * progress),
        years: Math.round(targets.years * progress),
      });
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [therapiesVisible]);

  // Compute blur: 0px at scrollY=0, up to 12px at scrollY=400
  const blurAmount = Math.min((scrollY / 400) * 12, 12);
  // Compute fade: opacity 1 at scrollY=0, down to 0.3 at scrollY=400
  const imageOpacity = Math.max(1 - (scrollY / 400) * 0.7, 0.3);

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
      {/* Floating Pill Design Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-300 ${isScrolled ? 'pt-3' : 'pt-5'}`}>
        <div className={`flex items-center justify-between w-full max-w-5xl gap-6 px-6 py-3 rounded-full transition-all duration-500 ease-in-out ${
          isScrolled
            ? 'bg-green-700/90 backdrop-blur-md border border-green-600/50 shadow-lg shadow-green-900/20'
            : 'bg-white/90 backdrop-blur-md border border-white/70 shadow-sm'
        }`}>
          {/* Logo */}
          <div className="flex items-center gap-2 mr-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Leaf className={`w-5 h-5 animate-pulse transition-colors duration-500 ${isScrolled ? 'text-green-200' : 'text-green-500'}`} />
            <span
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
              className={`font-bold text-xl tracking-wide transition-colors duration-500 ${isScrolled ? 'text-white' : 'text-gray-900'}`}
            >
              AyurSutra
            </span>
          </div>

          {/* Desktop Nav links */}
          <div className="hidden md:flex items-center gap-1">
            <a href="#about" className={`text-sm font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${
              isScrolled ? 'text-green-100 hover:text-white hover:bg-green-600/60' : 'text-gray-600 hover:text-gray-900 hover:bg-green-50'
            }`}>About</a>
            <a href="#services" className={`text-sm font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${
              isScrolled ? 'text-green-100 hover:text-white hover:bg-green-600/60' : 'text-gray-600 hover:text-gray-900 hover:bg-green-50'
            }`}>Services</a>
            <a href="#clinics" className={`text-sm font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${
              isScrolled ? 'text-green-100 hover:text-white hover:bg-green-600/60' : 'text-gray-600 hover:text-gray-900 hover:bg-green-50'
            }`}>Find Clinic</a>
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                onClick={() => navigate(currentUser.dashboardPath)}
                className={`text-sm rounded-full px-5 py-2 font-semibold transition-all duration-200 shadow-sm flex items-center gap-1.5 ${
                  isScrolled
                    ? 'bg-amber-500 hover:bg-amber-400 text-white hover:shadow-amber-200/50 hover:shadow-md'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                Dashboard ({currentUser.name.split(' ')[0]}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {!currentUser && (
              <>
            <button onClick={() => navigate('/auth')} className={`hidden md:inline-flex text-sm font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${
              isScrolled ? 'text-green-200 hover:text-white hover:bg-green-600/50' : 'text-gray-600 hover:text-gray-900 hover:bg-green-50'
            }`}>
              Login
            </button>
            <button onClick={() => navigate('/auth')} className={`text-sm rounded-full px-5 py-2 font-semibold transition-all duration-200 shadow-sm flex items-center gap-1 ${
              isScrolled
                ? 'bg-amber-500 hover:bg-amber-400 text-white hover:shadow-amber-200/50 hover:shadow-md'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}>
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </button>
              </>
            )}
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden p-1.5 rounded-full transition-all ${isScrolled ? 'text-white hover:bg-white/20' : 'text-gray-700 hover:bg-green-50'}`}
              aria-label="Toggle mobile menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <div className={`fixed top-20 left-4 right-4 rounded-2xl shadow-xl p-5 flex flex-col gap-3 z-50 md:hidden animate-in fade-in slide-in-from-top-4 duration-300 ${
            isScrolled
              ? 'bg-green-700/95 backdrop-blur-md border border-green-600/50'
              : 'bg-white/95 backdrop-blur-md border border-white/70'
          }`}>
            <a
              href="#about"
              onClick={() => setIsMenuOpen(false)}
              className={`text-base font-medium px-4 py-2.5 rounded-xl transition-all ${
                isScrolled ? 'text-green-100 hover:text-white hover:bg-green-600/60' : 'text-gray-700 hover:text-gray-900 hover:bg-green-50'
              }`}
            >
              About
            </a>
            <a
              href="#services"
              onClick={() => setIsMenuOpen(false)}
              className={`text-base font-medium px-4 py-2.5 rounded-xl transition-all ${
                isScrolled ? 'text-green-100 hover:text-white hover:bg-green-600/60' : 'text-gray-700 hover:text-gray-900 hover:bg-green-50'
              }`}
            >
              Services
            </a>
            <a
              href="#clinics"
              onClick={() => setIsMenuOpen(false)}
              className={`text-base font-medium px-4 py-2.5 rounded-xl transition-all ${
                isScrolled ? 'text-green-100 hover:text-white hover:bg-green-600/60' : 'text-gray-700 hover:text-gray-900 hover:bg-green-50'
              }`}
            >
              Find Clinic
            </a>
            <hr className={isScrolled ? 'border-green-600/50 my-1' : 'border-green-100 my-1'} />
            {currentUser ? (
              <button
                onClick={() => { navigate(currentUser.dashboardPath); setIsMenuOpen(false); }}
                className={`w-full text-center text-base py-3 rounded-xl font-semibold transition-colors shadow-sm ${
                  isScrolled ? 'bg-amber-500 hover:bg-amber-400 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                Go to My Dashboard ({currentUser.name.split(' ')[0]})
              </button>
            ) : (
              <>
            <button
              onClick={() => { navigate('/auth'); setIsMenuOpen(false); }}
              className={`w-full text-left text-base font-medium px-4 py-2.5 rounded-xl transition-all ${
                isScrolled ? 'text-green-200 hover:text-white hover:bg-green-600/50' : 'text-gray-700 hover:text-gray-900 hover:bg-green-50'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { navigate('/auth'); setIsMenuOpen(false); }}
              className={`w-full text-center text-base py-3 rounded-xl font-semibold transition-colors shadow-sm ${
                isScrolled ? 'bg-amber-500 hover:bg-amber-400 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              Get Started
            </button>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Hero: sticky, stays in place while user scrolls */}
      <section className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        {/* Slideshow background layer */}
        <div 
          className="absolute inset-0 w-full h-full z-0 transition-all duration-300 ease-out"
          style={{
            filter: `blur(${blurAmount}px)`,
            opacity: imageOpacity,
            transform: `scale(${1 + scrollY / 2000})`
          }}
        >
          {heroImages.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Ayurveda Therapy Slideshow ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          {/* Green photo tint overlay */}
          <div className="absolute inset-0 bg-emerald-950/45 z-10" />
          {/* Soft vignette gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/5 to-black/35 z-10" />
        </div>

        {/* Bottom gradient fade — makes dot indicators crisp, gives a natural ground */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/40 to-transparent z-10 pointer-events-none" />

        {/* Hero content */}
        <div className="relative z-20 text-center px-8 py-12 max-w-3xl mx-auto">
          <h1
            className="text-4xl md:text-6xl font-bold text-white text-center leading-tight mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.55), 0 1px 6px rgba(0,0,0,0.35)' }}
          >
            Transform Your Health with{' '}
            <br />
            <span className="text-green-300">Ancient Panchakarma </span>
            <span className="text-amber-300">Wisdom</span>
          </h1>
          <p
            className="text-lg md:text-xl text-white/90 text-center max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300"
            style={{ textShadow: '0 1px 10px rgba(0,0,0,0.45)' }}
          >
            Experience personalized Ayurvedic healing through our comprehensive platform connecting you with certified practitioners and AI-guided wellness journeys.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-lg px-8 py-6 rounded-full hover:scale-105 active:scale-95 transition-all"
              onClick={() => navigate(currentUser ? currentUser.dashboardPath : '/auth')}
            >
              <Calendar className="w-5 h-5 mr-2" />
              {currentUser ? 'My Dashboard' : 'Book Therapy'}
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate(currentUser ? currentUser.dashboardPath : '/auth')} className="text-lg px-8 py-6 rounded-full bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white hover:scale-105 active:scale-95 transition-all">
              <Users className="w-5 h-5 mr-2" />
              Patient Login
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="text-lg px-8 py-6 rounded-full bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white hover:scale-105 active:scale-95 transition-all">
              <Shield className="w-5 h-5 mr-2" />
              Register Clinic
            </Button>
          </div>
        </div>

        {/* Carousel slide indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 items-center z-20">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`transition-all duration-300 ${
                index === currentSlide ? 'w-3 h-3 bg-white rounded-full shadow-md shadow-black/30' : 'w-2 h-2 bg-white/50 rounded-full hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Sliding panel: normal document flow, scrolls over the sticky hero */}
      <div className="relative z-10 bg-gradient-to-b from-white to-green-50 rounded-t-3xl shadow-[0_-12px_60px_rgba(0,0,0,0.15)] -mt-16">
        <div className="pt-6">
          <div className="w-10 h-1 bg-green-300 rounded-full mx-auto" />
        </div>

      {/* About Panchakarma Section */}
      <section
        id="about"
        ref={therapiesRef}
        className="pt-8 pb-16 px-6"
      >

        {/* Stats Infographic Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16 px-4">
          {/* Card 1: Patients */}
          <div className="bg-white border border-green-100 rounded-2xl p-5 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <Users className="w-7 h-7 text-green-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-700">
              {counts.patients >= 10000 ? '10,000+' : counts.patients.toLocaleString() + '+'}
            </div>
            <div className="text-xs text-gray-500 mt-1 leading-snug">Patients Treated</div>
          </div>

          {/* Card 2: Rating */}
          <div className="bg-white border border-green-100 rounded-2xl p-5 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <Star className="w-7 h-7 text-green-500 mx-auto mb-2 fill-current" />
            <div className="text-3xl font-bold text-green-700">
              {counts.rating >= 49 ? '4.9/5' : (counts.rating / 10).toFixed(1) + '/5'}
            </div>
            <div className="text-xs text-gray-500 mt-1 leading-snug">Average Rating</div>
          </div>

          {/* Card 3: Sessions */}
          <div className="bg-white border border-green-100 rounded-2xl p-5 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <CalendarCheck className="w-7 h-7 text-green-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-700">
              {counts.sessions >= 5000 ? '5,000+' : counts.sessions.toLocaleString() + '+'}
            </div>
            <div className="text-xs text-gray-500 mt-1 leading-snug">Sessions Completed</div>
          </div>

          {/* Card 4: Years of Wisdom */}
          <div className="bg-white border border-green-100 rounded-2xl p-5 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <Leaf className="w-7 h-7 text-green-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-700">
              {counts.years >= 25 ? '25+' : counts.years + '+'}
            </div>
            <div className="text-xs text-gray-500 mt-1 leading-snug">Years of Wisdom</div>
          </div>
        </div>

        {/* Content Details */}
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
      <section id="services" className="py-16 px-4 bg-gradient-to-r from-green-50 to-orange-50">
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
          <Card id="clinics" className="mt-8">
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
                    <Button size="sm" className="mt-3 w-full animate-pulse hover:animate-none">
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
              <Card key={index} className="hover:shadow-xl hover:-translate-y-2 hover:border-green-200 transition-all duration-300 transform">
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

      {/* Close sliding panel div */}
      </div>

      {/* AI Chatbot Widget */}
      <AIChatbot />
    </div>
  );
}
