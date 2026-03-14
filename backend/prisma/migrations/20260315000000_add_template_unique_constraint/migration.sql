-- CreateIndex: compound unique for account-specific templates
CREATE UNIQUE INDEX "NotificationTemplate_name_channel_account_id_key" ON "NotificationTemplate"("name", "channel", "account_id");

-- CreateIndex: partial unique for platform-level templates (null account_id)
CREATE UNIQUE INDEX "NotificationTemplate_name_channel_platform_key" ON "NotificationTemplate"("name", "channel") WHERE "account_id" IS NULL;
