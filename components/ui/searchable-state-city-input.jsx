"use client"

import { useState, useEffect } from 'react'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { SearchInput } from '@/components/ui/searchable-select'
import { Label } from '@/components/ui/label'
import { 
  getStates, 
  getCitiesForState, 
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
  const [stateOptions] = useState(() => getStateOptions())
  const [cityOptions, setCityOptions] = useState([])

  // Update available cities when state changes
  useEffect(() => {
    if (selectedState) {
      const cities = getCityOptions(selectedState)
      setCityOptions(cities)
      
      // Clear city if it's not valid for the new state
      if (selectedCity && !isCityInState(selectedState, selectedCity)) {
        onCityChange('')
      }
    } else {
      setCityOptions([])
      if (selectedCity) {
        onCityChange('')
      }
    }
  }, [selectedState, selectedCity, onCityChange])

  // Auto-detect state when city is set externally
  useEffect(() => {
    if (selectedCity && !selectedState) {
      const detectedState = getStateForCity(selectedCity)
      if (detectedState) {
        onStateChange(detectedState)
      }
    }
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
              : cityOptions.length === 0 
                ? 'No cities available'
                : cityPlaceholder
          }
          searchPlaceholder="Type to search cities..."
          emptyMessage={!selectedState ? "Please select a state first" : "No cities found"}
          disabled={disabled || !selectedState || cityOptions.length === 0}
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