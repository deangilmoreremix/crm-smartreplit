# Design System

## Overview

SmartCRM uses a modern component architecture built on React 18, Tailwind CSS v4, and Radix UI primitives. The design system supports light/dark themes, white-label customization, and a comprehensive set of UI components.

## Theme

### Color Strategy

**Restrained with moments of Commitment**

The default product UI uses a restrained palette (tinted neutrals + blue accent ≤10%) for maximum readability and focus. Key moments — AI insights, deal intelligence, onboarding — can earn committed color treatment.

### Color Tokens (HSL)

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--background` | 0 0% 100% | 222.2 84% 4.9% | Page background |
| `--foreground` | 222.2 84% 4.9% | 210 40% 98% | Primary text |
| `--card` | 0 0% 100% | 222.2 84% 4.9% | Card backgrounds |
| `--card-foreground` | 222.2 84% 4.9% | 210 40% 98% | Card text |
| `--popover` | 0 0% 100% | 222.2 84% 4.9% | Dropdown/popover bg |
| `--primary` | 221.2 83.2% 53.3% | 217.2 91.2% 59.8% | Primary actions, links |
| `--primary-foreground` | 210 40% 98% | 222.2 84% 4.9% | Text on primary |
| `--secondary` | 210 40% 96% | 217.2 32.6% 17.5% | Secondary buttons |
| `--muted` | 210 40% 96% | 217.2 32.6% 17.5% | Muted backgrounds |
| `--muted-foreground` | 215.4 16.3% 46.9% | 215 20.2% 65.1% | Secondary text |
| `--accent` | 210 40% 96% | 217.2 32.6% 17.5% | Accent backgrounds |
| `--destructive` | 0 84.2% 60.2% | 0 62.8% 30.6% | Errors, destructive actions |
| `--border` | 214.3 31.8% 91.4% | 217.2 32.6% 17.5% | Borders, dividers |
| `--input` | 214.3 31.8% 91.4% | 217.2 32.6% 17.5% | Input borders |
| `--ring` | 221.2 83.2% 53.3% | 224.3 76.3% 94% | Focus rings |

**Radius**: 0.5rem (8px) default

### Semantic Colors

- **Success**: Green (emerald-500 / #10b981)
- **Warning**: Amber (amber-500 / #f59e0b)
- **Error**: Red (red-500 / #ef4444)
- **Info**: Blue (blue-500 / #3b82f6)

### AI Accent Colors

- **AI Primary**: Blue glow effects for AI-powered features
- **AI Success**: Green glow for positive AI insights
- **AI Purple**: Purple glow for creative/generative AI features

## Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
```

System fonts are used for native feel across platforms. Inter is the common cross-platform fallback.

### Type Scale

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 1.875rem (30px) | 700 | Page titles |
| H2 | 1.5rem (24px) | 600 | Section headings |
| H3 | 1.25rem (20px) | 600 | Card titles, subsections |
| H4 | 1.125rem (18px) | 500 | Labels, small headings |
| Body | 1rem (16px) | 400 | Primary body text |
| Small | 0.875rem (14px) | 400 | Secondary text, captions |
| XS | 0.75rem (12px) | 400 | Metadata, timestamps |

**Line height**: 1.5 for body, 1.25 for headings
**Line length**: Capped at 65-75ch for prose sections

## Spacing

### Base Scale

Tailwind spacing scale is used throughout:
- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)

### Layout Spacing

- **Page padding**: 1rem mobile, 1.5rem tablet, 2rem desktop
- **Card padding**: 1.5rem
- **Section gap**: 1.5rem - 2rem
- **Component gap**: 0.75rem - 1rem

## Components

### Cards

**Standard Card**:
- Background: `hsl(var(--card))`
- Border: 1px solid `hsl(var(--border))`
- Border radius: `var(--radius)` (0.5rem)
- Shadow: subtle (`shadow-sm` to `shadow-md`)
- Padding: 1.5rem

**Glass Card** (used sparingly for overlays/modals):
- Background: `rgba(255, 255, 255, 0.8)` light / `rgba(30, 41, 59, 0.8)` dark
- Backdrop filter: blur(12px)
- Border: 1px solid `rgba(255, 255, 255, 0.2)`
- **Note**: Glassmorphism is used purposefully, not as default. Avoid decorative glass cards.

### Buttons

**Primary**:
- Background: `hsl(var(--primary))`
- Text: `hsl(var(--primary-foreground))`
- Hover: slightly darker primary
- Padding: 0.5rem 1rem
- Border radius: `var(--radius)`

**Secondary**:
- Background: `hsl(var(--secondary))`
- Text: `hsl(var(--secondary-foreground))`
- Border: 1px solid `hsl(var(--border))`

**Ghost**:
- Background: transparent
- Text: `hsl(var(--foreground))`
- Hover: `hsl(var(--accent))`

### Forms

**Input**:
- Background: `hsl(var(--background))`
- Border: 1px solid `hsl(var(--input))`
- Border radius: `var(--radius)`
- Focus: ring-2 `hsl(var(--ring))`
- Padding: 0.5rem 0.75rem

**Label**:
- Font size: 0.875rem
- Font weight: 500
- Margin bottom: 0.25rem

### Badges

- Inline-flex, centered
- Padding: 0.25rem 0.5rem
- Font size: 0.75rem
- Font weight: 500
- Border radius: full (pill shape)
- Variants: red, green, blue, purple, orange

## Elevation

### Shadow Scale

| Level | Value | Usage |
|-------|-------|-------|
| sm | 0 1px 2px rgba(0,0,0,0.05) | Cards, subtle elevation |
| md | 0 4px 6px rgba(0,0,0,0.1) | Dropdowns, popovers |
| lg | 0 10px 15px rgba(0,0,0,0.1) | Modals, dialogs |
| xl | 0 20px 25px rgba(0,0,0,0.15) | Full-screen overlays |

## Motion

### Timing

- **Fast**: 150ms (micro-interactions, hover)
- **Normal**: 200-250ms (state changes, transitions)
- **Slow**: 300ms (page transitions, reveals)

### Easing

- **Default**: `ease-out` (natural deceleration)
- **Entrance**: `ease-out-quart` / `cubic-bezier(0.25, 1, 0.5, 1)`
- **Exit**: `ease-in` (acceleration out)

### Patterns

- **No bounce, no elastic** — feels dated
- **No layout property animation** — animate transforms and opacity only
- **Respect `prefers-reduced-motion`** — disable or simplify animations when user prefers reduced motion

## Responsive Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| sm | 640px | Small tablets |
| md | 768px | Tablets |
| lg | 1024px | Small laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large screens |

## White-Label Support

The design system supports dynamic theming via CSS custom properties. White-label tenants can override:

- Primary color (`--primary`)
- Background colors
- Border radius
- Font family (if loaded)

Core layout patterns, spacing, and component structure remain consistent across all tenants.

## Iconography

- **Library**: Lucide React (`lucide-react`)
- **Size**: 16px default, 20px for navigation, 24px for feature icons
- **Style**: Stroke width 2, consistent across all icons
- **Color**: Inherit from parent text color

## Known Patterns

### Dashboard Layout
- Grid-based responsive layout
- Draggable sections via `react-beautiful-dnd`
- KPI cards at top, detailed sections below
- Sidebar navigation on desktop, bottom nav on mobile

### Data Tables
- Sortable columns
- Pagination or infinite scroll
- Row actions (edit, delete, view)
- Empty states with clear CTAs

### Modal Patterns
- Centered modals for confirmations
- Side panels (drawers) for detail views
- Full-screen modals for complex workflows

### Loading States
- Skeleton screens for content areas
- Spinner for async actions
- Progressive loading for dashboards

## File Locations

- **Global styles**: `client/src/index.css`
- **Theme provider**: `client/src/contexts/ThemeContext.tsx`
- **White-label provider**: `client/src/contexts/WhitelabelContext.tsx`
- **UI components**: `client/src/components/ui/`
- **Shared components**: `client/src/components/shared/`
- **Dashboard components**: `client/src/components/dashboard/`
- **Section components**: `client/src/components/sections/`
