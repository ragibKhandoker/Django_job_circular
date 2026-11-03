import {
  BriefcaseBusiness,
  GraduationCap,
  Headset,
  Landmark,
  Laptop,
  Megaphone,
  Network,
  Palette,
  PenLine,
  Stethoscope,
  Wrench,
} from 'lucide-react';

// Display names and icons for the job categories (JobPost.title choices).
const CATEGORY_INFO = {
  Technology: { label: 'IT & Software', Icon: Laptop },
  Finance: { label: 'Banking & Finance', Icon: Landmark },
  Marketing: { label: 'Marketing & Sales', Icon: Megaphone },
  Education: { label: 'Education', Icon: GraduationCap },
  Healthcare: { label: 'Healthcare', Icon: Stethoscope },
  Engineering: { label: 'Engineering', Icon: Wrench },
  Networking: { label: 'Networking', Icon: Network },
  Design: { label: 'Design & Creative', Icon: Palette },
  'Content Writing': { label: 'Content Writing', Icon: PenLine },
  'Customer Support': { label: 'Customer Support', Icon: Headset },
};

// Order shown on the home page; the first six are visible before "View All".
export const CATEGORY_ORDER = Object.keys(CATEGORY_INFO);

export function categoryInfo(category) {
  return CATEGORY_INFO[category] ?? { label: category, Icon: BriefcaseBusiness };
}
