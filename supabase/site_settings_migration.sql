-- Run this query in your Supabase SQL Editor to add the missing columns to site_settings

ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS community_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS community_title TEXT,
ADD COLUMN IF NOT EXISTS community_desc TEXT,
ADD COLUMN IF NOT EXISTS support_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS support_title TEXT,
ADD COLUMN IF NOT EXISTS support_desc TEXT;
