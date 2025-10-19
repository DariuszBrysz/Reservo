import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ReservationDetailDTO } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate iCalendar (.ics) file content from a reservation
 * @param reservation - Reservation details with facility information
 * @returns Formatted .ics file content as a string
 */
export function generateIcsContent(reservation: ReservationDetailDTO): string {
  // Convert ISO datetime strings to ICS format (YYYYMMDDTHHMMSSZ)
  const formatDateForIcs = (isoDate: string): string => {
    return new Date(isoDate)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  };

  const dtStart = formatDateForIcs(reservation.start_time);
  const dtEnd = formatDateForIcs(reservation.end_time);
  const dtStamp = formatDateForIcs(new Date().toISOString());

  // Generate unique identifier for the event
  const uid = `reservation-${reservation.id}@reservo.app`;

  // Build event summary and description
  const summary = `Reservation: ${reservation.facility.name}`;
  const description = `Facility: ${reservation.facility.name}\\nStatus: ${reservation.status}\\nDuration: ${reservation.duration}`;

  // Construct the ICS content following RFC 5545 specification
  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Reservo//Reservation System//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `STATUS:${reservation.status === "confirmed" ? "CONFIRMED" : "CANCELLED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  // Join with CRLF line endings as per ICS specification
  return icsLines.join("\r\n");
}
