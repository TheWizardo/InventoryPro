"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Shield, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { useLicense } from "@/components/license-provider"

export default function AboutPage() {
    const { isLicenseValid, licenseEndDate, isLoading, fetchLicense } = useLicense() // Get license data from service

    useEffect(() => {
        fetchLicense()
    }, [])

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">About Inventory Pro</h1>
                <p className="text-muted-foreground">Learn more about our inventory management system</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Product Overview
                    </CardTitle>
                    <CardDescription>Comprehensive inventory management solution for your business</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed">
                        Inventory Pro Admin© is a streamlined way to extend the capabilities of your Inventory Pro© system.<br/>
                        Featuring all the same, familiar screens along side the option to safely delete and alter otherwise
                        locked down entries from the inventory database.<br/>
                        With great power comes great responsibility.
                    </p>

                    <div className="flex items-center gap-2 pt-4 border-t">
                        {isLoading ? (
                            <>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Loading license information...</span>
                            </>
                        ) : (
                            <>
                                {isLicenseValid ? (
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-sm text-muted-foreground">License expires:</span>
                                <Badge variant={isLicenseValid ? "outline" : "destructive"} className="font-mono">
                                    {licenseEndDate ? formatDate(licenseEndDate) : "Invalid License"}
                                </Badge>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
