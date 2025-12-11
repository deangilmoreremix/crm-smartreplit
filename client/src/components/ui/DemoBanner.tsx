import { Info } from 'lucide-react';

interface DemoBannerProps {
  feature: string;
}

export function DemoBanner({ feature }: DemoBannerProps) {
  return (
    <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <Info className="w-5 h-5" />
        <p className="font-semibold">
          Demo Mode: {feature}
        </p>
        <span className="hidden sm:inline text-white/90">
          - Showcasing features with sample data
        </span>
      </div>
    </div>
  );
}
