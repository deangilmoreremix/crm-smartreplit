import { forwardRef } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Building,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock,
  Code,
  Code2,
  Copy,
  CreditCard,
  Crown,
  Database,
  DollarSign,
  Download,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  File,
  FileText,
  Filter,
  Globe,
  Hash,
  HelpCircle,
  Image,
  Info,
  Key,
  Lightbulb,
  Link,
  List,
  Loader2,
  Lock,
  LogIn,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquare,
  Mic,
  MicOff,
  Minus,
  Monitor,
  Moon,
  MoreHorizontal,
  Music,
  Package,
  Paperclip,
  Pause,
  Phone,
  PhoneCall,
  PhoneOff,
  PieChart,
  Play,
  Plus,
  PlusCircle,
  Power,
  Receipt,
  RefreshCw,
  Reply,
  Save,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  Signal,
  Sliders,
  Smile,
  Sparkles,
  Square,
  Star,
  StopCircle,
  Sun,
  Tag,
  Target,
  Trash,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  UploadCloud,
  User,
  UserPlus,
  Users,
  Video,
  VideoOff,
  Volume2,
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
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Building,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock,
  Code,
  Code2,
  Copy,
  CreditCard,
  Crown,
  Database,
  DollarSign,
  Download,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  File,
  FileText,
  Filter,
  Globe,
  Hash,
  HelpCircle,
  Image,
  Info,
  Key,
  Lightbulb,
  Link,
  List,
  Loader2,
  Lock,
  LogIn,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquare,
  Mic,
  MicOff,
  Minus,
  Monitor,
  Moon,
  MoreHorizontal,
  Music,
  Package,
  Paperclip,
  Pause,
  Phone,
  PhoneCall,
  PhoneOff,
  PieChart,
  Play,
  Plus,
  PlusCircle,
  Power,
  Receipt,
  RefreshCw,
  Reply,
  Save,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  Signal,
  Sliders,
  Smile,
  Sparkles,
  Square,
  Star,
  StopCircle,
  Sun,
  Tag,
  Target,
  Trash,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  UploadCloud,
  User,
  UserPlus,
  Users,
  Video,
  VideoOff,
  Volume2,
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
