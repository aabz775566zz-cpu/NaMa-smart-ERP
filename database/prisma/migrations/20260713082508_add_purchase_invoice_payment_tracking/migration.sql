-- AlterTable
ALTER TABLE "PurchaseInvoice" ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ALTER COLUMN "invoiceNumber" DROP NOT NULL;
