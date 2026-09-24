import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Stethoscope,
  UserCheck,
  Mail,
  Phone,
  Lock,
  Upload,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Leaf,
  Shield,
  Users
} from 'lucide-react';
import { authService } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<'patient' | 'practitioner' | 'receptionist'>('patient');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: '',
    specialization: '',
    clinicCode: '',
    idDocument: null as File | null,
  });

  const specializations = [
    'Panchakarma Specialist',
    'Ayurvedic Physician',
    'Massage Therapist',
    'Herbal Medicine Expert',
    'Yoga Therapist',
    'Nutrition Counselor'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    if (authMode === 'register') {
      if (!formData.name) newErrors.name = 'Name is required';
      if (!formData.phone) newErrors.phone = 'Phone is required';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (selectedRole === 'practitioner' && !formData.specialization) {
        newErrors.specialization = 'Specialization is required';
      }
      if (selectedRole === 'receptionist' && !formData.clinicCode) {
        newErrors.clinicCode = 'Clinic code is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, idDocument: file }));
    }
  };

  const sendOTP = async () => {
    if (!formData.email) {
      setErrors({ email: 'Email address is required for OTP' });
      return;
    }

    setIsLoading(true);
    try {
      await authService.sendOTP(formData.email);
      setOtpSent(true);
      setErrors(prev => ({ ...prev, email: '', otp: '' }));
    } catch (error: any) {
      setErrors({ otp: error?.message || 'Failed to send OTP to email. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (authMode === 'login') {
        const result = await authService.login({
          email: formData.email,
          password: formData.password,
          role: selectedRole
        });

        if (result.success) {
          // Route based on authentic user role from Supabase DB
          const effectiveRole = result.user?.role || selectedRole;
          switch (effectiveRole) {
            case 'patient':
              navigate('/patient-dashboard');
              break;
            case 'practitioner':
              navigate('/practitioner-dashboard');
              break;
            case 'receptionist':
              navigate('/receptionist-dashboard');
              break;
            default:
              navigate('/patient-dashboard');
              break;
          }
        }
      } else {
        // Registration
        if (otpSent && formData.otp) {
          await authService.verifyOTP(formData.email, formData.otp);
        }

        const result = await authService.register({
          ...formData,
          role: selectedRole
        });

        if (result.success) {
          // Show success message and switch to login
          setAuthMode('login');
          setFormData({ ...formData, password: '', confirmPassword: '', otp: '' });
          setOtpSent(false);
        }
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Authentication failed. Please try again.';
      setErrors({ general: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const roleIcons = {
    patient: <User className="w-5 h-5" />,
    practitioner: <Stethoscope className="w-5 h-5" />,
    receptionist: <UserCheck className="w-5 h-5" />
  };

  const roleDescriptions = {
    patient: 'Book sessions, track progress, and manage your wellness journey',
    practitioner: 'Manage patients, conduct sessions, and track treatment outcomes',
    receptionist: 'Handle scheduling, patient registration, and clinic operations'
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT: Brand panel — hidden below lg */}
      <div
        className="hidden lg:flex lg:w-[45%] relative flex-col items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #14532d 0%, #166534 35%, #15803d 65%, #065f46 100%)' }}
      >
        {/* Subtle background texture */}
        <img
          src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=900&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center opacity-15 mix-blend-luminosity"
        />

        {/* Decorative blobs */}
        <div className="absolute top-[-100px] right-[-100px] w-96 h-96 rounded-full bg-green-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-80px] left-[-80px] w-80 h-80 rounded-full bg-emerald-300/10 blur-3xl pointer-events-none" />

        {/* Main content */}
        <div className="relative z-10 text-center px-12 max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-10">
            <Leaf className="w-8 h-8 text-green-300" />
            <span
              className="text-3xl font-bold text-white"
              style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.05em' }}
            >
              AyurSutra
            </span>
          </div>

          <h2
            className="text-4xl font-bold text-white leading-snug mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Begin Your Healing Journey
          </h2>

          <p className="text-green-200 text-sm leading-relaxed mb-10">
            Connect with certified Panchakarma practitioners and experience the transformative power of ancient Ayurvedic wisdom.
          </p>

          {/* Trust points */}
          {[
            { icon: Shield, text: 'Verified Certified Practitioners' },
            { icon: Users, text: '10,000+ Patients Treated' },
            { icon: Leaf, text: 'Ancient Wisdom, Modern Care' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-green-300" />
              </div>
              <span className="text-green-100 text-sm text-left">{text}</span>
            </div>
          ))}

          <div className="mt-10 flex items-center gap-3">
            <div className="flex-1 h-px bg-green-700/60" />
            <span className="text-green-500 text-xs tracking-widest uppercase">Panchakarma</span>
            <div className="flex-1 h-px bg-green-700/60" />
          </div>
        </div>
      </div>

      {/* RIGHT: Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12 min-h-screen overflow-y-auto">

        {/* Back to Home */}
        <div className="w-full max-w-md mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-green-700 hover:text-green-800 hover:bg-green-50 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Mobile-only logo */}
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <Leaf className="w-5 h-5 text-green-600" />
          <span
            className="text-xl font-bold text-green-800"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            AyurSutra
          </span>
        </div>

        {/* Form container — no Card wrapper, sits on white bg */}
        <div className="w-full max-w-md">

          {/* Auth Mode Toggle */}
          <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'login' | 'register')} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {authMode === 'login' ? 'Welcome Back' : 'Join Our Platform'}
            </h1>
            <p className="text-gray-500 text-sm">
              {authMode === 'login' ? 'Sign in to your account' : 'Create your account to get started'}
            </p>
          </div>

          {/* Role Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Select Your Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {(['patient', 'practitioner', 'receptionist'] as const).map((role) => (
                  <div
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedRole === role
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${selectedRole === role ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                        {roleIcons[role]}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium capitalize">{role}</h3>
                        <p className="text-sm text-gray-600">{roleDescriptions[role]}</p>
                      </div>
                      {selectedRole === role && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Form */}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* General Error */}
                {errors.general && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-red-700">{errors.general}</span>
                  </div>
                )}

                {/* Name (Register only) */}
                {authMode === 'register' && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  {authMode === 'register' ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={sendOTP}
                        disabled={isLoading || !formData.email}
                      >
                        {otpSent ? 'Resend' : 'Send OTP'}
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>
                  )}
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                {/* Email OTP (Register only, after OTP sent) */}
                {authMode === 'register' && otpSent && (
                  <div className="space-y-2">
                    <Label htmlFor="otp">Email OTP Verification</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP from email"
                      maxLength={6}
                      value={formData.otp}
                      onChange={(e) => handleInputChange('otp', e.target.value)}
                      className={errors.otp ? 'border-red-500' : ''}
                    />
                    {errors.otp && <p className="text-sm text-red-500">{errors.otp}</p>}
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      OTP sent to {formData.email}
                    </p>
                  </div>
                )}

                {/* Phone (Register only) */}
                {authMode === 'register' && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                  </div>
                )}

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className={`pl-10 ${errors.password ? 'border-red-500' : ''}`}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                    />
                  </div>
                  {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                </div>

                {/* Confirm Password (Register only) */}
                {authMode === 'register' && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        className={`pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                  </div>
                )}

                {/* Practitioner-specific fields */}
                {authMode === 'register' && selectedRole === 'practitioner' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Select value={formData.specialization} onValueChange={(value) => handleInputChange('specialization', value)}>
                        <SelectTrigger className={errors.specialization ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select your specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          {specializations.map((spec) => (
                            <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.specialization && <p className="text-sm text-red-500">{errors.specialization}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="idDocument">ID/Degree Document</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          id="idDocument"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <label htmlFor="idDocument" className="cursor-pointer">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            {formData.idDocument ? formData.idDocument.name : 'Upload ID or Degree Certificate'}
                          </p>
                          <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 5MB)</p>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* Receptionist-specific fields */}
                {authMode === 'register' && selectedRole === 'receptionist' && (
                  <div className="space-y-2">
                    <Label htmlFor="clinicCode">Clinic Code</Label>
                    <Input
                      id="clinicCode"
                      type="text"
                      placeholder="Enter clinic registration code"
                      value={formData.clinicCode}
                      onChange={(e) => handleInputChange('clinicCode', e.target.value)}
                      className={errors.clinicCode ? 'border-red-500' : ''}
                    />
                    {errors.clinicCode && <p className="text-sm text-red-500">{errors.clinicCode}</p>}
                    <p className="text-xs text-gray-500">
                      Contact your clinic administrator for the registration code
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
                </Button>
              </form>

              {/* Additional Links */}
              <div className="mt-6 text-center text-sm">
                {authMode === 'login' ? (
                  <p className="text-gray-600">
                    Don't have an account?{' '}
                    <button
                      onClick={() => setAuthMode('register')}
                      className="text-green-600 hover:text-green-700 font-medium"
                    >
                      Sign up here
                    </button>
                  </p>
                ) : (
                  <p className="text-gray-600">
                    Already have an account?{' '}
                    <button
                      onClick={() => setAuthMode('login')}
                      className="text-green-600 hover:text-green-700 font-medium"
                    >
                      Sign in here
                    </button>
                  </p>
                )}
              </div>

              {/* Role-specific notes */}
              {authMode === 'register' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    {selectedRole === 'practitioner' && 'Your account will be verified by our team before activation.'}
                    {selectedRole === 'receptionist' && 'Please ensure you have the correct clinic code from your administrator.'}
                    {selectedRole === 'patient' && 'You can start booking sessions immediately after registration.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}