import { profiles, type Profile, type InsertProfile, partners, type Partner, type InsertPartner, partnerTiers, type PartnerTier, partnerMetrics, partnerCustomers, commissions, type Commission, payouts, type Payout, featurePackages, type FeaturePackage, contacts, tenantConfigs, type TenantConfig, type InsertTenantConfig, userWLSettings, type UserWLSettings, type InsertUserWLSettings, partnerWLConfigs, type PartnerWLConfig, type InsertPartnerWLConfig, whiteLabelPackages, type WhiteLabelPackage, features, type Feature, type InsertFeature, userFeatures, type UserFeature, type InsertUserFeature } from "../shared/schema.js";
import { eq, desc, sql, and } from "drizzle-orm";
import { db } from "./db";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByUsername(username: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile & { id: string }): Promise<Profile>;
  getAllProfiles(): Promise<Profile[]>;
  updateProfile(id: string, updates: Partial<Profile>): Promise<Profile>;
  
  // Backward compatibility - alias Profile methods as User methods
  getUser(id: string): Promise<Profile | undefined>;
  getUserByUsername(username: string): Promise<Profile | undefined>;
  createUser(user: InsertProfile & { id: string }): Promise<Profile>;

  // Partner Management Methods
  getPartners(): Promise<Partner[]>;
  getPartner(id: string): Promise<Partner | undefined>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  updatePartner(id: string, updates: Partial<Partner>): Promise<Partner | undefined>;
  getPartnerStats(partnerId: string): Promise<any>;
  getPartnerCustomers(partnerId: string): Promise<any[]>;
  getPartnerCommissions(partnerId: string): Promise<Commission[]>;
  getPartnerTiers(): Promise<PartnerTier[]>;
  getFeaturePackages(): Promise<FeaturePackage[]>;
  createFeaturePackage(pkg: any): Promise<FeaturePackage>;
  getRevenueAnalytics(): Promise<any>;

  // White Label Storage Methods
  getTenantConfig(tenantId: string): Promise<TenantConfig | undefined>;
  createTenantConfig(config: InsertTenantConfig): Promise<TenantConfig>;
  updateTenantConfig(tenantId: string, updates: Partial<TenantConfig>): Promise<TenantConfig | undefined>;
  getUserWLSettings(userId: string): Promise<UserWLSettings | undefined>;
  createUserWLSettings(settings: InsertUserWLSettings): Promise<UserWLSettings>;
  updateUserWLSettings(userId: string, updates: Partial<UserWLSettings>): Promise<UserWLSettings | undefined>;
  getPartnerWLConfig(partnerId: string): Promise<PartnerWLConfig | undefined>;
  createPartnerWLConfig(config: InsertPartnerWLConfig): Promise<PartnerWLConfig>;
  updatePartnerWLConfig(partnerId: string, updates: Partial<PartnerWLConfig>): Promise<PartnerWLConfig | undefined>;
  getWhiteLabelPackages(): Promise<WhiteLabelPackage[]>;

  // Feature Management Methods
  getAllFeatures(): Promise<Feature[]>;
  getFeatureById(id: number): Promise<Feature | undefined>;
  getFeatureByKey(featureKey: string): Promise<Feature | undefined>;
  createFeature(feature: InsertFeature): Promise<Feature>;
  updateFeature(id: number, updates: Partial<Feature>): Promise<Feature | undefined>;
  deleteFeature(id: number): Promise<void>;
  getUserFeatures(userId: string): Promise<UserFeature[]>;
  setUserFeature(userId: string, featureId: number, enabled: boolean, grantedBy?: string): Promise<UserFeature>;
  removeUserFeature(userId: string, featureId: number): Promise<void>;
  bulkSetUserFeatures(userId: string, featureIds: number[], enabled: boolean, grantedBy?: string): Promise<UserFeature[]>;
}

// Database Storage Implementation using Supabase
export class DatabaseStorage implements IStorage {
  private db: any;

  constructor(dbConnection: any) {
    this.db = dbConnection;
  }

  async getProfile(id: string): Promise<Profile | undefined> {
    const [profile] = await this.db.select().from(profiles).where(eq(profiles.id, id));
    return profile || undefined;
  }

  async getProfileByUsername(username: string): Promise<Profile | undefined> {
    const [profile] = await this.db.select().from(profiles).where(eq(profiles.username, username));
    return profile || undefined;
  }

  async createProfile(insertProfile: InsertProfile & { id: string }): Promise<Profile> {
    const [profile] = await this.db
      .insert(profiles)
      .values(insertProfile)
      .returning();
    return profile;
  }

  async getAllProfiles(): Promise<Profile[]> {
    return await this.db.select().from(profiles);
  }

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    const [profile] = await this.db
      .update(profiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    
    if (!profile) {
      throw new Error(`Profile with id ${id} not found`);
    }
    return profile;
  }

  // Backward compatibility methods
  async getUser(id: string): Promise<Profile | undefined> {
    return this.getProfile(id);
  }

  async getUserByUsername(username: string): Promise<Profile | undefined> {
    return this.getProfileByUsername(username);
  }

  async createUser(user: InsertProfile & { id: string }): Promise<Profile> {
    return this.createProfile(user);
  }

  // Partner Management Methods
  async getPartners(): Promise<Partner[]> {
    return await this.db.select().from(partners).orderBy(partners.createdAt);
  }

  async getPartner(id: string): Promise<Partner | undefined> {
    const [partner] = await this.db.select().from(partners).where(eq(partners.id, id));
    return partner || undefined;
  }

  async createPartner(partner: InsertPartner): Promise<Partner> {
    const [newPartner] = await this.db
      .insert(partners)
      .values(partner)
      .returning();
    return newPartner;
  }

  async updatePartner(id: string, updates: Partial<Partner>): Promise<Partner | undefined> {
    const [partner] = await this.db
      .update(partners)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(partners.id, id))
      .returning();
    return partner || undefined;
  }

  async getPartnerStats(partnerId: string): Promise<any> {
    const partner = await this.getPartner(partnerId);
    if (!partner) return null;

    // Get latest metrics for the partner
    const [latestMetric] = await this.db
      .select()
      .from(partnerMetrics)
      .where(eq(partnerMetrics.partnerId, partnerId))
      .orderBy(desc(partnerMetrics.year), desc(partnerMetrics.month))
      .limit(1);

    return {
      totalRevenue: partner.totalRevenue,
      totalCommissions: partner.totalCommissions,
      customerCount: partner.customerCount,
      conversionRate: latestMetric?.conversionRate || 0.15,
      monthlyGrowth: 0.08,
      tier: partner.tier,
      commissionRate: partner.commissionRate,
      status: partner.status
    };
  }

  async getPartnerCustomers(partnerId: string): Promise<any[]> {
    const customers = await this.db
      .select({
        id: partnerCustomers.customerId,
        name: sql`concat(${contacts.firstName}, ' ', ${contacts.lastName})`.as('name'),
        email: contacts.email,
        value: partnerCustomers.lifetime_value,
        status: partnerCustomers.status,
        acquisitionDate: partnerCustomers.acquisitionDate
      })
      .from(partnerCustomers)
      .innerJoin(contacts, eq(partnerCustomers.customerId, contacts.id))
      .where(eq(partnerCustomers.partnerId, partnerId));

    return customers;
  }

  async getPartnerCommissions(partnerId: string): Promise<Commission[]> {
    return await this.db
      .select()
      .from(commissions)
      .where(eq(commissions.partnerId, partnerId))
      .orderBy(desc(commissions.createdAt));
  }

  async getPartnerTiers(): Promise<PartnerTier[]> {
    return await this.db
      .select()
      .from(partnerTiers)
      .where(eq(partnerTiers.isActive, true))
      .orderBy(partnerTiers.priority);
  }

  async getFeaturePackages(): Promise<FeaturePackage[]> {
    return await this.db
      .select()
      .from(featurePackages)
      .where(eq(featurePackages.isActive, true))
      .orderBy(featurePackages.createdAt);
  }

  async createFeaturePackage(pkg: any): Promise<FeaturePackage> {
    const [featurePackage] = await this.db
      .insert(featurePackages)
      .values({
        name: pkg.name,
        description: pkg.description || null,
        features: pkg.features || [],
        price: pkg.price || null,
        billingCycle: pkg.billingCycle || 'monthly',
        isActive: pkg.isActive !== undefined ? pkg.isActive : true,
        targetTier: pkg.targetTier || null
      })
      .returning();
    return featurePackage;
  }

  async getRevenueAnalytics(): Promise<any> {
    const partners = await this.getPartners();
    const totalRevenue = partners.reduce((sum, p) => sum + parseFloat(p.totalRevenue || '0'), 0);
    const totalCommissions = partners.reduce((sum, p) => sum + parseFloat(p.totalCommissions || '0'), 0);
    const totalCustomers = partners.reduce((sum, p) => sum + (p.customerCount || 0), 0);

    return {
      totalRevenue,
      totalCommissions,
      totalPartners: partners.length,
      activePartners: partners.filter(p => p.status === 'active').length,
      totalCustomers,
      averageCommissionRate: 0.20,
      monthlyGrowth: 0.12,
      topPerformingTier: 'gold',
      metrics: {
        revenue: {
          current: totalRevenue,
          previousMonth: totalRevenue * 0.9,
          growth: 0.10
        },
        commissions: {
          current: totalCommissions,
          previousMonth: totalCommissions * 0.9,
          growth: 0.10
        },
        partners: {
          current: partners.length,
          previousMonth: Math.max(1, partners.length - 1),
          growth: partners.length > 1 ? 0.05 : 0
        }
      }
    };
  }

  // White Label Storage Methods for DatabaseStorage
  async getTenantConfig(tenantId: string): Promise<TenantConfig | undefined> {
    const [config] = await this.db
      .select()
      .from(tenantConfigs)
      .where(eq(tenantConfigs.tenantId, tenantId));
    return config || undefined;
  }

  async createTenantConfig(config: InsertTenantConfig): Promise<TenantConfig> {
    const [tenantConfig] = await this.db
      .insert(tenantConfigs)
      .values(config)
      .returning();
    return tenantConfig;
  }

  async updateTenantConfig(tenantId: string, updates: Partial<TenantConfig>): Promise<TenantConfig | undefined> {
    const [config] = await this.db
      .update(tenantConfigs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tenantConfigs.tenantId, tenantId))
      .returning();
    return config || undefined;
  }

  async getUserWLSettings(userId: string): Promise<UserWLSettings | undefined> {
    const [settings] = await this.db
      .select()
      .from(userWLSettings)
      .where(eq(userWLSettings.userId, userId));
    return settings || undefined;
  }

  async createUserWLSettings(settings: InsertUserWLSettings): Promise<UserWLSettings> {
    const [userSettings] = await this.db
      .insert(userWLSettings)
      .values(settings)
      .returning();
    return userSettings;
  }

  async updateUserWLSettings(userId: string, updates: Partial<UserWLSettings>): Promise<UserWLSettings | undefined> {
    const [settings] = await this.db
      .update(userWLSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userWLSettings.userId, userId))
      .returning();
    return settings || undefined;
  }

  async getPartnerWLConfig(partnerId: string): Promise<PartnerWLConfig | undefined> {
    const [config] = await this.db
      .select()
      .from(partnerWLConfigs)
      .where(eq(partnerWLConfigs.partnerId, partnerId));
    return config || undefined;
  }

  async createPartnerWLConfig(config: InsertPartnerWLConfig): Promise<PartnerWLConfig> {
    const [partnerConfig] = await this.db
      .insert(partnerWLConfigs)
      .values(config)
      .returning();
    return partnerConfig;
  }

  async updatePartnerWLConfig(partnerId: string, updates: Partial<PartnerWLConfig>): Promise<PartnerWLConfig | undefined> {
    const [config] = await this.db
      .update(partnerWLConfigs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(partnerWLConfigs.partnerId, partnerId))
      .returning();
    return config || undefined;
  }

  async getWhiteLabelPackages(): Promise<WhiteLabelPackage[]> {
    return await this.db
      .select()
      .from(whiteLabelPackages)
      .where(eq(whiteLabelPackages.isActive, true))
      .orderBy(whiteLabelPackages.createdAt);
  }

  // Feature Management Methods
  async getAllFeatures(): Promise<Feature[]> {
    return await this.db.select().from(features).orderBy(features.category, features.name);
  }

  async getFeatureById(id: number): Promise<Feature | undefined> {
    const [feature] = await this.db.select().from(features).where(eq(features.id, id));
    return feature || undefined;
  }

  async getFeatureByKey(featureKey: string): Promise<Feature | undefined> {
    const [feature] = await this.db.select().from(features).where(eq(features.featureKey, featureKey));
    return feature || undefined;
  }

  async createFeature(feature: InsertFeature): Promise<Feature> {
    const [newFeature] = await this.db.insert(features).values(feature).returning();
    return newFeature;
  }

  async updateFeature(id: number, updates: Partial<Feature>): Promise<Feature | undefined> {
    const [feature] = await this.db.update(features).set({ ...updates, updatedAt: new Date() }).where(eq(features.id, id)).returning();
    return feature || undefined;
  }

  async deleteFeature(id: number): Promise<void> {
    await this.db.delete(features).where(eq(features.id, id));
  }

  async getUserFeatures(userId: string): Promise<UserFeature[]> {
    return await this.db.select().from(userFeatures).where(eq(userFeatures.profileId, userId));
  }

  async setUserFeature(userId: string, featureId: number, enabled: boolean, grantedBy?: string): Promise<UserFeature> {
    const existing = await this.db.select().from(userFeatures).where(and(eq(userFeatures.profileId, userId), eq(userFeatures.featureId, featureId)));
    
    if (existing.length > 0) {
      const [updated] = await this.db.update(userFeatures).set({ enabled, grantedBy: grantedBy || null }).where(and(eq(userFeatures.profileId, userId), eq(userFeatures.featureId, featureId))).returning();
      return updated;
    } else {
      const [newUserFeature] = await this.db.insert(userFeatures).values({ profileId: userId, featureId, enabled, grantedBy: grantedBy || null }).returning();
      return newUserFeature;
    }
  }

  async removeUserFeature(userId: string, featureId: number): Promise<void> {
    await this.db.delete(userFeatures).where(and(eq(userFeatures.profileId, userId), eq(userFeatures.featureId, featureId)));
  }

  async bulkSetUserFeatures(userId: string, featureIds: number[], enabled: boolean, grantedBy?: string): Promise<UserFeature[]> {
    const results: UserFeature[] = [];
    for (const featureId of featureIds) {
      const result = await this.setUserFeature(userId, featureId, enabled, grantedBy);
      results.push(result);
    }
    return results;
  }
}

export class MemStorage implements IStorage {
  private profiles: Map<string, Profile>;
  private partners: Map<string, Partner>;
  private partnerTiers: Map<string, PartnerTier>;
  private commissions: Map<string, Commission>;
  private featurePackages: Map<string, FeaturePackage>;
  private tenantConfigs: Map<string, TenantConfig>;
  private userWLSettings: Map<string, UserWLSettings>;
  private partnerWLConfigs: Map<string, PartnerWLConfig>;
  private whiteLabelPackages: Map<string, WhiteLabelPackage>;

  constructor() {
    this.profiles = new Map();
    this.partners = new Map();
    this.partnerTiers = new Map();
    this.commissions = new Map();
    this.featurePackages = new Map();
    this.tenantConfigs = new Map();
    this.userWLSettings = new Map();
    this.partnerWLConfigs = new Map();
    this.whiteLabelPackages = new Map();
    
    // Initialize with test data for role migration testing
    this.initializeTestData();
    this.initializePartnerTestData();
  }

  private initializeTestData() {
    const testProfiles: Profile[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        username: 'dean',
        firstName: 'Dean',
        lastName: 'Smith',
        role: 'user', // Will be migrated to super_admin
        productTier: 'super_admin',
        avatar: null,
        appContext: 'smartcrm',
        emailTemplateSet: 'smartcrm',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        username: 'victor',
        firstName: 'Victor',
        lastName: 'Johnson',
        role: 'user', // Will be migrated to super_admin
        productTier: 'super_admin',
        avatar: null,
        appContext: 'smartcrm',
        emailTemplateSet: 'smartcrm',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        username: 'samuel',
        firstName: 'Samuel',
        lastName: 'Wilson',
        role: 'user', // Will be migrated to super_admin
        productTier: 'super_admin',
        avatar: null,
        appContext: 'smartcrm',
        emailTemplateSet: 'smartcrm',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        username: 'jane.doe',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'admin', // Will be migrated to wl_user
        productTier: 'whitelabel',
        avatar: null,
        appContext: 'smartcrm',
        emailTemplateSet: 'smartcrm',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        username: 'john.smith',
        firstName: 'John',
        lastName: 'Smith',
        role: 'customer_admin', // Will be migrated to wl_user
        productTier: 'smartcrm',
        avatar: null,
        appContext: 'smartcrm',
        emailTemplateSet: 'smartcrm',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    testProfiles.forEach(profile => {
      this.profiles.set(profile.id, profile);
    });
  }

  private initializePartnerTestData() {
    // Initialize Partner Tiers
    const tiers: PartnerTier[] = [
      {
        id: 'tier-bronze',
        name: 'Bronze Partner',
        slug: 'bronze',
        commissionRate: '15.00',
        minimumRevenue: '0.00',
        features: ['Basic CRM Access', 'Email Support', 'Partner Portal'],
        benefits: ['15% commission', 'Basic marketing materials'],
        color: '#CD7F32',
        priority: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tier-silver',
        name: 'Silver Partner',
        slug: 'silver',
        commissionRate: '20.00',
        minimumRevenue: '5000.00',
        features: ['Advanced CRM Access', 'Priority Support', 'Custom Branding'],
        benefits: ['20% commission', 'Co-marketing opportunities'],
        color: '#C0C0C0',
        priority: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tier-gold',
        name: 'Gold Partner',
        slug: 'gold',
        commissionRate: '25.00',
        minimumRevenue: '15000.00',
        features: ['Premium CRM Access', 'Dedicated Support', 'White Label'],
        benefits: ['25% commission', 'Joint sales opportunities'],
        color: '#FFD700',
        priority: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    tiers.forEach(tier => this.partnerTiers.set(tier.id, tier));

    // Initialize Test Partners
    const testPartners: Partner[] = [
      {
        id: 'partner-001',
        companyName: 'TechSolutions Inc.',
        contactName: 'John Smith',
        contactEmail: 'john@techsolutions.com',
        phone: '+1-555-123-4567',
        website: 'https://techsolutions.com',
        businessType: 'Technology Consulting',
        status: 'active',
        tier: 'silver',
        commissionRate: '20.00',
        totalRevenue: '8500.00',
        totalCommissions: '1700.00',
        customerCount: 12,
        brandingConfig: {
          logo: '/assets/partners/techsolutions-logo.png',
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF'
        },
        contractDetails: {
          startDate: '2024-01-15',
          contractDuration: '12 months',
          autoRenewal: true
        },
        payoutSettings: {
          method: 'bank_transfer',
          frequency: 'monthly',
          minimumPayout: 100
        },
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date(),
        profileId: '550e8400-e29b-41d4-a716-446655440000'
      }
    ];

    testPartners.forEach(partner => this.partners.set(partner.id, partner));

    // Initialize Feature Packages
    const packages: FeaturePackage[] = [
      {
        id: 'pkg-basic',
        name: 'Basic CRM Package',
        description: 'Essential CRM features for small businesses',
        features: ['Contact Management', 'Deal Tracking', 'Basic Reporting'],
        price: '29.99',
        billingCycle: 'monthly',
        isActive: true,
        targetTier: 'bronze',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    packages.forEach(pkg => this.featurePackages.set(pkg.id, pkg));
    console.log(`Initialized ${this.partnerTiers.size} partner tiers, ${this.partners.size} partners, ${this.featurePackages.size} feature packages`);
  }

  async getProfile(id: string): Promise<Profile | undefined> {
    return this.profiles.get(id);
  }

  async getProfileByUsername(username: string): Promise<Profile | undefined> {
    return Array.from(this.profiles.values()).find(
      (profile) => profile.username === username,
    );
  }

  async createProfile(insertProfile: InsertProfile & { id: string }): Promise<Profile> {
    const profile: Profile = { 
      id: insertProfile.id,
      username: insertProfile.username || null,
      firstName: insertProfile.firstName || null,
      lastName: insertProfile.lastName || null,
      role: insertProfile.role || null,
      avatar: insertProfile.avatar || null,
      appContext: 'smartcrm',
      emailTemplateSet: 'smartcrm',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.profiles.set(insertProfile.id, profile);
    return profile;
  }

  // Backward compatibility methods
  async getUser(id: string): Promise<Profile | undefined> {
    return this.getProfile(id);
  }

  async getUserByUsername(username: string): Promise<Profile | undefined> {
    return this.getProfileByUsername(username);
  }

  async createUser(user: InsertProfile & { id: string }): Promise<Profile> {
    return this.createProfile(user);
  }

  async getAllProfiles(): Promise<Profile[]> {
    return Array.from(this.profiles.values());
  }

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    const existing = this.profiles.get(id);
    if (!existing) {
      throw new Error(`Profile with id ${id} not found`);
    }
    
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    
    this.profiles.set(id, updated);
    return updated;
  }

  // Partner Management Methods Implementation
  async getPartners(): Promise<Partner[]> {
    return Array.from(this.partners.values());
  }

  async getPartner(id: string): Promise<Partner | undefined> {
    return this.partners.get(id);
  }

  async createPartner(insertPartner: InsertPartner): Promise<Partner> {
    const id = 'partner-' + Date.now();
    const partner: Partner = {
      id,
      companyName: insertPartner.companyName,
      contactName: insertPartner.contactName,
      contactEmail: insertPartner.contactEmail,
      phone: insertPartner.phone || null,
      website: insertPartner.website || null,
      businessType: insertPartner.businessType || null,
      status: insertPartner.status || 'pending',
      tier: insertPartner.tier || 'bronze',
      commissionRate: insertPartner.commissionRate || '15.00',
      totalRevenue: insertPartner.totalRevenue || '0.00',
      totalCommissions: insertPartner.totalCommissions || '0.00',
      customerCount: insertPartner.customerCount || 0,
      brandingConfig: insertPartner.brandingConfig || null,
      contractDetails: insertPartner.contractDetails || null,
      payoutSettings: insertPartner.payoutSettings || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      profileId: insertPartner.profileId || null
    };
    this.partners.set(id, partner);
    return partner;
  }

  async updatePartner(id: string, updates: Partial<Partner>): Promise<Partner | undefined> {
    const existing = this.partners.get(id);
    if (!existing) return undefined;
    
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.partners.set(id, updated);
    return updated;
  }

  async getPartnerStats(partnerId: string): Promise<any> {
    const partner = this.partners.get(partnerId);
    if (!partner) return null;

    return {
      partnerId,
      totalRevenue: partner.totalRevenue,
      totalCommissions: partner.totalCommissions,
      customerCount: partner.customerCount,
      conversionRate: 0.15,
      monthlyGrowth: 0.08,
      tier: partner.tier,
      commissionRate: partner.commissionRate,
      status: partner.status
    };
  }

  async getPartnerCustomers(partnerId: string): Promise<any[]> {
    // Mock customer data for development
    return [
      {
        id: 'customer-001',
        name: 'Acme Corp',
        email: 'contact@acme.com',
        value: 2500,
        status: 'active',
        acquisitionDate: '2024-01-15'
      }
    ];
  }

  async getPartnerCommissions(partnerId: string): Promise<Commission[]> {
    return Array.from(this.commissions.values()).filter(
      commission => commission.partnerId === partnerId
    );
  }

  async getPartnerTiers(): Promise<PartnerTier[]> {
    return Array.from(this.partnerTiers.values()).sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }

  async getFeaturePackages(): Promise<FeaturePackage[]> {
    return Array.from(this.featurePackages.values());
  }

  async createFeaturePackage(pkg: any): Promise<FeaturePackage> {
    const id = 'pkg-' + Date.now();
    const featurePackage: FeaturePackage = {
      id,
      name: pkg.name,
      description: pkg.description || null,
      features: pkg.features || [],
      price: pkg.price || null,
      billingCycle: pkg.billingCycle || 'monthly',
      isActive: pkg.isActive !== undefined ? pkg.isActive : true,
      targetTier: pkg.targetTier || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.featurePackages.set(id, featurePackage);
    return featurePackage;
  }

  async getRevenueAnalytics(): Promise<any> {
    const partners = Array.from(this.partners.values());
    const totalRevenue = partners.reduce((sum, p) => sum + parseFloat(p.totalRevenue || '0'), 0);
    const totalCommissions = partners.reduce((sum, p) => sum + parseFloat(p.totalCommissions || '0'), 0);
    const totalCustomers = partners.reduce((sum, p) => sum + (p.customerCount || 0), 0);

    return {
      totalRevenue,
      totalCommissions,
      totalPartners: partners.length,
      activePartners: partners.filter(p => p.status === 'active').length,
      totalCustomers,
      averageCommissionRate: 0.20,
      monthlyGrowth: 0.12,
      topPerformingTier: 'gold',
      metrics: {
        revenue: {
          current: totalRevenue,
          previousMonth: totalRevenue * 0.9,
          growth: 0.10
        },
        commissions: {
          current: totalCommissions,
          previousMonth: totalCommissions * 0.9,
          growth: 0.10
        },
        partners: {
          current: partners.length,
          previousMonth: Math.max(1, partners.length - 1),
          growth: partners.length > 1 ? 0.05 : 0
        }
      }
    };
  }

  // White Label Storage Methods for MemStorage
  async getTenantConfig(tenantId: string): Promise<TenantConfig | undefined> {
    return this.tenantConfigs.get(tenantId);
  }

  async createTenantConfig(config: InsertTenantConfig): Promise<TenantConfig> {
    const id = config.tenantId || 'tenant-' + Date.now();
    const tenantConfig: TenantConfig = {
      id: 'tc-' + Date.now(),
      tenantId: id,
      companyName: config.companyName || '',
      logo: config.logo || null,
      favicon: config.favicon || null,
      primaryColor: config.primaryColor || '#3B82F6',
      secondaryColor: config.secondaryColor || '#1E40AF',
      accentColor: config.accentColor || '#10B981',
      backgroundColor: config.backgroundColor || '#FFFFFF',
      textColor: config.textColor || '#1F2937',
      customDomain: config.customDomain || null,
      customCSS: config.customCSS || null,
      emailFromName: config.emailFromName || null,
      emailReplyTo: config.emailReplyTo || null,
      emailSignature: config.emailSignature || null,
      brandingConfig: config.brandingConfig || null,
      features: config.features || null,
      profileId: config.profileId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tenantConfigs.set(id, tenantConfig);
    return tenantConfig;
  }

  async updateTenantConfig(tenantId: string, updates: Partial<TenantConfig>): Promise<TenantConfig | undefined> {
    const existing = this.tenantConfigs.get(tenantId);
    if (!existing) return undefined;
    
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.tenantConfigs.set(tenantId, updated);
    return updated;
  }

  async getUserWLSettings(userId: string): Promise<UserWLSettings | undefined> {
    return this.userWLSettings.get(userId);
  }

  async createUserWLSettings(settings: InsertUserWLSettings): Promise<UserWLSettings> {
    const userSettings: UserWLSettings = {
      id: 'wl-' + Date.now(),
      userId: settings.userId,
      customBranding: settings.customBranding || null,
      enabledFeatures: settings.enabledFeatures || [],
      preferences: settings.preferences || null,
      settings: settings.settings || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.userWLSettings.set(settings.userId, userSettings);
    return userSettings;
  }

  async updateUserWLSettings(userId: string, updates: Partial<UserWLSettings>): Promise<UserWLSettings | undefined> {
    const existing = this.userWLSettings.get(userId);
    if (!existing) return undefined;
    
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.userWLSettings.set(userId, updated);
    return updated;
  }

  async getPartnerWLConfig(partnerId: string): Promise<PartnerWLConfig | undefined> {
    return this.partnerWLConfigs.get(partnerId);
  }

  async createPartnerWLConfig(config: InsertPartnerWLConfig): Promise<PartnerWLConfig> {
    const partnerConfig: PartnerWLConfig = {
      id: 'pwl-' + Date.now(),
      partnerId: config.partnerId,
      companyName: config.companyName || '',
      logo: config.logo || null,
      primaryColor: config.primaryColor || '#3B82F6',
      secondaryColor: config.secondaryColor || '#1E40AF',
      customDomain: config.customDomain || null,
      emailFromName: config.emailFromName || null,
      emailReplyTo: config.emailReplyTo || null,
      brandingConfig: config.brandingConfig || null,
      features: config.features || null,
      profileId: config.profileId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.partnerWLConfigs.set(config.partnerId, partnerConfig);
    return partnerConfig;
  }

  async updatePartnerWLConfig(partnerId: string, updates: Partial<PartnerWLConfig>): Promise<PartnerWLConfig | undefined> {
    const existing = this.partnerWLConfigs.get(partnerId);
    if (!existing) return undefined;
    
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.partnerWLConfigs.set(partnerId, updated);
    return updated;
  }

  async getWhiteLabelPackages(): Promise<WhiteLabelPackage[]> {
    return Array.from(this.whiteLabelPackages.values()).filter(pkg => pkg.isActive);
  }

  // Feature Management Methods (MemStorage stubs - use DatabaseStorage for real feature management)
  async getAllFeatures(): Promise<Feature[]> {
    return [];
  }

  async getFeatureById(id: number): Promise<Feature | undefined> {
    return undefined;
  }

  async getFeatureByKey(featureKey: string): Promise<Feature | undefined> {
    return undefined;
  }

  async createFeature(feature: InsertFeature): Promise<Feature> {
    throw new Error('Feature management requires DatabaseStorage - not available in MemStorage');
  }

  async updateFeature(id: number, updates: Partial<Feature>): Promise<Feature | undefined> {
    return undefined;
  }

  async deleteFeature(id: number): Promise<void> {
    // No-op
  }

  async getUserFeatures(userId: string): Promise<UserFeature[]> {
    return [];
  }

  async setUserFeature(userId: string, featureId: number, enabled: boolean, grantedBy?: string): Promise<UserFeature> {
    throw new Error('Feature management requires DatabaseStorage - not available in MemStorage');
  }

  async removeUserFeature(userId: string, featureId: number): Promise<void> {
    // No-op
  }

  async bulkSetUserFeatures(userId: string, featureIds: number[], enabled: boolean, grantedBy?: string): Promise<UserFeature[]> {
    return [];
  }
}

// Use DatabaseStorage if DATABASE_URL is available, otherwise fall back to MemStorage
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage(db)
  : new MemStorage();
