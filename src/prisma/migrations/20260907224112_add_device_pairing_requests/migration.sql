-- CreateEnum
CREATE TYPE "DevicePairingStatus" AS ENUM ('pending', 'confirmed');

-- CreateTable
CREATE TABLE "device_pairing_requests" (
    "id" TEXT NOT NULL,
    "device_code" TEXT NOT NULL,
    "user_code" TEXT NOT NULL,
    "status" "DevicePairingStatus" NOT NULL DEFAULT 'pending',
    "user_id" TEXT,
    "requesting_user_agent" TEXT,
    "requesting_ip" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumed_at" TIMESTAMP(3),

    CONSTRAINT "device_pairing_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_pairing_requests_device_code_key" ON "device_pairing_requests"("device_code");

-- CreateIndex
CREATE UNIQUE INDEX "device_pairing_requests_user_code_key" ON "device_pairing_requests"("user_code");

-- AddForeignKey
ALTER TABLE "device_pairing_requests" ADD CONSTRAINT "device_pairing_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
