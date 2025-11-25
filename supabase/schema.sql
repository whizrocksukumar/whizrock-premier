
-- Quotes Table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id),
    site_address TEXT,
    region_id UUID REFERENCES regions(id),
    job_type TEXT,
    sales_rep_id UUID REFERENCES sales_reps(id),
    status TEXT DEFAULT 'Draft',
    pricing_tier TEXT DEFAULT 'Retail',
    markup_percent NUMERIC,
    waste_percent NUMERIC,
    labour_rate NUMERIC,
    total_cost_ex_gst NUMERIC,
    total_sell_ex_gst NUMERIC,
    gst_amount NUMERIC,
    total_inc_gst NUMERIC,
    gross_profit NUMERIC,
    gross_profit_percent NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quote Sections Table
CREATE TABLE IF NOT EXISTS quote_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    app_type_id UUID REFERENCES app_types(id),
    custom_name TEXT,
    section_color TEXT,
    sort_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quote Items Table
CREATE TABLE IF NOT EXISTS quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES quote_sections(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    marker TEXT, -- New field
    description TEXT,
    area_sqm NUMERIC,
    is_labour BOOLEAN DEFAULT false,
    cost_price NUMERIC,
    sell_price NUMERIC,
    line_cost NUMERIC,
    line_sell NUMERIC,
    margin_percent NUMERIC,
    packs_required INTEGER,
    sort_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies if needed (skipping for now as per user context)
