-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'AWAITING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AWAITING_TRANSFER', 'VERIFYING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'PAYTR');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('SHIPPING', 'BILLING');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "EventKind" AS ENUM ('WORKSHOP', 'DROP', 'EXHIBITION', 'VISIT', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "name" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT,
    "newsletter" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryTranslation" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "editionTotal" INTEGER,
    "editionNumber" INTEGER,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTranslation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "materials" TEXT,

    CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "priceOverride" DECIMAL(12,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductModel3D" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "glbUrl" TEXT NOT NULL,
    "usdzUrl" TEXT,
    "posterUrl" TEXT,
    "publicId" TEXT NOT NULL,

    CONSTRAINT "ProductModel3D_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT,
    "couponId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "shippingCost" DECIMAL(12,2) NOT NULL,
    "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "couponCode" TEXT,
    "shippingAddressId" TEXT,
    "billingAddressId" TEXT,
    "customerNote" TEXT,
    "adminNote" TEXT,
    "trackingNumber" TEXT,
    "trackingCarrier" TEXT,
    "stockRestored" BOOLEAN NOT NULL DEFAULT false,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "skuSnapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "reference" TEXT,
    "providerPayload" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "swift" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "minSubtotal" DECIMAL(12,2),
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "AddressType" NOT NULL,
    "fullName" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'TR',
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "brandName" TEXT NOT NULL DEFAULT 'efruze',
    "tagline" JSONB NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "whatsapp" TEXT,
    "instagram" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'TRY',
    "shippingFlatRate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "freeShippingThreshold" DECIMAL(12,2),
    "addressTr" TEXT,
    "addressEn" TEXT,
    "hoursTr" TEXT,
    "hoursEn" TEXT,
    "maisonHeroImageUrl" TEXT,
    "maisonIntroTr" TEXT,
    "maisonIntroEn" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "kind" "EventKind" NOT NULL DEFAULT 'WORKSHOP',
    "imageUrl" TEXT,
    "priceText" TEXT,
    "ctaUrl" TEXT NOT NULL DEFAULT '/contact',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTranslation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "meta" TEXT NOT NULL,
    "ctaLabel" TEXT NOT NULL,

    CONSTRAINT "EventTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "readMinutes" INTEGER NOT NULL DEFAULT 5,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntryTranslation" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "JournalEntryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqItemTranslation" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,

    CONSTRAINT "FaqItemTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaticPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaticPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaticPageTranslation" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "intro" TEXT,
    "body" TEXT NOT NULL,

    CONSTRAINT "StaticPageTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaisonStep" (
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaisonStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaisonStepTranslation" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "MaisonStepTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaisonArtisan" (
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaisonArtisan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaisonArtisanTranslation" (
    "id" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "bio" TEXT NOT NULL,

    CONSTRAINT "MaisonArtisanTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_categoryId_locale_key" ON "CategoryTranslation"("categoryId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_slug_idx" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_categoryId_isPublished_idx" ON "Product"("categoryId", "isPublished");

-- CreateIndex
CREATE INDEX "Product_isFeatured_isPublished_idx" ON "Product"("isFeatured", "isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslation_productId_locale_key" ON "ProductTranslation"("productId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_token_key" ON "Cart"("token");

-- CreateIndex
CREATE INDEX "Cart_token_idx" ON "Cart"("token");

-- CreateIndex
CREATE INDEX "Cart_userId_idx" ON "Cart"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_variantId_key" ON "CartItem"("cartId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_status_placedAt_idx" ON "Order"("status", "placedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_slug_idx" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_date_idx" ON "Event"("date");

-- CreateIndex
CREATE INDEX "Event_isPublished_date_idx" ON "Event"("isPublished", "date");

-- CreateIndex
CREATE UNIQUE INDEX "EventTranslation_eventId_locale_key" ON "EventTranslation"("eventId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_slug_key" ON "JournalEntry"("slug");

-- CreateIndex
CREATE INDEX "JournalEntry_slug_idx" ON "JournalEntry"("slug");

-- CreateIndex
CREATE INDEX "JournalEntry_date_idx" ON "JournalEntry"("date");

-- CreateIndex
CREATE INDEX "JournalEntry_isPublished_featured_date_idx" ON "JournalEntry"("isPublished", "featured", "date");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntryTranslation_entryId_locale_key" ON "JournalEntryTranslation"("entryId", "locale");

-- CreateIndex
CREATE INDEX "FaqItem_isActive_sortOrder_idx" ON "FaqItem"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "FaqItemTranslation_itemId_locale_key" ON "FaqItemTranslation"("itemId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "StaticPage_slug_key" ON "StaticPage"("slug");

-- CreateIndex
CREATE INDEX "StaticPage_slug_idx" ON "StaticPage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "StaticPageTranslation_pageId_locale_key" ON "StaticPageTranslation"("pageId", "locale");

-- CreateIndex
CREATE INDEX "MaisonStep_isActive_sortOrder_idx" ON "MaisonStep"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "MaisonStepTranslation_stepId_locale_key" ON "MaisonStepTranslation"("stepId", "locale");

-- CreateIndex
CREATE INDEX "MaisonArtisan_isActive_sortOrder_idx" ON "MaisonArtisan"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "MaisonArtisanTranslation_artisanId_locale_key" ON "MaisonArtisanTranslation"("artisanId", "locale");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryTranslation" ADD CONSTRAINT "CategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTranslation" ADD CONSTRAINT "ProductTranslation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductModel3D" ADD CONSTRAINT "ProductModel3D_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTranslation" ADD CONSTRAINT "EventTranslation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntryTranslation" ADD CONSTRAINT "JournalEntryTranslation_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaqItemTranslation" ADD CONSTRAINT "FaqItemTranslation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "FaqItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaticPageTranslation" ADD CONSTRAINT "StaticPageTranslation_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "StaticPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaisonStepTranslation" ADD CONSTRAINT "MaisonStepTranslation_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "MaisonStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaisonArtisanTranslation" ADD CONSTRAINT "MaisonArtisanTranslation_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "MaisonArtisan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

