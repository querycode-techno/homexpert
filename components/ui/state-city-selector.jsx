"use client"

import { useState, useEffect } from 'react'
import { 
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { 
  getStates, 
  getCitiesForState, 
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
                : cityOptions.length === 0 
                  ? 'No cities available'
                  : cityPlaceholder
            }
            searchPlaceholder="Search cities..."
            emptyMessage={!selectedState ? "Please select a state first" : "No cities found"}
            disabled={disabled || !selectedState || cityOptions.length === 0}
            showSearch={cityOptions.length > 10} // Only show search for cities if there are many options
          />
        ) : (
          <Select 
            value={selectedCity} 
            onValueChange={handleCityChange}
            disabled={disabled || !selectedState || cityOptions.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !selectedState 
                  ? 'Select state first' 
                  : cityOptions.length === 0 
                    ? 'No cities available'
                    : cityPlaceholder
              } />
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