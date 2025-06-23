"use client"

import { useState, useMemo } from "react"
import { Check, Search, X, Plus, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { serviceUtils } from "@/lib/utils"

export function ServiceSelector({ 
  selectedServices = [], 
  onServicesChange,
  placeholder = "Search or select services...",
  className = ""
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")

  // Get all services and categories from services.json
  const allServices = useMemo(() => serviceUtils.getAllServices(), [])
  const categories = useMemo(() => serviceUtils.getCategories(), [])
  const servicesByCategory = useMemo(() => {
    if (!selectedCategory) return []
    return serviceUtils.getServicesByCategory(selectedCategory)
  }, [selectedCategory])

  // Filter services based on search
  const filteredServices = useMemo(() => {
    if (!searchValue) return allServices
    return allServices.filter(service =>
      service.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [allServices, searchValue])

  const addService = (service) => {
    if (!selectedServices.includes(service)) {
      onServicesChange([...selectedServices, service])
    }
    setSearchOpen(false)
    setSearchValue("")
  }

  const removeService = (serviceToRemove) => {
    onServicesChange(selectedServices.filter(service => service !== serviceToRemove))
  }

  const addServiceFromCategory = (serviceName) => {
    if (!selectedServices.includes(serviceName)) {
      onServicesChange([...selectedServices, serviceName])
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Search-based service selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Search Services</label>
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={searchOpen}
                className="w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <span className="text-muted-foreground">{placeholder}</span>
                </div>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Type to search services..." 
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  <CommandEmpty>No services found.</CommandEmpty>
                  <CommandGroup>
                    {filteredServices.slice(0, 10).map((service) => (
                      <CommandItem
                        key={service}
                        value={service}
                        onSelect={() => addService(service)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedServices.includes(service) ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        {service}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Category-based service selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Browse by Category</label>
          <div className="space-y-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCategory && servicesByCategory.length > 0 && (
              <Select onValueChange={addServiceFromCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service from this category" />
                </SelectTrigger>
                <SelectContent>
                  {servicesByCategory.map((service) => (
                    <SelectItem key={service.id} value={service.name}>
                      <div className="flex items-center justify-between w-full">
                        <span>{service.name}</span>
                        {selectedServices.includes(service.name) && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Selected services display */}
      {selectedServices.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Selected Services ({selectedServices.length})
          </label>
          <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/20">
            {selectedServices.map((service, index) => (
              <Badge key={index} variant="secondary" className="gap-1 py-1 px-2">
                {service}
                <button
                  type="button"
                  onClick={() => removeService(service)}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="text-xs text-muted-foreground">
        {selectedServices.length > 0 ? (
          <span>{selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected</span>
        ) : (
          <span>No services selected. Search above or browse by category.</span>
        )}
      </div>
    </div>
  )
} 