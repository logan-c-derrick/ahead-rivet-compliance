-- Rivet Database Schema
-- Multi-tenant with RLS based on profiles.organization_id

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table (links auth.users to organizations)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  category TEXT,
  lifecycle_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Components table
CREATE TABLE components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  part_number TEXT,
  description TEXT,
  manufacturer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regulations table (shared across organizations, but can be customized)
CREATE TABLE regulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  jurisdiction TEXT,
  effective_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Components (many-to-many)
CREATE TABLE product_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  quantity NUMERIC,
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, component_id)
);

-- Component Regulations (many-to-many)
CREATE TABLE component_regulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  regulation_id UUID NOT NULL REFERENCES regulations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(component_id, regulation_id)
);

-- Product Regulation Status (tracks compliance at product level)
CREATE TABLE product_regulation_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  regulation_id UUID NOT NULL REFERENCES regulations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  compliance_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, regulation_id)
);

-- Outreach Requests
CREATE TABLE outreach_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  component_id UUID REFERENCES components(id) ON DELETE SET NULL,
  regulation_id UUID REFERENCES regulations(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX idx_products_organization_id ON products(organization_id);
CREATE INDEX idx_components_organization_id ON components(organization_id);
CREATE INDEX idx_suppliers_organization_id ON suppliers(organization_id);
CREATE INDEX idx_product_components_product_id ON product_components(product_id);
CREATE INDEX idx_product_components_component_id ON product_components(component_id);
CREATE INDEX idx_component_regulations_component_id ON component_regulations(component_id);
CREATE INDEX idx_component_regulations_regulation_id ON component_regulations(regulation_id);
CREATE INDEX idx_product_regulation_status_product_id ON product_regulation_status(product_id);
CREATE INDEX idx_product_regulation_status_regulation_id ON product_regulation_status(regulation_id);
CREATE INDEX idx_outreach_requests_organization_id ON outreach_requests(organization_id);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Function to get current user's organization_id
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- RLS Policies

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_regulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_regulation_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Organizations: users can only see their own organization
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (id = get_user_organization_id());

CREATE POLICY "Users can update their own organization"
  ON organizations FOR UPDATE
  USING (id = get_user_organization_id());

-- Profiles: users can view profiles in their organization
CREATE POLICY "Users can view profiles in their organization"
  ON profiles FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Products: users can only access products in their organization
CREATE POLICY "Users can view products in their organization"
  ON products FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert products in their organization"
  ON products FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update products in their organization"
  ON products FOR UPDATE
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete products in their organization"
  ON products FOR DELETE
  USING (organization_id = get_user_organization_id());

-- Components: users can only access components in their organization
CREATE POLICY "Users can view components in their organization"
  ON components FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert components in their organization"
  ON components FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update components in their organization"
  ON components FOR UPDATE
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete components in their organization"
  ON components FOR DELETE
  USING (organization_id = get_user_organization_id());

-- Suppliers: users can only access suppliers in their organization
CREATE POLICY "Users can view suppliers in their organization"
  ON suppliers FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert suppliers in their organization"
  ON suppliers FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update suppliers in their organization"
  ON suppliers FOR UPDATE
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete suppliers in their organization"
  ON suppliers FOR DELETE
  USING (organization_id = get_user_organization_id());

-- Regulations: all authenticated users can view (shared across organizations)
CREATE POLICY "Authenticated users can view regulations"
  ON regulations FOR SELECT
  TO authenticated
  USING (true);

-- Product Components: users can only access via products in their organization
CREATE POLICY "Users can view product_components in their organization"
  ON product_components FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_components.product_id
      AND products.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can manage product_components in their organization"
  ON product_components FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_components.product_id
      AND products.organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_components.product_id
      AND products.organization_id = get_user_organization_id()
    )
  );

-- Component Regulations: users can only access via components in their organization
CREATE POLICY "Users can view component_regulations in their organization"
  ON component_regulations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM components
      WHERE components.id = component_regulations.component_id
      AND components.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can manage component_regulations in their organization"
  ON component_regulations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM components
      WHERE components.id = component_regulations.component_id
      AND components.organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM components
      WHERE components.id = component_regulations.component_id
      AND components.organization_id = get_user_organization_id()
    )
  );

-- Product Regulation Status: users can only access via products in their organization
CREATE POLICY "Users can view product_regulation_status in their organization"
  ON product_regulation_status FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_regulation_status.product_id
      AND products.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can manage product_regulation_status in their organization"
  ON product_regulation_status FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_regulation_status.product_id
      AND products.organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_regulation_status.product_id
      AND products.organization_id = get_user_organization_id()
    )
  );

-- Outreach Requests: users can only access requests in their organization
CREATE POLICY "Users can view outreach_requests in their organization"
  ON outreach_requests FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert outreach_requests in their organization"
  ON outreach_requests FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update outreach_requests in their organization"
  ON outreach_requests FOR UPDATE
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete outreach_requests in their organization"
  ON outreach_requests FOR DELETE
  USING (organization_id = get_user_organization_id());

-- Audit Logs: users can only view audit logs in their organization
CREATE POLICY "Users can view audit_logs in their organization"
  ON audit_logs FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "System can insert audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- Trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Note: This requires organization_id to be set manually or via a separate process
  -- For now, we'll just create the profile row structure
  -- In production, you might want to create a default org or require org selection
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Profile creation should be handled in your application code
-- after user signs up, to ensure they select/are assigned an organization
