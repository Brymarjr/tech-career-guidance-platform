import * as Icons from "lucide-react";
import { LucideProps } from "lucide-react";

interface BadgeIconProps extends LucideProps {
  name: string;
}

const BadgeIcon = ({ name, ...props }: BadgeIconProps) => {
  // This looks up the icon string (e.g., "Trophy") in the Lucide library
  const LucideIcon = (Icons as any)[name];

  // If the icon name is misspelled or doesn't exist, it defaults to an "Award" icon
  if (!LucideIcon) {
    return <Icons.Award {...props} />;
  }

  return <LucideIcon {...props} />;
};

export default BadgeIcon;