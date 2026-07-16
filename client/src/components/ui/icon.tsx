import { forwardRef } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Brain,
  Building,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Copy,
  CreditCard,
  Database,
  DollarSign,
  Download,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Globe,
  Image,
  Info,
  Key,
  Lightbulb,
  Loader2,
  Lock,
  Mail,
  Menu,
  MessageSquare,
  Mic,
  Minus,
  Monitor,
  Moon,
  MoreHorizontal,
  Pause,
  Phone,
  Play,
  Plus,
  Power,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  Share2,
  Sparkles,
  Star,
  Sun,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  User,
  UserPlus,
  Users,
  Video,
  Wifi,
  WifiOff,
  XCircle,
  Zap,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Curated set of the most-used CRM icons, keyed by their lucide-react name.
 * Add new entries here to grow the supported `name` union.
 */
export const COMMON_ICONS = {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Brain,
  Building,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Copy,
  CreditCard,
  Database,
  DollarSign,
  Download,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Globe,
  Image,
  Info,
  Key,
  Lightbulb,
  Loader2,
  Lock,
  Mail,
  Menu,
  MessageSquare,
  Mic,
  Minus,
  Monitor,
  Moon,
  MoreHorizontal,
  Pause,
  Phone,
  Play,
  Plus,
  Power,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  Share2,
  Sparkles,
  Star,
  Sun,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  User,
  UserPlus,
  Users,
  Video,
  Wifi,
  WifiOff,
  XCircle,
  Zap,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof COMMON_ICONS;

export interface IconProps extends Omit<LucideProps, 'name' | 'ref'> {
  /** Curated icon name from {@link COMMON_ICONS}. Falls back to a default icon when unknown. */
  name: IconName | (string & {});
  /** Pixel size (sets both width and height). Defaults to lucide's 24. */
  size?: number | string;
  /** Extra Tailwind / utility classes. */
  className?: string;
}

/**
 * Unified icon component — a thin, curated wrapper around `lucide-react`.
 *
 * @example
 * // Render a curated icon
 * <Icon name="Plus" size={16} />
 *
 * @example
 * // Color + classes
 * <Icon name="Trash2" className="text-destructive" />
 *
 * @example
 * // Unknown names gracefully fall back to a default (Circle) icon instead of throwing
 * <Icon name="SomeFutureIcon" />
 */
const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ name, size, color, className, ...props }, ref) => {
    const FallbackIcon = COMMON_ICONS.Circle;
    const LucideComponent =
      (name in COMMON_ICONS ? COMMON_ICONS[name as IconName] : undefined) ??
      FallbackIcon;

    return (
      <LucideComponent
        ref={ref}
        size={size}
        color={color}
        className={cn(className)}
        aria-label={typeof name === 'string' ? name : undefined}
        {...props}
      />
    );
  }
);

Icon.displayName = 'Icon';

export { Icon };
