import type { FacilityViewModel } from "./views/viewModels";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

interface FacilityCardProps {
  facility: FacilityViewModel;
  index?: number;
}

/**
 * Presentational component for displaying a single facility
 *
 * Renders facility information in a card format and provides
 * navigation to the facility's detailed schedule page.
 *
 * @param facility - The facility data to display
 */
export function FacilityCard({ facility, index }: FacilityCardProps) {
  return (
    <a
      href={`/facilities/${facility.id}`}
      className="block transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring rounded-lg"
      data-testid={`facility-card-${index !== undefined ? index : facility.id}`}
    >
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>{facility.name}</CardTitle>
        </CardHeader>
      </Card>
    </a>
  );
}
