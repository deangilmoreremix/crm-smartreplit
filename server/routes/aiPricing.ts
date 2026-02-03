import type { Express, Request, Response } from "express";
import { requireAuth, requireAdmin, requireRole } from "../auth.js";
import { AIPricingService } from "../services/aiPricingService.js";
import { db } from "../db.js";
import { aiFeatureDefinitions, aiResellerPricing, aiFeatureUsage } from "../../shared/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";

export function registerAIPricingRoutes(app: Express): void {
  // ==========================================================================
  // Super Admin Routes
  // ==========================================================================

  // Get all AI feature definitions (admin view)
  app.get("/api/admin/ai-features", requireAdmin, async (req: Request, res: Response) => {
    try {
      const features = await db
        .select()
        .from(aiFeatureDefinitions)
        .orderBy(aiFeatureDefinitions.category, aiFeatureDefinitions.featureName);

      res.json({
        success: true,
        features: features.map(f => ({
          id: f.id,
          featureKey: f.featureKey,
          featureName: f.featureName,
          description: f.description,
          category: f.category,
          baseCreditCost: f.baseCreditCost,
          minCreditCost: f.minCreditCost,
          maxCreditCost: f.maxCreditCost,
          isActive: f.isActive,
        })),
      });
    } catch (error) {
      console.error("Error fetching AI features:", error);
      res.status(500).json({ success: false, error: "Failed to fetch AI features" });
    }
  });

  // Update AI feature base pricing (Super Admin only)
  app.put("/api/admin/ai-features/:featureKey", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { featureKey } = req.params;
      const { baseCreditCost, minCreditCost, maxCreditCost, isActive } = req.body;

      await AIPricingService.setFeatureBasePrice(featureKey, {
        baseCreditCost,
        minCreditCost,
        maxCreditCost,
        isActive,
      });

      res.json({ success: true, message: "Feature updated successfully" });
    } catch (error) {
      console.error("Error updating AI feature:", error);
      res.status(500).json({ success: false, error: "Failed to update feature" });
    }
  });

  // Get platform-wide analytics (Super Admin only)
  app.get("/api/admin/ai-analytics", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      // Get total usage stats
      const usageStats = await db
        .select({
          totalUsage: sql<number>`count(*)`,
          totalRevenue: sql<number>`sum(${aiFeatureUsage.creditsCharged})`,
          totalPlatformRevenue: sql<number>`sum(${aiFeatureUsage.creditsPaidToPlatform})`,
          totalResellerProfit: sql<number>`sum(${aiFeatureUsage.resellerProfitCredits})`,
        })
        .from(aiFeatureUsage);

      // Get feature breakdown
      const featureBreakdown = await db
        .select({
          featureKey: aiFeatureUsage.featureKey,
          usageCount: sql<number>`count(*)`,
          totalCredits: sql<number>`sum(${aiFeatureUsage.creditsCharged})`,
        })
        .from(aiFeatureUsage)
        .groupBy(aiFeatureUsage.featureKey)
        .orderBy(desc(sql<number>`count(*)`));

      // Get top resellers
      const topResellers = await db
        .select({
          resellerId: aiFeatureUsage.resellerId,
          usageCount: sql<number>`count(*)`,
          totalRevenue: sql<number>`sum(${aiFeatureUsage.creditsCharged})`,
        })
        .from(aiFeatureUsage)
        .where(sql`${aiFeatureUsage.resellerId} IS NOT NULL`)
        .groupBy(aiFeatureUsage.resellerId)
        .orderBy(desc(sql<number>`count(*)`))
        .limit(10);

      res.json({
        success: true,
        analytics: {
          summary: usageStats[0] || {
            totalUsage: 0,
            totalRevenue: 0,
            totalPlatformRevenue: 0,
            totalResellerProfit: 0,
          },
          featureBreakdown,
          topResellers,
        },
      });
    } catch (error) {
      console.error("Error fetching AI analytics:", error);
      res.status(500).json({ success: false, error: "Failed to fetch analytics" });
    }
  });

  // ==========================================================================
  // Reseller Routes
  // ==========================================================================

  // Get reseller's pricing configuration
  app.get("/api/reseller/ai-pricing", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId || req.user?.id;
      const userRole = req.user?.role || req.session?.userRole;

      // Only whitelabel/reseller users can access this
      if (userRole !== "whitelabel" && userRole !== "reseller" && userRole !== "super_admin") {
        return res.status(403).json({ success: false, error: "Access denied" });
      }

      const features = await AIPricingService.getAIFeaturesWithPricing(
        userId,
        userRole,
        userId // For resellers, they see their own pricing
      );

      // Get current credit balance
      const creditBalance = await AIPricingService.getResellerCreditBalance(userId);

      res.json({
        success: true,
        features,
        creditBalance,
      });
    } catch (error) {
      console.error("Error fetching reseller pricing:", error);
      res.status(500).json({ success: false, error: "Failed to fetch pricing" });
    }
  });

  // Update reseller's pricing for a feature
  app.put("/api/reseller/ai-pricing/:featureKey", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId || req.user?.id;
      const userRole = req.user?.role || req.session?.userRole;
      const { featureKey } = req.params;
      const { retailCreditCost, wholesaleCreditCost } = req.body;

      // Only whitelabel/reseller users can update pricing
      if (userRole !== "whitelabel" && userRole !== "reseller" && userRole !== "super_admin") {
        return res.status(403).json({ success: false, error: "Access denied" });
      }

      // Validate price is within allowed range
      const feature = await db
        .select()
        .from(aiFeatureDefinitions)
        .where(eq(aiFeatureDefinitions.featureKey, featureKey))
        .limit(1);

      if (feature.length === 0) {
        return res.status(404).json({ success: false, error: "Feature not found" });
      }

      const { minCreditCost, maxCreditCost } = feature[0];

      if (retailCreditCost < minCreditCost || retailCreditCost > maxCreditCost) {
        return res.status(400).json({
          success: false,
          error: `Retail price must be between ${minCreditCost} and ${maxCreditCost} credits`,
        });
      }

      await AIPricingService.setResellerPricing(
        userId,
        featureKey,
        retailCreditCost,
        wholesaleCreditCost
      );

      res.json({ success: true, message: "Pricing updated successfully" });
    } catch (error) {
      console.error("Error updating reseller pricing:", error);
      res.status(500).json({ success: false, error: "Failed to update pricing" });
    }
  });

  // Get reseller analytics
  app.get("/api/reseller/ai-analytics", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId || req.user?.id;
      const userRole = req.user?.role || req.session?.userRole;

      if (userRole !== "whitelabel" && userRole !== "reseller" && userRole !== "super_admin") {
        return res.status(403).json({ success: false, error: "Access denied" });
      }

      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const analytics = await AIPricingService.getResellerUsageAnalytics(userId, start, end);

      res.json({
        success: true,
        analytics,
      });
    } catch (error) {
      console.error("Error fetching reseller analytics:", error);
      res.status(500).json({ success: false, error: "Failed to fetch analytics" });
    }
  });

  // Purchase wholesale credits (for resellers)
  app.post("/api/reseller/purchase-credits", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId || req.user?.id;
      const userRole = req.user?.role || req.session?.userRole;
      const { creditsAmount, paymentMethodId } = req.body;

      if (userRole !== "whitelabel" && userRole !== "reseller" && userRole !== "super_admin") {
        return res.status(403).json({ success: false, error: "Access denied" });
      }

      // Calculate cost (wholesale price = 50% of retail)
      // For simplicity, assume 1 credit = 1 cent wholesale
      const costCents = creditsAmount;

      // In production, this would charge via Stripe
      // const paymentIntent = await stripe.paymentIntents.create({...})

      await AIPricingService.purchaseWholesaleCredits(
        userId,
        creditsAmount,
        costCents,
        `demo_txn_${Date.now()}`
      );

      res.json({
        success: true,
        message: `Successfully purchased ${creditsAmount} wholesale credits`,
        creditsPurchased: creditsAmount,
        costCents,
      });
    } catch (error) {
      console.error("Error purchasing wholesale credits:", error);
      res.status(500).json({ success: false, error: "Failed to purchase credits" });
    }
  });

  // ==========================================================================
  // End User Routes
  // ==========================================================================

  // Get AI features with pricing (for end users)
  app.get("/api/ai-features", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId || req.user?.id;
      const userRole = req.user?.role || req.session?.userRole;
      const resellerId = req.user?.resellerId || req.session?.resellerId;

      const features = await AIPricingService.getAIFeaturesWithPricing(
        userId,
        userRole,
        resellerId
      );

      res.json({
        success: true,
        features: features.map(f => ({
          featureKey: f.featureKey,
          featureName: f.featureName,
          description: f.description,
          category: f.category,
          creditCost: f.retailPrice, // End users see retail price
        })),
      });
    } catch (error) {
      console.error("Error fetching AI features:", error);
      res.status(500).json({ success: false, error: "Failed to fetch AI features" });
    }
  });

  // Get feature cost (with user's specific pricing)
  app.get("/api/ai-features/:featureKey/cost", requireAuth, async (req: Request, res: Response) => {
    try {
      const { featureKey } = req.params;
      const userId = req.session?.userId || req.user?.id;
      const userRole = req.user?.role || req.session?.userRole;
      const resellerId = req.user?.resellerId || req.session?.resellerId;

      const features = await AIPricingService.getAIFeaturesWithPricing(
        userId,
        userRole,
        resellerId
      );

      const feature = features.find(f => f.featureKey === featureKey);

      if (!feature) {
        return res.status(404).json({ success: false, error: "Feature not found" });
      }

      res.json({
        success: true,
        featureKey: feature.featureKey,
        featureName: feature.featureName,
        creditCost: feature.retailPrice,
        userCurrency: "credits",
      });
    } catch (error) {
      console.error("Error fetching feature cost:", error);
      res.status(500).json({ success: false, error: "Failed to fetch cost" });
    }
  });

  // Check if user can afford a feature
  app.get("/api/ai-features/:featureKey/check", requireAuth, async (req: Request, res: Response) => {
    try {
      const { featureKey } = req.params;
      const userId = req.session?.userId || req.user?.id;
      const userRole = req.user?.role || req.session?.userRole;
      const resellerId = req.user?.resellerId || req.session?.resellerId;

      const features = await AIPricingService.getAIFeaturesWithPricing(
        userId,
        userRole,
        resellerId
      );

      const feature = features.find(f => f.featureKey === featureKey);

      if (!feature) {
        return res.status(404).json({ success: false, error: "Feature not found" });
      }

      // Check user's credit balance
      const { CreditService } = await import("../services/creditService.js");
      const balance = await CreditService.getCreditBalance(userId);
      const canAfford = balance.availableCredits >= feature.retailPrice;

      res.json({
        success: true,
        canAfford,
        creditCost: feature.retailPrice,
        userBalance: balance.availableCredits,
        featureName: feature.featureName,
      });
    } catch (error) {
      console.error("Error checking feature affordability:", error);
      res.status(500).json({ success: false, error: "Failed to check affordability" });
    }
  });

  // Charge for AI feature usage
  app.post("/api/ai-features/:featureKey/charge", requireAuth, async (req: Request, res: Response) => {
    try {
      const { featureKey } = req.params;
      const userId = req.session?.userId || req.user?.id;
      const resellerId = req.user?.resellerId || req.session?.resellerId;
      const { description, metadata, context } = req.body;

      const result = await AIPricingService.chargeForFeature(
        userId,
        featureKey,
        description || `AI Feature: ${featureKey}`,
        {
          resellerId,
          metadata,
          context,
        }
      );

      if (!result.success) {
        return res.status(402).json({
          success: false,
          error: result.error,
          creditsRequired: result.creditsCharged,
        });
      }

      res.json({
        success: true,
        creditsCharged: result.creditsCharged,
        newBalance: result.creditsCharged, // Would return actual new balance
      });
    } catch (error) {
      console.error("Error charging for AI feature:", error);
      res.status(500).json({ success: false, error: "Failed to process charge" });
    }
  });

  // Get user's AI usage history
  app.get("/api/ai-usage", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId || req.user?.id;
      const { limit = 50, offset = 0 } = req.query;

      const usage = await db
        .select({
          id: aiFeatureUsage.id,
          featureKey: aiFeatureUsage.featureKey,
          creditsCharged: aiFeatureUsage.creditsCharged,
          context: aiFeatureUsage.context,
          createdAt: aiFeatureUsage.createdAt,
        })
        .from(aiFeatureUsage)
        .where(eq(aiFeatureUsage.userId, userId))
        .orderBy(desc(aiFeatureUsage.createdAt))
        .limit(Number(limit))
        .offset(Number(offset));

      res.json({
        success: true,
        usage,
      });
    } catch (error) {
      console.error("Error fetching usage history:", error);
      res.status(500).json({ success: false, error: "Failed to fetch usage history" });
    }
  });
}
