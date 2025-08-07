"use client"

import { useState, useEffect } from 'react'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  isCityInState,
  getStateForCity,
  getStateOptions,
  getCityOptions
} from '@/lib/utils/stateCityUtils'

/**
 * StateCitySelector Component
 * A reusable component for selecting state and city with proper validation
 */
export function StateCitySelector({
  selectedState = '',
  selectedCity = '',
  onStateChange,
  onCityChange,
  disabled = false,
  showLabels = true,
  stateLabel = 'State',
  cityLabel = 'City',
  statePlaceholder = 'Select a state',
  cityPlaceholder = 'Select a city',
  required = false,
  className = '',
  enableSearch = true
}) {
  const [stateOptions, setStateOptions] = useState([])
  const [cityOptions, setCityOptions] = useState([])
  const [loading, setLoading] = useState(false)

  // Load state options on component mount
  useEffect(() => {
    const loadStateOptions = async () => {
      try {
        const options = await getStateOptions()
        setStateOptions(options)
      } catch (error) {
        console.error('Error loading state options:', error)
        setStateOptions([])
      }
    }
    loadStateOptions()
  }, [])

  // Update available cities when state changes
  useEffect(() => {
    const loadCityOptions = async () => {
      if (selectedState) {
        setLoading(true)
        try {
          const options = await getCityOptions(selectedState)
          setCityOptions(options)
          
          // Clear city if it's not valid for the new state
          if (selectedCity) {
            const isValid = await isCityInState(selectedState, selectedCity)
            if (!isValid) {
              onCityChange('')
            }
          }
        } catch (error) {
          console.error('Error loading city options:', error)
          setCityOptions([])
        } finally {
          setLoading(false)
        }
      } else {
        setCityOptions([])
        if (selectedCity) {
          onCityChange('')
        }
      }
    }
    loadCityOptions()
  }, [selectedState, selectedCity, onCityChange])

  // Auto-detect state when city is set externally
  useEffect(() => {
    const detectState = async () => {
      if (selectedCity && !selectedState) {
        try {
          const detectedState = await getStateForCity(selectedCity)
          if (detectedState) {
            onStateChange(detectedState)
          }
        } catch (error) {
          console.error('Error detecting state for city:', error)
        }
      }
    }
    detectState()
  }, [selectedCity, selectedState, onStateChange])

  const handleStateChange = (newState) => {
    onStateChange(newState)
  }

  const handleCityChange = (newCity) => {
    onCityChange(newCity)
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {/* State Selector */}
      <div className="space-y-2">
        {showLabels && (
          <label className="text-sm font-medium">
            {stateLabel} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        {enableSearch ? (
          <SearchableSelect
            options={stateOptions}
            value={selectedState}
            onValueChange={handleStateChange}
            placeholder={statePlaceholder}
            searchPlaceholder="Search states..."
            emptyMessage="No states found"
            disabled={disabled}
            showSearch={true}
          />
        ) : (
          <Select 
            value={selectedState} 
            onValueChange={handleStateChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={statePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {stateOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* City Selector */}
      <div className="space-y-2">
        {showLabels && (
          <label className="text-sm font-medium">
            {cityLabel} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        {enableSearch ? (
          <SearchableSelect
            options={cityOptions}
            value={selectedCity}
            onValueChange={handleCityChange}
            placeholder={
              !selectedState 
                ? 'Select state first' 
                : loading
                  ? 'Loading cities...'
                  : cityOptions.length === 0 
                    ? 'No cities available'
                    : cityPlaceholder
            }
            searchPlaceholder="Search cities..."
            emptyMessage={!selectedState ? "Please select a state first" : "No cities found"}
            disabled={disabled || !selectedState || loading || cityOptions.length === 0}
            showSearch={true}
          />
        ) : (
          <Select 
            value={selectedCity} 
            onValueChange={handleCityChange}
            disabled={disabled || !selectedState || loading || cityOptions.length === 0}
          >
            <SelectTrigger>
              <SelectValue 
                placeholder={
                  !selectedState 
                    ? 'Select state first' 
                    : loading
                      ? 'Loading cities...'
                      : cityOptions.length === 0 
                        ? 'No cities available'
                        : cityPlaceholder
                } 
              />
            </SelectTrigger>
            <SelectContent>
              {cityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}

/**
 * FormField compatible version for react-hook-form
 */
export function StateCitySelectorFormField({
  stateField,
  cityField,
  disabled = false,
  showLabels = true,
  stateLabel = 'State',
  cityLabel = 'City',
  statePlaceholder = 'Select a state',
  cityPlaceholder = 'Select a city',
  required = false,
  className = '',
  enableSearch = true
}) {
  return (
    <StateCitySelector
      selectedState={stateField.value}
      selectedCity={cityField.value}
      onStateChange={stateField.onChange}
      onCityChange={cityField.onChange}
      disabled={disabled}
      showLabels={showLabels}
      stateLabel={stateLabel}
      cityLabel={cityLabel}
      statePlaceholder={statePlaceholder}
      cityPlaceholder={cityPlaceholder}
      required={required}
      className={className}
      enableSearch={enableSearch}
    />
  )
}