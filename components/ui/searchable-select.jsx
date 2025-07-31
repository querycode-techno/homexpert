"use client"

import { useState, useMemo } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

/**
 * SearchableSelect Component
 * A dropdown with search functionality for better UX with large datasets
 */
export function SearchableSelect({
  options = [],
  value = '',
  onValueChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No options found',
  disabled = false,
  className = '',
  showSearch = true
}) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [options, searchTerm])

  const selectedOption = options.find(option => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !selectedOption && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          {showSearch && (
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 p-2 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          )}
          <CommandEmpty className="py-6 text-center text-sm">
            {emptyMessage}
          </CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-auto">
            {filteredOptions.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={(currentValue) => {
                  onValueChange(currentValue === value ? '' : currentValue)
                  setOpen(false)
                  setSearchTerm('')
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="truncate">{option.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Simple text input with search icon for basic search functionality
 */
export function SearchInput({
  value = '',
  onChange,
  placeholder = 'Search...',
  disabled = false,
  className = ''
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="pl-9"
      />
    </div>
  )
}