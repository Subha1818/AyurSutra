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
  Leaf
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
    if (!formData.phone) {
      setErrors({ phone: 'Phone number is required for OTP' });
      return;
    }

    setIsLoading(true);
    try {
      await authService.sendOTP(formData.phone);
      setOtpSent(true);
    } catch (error) {
      setErrors({ otp: 'Failed to send OTP. Please try again.' });
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
          // Redirect based on role
          switch (selectedRole) {
            case 'patient':
              navigate('/patient-dashboard');
              break;
            case 'practitioner':
              navigate('/practitioner-dashboard');
              break;
            case 'receptionist':
              navigate('/receptionist-dashboard');
              break;
          }
        }
      } else {
        // Registration
        if (otpSent && formData.otp) {
          await authService.verifyOTP(formData.phone, formData.otp);
        }
        
        const result = await authService.register({
          ...formData,
          role: selectedRole
        });
        
        if (result.success) {
          // Show success message and switch to login
          setAuthMode('login');
          setFormData({ ...formData, password: '', confirmPassword: '', otp: '' });
        }
      }
    } catch (error) {
      setErrors({ general: 'Authentication failed. Please try again.' });
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">Panchakarma</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {authMode === 'login' ? 'Welcome Back' : 'Join Our Platform'}
          </h1>
          <p className="text-gray-600">
            {authMode === 'login' ? 'Sign in to your account' : 'Create your account to get started'}
          </p>
        </div>

        {/* Auth Mode Toggle */}
        <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'login' | 'register')} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
        </Tabs>

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
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedRole === role
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      selectedRole === role ? 'bg-green-100' : 'bg-gray-100'
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
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              {/* Phone (Register only) */}
              {authMode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={sendOTP}
                      disabled={isLoading || !formData.phone}
                    >
                      {otpSent ? 'Resend' : 'Send OTP'}
                    </Button>
                  </div>
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>
              )}

              {/* OTP (Register only, after OTP sent) */}
              {authMode === 'register' && otpSent && (
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP Verification</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    value={formData.otp}
                    onChange={(e) => handleInputChange('otp', e.target.value)}
                    className={errors.otp ? 'border-red-500' : ''}
                  />
                  {errors.otp && <p className="text-sm text-red-500">{errors.otp}</p>}
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    OTP sent to {formData.phone}
                  </p>
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
  );
}