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
                        Inventory Pro© is a comprehensive inventory management system designed to streamline your business
                        operations and assembly managment.<br/>
                        Our platform provides real-time tracking of inventory, assembled products, project progression,
                        and employee oversight.
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
