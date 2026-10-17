CREATE TABLE users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email));

CREATE TABLE categories (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX categories_name_lower_unique ON categories (lower(name));

CREATE TABLE products (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sku VARCHAR(64) NOT NULL,
  name VARCHAR(160) NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reorder_threshold INTEGER NOT NULL DEFAULT 0 CHECK (reorder_threshold >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX products_sku_upper_unique ON products (upper(sku));
CREATE INDEX products_category_status_idx ON products (category_id, status);
CREATE INDEX products_status_name_idx ON products (status, name);

CREATE TABLE orders (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_by INTEGER NOT NULL REFERENCES users(id),
  customer_name VARCHAR(160) NOT NULL,
  customer_email VARCHAR(255),
  status TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'cancelled')),
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  cancelled_by INTEGER REFERENCES users(id),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX orders_created_by_created_at_idx ON orders (created_by, created_at DESC);
CREATE INDEX orders_created_at_idx ON orders (created_at DESC);

CREATE TABLE order_items (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  sku_snapshot VARCHAR(64) NOT NULL,
  product_name_snapshot VARCHAR(160) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(12,2) NOT NULL CHECK (line_total = unit_price * quantity),
  UNIQUE (order_id, product_id)
);
CREATE INDEX order_items_product_id_idx ON order_items (product_id);

CREATE TABLE stock_movements (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'stock_in', 'adjustment', 'order_deduction', 'order_cancellation'
  )),
  quantity_delta INTEGER NOT NULL CHECK (quantity_delta <> 0),
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  actor_user_id INTEGER NOT NULL REFERENCES users(id),
  related_order_id INTEGER REFERENCES orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (movement_type <> 'stock_in' OR quantity_delta > 0),
  CHECK (movement_type <> 'order_deduction' OR quantity_delta < 0),
  CHECK (movement_type <> 'order_cancellation' OR quantity_delta > 0)
);
CREATE INDEX stock_movements_product_created_at_idx ON stock_movements (product_id, created_at DESC);
CREATE INDEX stock_movements_created_at_idx ON stock_movements (created_at DESC);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);
