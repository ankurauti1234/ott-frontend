"use client"
import { useRef, useEffect, useState, useCallback } from "react"
import { ProgramBlock } from "@/components/modules/program-grid/program-block" // Re-using ProgramBlock
import { DualRangeSlider } from "@/components/dual-range-slider"
import { Separator } from "@/components/ui/separator"
import ReportsDialog from "@/components/report-dialog"
import { OttPlatformSelector } from "@/components/ott-platform-selector"

interface Platform {
  id: string
  name: string
  series: Series[]
}

interface Series {
  id: string
  name: string
  seasons: Season[]
}

interface Season {
  id: string
  name: string
}

interface ProgramData {
  id: string
  channel: string // This will be the series name for OTT
  date: string
  start: string
  end: string
  type: "episode" | "ad" | "not_detected" // Updated types
  program: string
  image: string
  region?: string
  brand?: string | null
  sector?: string | null
  category?: string | null
  description?: string
}

interface OttProgramGridProps {
  platforms: Platform[]
  initialPlatformId: string
}

const OttProgramGrid = ({ platforms, initialPlatformId }: OttProgramGridProps) => {
  const timelineRef = useRef<HTMLDivElement>(null)
  const programRef = useRef<HTMLDivElement>(null)
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 23.5]) // Full 24 hours initially
  const [selectedPlatformId, setSelectedPlatformId] = useState(initialPlatformId)
  const [programData, setProgramData] = useState<ProgramData[][]>([]) // Now a 2D array
  const [dynamicPixelsPerSecond, setDynamicPixelsPerSecond] = useState(0.1)
  const [currentSeriesList, setCurrentSeriesList] = useState<Series[]>([]) // List of series for the selected platform

  const currentPlatform = platforms.find((p) => p.id === selectedPlatformId)

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
        setDynamicPixelsPerSecond(360 / 3600) // Default 0.1px/sec (1 hour = 360px)
      }
    }

    calculateDynamicScale()
    window.addEventListener("resize", calculateDynamicScale)
    return () => window.removeEventListener("resize", calculateDynamicScale)
  }, [timeRange, rangeDurationSeconds])

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
  const filteredData = programData.map((seriesPrograms) => {
    return seriesPrograms.filter((program) => {
      const startSeconds = timeToSeconds(program.start)
      const endSeconds = timeToSeconds(program.end)
      const isVisible = startSeconds < rangeEndSeconds && endSeconds > rangeStartSeconds
      return isVisible
    })
  })

  // Auto-scroll to start of time range (should be 0 if zoomed to fit)
  useEffect(() => {
    if (timelineRef.current && programRef.current) {
      timelineRef.current.scrollLeft = 0
      programRef.current.scrollLeft = 0
    }
  }, [timeRange, dynamicPixelsPerSecond])

  // Fetch data when platform changes
  useEffect(() => {
    const fetchData = async () => {
      if (!currentPlatform) {
        setProgramData([])
        setCurrentSeriesList([])
        return
      }

      setCurrentSeriesList(currentPlatform.series)

      const allSeriesProgramData = await Promise.all(
        currentPlatform.series.map(async (series) => {
          let seriesPrograms: ProgramData[] = []
          // Fetch data for all seasons within this series
          await Promise.all(
            series.seasons.map(async (season) => {
              try {
                const response = await fetch(
                  `${process.env.NEXT_PUBLIC_URL}/data/ott/${selectedPlatformId}/${series.id}/${season.id}.json`,
                )
                if (!response.ok) {
                  console.warn(`No data found for ${selectedPlatformId}/${series.id}/${season.id}.json`)
                  return []
                }
                const data: ProgramData[] = await response.json()
                // Assign the series name as the channel for each program
                const programsWithSeriesChannel = data.map((p) => ({ ...p, channel: series.name }))
                seriesPrograms = seriesPrograms.concat(programsWithSeriesChannel)
              } catch (error) {
                console.error(`Error fetching data for ${selectedPlatformId}/${series.id}/${season.id}:`, error)
              }
            }),
          )
          // Sort programs by start time for correct display
          return seriesPrograms.sort((a, b) => timeToSeconds(a.start) - timeToSeconds(b.start))
        }),
      )
      setProgramData(allSeriesProgramData)
    }
    fetchData()
  }, [selectedPlatformId, currentPlatform, timeToSeconds]) // Depend on selectedPlatformId and currentPlatform

  return (
    <div className="flex flex-col">
      <div className="bg-card border rounded-lg h-fit mb-2">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl">OTT Program Grid</h1>
          <div className="flex items-center gap-4">
            <OttPlatformSelector
              platforms={platforms}
              selectedPlatformId={selectedPlatformId}
              onSelectPlatform={setSelectedPlatformId}
            />
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
              {Array.from({ length: Math.ceil(timeRange[1] - timeRange[0]) + 1 }, (_, i) => {
                const hour = Math.floor(timeRange[0] + i)
                const hourSegmentWidth = 3600 * dynamicPixelsPerSecond
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
          {/* Display each series as a channel */}
          {currentSeriesList.map((series) => (
            <div key={series.id} className="flex gap-2 items-center h-32 p-2 bg-card hover:bg-muted transition-colors">
              <img
                src="/placeholder.svg?height=48&width=48"
                alt={`${series.name} Logo`}
                className="h-12 w-12 rounded-lg border object-cover"
              />
              <div>
                <h2 className="text-lg font-semibold">{series.name}</h2>
                <p className="text-muted-foreground text-sm">{currentPlatform?.name}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-6 bg-muted">
          <div ref={programRef} className="overflow-x-auto overflow-y-hidden">
            <div
              className="relative"
              style={{
                width: `${timelineContentWidth}px`,
                height: `${currentSeriesList.length * 8}rem`, // Height based on number of series
              }}
            >
              {filteredData.map((seriesPrograms, index) => (
                <div
                  key={currentSeriesList[index]?.id || `series-row-${index}`}
                  className="flex items-center h-32 relative"
                >
                  {seriesPrograms.length === 0 && (
                    <div className="text-center w-full text-muted-foreground absolute inset-0 flex items-center justify-center">
                      No programs found for {currentSeriesList[index]?.name} in selected time range.
                    </div>
                  )}
                  {seriesPrograms.map((program) => (
                    <ProgramBlock
                      key={program.id}
                      type={program.type}
                      name={program.program}
                      description={program.description || "No description available"}
                      startTime={program.start}
                      endTime={program.end}
                      image={program.image}
                      channel={program.channel} // This will be the series name
                      brand={program.brand}
                      sector={program.sector}
                      category={program.category}
                      timeRangeStart={rangeStartSeconds}
                      pixelsPerSecond={dynamicPixelsPerSecond}
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

export default OttProgramGrid
