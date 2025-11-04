import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/Button'
import { validators } from '../../utils/validators'

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'Account' | 'Personal' | 'Address'>('Account')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Tab field groupings are implicit in the UI; no constants needed

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Required fields
    const firstNameError = validators.required(formData.firstName)
    if (firstNameError) newErrors.firstName = firstNameError

    const lastNameError = validators.required(formData.lastName)
    if (lastNameError) newErrors.lastName = lastNameError

    const emailError = validators.email(formData.email)
    if (emailError) newErrors.email = emailError

    const passwordError = validators.password(formData.password)
    if (passwordError) newErrors.password = passwordError

    const confirmPasswordError = validators.confirmPassword(formData.confirmPassword, formData.password)
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError

    // Optional fields
    if (formData.phone) {
      const phoneError = validators.phone(formData.phone)
      if (phoneError) newErrors.phone = phoneError
    }

    if (formData.zipCode) {
      const zipCodeError = validators.zipCode(formData.zipCode)
      if (zipCodeError) newErrors.zipCode = zipCodeError
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateTab = (tab: 'Account' | 'Personal' | 'Address') => {
    const newErrors: Record<string, string> = {}

    if (tab === 'Personal') {
      const firstNameError = validators.required(formData.firstName)
      if (firstNameError) newErrors.firstName = firstNameError

      const lastNameError = validators.required(formData.lastName)
      if (lastNameError) newErrors.lastName = lastNameError
    }

    if (tab === 'Account') {
      const emailError = validators.email(formData.email)
      if (emailError) newErrors.email = emailError

      const passwordError = validators.password(formData.password)
      if (passwordError) newErrors.password = passwordError

      const confirmPasswordError = validators.confirmPassword(formData.confirmPassword, formData.password)
      if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError
    }

    if (tab === 'Address') {
      if (formData.phone) {
        const phoneError = validators.phone(formData.phone)
        if (phoneError) newErrors.phone = phoneError
      }

      if (formData.zipCode) {
        const zipCodeError = validators.zipCode(formData.zipCode)
        if (zipCodeError) newErrors.zipCode = zipCodeError
      }
    }

    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setIsLoading(true)
      
      const firstName = formData.firstName.trim()
      const lastName = formData.lastName.trim()
      const email = formData.email.trim().toLowerCase()
      const phone = formData.phone.trim()
      const street = formData.street.trim()
      const city = formData.city.trim()
      const state = formData.state.trim()
      const zipCode = formData.zipCode.trim()

      const hasAddress = Boolean(street || city || state || zipCode)

      const registrationData = {
        firstName,
        lastName,
        email,
        password: formData.password,
        phone: phone || undefined,
        address: hasAddress ? {
          ...(street ? { street } : {}),
          ...(city ? { city } : {}),
          ...(state ? { state } : {}),
          ...(zipCode ? { zipCode } : {}),
        } : undefined,
      }

      await register(registrationData)
      navigate('/resident/dashboard')
    } catch (error) {
      const anyErr = error as { errors?: Record<string, string[]> }
      // Map server-side validation errors to form fields
      if (anyErr && anyErr.errors && typeof anyErr.errors === 'object') {
        const serverErrors = anyErr.errors as Record<string, string[]>
        const mapped: Record<string, string> = {}
        Object.keys(serverErrors).forEach((key) => {
          const msg = serverErrors[key]?.[0]
          switch (key) {
            case 'firstName':
              mapped.firstName = msg
              break
            case 'lastName':
              mapped.lastName = msg
              break
            case 'email':
              mapped.email = msg
              break
            case 'password':
              mapped.password = msg
              break
            case 'address.street':
              mapped.street = msg
              break
            case 'address.city':
              mapped.city = msg
              break
            case 'address.state':
              mapped.state = msg
              break
            case 'address.zipCode':
              mapped.zipCode = msg
              break
            default:
              break
          }
        })
        if (Object.keys(mapped).length > 0) setErrors(mapped)
      }
      // Toast is handled in AuthContext
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <div className="mb-2">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create Account
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Join WasteWise today
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <nav className="flex border-b border-gray-200 dark:border-gray-700" role="tablist" aria-label="Registration tabs">
          {(['Account','Personal','Address'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`tab-${tab.toLowerCase()}`}
              className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 focus:outline-none transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        {activeTab === 'Account' && (
          <div id="tab-account" role="tabpanel" aria-labelledby="Account" className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pr-10 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-300"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3.94 4.94a1.5 1.5 0 0 1 2.12 0l9 9a1.5 1.5 0 0 1-2.12 2.12l-1.43-1.43A8.53 8.53 0 0 1 10 15.5C5.5 15.5 2.27 12.5 1 10c.54-1.06 1.5-2.42 2.94-3.56l-.99-.99a1.5 1.5 0 0 1 0-2.12zm6.93 6.93-2.74-2.74a2.5 2.5 0 0 0 2.74 2.74zM10 4.5c4.5 0 7.73 3 9 5.5-.38.75-1.02 1.72-1.93 2.62l-2.04-2.04a4.5 4.5 0 0 0-5.61-5.61L7.38 3.57C8.2 3.5 9.08 4.5 10 4.5z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pr-10 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3.94 4.94a1.5 1.5 0 0 1 2.12 0l9 9a1.5 1.5 0 0 1-2.12 2.12l-1.43-1.43A8.53 8.53 0 0 1 10 15.5C5.5 15.5 2.27 12.5 1 10c.54-1.06 1.5-2.42 2.94-3.56l-.99-.99a1.5 1.5 0 0 1 0-2.12zm6.93 6.93-2.74-2.74a2.5 2.5 0 0 0 2.74 2.74zM10 4.5c4.5 0 7.73 3 9 5.5-.38.75-1.02 1.72-1.93 2.62l-2.04-2.04a4.5 4.5 0 0 0-5.61-5.61L7.38 3.57C8.2 3.5 9.08 4.5 10 4.5z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="primary" onClick={() => {
                if (validateTab('Account')) setActiveTab('Personal')
              }}>
                Next
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'Personal' && (
          <div id="tab-personal" role="tabpanel" aria-labelledby="Personal" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="First name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Start with country code ie. +254"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="secondary" onClick={() => setActiveTab('Account')}>Back</Button>
              <Button type="button" variant="primary" onClick={() => {
                if (validateTab('Personal')) setActiveTab('Address')
              }}>Next</Button>
            </div>
          </div>
        )}

        {activeTab === 'Address' && (
          <div id="tab-address" role="tabpanel" aria-labelledby="Address" className="space-y-4">
            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Street Address
              </label>
              <input
                type="text"
                id="street"
                name="street"
                value={formData.street}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="City"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="State"
                />
              </div>
            </div>

            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ZIP Code
              </label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.zipCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ZIP code"
              />
              {errors.zipCode && (
                <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
              )}
            </div>

            <div className="flex justify-between items-center">
              <Button type="button" variant="secondary" onClick={() => setActiveTab('Personal')}>Back</Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isLoading}
                className="w-auto"
                onClick={(e: React.MouseEvent) => {
                  // Ensure full validation on submit click before form submit proceeds
                  const valid = validateForm()
                  if (!valid) {
                    e.preventDefault()
                  }
                }}
              >
                Create Account
              </Button>
            </div>
          </div>
        )}
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Already have an account?{' '}
          <Link
            to="/auth/login"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
