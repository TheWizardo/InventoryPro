"use client"

import { licenseService } from "@/lib/services"
import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface LicenseContextType {
  isLicenseValid: boolean
  licenseEndDate: Date | null
  isLoading: boolean
  fetchLicense: () => void
}

const LicenseContext = createContext<LicenseContextType>({
  isLicenseValid: true,
  licenseEndDate: null,
  isLoading: true,
  fetchLicense: () => { }
})

export const useLicense = () => useContext(LicenseContext)

export function LicenseProvider({ children }: { children: React.ReactNode }) {
  const [isLicenseValid, setIsLicenseValid] = useState(true)
  const [licenseEndDate, setLicenseEndDate] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchLicense = async () => {
    try {
      const res = await licenseService.fetchDate();
      const lic = await res.json()
      if (!lic.licenseEnd) throw new Error("Licence end date is: null");
      
      licenseService.setLicenseEnd({ licenseEnd: new Date(lic.licenseEnd) });
      const licenseData = licenseService.getLicenseEnd();

      setLicenseEndDate(licenseData ? licenseData.licenseEnd : null)
      setIsLicenseValid(licenseService.isValid())
    } catch (error) {
      console.error("Failed to fetch license:", error)
      // On error, assume license is invalid
      setIsLicenseValid(false)
      setLicenseEndDate(null)
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    fetchLicense()
  }, [])

  return (
    <LicenseContext.Provider value={{ isLicenseValid, licenseEndDate, isLoading, fetchLicense }}>{children}</LicenseContext.Provider>
  )
}
