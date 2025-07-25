import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

type ProgramBlockType = "program" | "ad" | "episode" | "not_detected";

interface ProgramBlockProps {
  type?: ProgramBlockType;
  name?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  image?: string;
  channel?: string;
  brand?: string | null;
  sector?: string | null;
  category?: string | null;
  timeRangeStart?: number; // Seconds of the start of the time range
  pixelsPerSecond?: number; // Scaling factor for zoom
}

// Helper function to convert time string to seconds
function timeToSeconds(timeString: string) {
  try {
    const parts = timeString.split(":");
    const hours = Number.parseInt(parts[0], 10) || 0;
    const minutes = Number.parseInt(parts[1], 10) || 0;
    const seconds = Number.parseInt(parts[2], 10) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  } catch (error) {
    console.error(`Error parsing time: ${timeString}`, error);
    return 0;
  }
}

// Helper function to calculate duration string
function calculateDuration(startTime: string, endTime: string) {
  const start = timeToSeconds(startTime);
  const end = timeToSeconds(endTime);
  const diffSeconds = end - start;
  if (diffSeconds < 0) return "Invalid duration";
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

export const ProgramBlock = ({
  type = "not_detected",
  name = "Unknown Content",
  description = "No description available",
  startTime = "00:00:00",
  endTime = "00:00:00",
  image = "https://picsum.photos/200/300",
  channel = "Unknown Channel",
  brand = null,
  sector = null,
  category = null,
  timeRangeStart = 0, // Default to 0 seconds
  pixelsPerSecond = 0.1, // Default to 0.1px/sec (360px per hour)
}: ProgramBlockProps) => {
  const typeConfig: Record<
    ProgramBlockType,
    {
      bgColor: string;
      borderColor: string;
      hoverColor: string;
      badgeText: string;
      badgeColor: string;
    }
  > = {
    program: {
      bgColor: "bg-blue-500",
      borderColor: "border-blue-600",
      hoverColor: "hover:bg-blue-800",
      badgeText: "Program",
      badgeColor: "bg-blue-700",
    },
    episode: {
      bgColor: "bg-violet-500",
      borderColor: "border-violet-600",
      hoverColor: "hover:bg-violet-800",
      badgeText: "Program",
      badgeColor: "bg-violet-700",
    },
    ad: {
      bgColor: "bg-amber-500",
      borderColor: "border-amber-600",
      hoverColor: "hover:bg-amber-800",
      badgeText: "Ad",
      badgeColor: "bg-amber-700",
    },
    not_detected: {
      bgColor: "bg-gray-500",
      borderColor: "border-gray-600",
      hoverColor: "hover:bg-gray-800",
      badgeText: "Not Detected",
      badgeColor: "bg-gray-700",
    },
  };
  const config = typeConfig[type];

  const durationSeconds = timeToSeconds(endTime) - timeToSeconds(startTime);
  // Ensure minimum width for visibility, even for very short programs
  const calculatedWidth = Math.max(durationSeconds * pixelsPerSecond, 96);

  // Calculate left position relative to the start of the *visible* time range
  const leftPosition =
    (timeToSeconds(startTime) - timeRangeStart) * pixelsPerSecond;

  return (
    <Sheet>
      <SheetTrigger>
        <div
          className={`${config.bgColor} h-32 border ${config.borderColor} flex p-2 cursor-pointer ${config.hoverColor} transition-colors duration-300 flex-col gap-2 overflow-hidden top-0 z-10`}
          style={{
            position: "absolute",
            left: `${leftPosition}px`,
            width: `${calculatedWidth}px`,
          }}
        >
          <Badge className={`${config.badgeColor} text-white w-fit`}>
            <span className="text-xs">{config.badgeText}</span>
          </Badge>
          <div className="flex items-center gap-2">
            <div className="size-12">
              <img
                src={image || "/placeholder.svg"}
                alt={name}
                className="rounded-md h-full w-full object-cover"
                onError={(e) => {
                  console.error(`Failed to load image for ${name}: ${image}`);
                  e.currentTarget.src = "/placeholder.svg?height=200&width=300"; // Fallback image
                }}
              />
            </div>
            <div className="flex flex-col text-left">
              <h1 className="truncate text-sm font-medium">{name}</h1>
              <div className="flex items-center gap-1">
                <span className="bg-gray-800 text-white px-2 py-1 text-xs rounded">
                  {startTime}
                </span>
                <span className="text-xs">-</span>
                <span className="bg-gray-800 text-white px-2 py-1 text-xs rounded">
                  {endTime}
                </span>
              </div>
            </div>
          </div>
        </div>
      </SheetTrigger>
      <div className="relative">
        <SheetContent className="m-1.5 h-[98.75vh] border rounded-lg w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {name}
              <Badge className={`${config.badgeColor} text-white`}>
                <span className="text-xs">{config.badgeText}</span>
              </Badge>
            </SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 p-2">
            <div className="h-96 w-full">
              <img
                src={image || "/placeholder.svg"}
                alt={name}
                className="rounded-md h-full w-full object-cover"
                onError={(e) => {
                  console.error(`Failed to load image for ${name}: ${image}`);
                  e.currentTarget.src = "/placeholder.svg?height=200&width=300"; // Fallback image
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">
                  Duration:
                </span>
                <p className="text-foreground">
                  {calculateDuration(startTime, endTime)}
                </p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  Channel:
                </span>
                <p className="text-foreground">{channel}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  Start Time:
                </span>
                <p className="text-foreground">{startTime}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  End Time:
                </span>
                <p className="text-foreground">{endTime}</p>
              </div>
              {type === "ad" && (
                <>
                  {brand && (
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Brand:
                      </span>
                      <p className="text-foreground">{brand}</p>
                    </div>
                  )}
                  {sector && (
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Sector:
                      </span>
                      <p className="text-foreground">{sector}</p>
                    </div>
                  )}
                  {category && (
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Category:
                      </span>
                      <p className="text-foreground">{category}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </div>
    </Sheet>
  );
};
