'use client'

import { useState, useEffect } from 'react'

interface ClientData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  siteAddress: string
  region: string
  postcode?: string
}

interface ClientDetailsFormProps {
  data: ClientData
  onChange: (data: ClientData) => void
  readOnly?: boolean
  title?: string
  onSave?: () => void
  onCancel?: () => void
}

const REGIONS = [
  'Auckland',
  'Wellington',
  'Christchurch',
  'Tauranga',
  'Hamilton',
  'Dunedin'
]

export const ClientDetailsForm = ({
  data,
  onChange,
  readOnly = false,
  title = 'Client Details',
  onSave,
  onCancel
}: ClientDetailsFormProps) => {
  const [formData, setFormData] = useState<ClientData>(data)
  const [errors, setErrors] = useState<Partial<Record<keyof ClientData, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof ClientData, boolean>>>({})

  useEffect(() => {
    setFormData(data)
  }, [data])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateField = (name: keyof ClientData, value: any): string | undefined => {
    if (name === 'firstName' && !value) {
      return 'First name is required'
    }
    if (name === 'lastName' && !value) {
      return 'Last name is required'
    }
    if (name === 'email') {
      if (!value) return 'Email is required'
      if (!validateEmail(value)) return 'Please enter a valid email address'
    }
    if (name === 'siteAddress' && !value) {
      return 'Site address is required'
    }
    if (name === 'region' && !value) {
      return 'Region is required'
    }
    return undefined
  }

  const handleChange = (field: keyof ClientData, value: string) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onChange(newData)

    if (touched[field]) {
      const error = validateField(field, value)
      setErrors(prev => ({
        ...prev,
        [field]: error
      }))
    }
  }

  const handleBlur = (field: keyof ClientData) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, formData[field])
    setErrors(prev => ({
      ...prev,
      [field]: error
    }))
  }

  const validateAll = (): boolean => {
    const newErrors: Partial<Record<keyof ClientData, string>> = {}
    let isValid = true

    ;(Object.keys(formData) as Array<keyof ClientData>).forEach(key => {
      const error = validateField(key, formData[key])
      if (error) {
        newErrors[key] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      siteAddress: true,
      region: true
    })

    return isValid
  }

  const handleSave = () => {
    if (validateAll() && onSave) {
      onSave()
    }
  }

  return (
    <div className="card">
      {title && (
        <div className="card-header">
          <h2 className="card-title">{title}</h2>
        </div>
      )}

      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="form-label form-label-required">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              onBlur={() => handleBlur('firstName')}
              disabled={readOnly}
              className={`form-input ${errors.firstName && touched.firstName ? 'error' : ''}`}
              placeholder="Enter first name"
            />
            {errors.firstName && touched.firstName && (
              <span className="form-error">{errors.firstName}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label form-label-required">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              onBlur={() => handleBlur('lastName')}
              disabled={readOnly}
              className={`form-input ${errors.lastName && touched.lastName ? 'error' : ''}`}
              placeholder="Enter last name"
            />
            {errors.lastName && touched.lastName && (
              <span className="form-error">{errors.lastName}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="form-label form-label-required">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              disabled={readOnly}
              className={`form-input ${errors.email && touched.email ? 'error' : ''}`}
              placeholder="example@email.com"
            />
            {errors.email && touched.email && (
              <span className="form-error">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={readOnly}
              className="form-input"
              placeholder="021 123 4567"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Company
          </label>
          <input
            type="text"
            value={formData.company || ''}
            onChange={(e) => handleChange('company', e.target.value)}
            disabled={readOnly}
            className="form-input"
            placeholder="Company name (optional)"
          />
        </div>

        <div className="form-group">
          <label className="form-label form-label-required">
            Site Address
          </label>
          <input
            type="text"
            value={formData.siteAddress}
            onChange={(e) => handleChange('siteAddress', e.target.value)}
            onBlur={() => handleBlur('siteAddress')}
            disabled={readOnly}
            className={`form-input ${errors.siteAddress && touched.siteAddress ? 'error' : ''}`}
            placeholder="Enter site address"
          />
          {errors.siteAddress && touched.siteAddress && (
            <span className="form-error">{errors.siteAddress}</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="form-label form-label-required">
              Region
            </label>
            <select
              value={formData.region}
              onChange={(e) => handleChange('region', e.target.value)}
              onBlur={() => handleBlur('region')}
              disabled={readOnly}
              className={`form-select ${errors.region && touched.region ? 'error' : ''}`}
            >
              <option value="">Select a region</option>
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
            {errors.region && touched.region && (
              <span className="form-error">{errors.region}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Postcode
            </label>
            <input
              type="text"
              value={formData.postcode || ''}
              onChange={(e) => handleChange('postcode', e.target.value)}
              disabled={readOnly}
              className="form-input"
              placeholder="1010"
            />
          </div>
        </div>

        {!readOnly && (onSave || onCancel) && (
          <div className="flex gap-3 mt-6 pt-6 border-t" style={{borderColor: 'var(--color-neutral-200)'}}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
            )}
            {onSave && (
              <button
                type="button"
                onClick={handleSave}
                className="btn-primary"
              >
                Save
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}