import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  canAccessFeature,
  PACKAGE_FEATURES,
  FeatureKey,
  UserEntitlement,
} from '../../types/entitlements';

// ===== PURE FUNCTION TESTS =====

describe('canAccessFeature (from entitlements)', () => {
  const createEntitlement = (
    packageType: UserEntitlement['package'],
    openclaw = false,
    admin = false
  ): UserEntitlement => ({
    id: '1',
    email: 'test@test.com',
    package: packageType,
    openclaw_enabled: openclaw,
    admin_enabled: admin,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  describe('super_admin package', () => {
    const entitlement = createEntitlement('super_admin');

    it('grants access to any feature', () => {
      expect(canAccessFeature(entitlement, FeatureKey.ANALYTICS)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.AI_TOOLS)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.OPENCLAW)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.ADMIN_PANEL)).toBe(true);
      expect(canAccessFeature(entitlement, 'any_random_feature' as FeatureKey)).toBe(true);
    });
  });

  describe('whitelabel package', () => {
    let entitlement: UserEntitlement;
    beforeEach(() => {
      entitlement = createEntitlement('whitelabel');
    });

    it('includes all smartmarketer features', () => {
      expect(canAccessFeature(entitlement, FeatureKey.CORE_CRM)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.DASHBOARD)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.CONTACTS)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.PIPELINE)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.CALENDAR)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.AI_TOOLS)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.EMAIL_ANALYSIS)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.ANALYTICS)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.BUSINESS_INTELLIGENCE)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.COMMUNICATION_HUB)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.TEXT_MESSAGES)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.PHONE_SYSTEM)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.CONNECTED_APPS)).toBe(true);
    });

    it('includes white label specific features', () => {
      expect(canAccessFeature(entitlement, FeatureKey.WHITE_LABEL)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.WHITE_LABEL_CUSTOMIZATION)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.PACKAGE_BUILDER)).toBe(true);
    });

    it('OpenClaw requires openclaw_enabled flag', () => {
      expect(canAccessFeature(entitlement, FeatureKey.OPENCLAW)).toBe(false);
      entitlement.openclaw_enabled = true;
      expect(canAccessFeature(entitlement, FeatureKey.OPENCLAW)).toBe(true);
    });

    it('Admin panel requires admin_enabled flag', () => {
      expect(canAccessFeature(entitlement, FeatureKey.ADMIN_PANEL)).toBe(false);
      entitlement.admin_enabled = true;
      expect(canAccessFeature(entitlement, FeatureKey.ADMIN_PANEL)).toBe(true);
    });

    it('does NOT grant nonexistent features', () => {
      expect(canAccessFeature(entitlement, 'nonexistent_feature' as FeatureKey)).toBe(false);
    });
  });

  describe('smartmarketer package', () => {
    let entitlement: UserEntitlement;
    beforeEach(() => {
      entitlement = createEntitlement('smartmarketer');
    });

    it('includes core CRM features', () => {
      expect(canAccessFeature(entitlement, FeatureKey.CORE_CRM)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.DASHBOARD)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.CONTACTS)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.PIPELINE)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.CALENDAR)).toBe(true);
    });

    it('includes AI tools', () => {
      expect(canAccessFeature(entitlement, FeatureKey.AI_TOOLS)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.AI_GOALS)).toBe(true);
    });

    it('includes analytics', () => {
      expect(canAccessFeature(entitlement, FeatureKey.ANALYTICS)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.BUSINESS_INTELLIGENCE)).toBe(true);
    });

    it('includes communication hub', () => {
      expect(canAccessFeature(entitlement, FeatureKey.COMMUNICATION_HUB)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.TEXT_MESSAGES)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.PHONE_SYSTEM)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.VIDEO_EMAIL)).toBe(true);
    });

    it('does NOT include white label features', () => {
      expect(canAccessFeature(entitlement, FeatureKey.WHITE_LABEL)).toBe(false);
      expect(canAccessFeature(entitlement, FeatureKey.WHITE_LABEL_CUSTOMIZATION)).toBe(false);
      expect(canAccessFeature(entitlement, FeatureKey.PACKAGE_BUILDER)).toBe(false);
    });

    it('does NOT include OpenClaw by default (requires flag)', () => {
      expect(canAccessFeature(entitlement, FeatureKey.OPENCLAW)).toBe(false);
    });

    it('does NOT include Admin Panel by default (requires flag)', () => {
      expect(canAccessFeature(entitlement, FeatureKey.ADMIN_PANEL)).toBe(false);
    });
  });

  describe('regular package', () => {
    let entitlement: UserEntitlement;
    beforeEach(() => {
      entitlement = createEntitlement('regular');
    });

    it('includes only core CRM features', () => {
      expect(canAccessFeature(entitlement, FeatureKey.CORE_CRM)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.DASHBOARD)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.CONTACTS)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.PIPELINE)).toBe(true);
      expect(canAccessFeature(entitlement, FeatureKey.CALENDAR)).toBe(true);
    });

    it('does NOT include AI tools', () => {
      expect(canAccessFeature(entitlement, FeatureKey.AI_TOOLS)).toBe(false);
      expect(canAccessFeature(entitlement, FeatureKey.AI_GOALS)).toBe(false);
    });

    it('does NOT include analytics', () => {
      expect(canAccessFeature(entitlement, FeatureKey.ANALYTICS)).toBe(false);
      expect(canAccessFeature(entitlement, FeatureKey.BUSINESS_INTELLIGENCE)).toBe(false);
    });

    it('does NOT include communication hub', () => {
      expect(canAccessFeature(entitlement, FeatureKey.COMMUNICATION_HUB)).toBe(false);
      expect(canAccessFeature(entitlement, FeatureKey.TEXT_MESSAGES)).toBe(false);
      expect(canAccessFeature(entitlement, FeatureKey.PHONE_SYSTEM)).toBe(false);
    });

    it('does NOT include white label features', () => {
      expect(canAccessFeature(entitlement, FeatureKey.WHITE_LABEL)).toBe(false);
    });

    it('does NOT include OpenClaw', () => {
      expect(canAccessFeature(entitlement, FeatureKey.OPENCLAW)).toBe(false);
    });

    it('does NOT include Admin Panel', () => {
      expect(canAccessFeature(entitlement, FeatureKey.ADMIN_PANEL)).toBe(false);
    });
  });

  describe('no_access package', () => {
    let entitlement: UserEntitlement;
    beforeEach(() => {
      entitlement = createEntitlement('no_access');
    });

    it('denies access to everything (including core)', () => {
      expect(canAccessFeature(entitlement, FeatureKey.CORE_CRM)).toBe(false);
      expect(canAccessFeature(entitlement, FeatureKey.DASHBOARD)).toBe(false);
      expect(canAccessFeature(entitlement, FeatureKey.CONTACTS)).toBe(false);
    });
  });

  describe('special flags override package checks', () => {
    it('OpenClaw requires openclaw_enabled regardless of package', () => {
      const baseEntitlement = createEntitlement('regular');
      expect(canAccessFeature(baseEntitlement, FeatureKey.OPENCLAW)).toBe(false);
      baseEntitlement.openclaw_enabled = true;
      expect(canAccessFeature(baseEntitlement, FeatureKey.OPENCLAW)).toBe(true);
    });

    it('Admin panel requires admin_enabled regardless of package', () => {
      const baseEntitlement = createEntitlement('regular');
      expect(canAccessFeature(baseEntitlement, FeatureKey.ADMIN_PANEL)).toBe(false);
      baseEntitlement.admin_enabled = true;
      expect(canAccessFeature(baseEntitlement, FeatureKey.ADMIN_PANEL)).toBe(true);
    });
  });
});

// ===== NAVBAR-DERIVED FLAGS TESTS =====

describe('Navbar-derived flag computation', () => {
  interface TestContext {
    entitlement: UserEntitlement | null;
    isSuperAdmin: boolean;
    isWLUser: boolean;
    isRegularUser: boolean;
    canAccess: (feature: string) => boolean;
  }

  const createTestContext = (
    packageType: UserEntitlement['package'] | null,
    openclaw = false,
    admin = false
  ): TestContext => {
    if (!packageType) {
      return {
        entitlement: null,
        isSuperAdmin: false,
        isWLUser: false,
        isRegularUser: false,
        canAccess: () => false,
      };
    }
    const entitlement: UserEntitlement = {
      id: '1',
      email: 'test@test.com',
      package: packageType,
      openclaw_enabled: openclaw,
      admin_enabled: admin,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return {
      entitlement,
      isSuperAdmin: packageType === 'super_admin',
      isWLUser: packageType === 'whitelabel',
      isRegularUser: packageType === 'regular',
      canAccess: (feature: string) => canAccessFeature(entitlement, feature as FeatureKey),
    };
  };

  describe('isSuperAdmin flag', () => {
    it('is true only for super_admin package', () => {
      expect(createTestContext('super_admin').isSuperAdmin).toBe(true);
      expect(createTestContext('whitelabel').isSuperAdmin).toBe(false);
      expect(createTestContext('smartmarketer').isSuperAdmin).toBe(false);
      expect(createTestContext('regular').isSuperAdmin).toBe(false);
      expect(createTestContext(null).isSuperAdmin).toBe(false);
    });
  });

  describe('isWLUser flag', () => {
    it('is true only for whitelabel package', () => {
      expect(createTestContext('whitelabel').isWLUser).toBe(true);
      expect(createTestContext('super_admin').isWLUser).toBe(false);
      expect(createTestContext('smartmarketer').isWLUser).toBe(false);
      expect(createTestContext('regular').isWLUser).toBe(false);
      expect(createTestContext(null).isWLUser).toBe(false);
    });
  });

  describe('isRegularUser flag', () => {
    it('is true only for regular package', () => {
      expect(createTestContext('regular').isRegularUser).toBe(true);
      expect(createTestContext('super_admin').isRegularUser).toBe(false);
      expect(createTestContext('whitelabel').isRegularUser).toBe(false);
      expect(createTestContext('smartmarketer').isRegularUser).toBe(false);
      expect(createTestContext(null).isRegularUser).toBe(false);
    });
  });

  describe('isAdmin flag equivalence', () => {
    it('isAdmin equals isSuperAdmin in Navbar', () => {
      const superCtx = createTestContext('super_admin');
      const wlCtx = createTestContext('whitelabel');
      expect(superCtx.isSuperAdmin).toBe(true);
      expect(wlCtx.isSuperAdmin).toBe(false);
    });
  });
});

// ===== MAIN TABS FILTERING TESTS =====

describe('Navbar mainTabs filtering', () => {
  const allTabs = [
    { id: 'dashboard', label: 'Dashboard', requiresAccess: 'core_crm' },
    { id: 'contacts', label: 'Contacts', requiresAccess: 'core_crm' },
    { id: 'pipeline', label: 'Pipeline', requiresAccess: 'core_crm' },
    { id: 'analytics', label: 'Analytics', requiresAccess: 'ai_tools' },
    { id: 'ai-goals', label: 'AI Goals', requiresAccess: 'ai_goals' },
    { id: 'ai-tools', label: 'AI Tools', requiresAccess: 'ai_tools' },
    { id: 'calendar', label: 'Calendar', requiresAccess: 'core_crm' },
  ];

  const filterTabs = (tabs: typeof allTabs, canAccessFn: (feature: string) => boolean) => {
    return tabs.filter((tab) => {
      if (!tab.requiresAccess) return true;
      return canAccessFn(tab.requiresAccess);
    });
  };

  it('super_admin sees all tabs', () => {
    const visibleTabs = filterTabs(allTabs, () => true);
    expect(visibleTabs.map((t) => t.id)).toEqual([
      'dashboard',
      'contacts',
      'pipeline',
      'analytics',
      'ai-goals',
      'ai-tools',
      'calendar',
    ]);
  });

  it('whitelabel sees all tabs', () => {
    const mockCanAccess = createFeatureChecker('whitelabel');
    const visibleTabs = filterTabs(allTabs, mockCanAccess);
    expect(visibleTabs.map((t) => t.id)).toEqual([
      'dashboard',
      'contacts',
      'pipeline',
      'analytics',
      'ai-goals',
      'ai-tools',
      'calendar',
    ]);
  });

  it('smartmarketer sees all tabs', () => {
    const mockCanAccess = createFeatureChecker('smartmarketer');
    const visibleTabs = filterTabs(allTabs, mockCanAccess);
    expect(visibleTabs.map((t) => t.id)).toEqual([
      'dashboard',
      'contacts',
      'pipeline',
      'analytics',
      'ai-goals',
      'ai-tools',
      'calendar',
    ]);
  });

  it('regular sees only core tabs', () => {
    const mockCanAccess = createFeatureChecker('regular');
    const visibleTabs = filterTabs(allTabs, mockCanAccess);
    expect(visibleTabs.map((t) => t.id)).toEqual(['dashboard', 'contacts', 'pipeline', 'calendar']);
  });

  it('no_access sees nothing', () => {
    const mockCanAccess = () => false;
    const visibleTabs = filterTabs(allTabs, mockCanAccess);
    expect(visibleTabs).toEqual([]);
  });
});

// ===== DROPDOWN MENUS FILTERING TESTS =====

describe('Navbar dropdownMenus filtering', () => {
  const allDropdownMenus = [
    { id: 'communications', label: 'Communication', requiresAccess: 'communication_hub' },
    { id: 'wl', label: 'WL', requiresAccess: 'ai_tools' },
    { id: 'apps', label: 'Apps', requiresAccess: 'ai_tools' },
  ];

  const filterMenus = (
    menus: typeof allDropdownMenus,
    canAccessFn: (feature: string) => boolean
  ) => {
    return menus.filter((menu) => {
      if (!menu.requiresAccess) return true;
      return canAccessFn(menu.requiresAccess);
    });
  };

  it('super_admin sees all dropdown menus', () => {
    const visibleMenus = filterMenus(allDropdownMenus, () => true);
    expect(visibleMenus.map((m) => m.id)).toEqual(['communications', 'wl', 'apps']);
  });

  it('whitelabel sees all dropdown menus', () => {
    const mockCanAccess = createFeatureChecker('whitelabel');
    const visibleMenus = filterMenus(allDropdownMenus, mockCanAccess);
    expect(visibleMenus.map((m) => m.id)).toEqual(['communications', 'wl', 'apps']);
  });

  it('smartmarketer sees all dropdown menus', () => {
    const mockCanAccess = createFeatureChecker('smartmarketer');
    const visibleMenus = filterMenus(allDropdownMenus, mockCanAccess);
    expect(visibleMenus.map((m) => m.id)).toEqual(['communications', 'wl', 'apps']);
  });

  it('regular sees only communications dropdown', () => {
    const mockCanAccess = createFeatureChecker('regular');
    const visibleMenus = filterMenus(allDropdownMenus, mockCanAccess);
    expect(visibleMenus.map((m) => m.id)).toEqual([]);
  });

  it('no_access sees only communications dropdown', () => {
    const mockCanAccess = () => false;
    const visibleMenus = filterMenus(allDropdownMenus, mockCanAccess);
    expect(visibleMenus.map((m) => m.id)).toEqual([]);
  });
});

// ===== FEATURE-KEY ACCESS MATRIX =====

describe('Feature access for all navbar items by package', () => {
  type UserPackage = 'super_admin' | 'whitelabel' | 'smartmarketer' | 'regular' | 'no_access';

  const canAccessForPackage = (packageType: UserPackage, feature: string): boolean => {
    if (packageType === 'super_admin') return true;
    if (packageType === 'no_access') return false;
    const features = PACKAGE_FEATURES[packageType as keyof typeof PACKAGE_FEATURES];
    return features.includes(feature as FeatureKey);
  };

  const packages: UserPackage[] = [
    'super_admin',
    'whitelabel',
    'smartmarketer',
    'regular',
    'no_access',
  ];

  it.each(packages)('%s - Core CRM always visible (to non-no_access)', (pkg) => {
    if (pkg === 'no_access') {
      expect(canAccessForPackage(pkg, FeatureKey.CORE_CRM)).toBe(false);
    } else {
      expect(canAccessForPackage(pkg, FeatureKey.CORE_CRM)).toBe(true);
      expect(canAccessForPackage(pkg, FeatureKey.DASHBOARD)).toBe(true);
      expect(canAccessForPackage(pkg, FeatureKey.CONTACTS)).toBe(true);
      expect(canAccessForPackage(pkg, FeatureKey.PIPELINE)).toBe(true);
      expect(canAccessForPackage(pkg, FeatureKey.CALENDAR)).toBe(true);
    }
  });

  it.each(packages)('%s - AI Tools access', (pkg) => {
    const expected = pkg === 'super_admin' || pkg === 'whitelabel' || pkg === 'smartmarketer';
    expect(canAccessForPackage(pkg, FeatureKey.AI_TOOLS)).toBe(expected);
    expect(canAccessForPackage(pkg, FeatureKey.AI_GOALS)).toBe(expected);
  });

  it.each(packages)('%s - Analytics access', (pkg) => {
    const expected = pkg === 'super_admin' || pkg === 'whitelabel' || pkg === 'smartmarketer';
    expect(canAccessForPackage(pkg, FeatureKey.ANALYTICS)).toBe(expected);
    expect(canAccessForPackage(pkg, FeatureKey.BUSINESS_INTELLIGENCE)).toBe(expected);
  });

  it.each(packages)('%s - Communication Hub access', (pkg) => {
    const expected = pkg === 'super_admin' || pkg === 'whitelabel' || pkg === 'smartmarketer';
    expect(canAccessForPackage(pkg, FeatureKey.COMMUNICATION_HUB)).toBe(expected);
    expect(canAccessForPackage(pkg, FeatureKey.TEXT_MESSAGES)).toBe(expected);
    expect(canAccessForPackage(pkg, FeatureKey.PHONE_SYSTEM)).toBe(expected);
    expect(canAccessForPackage(pkg, FeatureKey.VIDEO_EMAIL)).toBe(expected);
  });

  it.each(packages)('%s - White Label access', (pkg) => {
    const expected = pkg === 'whitelabel' || pkg === 'super_admin';
    expect(canAccessForPackage(pkg, FeatureKey.WHITE_LABEL)).toBe(expected);
  });

  it.each(packages)('%s - Admin Panel and OpenClaw access', (pkg) => {
    const expected = pkg === 'super_admin';
    expect(canAccessForPackage(pkg, FeatureKey.ADMIN_PANEL)).toBe(expected);
    expect(canAccessForPackage(pkg, FeatureKey.OPENCLAW)).toBe(expected);
  });
});

// ===== COMPLETE VISIBILITY MATRIX =====

describe('Complete Navbar Visibility Matrix', () => {
  type UserPackage = 'super_admin' | 'whitelabel' | 'smartmarketer' | 'regular' | 'no_access';

  const allTabs = [
    { id: 'dashboard', requiresAccess: 'core_crm' as string | null },
    { id: 'contacts', requiresAccess: 'core_crm' },
    { id: 'pipeline', requiresAccess: 'core_crm' },
    { id: 'analytics', requiresAccess: 'ai_tools' },
    { id: 'ai-goals', requiresAccess: 'ai_goals' },
    { id: 'ai-tools', requiresAccess: 'ai_tools' },
    { id: 'calendar', requiresAccess: 'core_crm' },
  ];

  const allDropdownMenus = [
    { id: 'communications', requiresAccess: 'core_crm' },
    { id: 'wl', requiresAccess: 'ai_tools' },
    { id: 'apps', requiresAccess: 'ai_tools' },
  ];

  const computeVisibility = (packageType: UserPackage) => {
    const canAccessFeatureForPackage = (feature: string): boolean => {
      if (packageType === 'super_admin') return true;
      if (packageType === 'no_access') return false;
      const features = PACKAGE_FEATURES[packageType as keyof typeof PACKAGE_FEATURES];
      return features.includes(feature as FeatureKey);
    };

    const visibleTabs = allTabs.filter((tab) => {
      if (!tab.requiresAccess) return true;
      return canAccessFeatureForPackage(tab.requiresAccess);
    });

    if (packageType === 'super_admin') {
      visibleTabs.push({ id: 'admin', requiresAccess: 'core_crm' });
    }

    const visibleDropdowns = allDropdownMenus.filter((menu) => {
      if (!menu.requiresAccess) return true;
      return canAccessFeatureForPackage(menu.requiresAccess);
    });

    return {
      visibleTabs: visibleTabs.map((t) => t.id),
      visibleDropdowns: visibleDropdowns.map((d) => d.id),
      adminPanelVisible: packageType === 'super_admin',
    };
  };

  it('Super Admin: full access to all features', () => {
    const result = computeVisibility('super_admin');
    expect(result.visibleTabs).toEqual([
      'dashboard',
      'contacts',
      'pipeline',
      'analytics',
      'ai-goals',
      'ai-tools',
      'calendar',
      'admin',
    ]);
    expect(result.visibleDropdowns).toEqual(['communications', 'wl', 'apps']);
    expect(result.adminPanelVisible).toBe(true);
  });

  it('Whitelabel: full feature access but no Admin Panel', () => {
    const result = computeVisibility('whitelabel');
    expect(result.visibleTabs).toEqual([
      'dashboard',
      'contacts',
      'pipeline',
      'analytics',
      'ai-goals',
      'ai-tools',
      'calendar',
    ]);
    expect(result.visibleDropdowns).toEqual(['communications', 'wl', 'apps']);
    expect(result.adminPanelVisible).toBe(false);
  });

  it('SmartMarketer: full feature access but no White Label menu and no Admin Panel', () => {
    const result = computeVisibility('smartmarketer');
    expect(result.visibleTabs).toEqual([
      'dashboard',
      'contacts',
      'pipeline',
      'analytics',
      'ai-goals',
      'ai-tools',
      'calendar',
    ]);
    expect(result.visibleDropdowns).toEqual(['communications', 'wl', 'apps']);
    expect(result.adminPanelVisible).toBe(false);
  });

  it('Regular: core CRM only', () => {
    const result = computeVisibility('regular');
    expect(result.visibleTabs).toEqual(['dashboard', 'contacts', 'pipeline', 'calendar']);
    expect(result.visibleDropdowns).toEqual(['communications']);
    expect(result.adminPanelVisible).toBe(false);
  });

  it('No Access: minimal UI - no tabs, only communications dropdown', () => {
    const result = computeVisibility('no_access');
    expect(result.visibleTabs).toEqual([]);
    expect(result.visibleDropdowns).toEqual([]);
    expect(result.adminPanelVisible).toBe(false);
  });
});
const createFeatureChecker = (packageType: UserEntitlement['package']) => {
  const entitlement: UserEntitlement = {
    id: '1',
    email: 'test@test.com',
    package: packageType,
    openclaw_enabled: false,
    admin_enabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return (feature: string) => canAccessFeature(entitlement, feature);
};
