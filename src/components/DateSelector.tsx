/**
 * DateSelector - Component for selecting a date from the next 7 days
 *
 * Displays 7 interactive buttons representing consecutive days, allowing users
 * to select which day's schedule they want to view. The currently selected date
 * is visually highlighted.
 */

import { Button } from "./ui/button";

interface DateSelectorProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

/**
 * Formats a date to display in the button (e.g., "Mon 18")
 */
function formatDateLabel(date: Date): string {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = dayNames[date.getUTCDay()];
  const dayNumber = date.getUTCDate();
  return `${dayName} ${dayNumber}`;
}

/**
 * Checks if two dates are the same day (ignoring time)
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

/**
 * Generates an array of the next 7 days starting from today
 */
function getNext7Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getUTCDate() + i);
    days.push(date);
  }

  return days;
}

export default function DateSelector({ selectedDate, onDateSelect }: DateSelectorProps) {
  const days = getNext7Days();

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Select date to view schedule"
      data-testid="date-selector"
    >
      {days.map((date, index) => {
        const isSelected = isSameDay(date, selectedDate);
        const label = formatDateLabel(date);
        const fullDate = date.toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        return (
          <Button
            key={date.toISOString()}
            variant={isSelected ? "default" : "outline"}
            onClick={() => onDateSelect(date)}
            aria-pressed={isSelected}
            aria-label={`View schedule for ${fullDate}`}
            className="min-w-[80px]"
            data-testid={`date-button-${index}`}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
