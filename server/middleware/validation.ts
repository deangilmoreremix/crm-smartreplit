import { Request, Response, NextFunction } from 'express';

// Input validation middleware
export function validateUserData(required: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    // Check required fields
    for (const field of required) {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        errors.push(`${field} is required`);
      }
    }

    // Email validation
    if (req.body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        errors.push('Invalid email format');
      }
    }

    // Role validation
    if (req.body.role) {
      const validRoles = ['super_admin', 'wl_user', 'regular_user'];
      if (!validRoles.includes(req.body.role)) {
        errors.push('Invalid role specified');
      }
    }

    // Product tier validation
    if (req.body.productTier) {
      const validTiers = ['super_admin', 'whitelabel', 'smartcrm_bundle', 'smartcrm', 'sales_maximizer', 'ai_boost_unlimited', 'ai_communication'];
      if (!validTiers.includes(req.body.productTier)) {
        errors.push('Invalid product tier specified');
      }
    }

    // Status validation
    if (req.body.status) {
      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(req.body.status)) {
        errors.push('Invalid status specified');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  };
}

export function validateBulkImport() {
  return (req: Request, res: Response, next: NextFunction) => {
    const { users } = req.body;

    if (!Array.isArray(users)) {
      return res.status(400).json({ error: 'Users must be an array' });
    }

    if (users.length === 0) {
      return res.status(400).json({ error: 'At least one user is required' });
    }

    if (users.length > 1000) {
      return res.status(400).json({ error: 'Maximum 1000 users per import' });
    }

    // Validate each user
    const errors: string[] = [];
    users.forEach((user: any, index: number) => {
      if (!user.email || typeof user.email !== 'string') {
        errors.push(`User ${index + 1}: email is required`);
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(user.email.trim())) {
          errors.push(`User ${index + 1}: invalid email format`);
        }
      }

      if (user.role) {
        const validRoles = ['super_admin', 'wl_user', 'regular_user'];
        if (!validRoles.includes(user.role)) {
          errors.push(`User ${index + 1}: invalid role`);
        }
      }

      if (user.product_tier) {
        const validTiers = ['super_admin', 'whitelabel', 'smartcrm_bundle', 'smartcrm', 'sales_maximizer', 'ai_boost_unlimited', 'ai_communication'];
        if (!validTiers.includes(user.product_tier)) {
          errors.push(`User ${index + 1}: invalid product tier`);
        }
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.slice(0, 10) // Limit error messages
      });
    }

    next();
  };
}

export function sanitizeInput() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Recursively sanitize string inputs
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.trim().replace(/[<>]/g, ''); // Basic XSS prevention
      } else if (Array.isArray(obj)) {
        return obj.map(sanitize);
      } else if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          sanitized[key] = sanitize(obj[key]);
        }
        return sanitized;
      }
      return obj;
    };

    req.body = sanitize(req.body);
    next();
  };
}