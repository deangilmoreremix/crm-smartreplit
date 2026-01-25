/**
 * Theme Manager Service
 * Handles advanced theme customization, preview, and management
 */

import { createClient } from '@supabase/supabase-js';
import { errorLogger } from '../errorLogger';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeTypography {
  fontFamily: {
    primary: string;
    secondary: string;
    monospace: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ThemeBorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ThemeAnimations {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

export interface ThemeConfig {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
  animations: ThemeAnimations;
}

export interface Theme {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  config: ThemeConfig;
  previewUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

class ThemeManager {
  /**
   * Get default theme configuration
   */
  getDefaultTheme(): ThemeConfig {
    return {
      colors: {
        primary: '#3B82F6',
        secondary: '#6366F1',
        accent: '#8B5CF6',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: {
          primary: '#111827',
          secondary: '#6B7280',
          disabled: '#9CA3AF'
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6'
      },
      typography: {
        fontFamily: {
          primary: 'Inter, system-ui, sans-serif',
          secondary: 'Georgia, serif',
          monospace: 'Fira Code, monospace'
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem'
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        },
        lineHeight: {
          tight: 1.25,
          normal: 1.5,
          relaxed: 1.75
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem'
      },
      borderRadius: {
        none: '0',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      },
      animations: {
        duration: {
          fast: '150ms',
          normal: '300ms',
          slow: '500ms'
        },
        easing: {
          linear: 'linear',
          easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
          easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
          easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
      }
    };
  }

  /**
   * Get dark theme configuration
   */
  getDarkTheme(): ThemeConfig {
    const defaultTheme = this.getDefaultTheme();
    return {
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        background: '#111827',
        surface: '#1F2937',
        text: {
          primary: '#F9FAFB',
          secondary: '#D1D5DB',
          disabled: '#6B7280'
        }
      }
    };
  }

  /**
   * Create theme
   */
  async createTheme(
    tenantId: string,
    name: string,
    config: ThemeConfig,
    createdBy: string,
    description?: string
  ): Promise<Theme> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Deactivate other themes for this tenant
      await supabase
        .from('themes')
        .update({ is_active: false })
        .eq('tenant_id', tenantId);

      // Create new theme
      const { data, error } = await supabase
        .from('themes')
        .insert({
          tenant_id: tenantId,
          name,
          description,
          is_active: true,
          config,
          created_by: createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create theme: ${error.message}`);
      }

      return this.mapDatabaseToTheme(data);

    } catch (error: any) {
      await errorLogger.logError('Theme creation failed', error, {
        tenantId,
        themeName: name
      });
      throw error;
    }
  }

  /**
   * Get active theme for tenant
   */
  async getActiveTheme(tenantId: string): Promise<Theme | null> {
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapDatabaseToTheme(data);
  }

  /**
   * List themes for tenant
   */
  async listThemes(tenantId: string): Promise<Theme[]> {
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list themes: ${error.message}`);
    }

    return (data || []).map(d => this.mapDatabaseToTheme(d));
  }

  /**
   * Update theme
   */
  async updateTheme(themeId: string, updates: Partial<Theme>): Promise<Theme> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const dbUpdates: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.config) dbUpdates.config = updates.config;
    if (updates.isActive !== undefined) {
      dbUpdates.is_active = updates.isActive;
      
      // If activating this theme, deactivate others
      if (updates.isActive) {
        const theme = await this.getTheme(themeId);
        await supabase
          .from('themes')
          .update({ is_active: false })
          .eq('tenant_id', theme.tenantId)
          .neq('id', themeId);
      }
    }

    const { data, error } = await supabase
      .from('themes')
      .update(dbUpdates)
      .eq('id', themeId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update theme: ${error.message}`);
    }

    return this.mapDatabaseToTheme(data);
  }

  /**
   * Delete theme
   */
  async deleteTheme(themeId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('themes')
      .delete()
      .eq('id', themeId);

    if (error) {
      throw new Error(`Failed to delete theme: ${error.message}`);
    }
  }

  /**
   * Get theme by ID
   */
  async getTheme(themeId: string): Promise<Theme> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .eq('id', themeId)
      .single();

    if (error || !data) {
      throw new Error('Theme not found');
    }

    return this.mapDatabaseToTheme(data);
  }

  /**
   * Generate CSS from theme configuration
   */
  generateThemeCSS(config: ThemeConfig): string {
    const css = `
:root {
  /* Colors */
  --color-primary: ${config.colors.primary};
  --color-secondary: ${config.colors.secondary};
  --color-accent: ${config.colors.accent};
  --color-background: ${config.colors.background};
  --color-surface: ${config.colors.surface};
  --color-text-primary: ${config.colors.text.primary};
  --color-text-secondary: ${config.colors.text.secondary};
  --color-text-disabled: ${config.colors.text.disabled};
  --color-success: ${config.colors.success};
  --color-warning: ${config.colors.warning};
  --color-error: ${config.colors.error};
  --color-info: ${config.colors.info};

  /* Typography */
  --font-family-primary: ${config.typography.fontFamily.primary};
  --font-family-secondary: ${config.typography.fontFamily.secondary};
  --font-family-monospace: ${config.typography.fontFamily.monospace};
  
  --font-size-xs: ${config.typography.fontSize.xs};
  --font-size-sm: ${config.typography.fontSize.sm};
  --font-size-base: ${config.typography.fontSize.base};
  --font-size-lg: ${config.typography.fontSize.lg};
  --font-size-xl: ${config.typography.fontSize.xl};
  --font-size-2xl: ${config.typography.fontSize['2xl']};
  --font-size-3xl: ${config.typography.fontSize['3xl']};
  
  --font-weight-light: ${config.typography.fontWeight.light};
  --font-weight-normal: ${config.typography.fontWeight.normal};
  --font-weight-medium: ${config.typography.fontWeight.medium};
  --font-weight-semibold: ${config.typography.fontWeight.semibold};
  --font-weight-bold: ${config.typography.fontWeight.bold};
  
  --line-height-tight: ${config.typography.lineHeight.tight};
  --line-height-normal: ${config.typography.lineHeight.normal};
  --line-height-relaxed: ${config.typography.lineHeight.relaxed};

  /* Spacing */
  --spacing-xs: ${config.spacing.xs};
  --spacing-sm: ${config.spacing.sm};
  --spacing-md: ${config.spacing.md};
  --spacing-lg: ${config.spacing.lg};
  --spacing-xl: ${config.spacing.xl};
  --spacing-2xl: ${config.spacing['2xl']};

  /* Border Radius */
  --radius-none: ${config.borderRadius.none};
  --radius-sm: ${config.borderRadius.sm};
  --radius-md: ${config.borderRadius.md};
  --radius-lg: ${config.borderRadius.lg};
  --radius-xl: ${config.borderRadius.xl};
  --radius-full: ${config.borderRadius.full};

  /* Shadows */
  --shadow-sm: ${config.shadows.sm};
  --shadow-md: ${config.shadows.md};
  --shadow-lg: ${config.shadows.lg};
  --shadow-xl: ${config.shadows.xl};

  /* Animations */
  --duration-fast: ${config.animations.duration.fast};
  --duration-normal: ${config.animations.duration.normal};
  --duration-slow: ${config.animations.duration.slow};
  
  --easing-linear: ${config.animations.easing.linear};
  --easing-ease-in: ${config.animations.easing.easeIn};
  --easing-ease-out: ${config.animations.easing.easeOut};
  --easing-ease-in-out: ${config.animations.easing.easeInOut};
}

/* Apply theme to body */
body {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background-color: var(--color-background);
}

/* Button styles */
.btn-primary {
  background-color: var(--color-primary);
  color: white;
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  font-weight: var(--font-weight-medium);
  transition: all var(--duration-normal) var(--easing-ease-in-out);
}

.btn-primary:hover {
  opacity: 0.9;
  box-shadow: var(--shadow-md);
}

/* Card styles */
.card {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

/* Input styles */
.input {
  border: 1px solid var(--color-text-disabled);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  font-size: var(--font-size-base);
  transition: border-color var(--duration-fast) var(--easing-ease-in-out);
}

.input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
    `.trim();

    return css;
  }

  /**
   * Generate Tailwind configuration from theme
   */
  generateTailwindConfig(config: ThemeConfig): Record<string, any> {
    return {
      theme: {
        extend: {
          colors: {
            primary: config.colors.primary,
            secondary: config.colors.secondary,
            accent: config.colors.accent,
            success: config.colors.success,
            warning: config.colors.warning,
            error: config.colors.error,
            info: config.colors.info
          },
          fontFamily: {
            sans: [config.typography.fontFamily.primary],
            serif: [config.typography.fontFamily.secondary],
            mono: [config.typography.fontFamily.monospace]
          },
          fontSize: config.typography.fontSize,
          fontWeight: config.typography.fontWeight,
          lineHeight: config.typography.lineHeight,
          spacing: config.spacing,
          borderRadius: config.borderRadius,
          boxShadow: config.shadows
        }
      }
    };
  }

  /**
   * Validate theme configuration
   */
  validateThemeConfig(config: ThemeConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate colors (hex format)
    const hexRegex = /^#[0-9A-F]{6}$/i;
    const colorFields = [
      config.colors.primary,
      config.colors.secondary,
      config.colors.accent,
      config.colors.background,
      config.colors.surface,
      config.colors.text.primary,
      config.colors.text.secondary,
      config.colors.text.disabled,
      config.colors.success,
      config.colors.warning,
      config.colors.error,
      config.colors.info
    ];

    colorFields.forEach((color, index) => {
      if (!hexRegex.test(color)) {
        errors.push(`Invalid color format at index ${index}: ${color}`);
      }
    });

    // Validate font sizes (rem or px)
    const sizeRegex = /^\d+(\.\d+)?(rem|px|em)$/;
    Object.entries(config.typography.fontSize).forEach(([key, value]) => {
      if (!sizeRegex.test(value)) {
        errors.push(`Invalid font size for ${key}: ${value}`);
      }
    });

    // Validate font weights (100-900)
    Object.entries(config.typography.fontWeight).forEach(([key, value]) => {
      if (value < 100 || value > 900 || value % 100 !== 0) {
        errors.push(`Invalid font weight for ${key}: ${value}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Clone theme
   */
  async cloneTheme(themeId: string, newName: string, createdBy: string): Promise<Theme> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const originalTheme = await this.getTheme(themeId);

    return await this.createTheme(
      originalTheme.tenantId,
      newName,
      originalTheme.config,
      createdBy,
      `Cloned from ${originalTheme.name}`
    );
  }

  /**
   * Export theme as JSON
   */
  exportTheme(theme: Theme): string {
    return JSON.stringify({
      name: theme.name,
      description: theme.description,
      config: theme.config
    }, null, 2);
  }

  /**
   * Import theme from JSON
   */
  async importTheme(
    tenantId: string,
    themeJson: string,
    createdBy: string
  ): Promise<Theme> {
    try {
      const parsed = JSON.parse(themeJson);

      if (!parsed.name || !parsed.config) {
        throw new Error('Invalid theme format: missing name or config');
      }

      // Validate configuration
      const validation = this.validateThemeConfig(parsed.config);
      if (!validation.valid) {
        throw new Error(`Invalid theme configuration: ${validation.errors.join(', ')}`);
      }

      return await this.createTheme(
        tenantId,
        parsed.name,
        parsed.config,
        createdBy,
        parsed.description
      );

    } catch (error: any) {
      await errorLogger.logError('Theme import failed', error, {
        tenantId
      });
      throw error;
    }
  }

  /**
   * Get theme presets
   */
  getThemePresets(): Array<{ name: string; description: string; config: ThemeConfig }> {
    return [
      {
        name: 'Default Light',
        description: 'Clean and professional light theme',
        config: this.getDefaultTheme()
      },
      {
        name: 'Default Dark',
        description: 'Modern dark theme for reduced eye strain',
        config: this.getDarkTheme()
      },
      {
        name: 'Ocean Blue',
        description: 'Calming blue tones inspired by the ocean',
        config: {
          ...this.getDefaultTheme(),
          colors: {
            ...this.getDefaultTheme().colors,
            primary: '#0EA5E9',
            secondary: '#06B6D4',
            accent: '#3B82F6'
          }
        }
      },
      {
        name: 'Forest Green',
        description: 'Natural green theme for eco-friendly brands',
        config: {
          ...this.getDefaultTheme(),
          colors: {
            ...this.getDefaultTheme().colors,
            primary: '#10B981',
            secondary: '#059669',
            accent: '#34D399'
          }
        }
      },
      {
        name: 'Sunset Orange',
        description: 'Warm and energetic orange theme',
        config: {
          ...this.getDefaultTheme(),
          colors: {
            ...this.getDefaultTheme().colors,
            primary: '#F97316',
            secondary: '#EA580C',
            accent: '#FB923C'
          }
        }
      },
      {
        name: 'Royal Purple',
        description: 'Elegant purple theme for premium brands',
        config: {
          ...this.getDefaultTheme(),
          colors: {
            ...this.getDefaultTheme().colors,
            primary: '#8B5CF6',
            secondary: '#7C3AED',
            accent: '#A78BFA'
          }
        }
      }
    ];
  }

  /**
   * Map database record to Theme
   */
  private mapDatabaseToTheme(data: any): Theme {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      description: data.description,
      isActive: data.is_active,
      config: data.config,
      previewUrl: data.preview_url,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}

// Export singleton instance
export const themeManager = new ThemeManager();
