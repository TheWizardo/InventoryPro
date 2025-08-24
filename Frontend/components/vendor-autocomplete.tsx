"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { inventoryService } from "@/lib/services"

interface VendorAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function VendorAutocomplete({
  value,
  onChange,
  placeholder = "Enter vendor name",
  className,
}: VendorAutocompleteProps) {
  const [vendors, setVendors] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [filteredVendors, setFilteredVendors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchVendors()
  }, [])

  useEffect(() => {
    // Filter vendors based on input value
    if (value) {
      const filtered = vendors.filter((vendor) => vendor.toLowerCase().includes(value.toLowerCase()))
      setFilteredVendors(filtered)
    } else {
      setFilteredVendors(vendors)
    }
  }, [value, vendors])

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchVendors = async () => {
    setLoading(true)
    try {
      const response = await inventoryService.getVendors();
      if (response.ok) {
        const vendorList = await response.json()
        setVendors(vendorList)
        setFilteredVendors(vendorList)
      }
    } catch (error) {
      console.error("Failed to fetch vendors:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsOpen(true)
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleVendorSelect = (vendor: string) => {
    onChange(vendor)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
      inputRef.current?.blur()
    } else if (e.key === "ArrowDown" && !isOpen) {
      setIsOpen(true)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn("pr-8", className)}
          autoComplete="off"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Loading vendors...</div>
          ) : filteredVendors.length > 0 ? (
            filteredVendors.map((vendor, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center justify-between"
                onClick={() => handleVendorSelect(vendor)}
              >
                <span>{vendor}</span>
                {value === vendor && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {value ? `Assuming new vendor "${value}"` : "No vendors available"}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
