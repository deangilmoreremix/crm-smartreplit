# 🎨 Dashboard Component Design System

## Overview
This is a comprehensive design guide for creating consistent, professional, and user-friendly dashboard components that align with our AI-powered sales enablement platform.

## 🎨 Design Principles

### 1. **Modern Glassmorphism & Dark Mode First**
- Use glass morphism effects with subtle transparency
- Dark mode as primary, light mode as alternative
- Smooth gradients and subtle shadows
- Clean, minimalist aesthetics

### 2. **Data-Driven Visual Hierarchy**
- Primary metrics prominently displayed
- Secondary information contextually grouped
- Clear visual separation between sections
- Progressive disclosure of complex data

### 3. **AI-Enhanced User Experience**
- Smart defaults and predictions
- Contextual AI suggestions
- Proactive insights and alerts
- Intelligent data visualization

---

## 📦 Component Categories

### 🏠 **Layout Components**

#### **DashboardGrid**
```jsx
// Responsive grid system for dashboard layouts
<DashboardGrid 
  columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
  gap="lg"
  adaptive={true}
/>
```

#### **DashboardCard**
```jsx
// Base card component with glassmorphism
<DashboardCard 
  variant="glass" 
  padding="lg" 
  hover={true}
  gradient="subtle"
/>
```

#### **FlexSection**
```jsx
// Flexible section container
<FlexSection 
  direction="row" 
  justify="between" 
  align="center"
  wrap={true}
/>
```

---

### 📊 **Metric Components**

#### **KPICard**
```jsx
// Key Performance Indicator display
<KPICard
  title="Monthly Revenue"
  value="$247,892"
  change={+12.5}
  trend="up"
  period="vs last month"
  icon={<DollarSign />}
  color="success"
/>
```

#### **MetricGroup**
```jsx
// Group of related metrics
<MetricGroup 
  title="Sales Performance"
  metrics={[
    { label: "Deals Closed", value: 23, change: +4 },
    { label: "Win Rate", value: "68%", change: +2.1 },
    { label: "Avg Deal Size", value: "$12.5K", change: -1.2 }
  ]}
/>
```

#### **ProgressMetric**
```jsx
// Progress towards goal
<ProgressMetric
  label="Monthly Target"
  current={247892}
  target={300000}
  format="currency"
  showPercentage={true}
/>
```

---

### 📈 **Chart Components**

#### **TrendChart**
```jsx
// Line chart for trends
<TrendChart
  data={revenueData}
  xAxis="month"
  yAxis="revenue"
  color="primary"
  smooth={true}
  showPoints={true}
/>
```

#### **ComparisonChart**
```jsx
// Bar chart for comparisons
<ComparisonChart
  data={salesData}
  categories={["Jan", "Feb", "Mar"]}
  series={["This Year", "Last Year"]}
  type="grouped"
/>
```

#### **DonutChart**
```jsx
// Donut chart for proportions
<DonutChart
  data={pipelineData}
  centerText="Total Deals"
  centerValue="156"
  showLegend={true}
/>
```

---

### 📋 **Data Components**

#### **DataTable**
```jsx
// Enhanced data table
<DataTable
  data={contacts}
  columns={[
    { key: "name", label: "Name", sortable: true },
    { key: "company", label: "Company", filterable: true },
    { key: "status", label: "Status", renderer: StatusBadge }
  ]}
  searchable={true}
  pagination={true}
  rowActions={["edit", "delete", "view"]}
/>
```

#### **ActivityFeed**
```jsx
// Real-time activity stream
<ActivityFeed
  activities={recentActivities}
  showAvatars={true}
  timeFormat="relative"
  maxItems={10}
  realTime={true}
/>
```

#### **ContactList**
```jsx
// Contact display component
<ContactList
  contacts={contacts}
  layout="grid"
  showStatus={true}
  onContactClick={handleContactView}
  aiEnhanced={true}
/>
```

---

### 🎯 **Action Components**

#### **QuickActions**
```jsx
// Fast access action buttons
<QuickActions
  actions={[
    { label: "Add Contact", icon: <Plus />, onClick: addContact },
    { label: "Create Deal", icon: <Target />, onClick: createDeal },
    { label: "Schedule Call", icon: <Phone />, onClick: scheduleCall }
  ]}
  layout="grid"
/>
```

#### **AIAssistant**
```jsx
// AI-powered assistant widget
<AIAssistant
  suggestions={aiSuggestions}
  onSuggestionClick={handleSuggestion}
  minimizable={true}
  position="bottom-right"
/>
```

#### **NotificationCenter**
```jsx
// Notification management
<NotificationCenter
  notifications={notifications}
  categories={["deals", "tasks", "system"]}
  markAsRead={markAsRead}
  clearAll={clearNotifications}
/>
```

---

### 🔍 **Input Components**

#### **SmartSearch**
```jsx
// AI-enhanced search with suggestions
<SmartSearch
  placeholder="Search contacts, deals, tasks..."
  onSearch={handleSearch}
  suggestions={searchSuggestions}
  aiPowered={true}
  filters={["contacts", "deals", "tasks"]}
/>
```

#### **FilterPanel**
```jsx
// Advanced filtering interface
<FilterPanel
  filters={[
    { type: "select", key: "status", options: statusOptions },
    { type: "date-range", key: "created", label: "Date Created" },
    { type: "number-range", key: "value", label: "Deal Value" }
  ]}
  onFilterChange={handleFilterChange}
  presets={["my-deals", "hot-leads", "overdue"]}
/>
```

---

### 📱 **Status Components**

#### **StatusBadge**
```jsx
// Status indicators
<StatusBadge
  status="active"
  variant="success"
  pulse={true}
  tooltip="Contact is active"
/>
```

#### **HealthIndicator**
```jsx
// System/pipeline health
<HealthIndicator
  level="excellent"
  metric="Pipeline Health"
  score={92}
  factors={["deal-velocity", "win-rate", "activity"]}
/>
```

#### **LoadingStates**
```jsx
// Loading placeholders
<LoadingStates
  type="skeleton"
  count={5}
  animation="pulse"
  height="60px"
/>
```

---

## 🎨 **Visual Design Tokens**

### **Colors**
```css
:root {
  /* Primary Colors */
  --primary: 230, 95%, 62%;
  --primary-foreground: 0, 0%, 100%;
  
  /* Success/Growth */
  --success: 142, 76%, 36%;
  --success-light: 142, 76%, 90%;
  
  /* Warning/Caution */
  --warning: 45, 93%, 47%;
  --warning-light: 45, 93%, 90%;
  
  /* Danger/Risk */
  --danger: 0, 84%, 60%;
  --danger-light: 0, 84%, 95%;
  
  /* Neutral Grays */
  --neutral-50: 0, 0%, 98%;
  --neutral-100: 0, 0%, 96%;
  --neutral-900: 0, 0%, 9%;
}
```

### **Gradients**
```css
/* Glass morphism backgrounds */
.glass-primary {
  background: linear-gradient(135deg, 
    hsla(230, 95%, 62%, 0.1) 0%,
    hsla(230, 95%, 82%, 0.05) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid hsla(230, 95%, 62%, 0.1);
}

.glass-success {
  background: linear-gradient(135deg,
    hsla(142, 76%, 36%, 0.1) 0%,
    hsla(142, 76%, 56%, 0.05) 100%);
}
```

### **Spacing System**
```css
:root {
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  --space-2xl: 3rem;     /* 48px */
}
```

### **Typography**
```css
:root {
  --font-heading: 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'Fira Code', monospace;
  
  /* Font Sizes */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
}
```

---

## 📐 **Layout Patterns**

### **Dashboard Header Pattern**
```jsx
<DashboardHeader>
  <HeaderLeft>
    <PageTitle>Sales Dashboard</PageTitle>
    <Breadcrumb path={["Home", "Sales", "Dashboard"]} />
  </HeaderLeft>
  <HeaderCenter>
    <SmartSearch />
  </HeaderCenter>
  <HeaderRight>
    <QuickActions />
    <NotificationCenter />
    <UserProfile />
  </HeaderRight>
</DashboardHeader>
```

### **Three-Column Layout**
```jsx
<DashboardLayout>
  <LeftSidebar width="280px">
    <Navigation />
    <RecentItems />
  </LeftSidebar>
  
  <MainContent>
    <DashboardGrid>
      <KPICards />
      <Charts />
      <DataTables />
    </DashboardGrid>
  </MainContent>
  
  <RightSidebar width="320px">
    <AIInsights />
    <ActivityFeed />
    <QuickActions />
  </RightSidebar>
</DashboardLayout>
```

### **Card Grid Pattern**
```jsx
<CardGrid columns={3} gap="lg">
  <MetricCard priority="high" />
  <ChartCard span={2} />
  <ActionCard />
  <DataCard span={3} />
</CardGrid>
```

---

## 🔄 **Interaction Patterns**

### **Hover States**
- Subtle scale transform (1.02x)
- Increased shadow depth
- Color saturation increase
- Smooth transitions (200ms ease)

### **Loading States**
- Skeleton loaders for data
- Pulse animations for metrics
- Spinner for actions
- Progressive loading for large datasets

### **Error States**
- Clear error messages
- Retry mechanisms
- Fallback content
- User guidance

---

## 📱 **Responsive Design**

### **Breakpoints**
```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

### **Mobile-First Approach**
- Stack cards vertically on mobile
- Collapsible navigation
- Touch-friendly interactions
- Optimized data tables

---

## ⚡ **Performance Guidelines**

### **Optimization Rules**
1. **Lazy Load Components** - Load heavy components only when visible
2. **Virtual Scrolling** - For large data sets
3. **Memoization** - Cache expensive calculations
4. **Image Optimization** - Use appropriate formats and sizes
5. **Bundle Splitting** - Load code on demand

### **Accessibility Standards**
- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader compatibility
- High contrast ratios
- Focus indicators

---

## 🧩 **Component Implementation Example**

### **KPICard Component**
```tsx
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'flat';
  period: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  trend,
  period,
  icon,
  color = 'primary'
}) => {
  return (
    <div className="glass-card p-6 rounded-xl hover:scale-105 transition-all">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {title}
        </h3>
        {icon && (
          <div className={`p-2 rounded-lg bg-${color}/10`}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {value}
        </p>
        
        <div className="flex items-center space-x-1">
          {trend === 'up' ? (
            <TrendingUp className="w-4 h-4 text-success" />
          ) : trend === 'down' ? (
            <TrendingDown className="w-4 h-4 text-danger" />
          ) : null}
          
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-success' : 
            trend === 'down' ? 'text-danger' : 
            'text-neutral-500'
          }`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
          
          <span className="text-sm text-neutral-500">
            {period}
          </span>
        </div>
      </div>
    </div>
  );
};
```

This design system provides the foundation for creating consistent, professional, and user-friendly dashboard components that enhance the AI-powered sales enablement experience.