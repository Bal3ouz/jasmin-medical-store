CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash_on_delivery', 'card_konnect', 'card_clic_to_pay', 'bank_transfer');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'refunded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('admin', 'manager', 'cashier', 'stock');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_type" AS ENUM('purchase', 'sale', 'adjustment', 'return', 'transfer');