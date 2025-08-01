import { useId } from "react"

// import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function StatusDot({ className }) {
  return (
    <svg
      width="8"
      height="8"
      fill="currentColor"
      viewBox="0 0 8 8"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

export function TypeSelector() {
  const id = useId()
  return (
    <div className="*:not-first:mt-2">
      {/* <Label htmlFor={id}>Status select</Label> */}
      <Select defaultValue="all">
        <SelectTrigger
          id={id}
          className="[&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0"
        >
          <SelectValue placeholder="Select content type" />
        </SelectTrigger>
        <SelectContent className="[&_*[role=option]>span>svg]:text-muted-foreground/80 [&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]>span>svg]:shrink-0">
          <SelectItem value="all">
            <span className="flex items-center gap-2">
              <StatusDot className="text-green-600" />
              <span className="truncate">All Content</span>
            </span>
          </SelectItem>
          <SelectItem value="1">
            <span className="flex items-center gap-2">
              <StatusDot className="text-blue-600" />
              <span className="truncate">Program</span>
            </span>
          </SelectItem>
          <SelectItem value="2">
            <span className="flex items-center gap-2">
              <StatusDot className="text-amber-500" />
              <span className="truncate">Advertisement</span>
            </span>
          </SelectItem>
          <SelectItem value="3">
            <span className="flex items-center gap-2">
              <StatusDot className="text-gray-500" />
              <span className="truncate">Not Detected</span>
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
