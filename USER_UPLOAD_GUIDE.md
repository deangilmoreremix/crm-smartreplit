# 📚 Complete Guide: Uploading Users with Features

## ✅ System Status

- **Supabase**: ✅ Connected
- **Database**: ✅ PostgreSQL on Supabase
- **Features Seeded**: ✅ 104 features across 8 categories
- **Bulk Import**: ✅ Available at `/admin/bulk-import`

---

## 🎯 7-Tier Product System

### Product Tiers & Auto-Assigned Features

Each product tier automatically grants access to specific features:

| Tier                   | Role Assigned | Features Included                                        |
| ---------------------- | ------------- | -------------------------------------------------------- |
| **super_admin**        | super_admin   | Everything + Admin Panel + All Remote Apps + White Label |
| **whitelabel**         | wl_user       | Everything except Admin Panel (includes White Label)     |
| **smartcrm_bundle**    | wl_user       | Base CRM + AI Goals + AI Tools + Communication           |
| **smartcrm**           | regular_user  | Base CRM only (Dashboard, Contacts, Pipeline, Calendar)  |
| **sales_maximizer**    | regular_user  | Base CRM + AI Goals + AI Tools                           |
| **ai_boost_unlimited** | regular_user  | Base CRM + AI Goals + AI Tools + Unlimited AI Credits    |
| **ai_communication**   | regular_user  | Base CRM + Communication Suite                           |

### Feature Inheritance

✅ **All paid tiers** include base CRM access (Dashboard, Contacts, Pipeline, Calendar, Communication Hub)
✅ Higher tiers inherit features from lower tiers automatically
✅ Super admins can override features for individual users

---

## 📤 How to Upload Users

### Step 1: Navigate to Bulk Import

Go to: **Admin Panel → Bulk Import** (`/admin/bulk-import`)

### Step 2: Prepare Your CSV

**CSV Format:**

```csv
email,first_name,last_name,company,phone,role,product_tier
john.doe@company.com,John,Doe,Acme Corp,(555) 123-4567,regular_user,smartcrm
jane.smith@business.com,Jane,Smith,Tech Solutions,(555) 987-6543,wl_user,smartcrm_bundle
admin@company.com,Admin,User,Head Office,(555) 000-0000,super_admin,super_admin
```

**Required Columns:**

- `email` - User's email address
- `first_name` - First name
- `last_name` - Last name

**Optional Columns:**

- `company` - Company name
- `phone` - Phone number
- `role` - User role (see below)
- `product_tier` - Product tier (see below)

### Step 3: Choose Product Tier

**Available Product Tiers:**

```csv
product_tier values:
- smartcrm                 (Base CRM)
- sales_maximizer          (CRM + AI Goals + AI Tools)
- ai_boost_unlimited       (CRM + AI + Unlimited Credits)
- ai_communication         (CRM + Communication Suite)
- smartcrm_bundle          (All features except White Label)
- whitelabel               (All features + White Label)
- super_admin              (Everything + Admin Panel)
```

### Step 4: Upload Process

1. **Paste CSV** into the text area
2. **Click "Parse CSV"** to preview users
3. **Review** the parsed data
4. **Click "Import Users"** to create accounts
5. **System automatically**:
   - Creates Supabase user accounts
   - Sends magic link emails
   - Assigns product tier
   - Auto-assigns role based on tier
   - Grants appropriate features

---

## 🔐 Automatic Feature Assignment

### How It Works

When a user is created with a `product_tier`:

1. **User Account Created** in Supabase
2. **Profile Created** in PostgreSQL profiles table
3. **Product Tier Stored** in `productTier` column
4. **Role Auto-Assigned**:
   - `super_admin` tier → `super_admin` role
   - `whitelabel`/`smartcrm_bundle` tier → `wl_user` role
   - All other tiers → `regular_user` role
5. **Features Auto-Granted** based on tier (via RoleBasedAccess component)

### Feature Access Check

The system checks features in this order:

1. **User-specific overrides** (if super admin toggled features for this user)
2. **Product tier features** (default features for their tier)
3. **Role-based features** (baseline access for their role)

---

## 📊 104 Seeded Features

### Categories Breakdown:

✅ **Core CRM (12 features)**

- Dashboard, Contacts, Pipeline, Calendar
- Tasks (Board, Calendar, Analytics, Activity Feed)
- Appointments, Analytics

✅ **Sales Intelligence (10 features)**

- Pipeline Intelligence, Deal Risk Monitor
- Conversion Insights, Pipeline Health
- Sales Cycle Analytics, Win Rate
- Revenue Intelligence, Competitor Insights
- Live Deal Analysis

✅ **AI Features (41 features)**

- AI Goals, AI Tools Suite
- Core AI Tools (9): Email Analysis, Meeting Summarizer, Proposal Generator, etc.
- Communication AI (4): Email Composer, Objection Handler, etc.
- Advanced AI (5): AI Assistant, Vision Analyzer, Image Generator, etc.
- Real-time AI (6): Streaming Chat, Form Validation, etc.
- Reasoning Generators (5): Reasoning Email, Proposal, Script, etc.
- Automation (4): Task Automation, Smart Prioritization, etc.

✅ **Communication (9 features)**

- Video Email, SMS Automation, VoIP Phone
- Phone System Dashboard, Invoicing
- Lead Automation, Circle Prospecting
- Forms & Surveys

✅ **Remote Apps (13 features)**

- FunnelCraft AI, SmartCRM Closer, ContentAI
- Remote Pipeline, Contacts, Calendar
- AI Analytics Dashboard, Product Research
- Business Intelligence, AI Goals Module

✅ **White Label (7 features)**

- White Label Customization
- WL Management Dashboard
- Revenue Sharing, Package Builder
- Partner Dashboard, Partner Onboarding

✅ **Admin (7 features)**

- Admin Dashboard, User Management
- Bulk Import, Feature Management
- Admin Analytics, Admin Settings

✅ **Content & Business Tools (4 features)**

- Content Library, Voice Profiles
- Business Analysis

✅ **Smart Automations (1 parent feature)**

- 16 pre-configured automation workflows

---

## 🛠️ Advanced: Per-User Feature Toggles

### For Super Admins Only

Super admins can override features for individual users:

1. Go to **Admin Panel → User Management**
2. Click **Edit** on any user
3. Access **Feature Manager** tab
4. Toggle individual features on/off
5. These overrides take precedence over tier defaults

**Use Cases:**

- Grant beta features to specific users
- Restrict features for trial users
- Custom feature packages for partners
- Testing new features with select users

---

## 📝 Example CSV Templates

### Template 1: Basic Users

```csv
email,first_name,last_name,product_tier
user1@company.com,John,Doe,smartcrm
user2@company.com,Jane,Smith,sales_maximizer
user3@company.com,Bob,Johnson,ai_boost_unlimited
```

### Template 2: Complete Data

```csv
email,first_name,last_name,company,phone,role,product_tier
john@acme.com,John,Doe,Acme Corp,(555) 111-2222,regular_user,smartcrm
jane@tech.com,Jane,Smith,Tech Co,(555) 333-4444,regular_user,sales_maximizer
admin@company.com,Admin,User,HQ,(555) 555-5555,super_admin,super_admin
partner@agency.com,Partner,User,Agency,(555) 777-8888,wl_user,whitelabel
```

### Template 3: White Label Partners

```csv
email,first_name,last_name,company,product_tier
partner1@agency1.com,Sarah,Williams,Marketing Agency,whitelabel
partner2@agency2.com,Mike,Brown,Sales Agency,whitelabel
partner3@agency3.com,Lisa,Davis,Growth Agency,smartcrm_bundle
```

---

## 🔄 Magic Link Authentication

After import, users receive:

1. **Welcome Email** with magic link
2. **Click Link** → Auto-authenticates
3. **Redirected** to dashboard
4. **Features Available** based on their product tier

No password needed! Magic link provides instant access.

---

## ✅ Verification Checklist

After uploading users, verify:

- [ ] Users appear in Admin → User Management
- [ ] Product Tier displays correctly
- [ ] Role matches tier (super_admin tier = super_admin role)
- [ ] Users can log in via magic link
- [ ] Users see appropriate features in navbar
- [ ] Users can't access restricted features
- [ ] Super admins see Admin Panel
- [ ] Whitelabel users see White Label Suite

---

## 🆘 Troubleshooting

### Issue: Users not receiving emails

**Solution**: Check Supabase email settings → Auth → Email Templates

### Issue: Wrong features showing

**Solution**: Check user's `productTier` in User Management

### Issue: CSV parse error

**Solution**: Ensure first row is headers, no extra commas

### Issue: User can't access feature

**Solution**: Verify their product tier includes that feature (see tier table above)

### Issue: Need to change user's tier

**Solution**: Go to User Management → Select product tier dropdown → Choose new tier

---

## 📞 Need Help?

- Check user's product tier in User Management
- Verify Supabase connection status
- Review feature seeding logs above
- Test with sample CSV first
- Use Dev user (dev@smartcrm.local) for testing

---

**Last Updated**: 2025-01-30
**Features Seeded**: 104 features across 8 categories
**Database**: Supabase PostgreSQL ✅
