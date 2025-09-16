"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, FileText, ChevronDown, ChevronRight, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { employeeService, logService } from "@/lib/services"
import { InventoryItem, LogRegistry } from "@/lib/types"
import { useLicense } from "@/components/license-provider"

export default function LogPage() {
  const [logs, setLogs] = useState<LogRegistry[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const { fetchLicense } = useLicense()

  useEffect(() => {
    fetchLogs()
    fetchLicense()
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await logService.fetchAll();
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setLogs(data)
    } catch (error) {
      console.error("Failed to fetch logs:", error)
      toast({
        title: "Error",
        description: "Failed to fetch log registries",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      await (await logService.deletryRegistry(id)).json();
        toast({
          title: "Success",
          description: `Entry deleted successfully`,
        });
      fetchLogs();
    }
    catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getDateFilteredLogs = () => {
    if (dateFilter === "all") return logs

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())

    return logs.filter((log) => {
      const logDate = new Date(log.registrationDate)

      switch (dateFilter) {
        case "today":
          return logDate >= today
        case "yesterday":
          return logDate >= yesterday && logDate < today
        case "last-month":
          return logDate >= lastMonth
        case "last-year":
          return logDate >= lastYear
        default:
          return true
      }
    })
  }

  const getSortedLogs = (items: LogRegistry[]) => {
    return [...items].sort((a, b) => {
      const aDate = new Date(a.registrationDate).getTime()
      const bDate = new Date(b.registrationDate).getTime()
      return bDate - aDate // Newest first
    })
  }

  const getFilteredAndSortedLogs = () => {
    const dateFiltered = getDateFilteredLogs()
    return getSortedLogs(dateFiltered)
  }

  const toggleRowExpansion = (logId: string) => {
    const newExpandedRows = new Set(expandedRows)
    if (newExpandedRows.has(logId)) {
      newExpandedRows.delete(logId)
    } else {
      newExpandedRows.add(logId)
    }
    setExpandedRows(newExpandedRows)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading log registries...</div>
  }

  const displayedLogs = getFilteredAndSortedLogs()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Inventory Log</h1>
        <p className="text-muted-foreground">View a history of all adjustments made to your inventory</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button variant={dateFilter === "all" ? "default" : "outline"} onClick={() => setDateFilter("all")}>
              All Time
            </Button>
            <Button variant={dateFilter === "today" ? "default" : "outline"} onClick={() => setDateFilter("today")}>
              Today
            </Button>
            <Button
              variant={dateFilter === "yesterday" ? "default" : "outline"}
              onClick={() => setDateFilter("yesterday")}
            >
              Yesterday
            </Button>
            <Button
              variant={dateFilter === "last-month" ? "default" : "outline"}
              onClick={() => setDateFilter("last-month")}
            >
              Last Month
            </Button>
            <Button
              variant={dateFilter === "last-year" ? "default" : "outline"}
              onClick={() => setDateFilter("last-year")}
            >
              Last Year
            </Button>
            <Badge variant="outline" className="h-10 flex items-center ml-auto">
              {displayedLogs.length} entries shown
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Log Entries
              <Badge variant="secondary">{displayedLogs.length}</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {displayedLogs.length > 0 ? (
            <div className="space-y-2">
              {displayedLogs.map((log) => (
                <div key={log._id} className="border rounded-lg">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleRowExpansion(log._id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[140px]">
                        <Calendar className="h-4 w-4" />
                        {formatDateTime(log.registrationDate.toString())}
                      </div>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span style={{ color: employeeService.generateColor(log.employee._id) }} className="font-medium">
                          {log.employee.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{log.description}</span>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {log.items.length} item{log.items.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="ml-4">
                      {expandedRows.has(log._id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </div>

                  {expandedRows.has(log._id) && (
                    <div className="border-t bg-muted/20 p-4">
                      <div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item Name</TableHead>
                              <TableHead>SKU</TableHead>
                              <TableHead>Quantity</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {log.items.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{(item.item as InventoryItem).itemName}</TableCell>
                                <TableCell className="text-muted-foreground">{(item.item as InventoryItem).sku}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{item.quantity}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex justify-end w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEntry(log._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-2 mr-2" />
                          Delete Entry
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No log entries found</h3>
              <p className="text-muted-foreground">No inventory log registries match the selected filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div >
  )
}
