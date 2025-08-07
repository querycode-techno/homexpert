"use client"

import { useState, useEffect } from 'react'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { SearchInput } from '@/components/ui/searchable-select'
import { Label } from '@/components/ui/label'
import { 
  getStateOptions,
  getCityOptions,
  searchCities,
  isCityInState,
  getStateForCity
} from '@/lib/utils/stateCityUtils'

/**
 * SearchableStateCityInput Component
 * Enhanced state-city selector with search functionality for better UX
 */
export function SearchableStateCityInput({
  selectedState = '',
  selectedCity = '',
  onStateChange,
  onCityChange,
  disabled = false,
  showLabels = true,
  stateLabel = 'State',
  cityLabel = 'City',
  statePlaceholder = 'Search and select state...',
  cityPlaceholder = 'Search and select city...',
  required = false,
  className = '',
  layout = 'horizontal' // 'horizontal' | 'vertical'
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

  const containerClass = layout === 'vertical' 
    ? 'space-y-4' 
    : 'grid grid-cols-1 md:grid-cols-2 gap-4'

  return (
    <div className={`${containerClass} ${className}`}>
      {/* State Selector */}
      <div className="space-y-2">
        {showLabels && (
          <Label className="text-sm font-medium">
            {stateLabel} {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <SearchableSelect
          options={stateOptions}
          value={selectedState}
          onValueChange={onStateChange}
          placeholder={statePlaceholder}
          searchPlaceholder="Type to search states..."
          emptyMessage="No states found"
          disabled={disabled}
          showSearch={true}
        />
      </div>

      {/* City Selector */}
      <div className="space-y-2">
        {showLabels && (
          <Label className="text-sm font-medium">
            {cityLabel} {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <SearchableSelect
          options={cityOptions}
          value={selectedCity}
          onValueChange={onCityChange}
          placeholder={
            !selectedState 
              ? 'Select state first' 
              : loading
                ? 'Loading cities...'
                : cityOptions.length === 0 
                  ? 'No cities available'
                  : cityPlaceholder
          }
          searchPlaceholder="Type to search cities..."
          emptyMessage={!selectedState ? "Please select a state first" : "No cities found"}
          disabled={disabled || !selectedState || loading || cityOptions.length === 0}
          showSearch={true}
        />
      </div>
    </div>
  )
}

/**
 * Simple search input for free-text city/state entry (legacy support)
 */
export function CityStateSearchInput({
  cityValue = '',
  stateValue = '',
  onCityChange,
  onStateChange,
  disabled = false,
  showLabels = true,
  cityLabel = 'City',
  stateLabel = 'State',
  cityPlaceholder = 'Type city name...',
  statePlaceholder = 'Type state name...',
  required = false,
  className = '',
  layout = 'horizontal'
}) {
  const containerClass = layout === 'vertical' 
    ? 'space-y-4' 
    : 'grid grid-cols-1 md:grid-cols-2 gap-4'

  return (
    <div className={`${containerClass} ${className}`}>
      {/* State Input */}
      <div className="space-y-2">
        {showLabels && (
          <Label className="text-sm font-medium">
            {stateLabel} {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <SearchInput
          value={stateValue}
          onChange={onStateChange}
          placeholder={statePlaceholder}
          disabled={disabled}
        />
      </div>

      {/* City Input */}
      <div className="space-y-2">
        {showLabels && (
          <Label className="text-sm font-medium">
            {cityLabel} {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <SearchInput
          value={cityValue}
          onChange={onCityChange}
          placeholder={cityPlaceholder}
          disabled={disabled}
        />
      </div>
    </div>
  )
}