-- CreateIndex
CREATE INDEX "device_pairing_requests_requesting_ip_created_at_idx" ON "device_pairing_requests"("requesting_ip", "created_at");
