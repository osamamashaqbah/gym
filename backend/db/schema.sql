-- ============================================================
-- Gym Management System — PostgreSQL schema reference
-- This file is for reference. The application creates and
-- migrates the schema automatically via EF Core on startup.
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
    id            uuid PRIMARY KEY,
    name          varchar(50)  NOT NULL UNIQUE,
    description   text,
    created_at    timestamptz NOT NULL,
    updated_at    timestamptz,
    is_archived   boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS users (
    id            uuid PRIMARY KEY,
    full_name     varchar(150) NOT NULL,
    email         varchar(200) NOT NULL UNIQUE,
    username      varchar(50)  NOT NULL UNIQUE,
    password_hash text         NOT NULL,
    phone_number  varchar(30),
    avatar_url    text,
    is_active     boolean NOT NULL DEFAULT true,
    last_login_at timestamptz,
    role_id       uuid NOT NULL REFERENCES roles(id),
    created_at    timestamptz NOT NULL,
    updated_at    timestamptz,
    is_archived   boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS members (
    id                uuid PRIMARY KEY,
    full_name         varchar(150) NOT NULL,
    phone_number      varchar(30)  NOT NULL,
    gender            int NOT NULL,
    age               int NOT NULL,
    address           text,
    profile_image_url text,
    email             varchar(200),
    notes             text,
    joined_at         timestamptz NOT NULL,
    created_at        timestamptz NOT NULL,
    updated_at        timestamptz,
    is_archived       boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS ix_members_phone ON members(phone_number);
CREATE INDEX IF NOT EXISTS ix_members_name  ON members(full_name);

CREATE TABLE IF NOT EXISTS membership_plans (
    id                  uuid PRIMARY KEY,
    name                varchar(100) NOT NULL,
    description         text,
    duration            int NOT NULL,
    duration_in_months  int NOT NULL,
    price               numeric(12,2) NOT NULL,
    is_active           boolean NOT NULL DEFAULT true,
    created_at          timestamptz NOT NULL,
    updated_at          timestamptz,
    is_archived         boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS memberships (
    id            uuid PRIMARY KEY,
    member_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    plan_id       uuid NOT NULL REFERENCES membership_plans(id),
    start_date    timestamptz NOT NULL,
    expiry_date   timestamptz NOT NULL,
    status        int NOT NULL,
    frozen_at     timestamptz,
    freeze_days   int,
    cancelled_at  timestamptz,
    notes         text,
    total_price   numeric(12,2) NOT NULL,
    amount_paid   numeric(12,2) NOT NULL,
    created_at    timestamptz NOT NULL,
    updated_at    timestamptz,
    is_archived   boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS ix_memberships_expiry ON memberships(expiry_date);
CREATE INDEX IF NOT EXISTS ix_memberships_status ON memberships(status);

CREATE TABLE IF NOT EXISTS payments (
    id              uuid PRIMARY KEY,
    member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    membership_id   uuid REFERENCES memberships(id) ON DELETE SET NULL,
    amount          numeric(12,2) NOT NULL,
    method          int NOT NULL,
    paid_at         timestamptz NOT NULL,
    reference_number text,
    notes           text,
    invoice_number  varchar(50) NOT NULL UNIQUE,
    created_at      timestamptz NOT NULL,
    updated_at      timestamptz,
    is_archived     boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS ix_payments_paid_at ON payments(paid_at);

CREATE TABLE IF NOT EXISTS attendances (
    id            uuid PRIMARY KEY,
    member_id     uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    check_in_time timestamptz NOT NULL,
    notes         text,
    created_at    timestamptz NOT NULL,
    updated_at    timestamptz,
    is_archived   boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS ix_attendances_check_in ON attendances(check_in_time);

CREATE TABLE IF NOT EXISTS notifications (
    id            uuid PRIMARY KEY,
    title         varchar(200) NOT NULL,
    message       varchar(1000) NOT NULL,
    type          int NOT NULL,
    is_read       boolean NOT NULL DEFAULT false,
    member_id     uuid REFERENCES members(id) ON DELETE SET NULL,
    created_at    timestamptz NOT NULL,
    updated_at    timestamptz,
    is_archived   boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS ix_notifications_is_read ON notifications(is_read);

CREATE TABLE IF NOT EXISTS gym_settings (
    id            uuid PRIMARY KEY,
    gym_name      varchar(150) NOT NULL,
    address       text,
    phone_number  varchar(30),
    email         varchar(200),
    logo_url      text,
    currency      varchar(10) NOT NULL,
    tax_number    varchar(50),
    website       text,
    created_at    timestamptz NOT NULL,
    updated_at    timestamptz,
    is_archived   boolean NOT NULL DEFAULT false
);
