"use client"
import { useRef, useEffect, useState, useCallback } from "react"
import { ProgramBlock } from "./program-block"
import { DatePicker } from "@/components/date-picker"
import { DualRangeSlider } from "@/components/dual-range-slider"
import { TypeSelector } from "@/components/type-selector"
import { Separator } from "@/components/ui/separator"
import ReportsDialog from "@/components/report-dialog"

interface Channel {
  name: string
  type: string
  logo: string
}

interface ProgramData {
  id: string
  channel: string
  date: string
  start: string
  end: string
  type: "program" | "ad" | "not_detected"
  program: string
  image: string
  region?: string
  brand?: string | null
  sector?: string | null
  category?: string | null
  description?: string
}

interface ProgramGridProps {
  initialData: ProgramData[][]
  channels: Channel[]
  selectedDate: string
}

const ProgramGrid = ({ initialData, channels, selectedDate }: ProgramGridProps) => {
  const timelineRef = useRef<HTMLDivElement>(null)
  const programRef = useRef<HTMLDivElement>(null)
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 23.5])
  const [selectedDateState, setSelectedDateState] = useState(selectedDate)
  const [programData, setProgramData] = useState<ProgramData[][]>(initialData)
  const [dynamicPixelsPerSecond, setDynamicPixelsPerSecond] = useState(0.1) // Initial default, will be calculated

  // Helper to convert time string to seconds
  const timeToSeconds = useCallback((time: string) => {
    try {
      const [hours, minutes, seconds] = time.split(":").map(Number)
      return hours * 3600 + minutes * 60 + (seconds || 0)
    } catch (error) {
      console.error(`Error parsing time: ${time}`, error)
      return 0
    }
  }, [])

  // Calculate range duration in seconds
  const rangeStartSeconds = timeRange[0] * 3600
  const rangeEndSeconds = timeRange[1] * 3600
  const rangeDurationSeconds = rangeEndSeconds - rangeStartSeconds

  // Effect to calculate dynamicPixelsPerSecond based on available width and time range
  useEffect(() => {
    const calculateDynamicScale = () => {
      if (programRef.current && rangeDurationSeconds > 0) {
        const availableWidth = programRef.current.offsetWidth
        const newPixelsPerSecond = availableWidth / rangeDurationSeconds
        setDynamicPixelsPerSecond(newPixelsPerSecond)
      } else {
        // Fallback if no duration or ref not ready, or if rangeDurationSeconds is 0 (e.g., start=end)
        setDynamicPixelsPerSecond(360 / 3600) // Default 0.1px/sec (1 hour = 360px)
      }
    }

    // Recalculate on mount, timeRange change, or window resize
    calculateDynamicScale()
    window.addEventListener("resize", calculateDynamicScale)
    return () => window.removeEventListener("resize", calculateDynamicScale)
  }, [timeRange, rangeDurationSeconds]) // Depend on timeRange and its derived duration

  // The total width of the scrollable content area, which should match the container width for "zoom"
  const timelineContentWidth = rangeDurationSeconds * dynamicPixelsPerSecond

  // Synchronize scrolling
  const handleTimelineScroll = () => {
    if (timelineRef.current && programRef.current) {
      programRef.current.scrollLeft = timelineRef.current.scrollLeft
    }
  }

  const handleProgramScroll = () => {
    if (timelineRef.current && programRef.current) {
      timelineRef.current.scrollLeft = programRef.current.scrollLeft
    }
  }

  useEffect(() => {
    const timeline = timelineRef.current
    const program = programRef.current
    if (timeline && program) {
      timeline.addEventListener("scroll", handleTimelineScroll)
      program.addEventListener("scroll", handleProgramScroll)
      return () => {
        timeline.removeEventListener("scroll", handleTimelineScroll)
        program.removeEventListener("scroll", handleProgramScroll)
      }
    }
  }, [])

  // Filter programs based on time range
  const filteredData = programData.map((channelPrograms) => {
    return channelPrograms.filter((program) => {
      const startSeconds = timeToSeconds(program.start)
      const endSeconds = timeToSeconds(program.end)
      // Check for any overlap
      const isVisible = startSeconds < rangeEndSeconds && endSeconds > rangeStartSeconds
      return isVisible
    })
  })

  // Auto-scroll to start of time range (should be 0 if zoomed to fit)
  useEffect(() => {
    if (timelineRef.current && programRef.current) {
      // When zoomed, the content starts at the beginning of the visible range, so scroll to 0
      timelineRef.current.scrollLeft = 0
      programRef.current.scrollLeft = 0
    }
  }, [timeRange, dynamicPixelsPerSecond]) // Re-run when timeRange or scale changes

  // Fetch data when date changes
  useEffect(() => {
    const fetchData = async () => {
      const newData = await Promise.all(
        channels.map(async (channel) => {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_URL}/data/${channel.name.toLowerCase().replace(" ", "-")}/${selectedDateState}.json`,
            )
            if (!response.ok) {
              console.warn(`No data found for ${channel.name} on ${selectedDateState}`)
              return []
            }
            const data = await response.json()
            return data
          } catch (error) {
            console.error(`Error fetching data for ${channel.name}:`, error)
            return []
          }
        }),
      )
      setProgramData(newData)
    }
    fetchData()
  }, [selectedDateState, channels])

  return (
    <div className="flex flex-col">
      <div className="bg-card border rounded-lg h-fit mb-2">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl">Program Grid</h1>
          <div className="flex items-center gap-4">
            <TypeSelector />
            <DatePicker onDateChange={setSelectedDateState} initialDate={selectedDate} />
            <ReportsDialog />
          </div>
        </div>
        <Separator />
        <div className="mb-8 p-4 pb-0">
          <DualRangeSlider onValueChange={setTimeRange} />
        </div>
      </div>
      <div className="grid grid-cols-7 h-12 border-t border-x rounded-t-lg overflow-hidden divide-x">
        <div className="flex items-center justify-center bg-card">
          <p>Timeline</p>
        </div>
        <div className="col-span-6 bg-muted">
          <div ref={timelineRef} className="overflow-x-auto overflow-y-hidden hide-scrollbar" style={{ width: "100%" }}>
            <div className="flex" style={{ width: `${timelineContentWidth}px` }}>
              {/* Render hour markers based on the selected time range */}
              {Array.from({ length: Math.ceil(timeRange[1] - timeRange[0]) + 1 }, (_, i) => {
                const hour = Math.floor(timeRange[0] + i)
                // Calculate the width of each hour segment based on dynamicPixelsPerSecond
                // An hour is 3600 seconds.
                const hourSegmentWidth = 3600 * dynamicPixelsPerSecond
                // Only render if the hour is within the selected range
                if (hour >= timeRange[0] && hour <= timeRange[1]) {
                  return (
                    <div
                      key={hour}
                      className="flex-none h-12 flex items-center justify-start relative border-l border-gray-200"
                      style={{ width: `${hourSegmentWidth}px` }}
                    >
                      <span className="text-sm font-medium absolute -left-4 bg-muted">{hour}:00</span>
                    </div>
                  )
                }
                return null
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-7 h-fit border rounded-b-lg overflow-hidden divide-x">
        <div className="h-full bg-card rounded-l-lg flex flex-col divide-y min-w-64">
          {channels.map((channel, index) => (
            <div key={index} className="flex gap-2 items-center h-32 p-2 bg-card hover:bg-muted transition-colors">
              <img
                src={channel.logo || "/placeholder.svg"}
                alt={`${channel.name} Logo`}
                className="h-12 w-12 rounded-lg border object-cover"
              />
              <div>
                <h2 className="text-lg font-semibold">{channel.name}</h2>
                <p className="text-muted-foreground text-sm">{channel.type}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-6 bg-muted">
          <div ref={programRef} className="overflow-x-auto overflow-y-hidden">
            <div
              className="relative"
              style={{
                width: `${timelineContentWidth}px`, // This should also use the dynamic width
                height: `${channels.length * 8}rem`,
              }}
            >
              {filteredData.map((channelPrograms, index) => (
                <div key={index} className="flex items-center h-32 relative">
                  {channelPrograms.length === 0 && (
                    <div className="text-center w-full text-muted-foreground">
                      No programs found for {channels[index].name} in selected time range.
                    </div>
                  )}
                  {channelPrograms.map((program) => (
                    <ProgramBlock
                      key={program.id}
                      type={program.type}
                      name={program.program}
                      description={program.description || "No description available"}
                      startTime={program.start}
                      endTime={program.end}
                      image={program.image}
                      channel={channels[index].name}
                      brand={program.brand}
                      sector={program.sector}
                      category={program.category}
                      timeRangeStart={rangeStartSeconds} // Pass time range start in seconds
                      pixelsPerSecond={dynamicPixelsPerSecond} // Pass the dynamically calculated scale
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgramGrid
