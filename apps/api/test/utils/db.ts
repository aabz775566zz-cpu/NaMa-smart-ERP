import type { PrismaClient } from '@prisma/client';

// Deletes every tenant/user-data row between tests, child-to-parent so FKs
// are satisfied without CASCADE. Deliberately NOT a blanket
// `TRUNCATE ... CASCADE`: Role.companyId is a nullable FK to Company (null
// = system role template), and TRUNCATE CASCADE wipes an entire dependent
// table regardless of which rows' FK values actually match — it would take
// the seeded system roles/permissions out with it. A real DELETE respects
// row-level FK matching correctly, so system roles (companyId: null) are
// never touched by deleting Company rows.
export async function cleanDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction([
    prisma.aIUsageLog.deleteMany(),
    prisma.aIMessage.deleteMany(),
    prisma.aIConversation.deleteMany(),
    prisma.companyCounter.deleteMany(),
    // Purchasing (Phase 7): SupplierPayment/PurchaseInvoice both hold a
    // Restrict FK to Supplier, and PurchaseInvoiceItem holds a Restrict FK
    // to Product — all three must go before their parents below, same
    // reasoning as Payment/Sale/InventoryMovement further down.
    prisma.supplierPayment.deleteMany(),
    prisma.purchaseInvoiceItem.deleteMany(),
    prisma.purchaseInvoice.deleteMany(),
    // Payment holds a Restrict FK to Customer — must go before
    // customer.deleteMany() below, exactly like Sale already does.
    prisma.payment.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.saleItem.deleteMany(),
    prisma.sale.deleteMany(),
    prisma.inventoryMovement.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.activityLog.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.user.deleteMany(),
    prisma.company.deleteMany(),
  ]);
}
