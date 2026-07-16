# Enhanced Branding UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add logo upload with Supabase storage, font selection dropdown, custom CSS injection, and enhanced live preview to the white-label customization page.

**Architecture:** Extend the existing `WhiteLabelCustomization.tsx` component with new UI controls for logo upload, font selection, and custom CSS. Enhance the `BrandingPreview` component to apply these settings. All state flows through the existing `WhitelabelContext`.

**Tech Stack:** React, TypeScript, shadcn/ui, Supabase Storage, lucide-react, Tailwind CSS

## Global Constraints

- Do NOT create new pages or routes
- Do NOT modify server code
- Use existing UI component patterns (shadcn/ui)
- Match existing code style (TypeScript, React functional components)
- Use existing toast/notification system for errors
- Keep all changes in the existing file where possible

---

### Task 1: Logo Upload with Preview and Supabase Storage

**Files:**
- Modify: `client/src/pages/WhiteLabelCustomization.tsx`

**Interfaces:**
- Consumes: `WhitelabelConfig`, `useWhitelabel`, `useToast`, `supabase` from `../lib/supabase`
- Produces: Updated logo upload UI with file input, preview, and Supabase upload

- [ ] **Step 1: Add logo upload state and handler**

In `WhiteLabelCustomization.tsx`, add state for logo upload:

```tsx
const [logoPreview, setLogoPreview] = useState<string | null>(null);
const [isUploadingLogo, setIsUploadingLogo] = useState(false);
```

Add the upload handler after existing handlers:

```tsx
const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    toast({
      title: 'Invalid File Type',
      description: 'Please upload PNG, JPG, SVG, or WebP',
      variant: 'destructive',
    });
    return;
  }

  setIsUploadingLogo(true);
  try {
    const { supabase } = await import('../lib/supabase');
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `whitelabel/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('whitelabel-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('whitelabel-assets').getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    updatePreviewConfig({ logoUrl: publicUrl });
    setLogoPreview(publicUrl);

    toast({
      title: 'Logo Uploaded',
      description: 'Logo uploaded successfully',
    });
  } catch (error) {
    console.error('Logo upload failed:', error);
    toast({
      title: 'Upload Failed',
      description: error instanceof Error ? error.message : 'Failed to upload logo. Please use URL instead.',
      variant: 'destructive',
    });
  } finally {
    setIsUploadingLogo(false);
  }
};
```

- [ ] **Step 2: Replace logo URL input with upload component**

In the Visual Assets card, replace the existing logo URL input with:

```tsx
<div>
  <Label htmlFor="logoUpload">Logo</Label>
  <div className="mt-1 space-y-2">
    {(previewConfig.logoUrl || logoPreview) && (
      <div className="flex items-center gap-3 p-2 border rounded-lg bg-muted/50">
        <img
          src={logoPreview || previewConfig.logoUrl}
          alt="Logo preview"
          className="h-10 w-10 object-contain rounded"
        />
        <span className="text-sm text-muted-foreground flex-1 truncate">
          {logoPreview ? 'Uploaded logo' : previewConfig.logoUrl}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setLogoPreview(null);
            updatePreviewConfig({ logoUrl: '' });
          }}
          className="text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )}
    <div className="flex items-center gap-2">
      <Input
        id="logoUpload"
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        onChange={handleLogoUpload}
        disabled={isUploadingLogo}
        className="flex-1"
      />
      {isUploadingLogo && <span className="text-sm text-muted-foreground">Uploading...</span>}
    </div>
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">Or enter URL</span>
      </div>
    </div>
    <Input
      value={previewConfig.logoUrl || ''}
      onChange={(e) => {
        setLogoPreview(null);
        updatePreviewConfig({ logoUrl: e.target.value });
      }}
      placeholder="https://your-logo.png"
    />
  </div>
</div>
```

- [ ] **Step 3: Verify logo upload works**

Run: `pnpm dev` in client directory
Expected: Logo upload input appears, file upload triggers Supabase upload, preview updates on success

---

### Task 2: Font Selection Dropdown

**Files:**
- Modify: `client/src/pages/WhiteLabelCustomization.tsx`

**Interfaces:**
- Consumes: `WhitelabelConfig`, `useWhitelabel`, `useToast`, existing `Select` UI components
- Produces: Font selector dropdown that updates `fontFamily` in config

- [ ] **Step 1: Add font options constant and state**

At the top of the component, add:

```tsx
const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Default)' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  { value: 'system-ui', label: 'System UI' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
] as const;
```

- [ ] **Step 2: Add font selector to the Branding tab**

In the Branding tab, add a new GlassCard after the Visual Assets card:

```tsx
<GlassCard>
  <CardHeader>
    <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
      <Type className="h-5 w-5 mr-2 text-orange-500" />
      Typography
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div>
      <Label htmlFor="fontFamily">Font Family</Label>
      <Select
        value={previewConfig.fontFamily || 'Inter'}
        onValueChange={(value) => updatePreviewConfig({ fontFamily: value })}
      >
        <SelectTrigger id="fontFamily" className="mt-1">
          <SelectValue placeholder="Select a font" />
        </SelectTrigger>
        <SelectContent>
          {FONT_OPTIONS.map((font) => (
            <SelectItem key={font.value} value={font.value}>
              {font.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </CardContent>
</GlassCard>
```

- [ ] **Step 3: Verify font selector works**

Expected: Dropdown appears, selecting a font updates preview and config

---

### Task 3: Custom CSS Injection

**Files:**
- Modify: `client/src/pages/WhiteLabelCustomization.tsx`

**Interfaces:**
- Consumes: `WhitelabelConfig`, `useWhitelabel`, `useToast`, existing `Textarea` UI component
- Produces: CSS textarea with validation and injection into preview

- [ ] **Step 1: Add CSS validation and size check state**

Add state near other state declarations:

```tsx
const [cssError, setCssError] = useState<string | null>(null);
```

Add validation helper:

```tsx
const validateCss = (css: string): string | null => {
  if (!css.trim()) return null;
  if (css.length > 10240) {
    return 'CSS exceeds 10KB limit. Please reduce the size.';
  }
  try {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    document.head.removeChild(style);
    return null;
  } catch {
    return 'Invalid CSS syntax detected.';
  }
};
```

- [ ] **Step 2: Add CSS textarea to Content tab**

In the Content tab, add a new GlassCard after the CTA Buttons card:

```tsx
<GlassCard>
  <CardHeader>
    <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
      <FileText className="h-5 w-5 mr-2 text-teal-500" />
      Custom CSS
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-2">
    <Textarea
      value={previewConfig.customCss || ''}
      onChange={(e) => {
        const error = validateCss(e.target.value);
        setCssError(error);
        updatePreviewConfig({ customCss: e.target.value });
      }}
      placeholder="/* Add custom CSS here */&#10;.custom-class {&#10;  color: red;&#10;}"
      rows={8}
      className={`font-mono text-sm ${cssError ? 'border-red-500' : ''}`}
    />
    {cssError && (
      <p className="text-sm text-red-500">{cssError}</p>
    )}
    {previewConfig.customCss && previewConfig.customCss.length > 7000 && (
      <p className="text-sm text-yellow-600">Warning: CSS is large and may impact performance.</p>
    )}
  </CardContent>
</GlassCard>
```

- [ ] **Step 3: Verify CSS injection works**

Expected: CSS textarea appears, valid CSS applies in preview, validation errors show for invalid CSS

---

### Task 4: Enhanced Live Preview

**Files:**
- Modify: `client/src/pages/WhiteLabelCustomization.tsx`

**Interfaces:**
- Consumes: `previewConfig`, `previewDevice`, all new state from previous tasks
- Produces: Enhanced `BrandingPreview` with font, CSS injection, favicon, realistic mockup

- [ ] **Step 1: Update preview header to show favicon and better layout**

Update the Preview Header section:

```tsx
{/* Preview Header */}
<div
  className="h-16 flex items-center justify-between px-6 shadow-sm"
  style={{
    background: `linear-gradient(to right, ${previewConfig.primaryColor}, ${previewConfig.secondaryColor})`,
  }}
>
  <div className="flex items-center space-x-3">
    {previewConfig.logoUrl && (
      <img
        src={previewConfig.logoUrl}
        alt="Logo"
        className="h-8 w-8 object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    )}
    <span
      className="text-white font-bold text-lg"
      style={{ fontFamily: previewConfig.fontFamily || 'Inter, sans-serif' }}
    >
      {previewConfig.companyName || 'SmartCRM'}
    </span>
  </div>
  <div className="flex items-center space-x-4">
    {previewConfig.faviconUrl && (
      <link rel="icon" href={previewConfig.faviconUrl} />
    )}
    <span className="text-white/80">Features</span>
    <span className="text-white/80">Pricing</span>
    <span className="text-white/80">Contact</span>
  </div>
</div>
```

- [ ] **Step 2: Inject custom CSS and apply font to preview body**

Update the preview container:

```tsx
<div
  className={`bg-white transition-all duration-300 ${
    previewDevice === 'mobile'
      ? 'w-80 mx-auto'
      : previewDevice === 'tablet'
        ? 'w-96 mx-auto'
        : 'w-full'
  }`}
  style={{
    transform:
      previewDevice === 'mobile'
        ? 'scale(0.8)'
        : previewDevice === 'tablet'
          ? 'scale(0.9)'
          : 'scale(1)',
    transformOrigin: 'top center',
    fontFamily: previewConfig.fontFamily || 'Inter, sans-serif',
  }}
>
  {previewConfig.customCss && (
    <style>{previewConfig.customCss}</style>
  )}
  {/* existing preview content */}
```

- [ ] **Step 3: Improve preview hero section**

Update the hero to be more realistic:

```tsx
{/* Preview Hero */}
<div className="px-6 py-16 text-center bg-gray-50">
  <h1
    className="text-4xl font-bold text-gray-900 mb-4"
    style={{ fontFamily: previewConfig.fontFamily || 'Inter, sans-serif' }}
  >
    {previewConfig.heroTitle || 'Transform Your Sales Process with AI'}
  </h1>
  <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">
    {previewConfig.heroSubtitle || 'SmartCRM combines powerful sales tools with advanced AI capabilities.'}
  </p>
  <div className="flex justify-center space-x-4">
    {previewConfig.ctaButtons?.filter(b => b.enabled).map((button, idx) => (
      <button
        key={button.id || idx}
        className="px-6 py-3 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-shadow"
        style={{
          background: button.color || `linear-gradient(to right, ${previewConfig.primaryColor}, ${previewConfig.secondaryColor})`,
          fontFamily: previewConfig.fontFamily || 'Inter, sans-serif',
        }}
      >
        {button.text}
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 4: Verify enhanced preview**

Expected: Preview shows selected font, custom CSS applies, favicon appears in header, hero renders CTA buttons from config

---

### Task 5: Build and Type Check

**Files:**
- Modify: `client/src/pages/WhiteLabelCustomization.tsx`

**Interfaces:**
- Consumes: All previous changes
- Produces: Verified build with no TypeScript errors

- [ ] **Step 1: Run TypeScript check**

Run: `cd client && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 2: Run build**

Run: `cd client && pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Run lint**

Run: `cd client && pnpm lint`
Expected: No lint errors in modified file
