"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "./ui/separator";

export default function ReportsDialog() {
  const [reportType, setReportType] = useState("raw");
  const [fileType, setFileType] = useState("csv");
  const [date, setDate] = useState("");
  const [channels, setChannels] = useState([]);

  const channelOptions = [
    { label: "Channel A", value: "a" },
    { label: "Channel B", value: "b" },
    { label: "Channel C", value: "c" },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Generate Report</Button>
      </SheetTrigger>
      <div className="relative">
        <SheetContent className="m-1.5 h-[98.75vh] border rounded-lg w-full sm:max-w-lg">
          <SheetHeader className="p-4 pb-0">
            <SheetTitle>Generate Report</SheetTitle>
            <SheetDescription>
              Select type and details of the report
            </SheetDescription>
          </SheetHeader>
          <Separator />

          <div className="space-y-4 p-4 h-full">
            {/* Report type selector */}
            <div className="space-y-2">
              <Label>Select Report Type</Label>
              <Select
                value={reportType}
                onValueChange={setReportType}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="raw">Raw Report</SelectItem>
                  <SelectItem value="analytics">Analytics Report</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {reportType === "raw"
                  ? "Unprocessed event-level data"
                  : "Aggregated data insights"}
              </p>
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label htmlFor="report-date">Select Date</Label>
              <input
                id="report-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Channel Single Select */}
            <div className="space-y-2">
              <Label>Select Channel</Label>
              <Select
                value={channels[0] || ""}
                onValueChange={(value) => setChannels([value])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {channelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File type only for raw report */}
            {reportType === "raw" && (
              <div className="space-y-2">
                <Label>Select File Type</Label>
                <Select value={fileType} onValueChange={setFileType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select file type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Separator />
          <SheetFooter className="p-4 pt-0">
            <Button className="w-full">
              {reportType === "raw"
                ? "Download Raw Report"
                : "Generate Analytics Report"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </div>
    </Sheet>
  );
}