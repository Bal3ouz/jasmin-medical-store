-- ============================================================
-- Row-Level Security policies for Jasmin Médical Store
-- Applied AFTER drizzle-kit migrations, only against Supabase.
-- ============================================================

-- Enable RLS on every domain table.
ALTER TABLE brands                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories              ENABLE ROW LEVEL SECURITY;
ALTER TABLE products                ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images          ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory               ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log               ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items              ENABLE ROW LEVEL SECURITY;

-- Helper: is the current auth user an active staff member with one of the given roles?
CREATE OR REPLACE FUNCTION is_staff(required_roles staff_role[])
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_users
    WHERE id = auth.uid() AND is_active = true AND role = ANY(required_roles)
  );
$$;

-- ============================================================
-- PUBLIC READ (anon)
-- ============================================================
DROP POLICY IF EXISTS brands_public_read ON brands;
CREATE POLICY brands_public_read ON brands FOR SELECT USING (true);

DROP POLICY IF EXISTS categories_public_read ON categories;
CREATE POLICY categories_public_read ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS products_public_read ON products;
CREATE POLICY products_public_read ON products
  FOR SELECT USING (is_published = true OR is_staff(ARRAY['admin','manager','cashier','stock']::staff_role[]));

DROP POLICY IF EXISTS product_variants_public_read ON product_variants;
CREATE POLICY product_variants_public_read ON product_variants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_variants.product_id
            AND (p.is_published = true OR is_staff(ARRAY['admin','manager','cashier','stock']::staff_role[])))
  );

DROP POLICY IF EXISTS product_categories_public_read ON product_categories;
CREATE POLICY product_categories_public_read ON product_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS product_images_public_read ON product_images;
CREATE POLICY product_images_public_read ON product_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_images.product_id
            AND (p.is_published = true OR is_staff(ARRAY['admin','manager','cashier','stock']::staff_role[])))
  );

-- inventory_public is a view; we grant SELECT to anon/authenticated explicitly.
-- The base inventory table has no public-read policy — anon cannot read it.
GRANT SELECT ON inventory_public TO anon, authenticated;

DROP POLICY IF EXISTS newsletter_public_insert ON newsletter_subscribers;
CREATE POLICY newsletter_public_insert ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- CUSTOMER (authenticated, exists in customers)
-- ============================================================
DROP POLICY IF EXISTS customers_self_read ON customers;
CREATE POLICY customers_self_read ON customers FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS customers_self_update ON customers;
CREATE POLICY customers_self_update ON customers
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS customers_self_insert ON customers;
CREATE POLICY customers_self_insert ON customers
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS customer_addresses_self ON customer_addresses;
CREATE POLICY customer_addresses_self ON customer_addresses
  FOR ALL USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS orders_self_read ON orders;
CREATE POLICY orders_self_read ON orders
  FOR SELECT USING (customer_id = auth.uid() OR is_staff(ARRAY['admin','manager','cashier']::staff_role[]));

DROP POLICY IF EXISTS order_items_self_read ON order_items;
CREATE POLICY order_items_self_read ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id
            AND (o.customer_id = auth.uid() OR is_staff(ARRAY['admin','manager','cashier']::staff_role[])))
  );

DROP POLICY IF EXISTS order_events_self_read ON order_events;
CREATE POLICY order_events_self_read ON order_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_events.order_id
            AND (o.customer_id = auth.uid() OR is_staff(ARRAY['admin','manager','cashier']::staff_role[])))
  );

DROP POLICY IF EXISTS carts_self ON carts;
CREATE POLICY carts_self ON carts
  FOR ALL USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS cart_items_self ON cart_items;
CREATE POLICY cart_items_self ON cart_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM carts c WHERE c.id = cart_items.cart_id AND c.customer_id = auth.uid())
  );

-- ============================================================
-- STAFF (authenticated, exists in staff_users with active role)
-- ============================================================
DROP POLICY IF EXISTS brands_staff_admin_write ON brands;
CREATE POLICY brands_staff_admin_write ON brands
  FOR ALL USING (is_staff(ARRAY['admin','manager']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager']::staff_role[]));

DROP POLICY IF EXISTS categories_staff_write ON categories;
CREATE POLICY categories_staff_write ON categories
  FOR ALL USING (is_staff(ARRAY['admin','manager']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager']::staff_role[]));

-- Products: admin/manager full write; stock can write but column-level restrictions
-- (no pricing changes) are enforced in the app layer in apps/admin server actions.
DROP POLICY IF EXISTS products_staff_write ON products;
CREATE POLICY products_staff_write ON products
  FOR ALL USING (is_staff(ARRAY['admin','manager','stock']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager','stock']::staff_role[]));

DROP POLICY IF EXISTS product_variants_staff_write ON product_variants;
CREATE POLICY product_variants_staff_write ON product_variants
  FOR ALL USING (is_staff(ARRAY['admin','manager']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager']::staff_role[]));

DROP POLICY IF EXISTS product_categories_staff_write ON product_categories;
CREATE POLICY product_categories_staff_write ON product_categories
  FOR ALL USING (is_staff(ARRAY['admin','manager']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager']::staff_role[]));

DROP POLICY IF EXISTS product_images_staff_write ON product_images;
CREATE POLICY product_images_staff_write ON product_images
  FOR ALL USING (is_staff(ARRAY['admin','manager','stock']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager','stock']::staff_role[]));

-- Inventory: admin/manager/stock full write; base table not public.
DROP POLICY IF EXISTS inventory_staff_full ON inventory;
CREATE POLICY inventory_staff_full ON inventory
  FOR ALL USING (is_staff(ARRAY['admin','manager','stock']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager','stock']::staff_role[]));

DROP POLICY IF EXISTS stock_movements_staff_full ON stock_movements;
CREATE POLICY stock_movements_staff_full ON stock_movements
  FOR ALL USING (is_staff(ARRAY['admin','manager','stock']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager','stock']::staff_role[]));

DROP POLICY IF EXISTS customers_staff_read ON customers;
CREATE POLICY customers_staff_read ON customers
  FOR SELECT USING (is_staff(ARRAY['admin','manager','cashier']::staff_role[]));

DROP POLICY IF EXISTS customers_staff_insert ON customers;
CREATE POLICY customers_staff_insert ON customers
  FOR INSERT WITH CHECK (is_staff(ARRAY['admin','manager']::staff_role[]));

DROP POLICY IF EXISTS customers_staff_update ON customers;
CREATE POLICY customers_staff_update ON customers
  FOR UPDATE USING (is_staff(ARRAY['admin','manager']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager']::staff_role[]));

DROP POLICY IF EXISTS orders_staff_insert ON orders;
CREATE POLICY orders_staff_insert ON orders
  FOR INSERT WITH CHECK (is_staff(ARRAY['admin','manager','cashier']::staff_role[]));

DROP POLICY IF EXISTS orders_staff_update ON orders;
CREATE POLICY orders_staff_update ON orders
  FOR UPDATE USING (is_staff(ARRAY['admin','manager','cashier']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager','cashier']::staff_role[]));

DROP POLICY IF EXISTS order_items_staff ON order_items;
CREATE POLICY order_items_staff ON order_items
  FOR ALL USING (is_staff(ARRAY['admin','manager','cashier']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager','cashier']::staff_role[]));

DROP POLICY IF EXISTS order_events_staff ON order_events;
CREATE POLICY order_events_staff ON order_events
  FOR ALL USING (is_staff(ARRAY['admin','manager','cashier']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin','manager','cashier']::staff_role[]));

DROP POLICY IF EXISTS staff_users_self_read ON staff_users;
CREATE POLICY staff_users_self_read ON staff_users
  FOR SELECT USING (id = auth.uid() OR is_staff(ARRAY['admin']::staff_role[]));

DROP POLICY IF EXISTS staff_users_admin_insert ON staff_users;
CREATE POLICY staff_users_admin_insert ON staff_users
  FOR INSERT WITH CHECK (is_staff(ARRAY['admin']::staff_role[]));

DROP POLICY IF EXISTS staff_users_admin_update ON staff_users;
CREATE POLICY staff_users_admin_update ON staff_users
  FOR UPDATE USING (is_staff(ARRAY['admin']::staff_role[]))
              WITH CHECK (is_staff(ARRAY['admin']::staff_role[]));

DROP POLICY IF EXISTS audit_log_admin_read ON audit_log;
CREATE POLICY audit_log_admin_read ON audit_log
  FOR SELECT USING (is_staff(ARRAY['admin']::staff_role[]));
