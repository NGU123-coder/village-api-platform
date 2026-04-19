-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "ApiLog_apiKeyId_idx" ON "ApiLog"("apiKeyId");

-- CreateIndex
CREATE INDEX "ApiLog_createdAt_idx" ON "ApiLog"("createdAt");
