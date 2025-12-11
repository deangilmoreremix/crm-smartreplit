# Dashboard Design System & Coding Structure

## Overview
Your CRM dashboard uses a modern design system built with:
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for consistent component library
- **CSS Custom Properties** for theming
- **React + TypeScript** for component structure

## Design Architecture

### 1. Color System (CSS Variables)
```css
/* Located in client/src/index.css */

/* Light Theme */
:root {
  --background: 0 0% 100%;           /* White background */
  --foreground: 222.2 84% 4.9%;      /* Dark text */
  --card: 0 0% 100%;                 /* Card backgrounds */
  --primary: 222.2 47.4% 11.2%;      /* Primary brand color */
  --secondary: 210 40% 96%;          /* Secondary elements */
  --muted: 210 40% 96%;              /* Muted backgrounds */
  --border: 214.3 31.8% 91.4%;      /* Border colors */
}

/* Dark Theme */
.dark {
  --background: 222.2 84% 4.9%;      /* Dark background */
  --foreground: 210 40% 98%;         /* Light text */
  --card: 222.2 84% 4.9%;            /* Dark cards */
  --primary: 217.2 91.2% 59.8%;      /* Bright primary */
}
```

### 2. Component Structure
```typescript
// Dashboard Layout Pattern
const Dashboard = () => {
  return (
    <div className="space-y-6 p-6">              {/* Container */}
      <div className="flex justify-between">      {/* Header */}
        <h1 className="text-3xl font-bold">Title</h1>
        <Button>Action</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6"> {/* Metrics Grid */}
        <Card>...</Card>
        <Card>...</Card>
      </div>
      
      <Tabs defaultValue="overview">             {/* Tabbed Content */}
        <TabsList>...</TabsList>
        <TabsContent>...</TabsContent>
      </Tabs>
    </div>
  );
};
```

### 3. Card Component Pattern
```typescript
<Card className="p-6">
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle className="text-sm font-medium">Metric Name</CardTitle>
    <Icon className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{value}</div>
    <p className="text-xs text-muted-foreground">
      <TrendingUp className="inline h-3 w-3 mr-1" />
      Change indicator
    </p>
  </CardContent>
</Card>
```

## Key Design Elements

### 1. Typography Scale
- **Headlines**: `text-3xl font-bold` (Dashboard titles)
- **Card Titles**: `text-sm font-medium` (Metric labels)  
- **Values**: `text-2xl font-bold` (Key numbers)
- **Descriptions**: `text-xs text-muted-foreground` (Helper text)

### 2. Spacing System
- **Container**: `space-y-6 p-6` (24px gaps, 24px padding)
- **Grid Gaps**: `gap-6` (24px between grid items)
- **Card Padding**: `p-6` (24px internal padding)

### 3. Grid Layouts
```typescript
// Responsive metric cards
"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"

// Two-column layout
"grid grid-cols-1 lg:grid-cols-2 gap-6"

// Full-width sections
"col-span-1 lg:col-span-2"
```

### 4. Color Usage Patterns
- **Backgrounds**: `bg-white dark:bg-gray-900`
- **Cards**: `bg-white dark:bg-gray-800`
- **Text**: `text-gray-900 dark:text-white`
- **Muted Text**: `text-gray-600 dark:text-gray-400`
- **Borders**: `border border-gray-200 dark:border-gray-700`

## Interactive Elements

### 1. Buttons
```typescript
<Button className="bg-blue-600 hover:bg-blue-700">
  Primary Action
</Button>
```

### 2. Tabs
```typescript
<Tabs defaultValue="overview" className="space-y-6">
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="overview">Overview</TabsTrigger>
  </TabsList>
</Tabs>
```

### 3. Select Dropdowns
```typescript
<Select value={timeRange} onValueChange={setTimeRange}>
  <SelectTrigger className="w-40">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="30">Last 30 days</SelectItem>
  </SelectContent>
</Select>
```

## Chart Styling

### 1. Recharts Integration
```typescript
<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
    <Area 
      type="monotone" 
      dataKey="revenue" 
      stroke="#3B82F6"     // Blue-500
      fill="#3B82F6" 
      fillOpacity={0.1}
    />
  </AreaChart>
</ResponsiveContainer>
```

### 2. Chart Colors
- **Primary**: `#3B82F6` (Blue-500)
- **Success**: `#10B981` (Green-500)
- **Warning**: `#F59E0B` (Yellow-500)
- **Error**: `#EF4444` (Red-500)

## Responsive Design

### 1. Breakpoints
- **Mobile**: Default (`grid-cols-1`)
- **Tablet**: `md:` prefix (`md:grid-cols-2`)
- **Desktop**: `lg:` prefix (`lg:grid-cols-4`)

### 2. Mobile-First Approach
```typescript
className="
  grid 
  grid-cols-1          // Mobile: 1 column
  md:grid-cols-2       // Tablet: 2 columns  
  lg:grid-cols-4       // Desktop: 4 columns
  gap-6                // 24px gaps on all sizes
"
```

## Animation & Transitions

### 1. Smooth Transitions
```css
/* Applied to specific elements */
h1, h2, h3, button, a {
  transition: color 0.2s ease;
}

button, .interactive {
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
```

### 2. Loading States
```typescript
{isLoading && (
  <div className="flex items-center justify-center h-96">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500" />
  </div>
)}
```

## File Structure
```
client/src/
├── index.css                    # Global styles & CSS variables
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── Dashboard.tsx            # Main dashboard component
│   └── analytics/
│       └── SalesPerformanceDashboard.tsx
├── pages/
│   ├── Dashboard.tsx            # Dashboard page wrapper
│   └── AnalyticsDashboard.tsx   # Analytics page
└── styles/
    └── design-system.css        # Custom design tokens
```

This design system ensures consistency across your entire CRM while maintaining flexibility for customization!