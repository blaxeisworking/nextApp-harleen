-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "userId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowExecution" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "nodes" JSONB NOT NULL,
    "results" JSONB,
    "trigger" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "nodeIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "executionTime" INTEGER,

    CONSTRAINT "WorkflowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTemplate" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "WorkflowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "autoSave" BOOLEAN NOT NULL DEFAULT true,
    "autoSaveInterval" INTEGER NOT NULL DEFAULT 30000,
    "notifications" JSONB NOT NULL,
    "editor" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workflowId" TEXT,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workflowId" TEXT,
    "executionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "nodes" JSONB NOT NULL,
    "results" JSONB,
    "executionTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ExecutionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileUpload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "FileUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "permissions" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Workflow_userId_idx" ON "Workflow"("userId");

-- CreateIndex
CREATE INDEX "Workflow_isPublic_idx" ON "Workflow"("isPublic");

-- CreateIndex
CREATE INDEX "Workflow_createdAt_idx" ON "Workflow"("createdAt");

-- CreateIndex
CREATE INDEX "Workflow_updatedAt_idx" ON "Workflow"("updatedAt");

-- CreateIndex
CREATE INDEX "WorkflowExecution_workflowId_idx" ON "WorkflowExecution"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowExecution_userId_idx" ON "WorkflowExecution"("userId");

-- CreateIndex
CREATE INDEX "WorkflowExecution_status_idx" ON "WorkflowExecution"("status");

-- CreateIndex
CREATE INDEX "WorkflowExecution_createdAt_idx" ON "WorkflowExecution"("createdAt");

-- CreateIndex
CREATE INDEX "WorkflowExecution_completedAt_idx" ON "WorkflowExecution"("completedAt");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_category_idx" ON "WorkflowTemplate"("category");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_isPublic_idx" ON "WorkflowTemplate"("isPublic");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_createdAt_idx" ON "WorkflowTemplate"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTemplate_workflowId_name_key" ON "WorkflowTemplate"("workflowId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "UserPreferences_userId_idx" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "ExecutionHistory_userId_idx" ON "ExecutionHistory"("userId");

-- CreateIndex
CREATE INDEX "ExecutionHistory_workflowId_idx" ON "ExecutionHistory"("workflowId");

-- CreateIndex
CREATE INDEX "ExecutionHistory_status_idx" ON "ExecutionHistory"("status");

-- CreateIndex
CREATE INDEX "ExecutionHistory_createdAt_idx" ON "ExecutionHistory"("createdAt");

-- CreateIndex
CREATE INDEX "FileUpload_userId_idx" ON "FileUpload"("userId");

-- CreateIndex
CREATE INDEX "FileUpload_createdAt_idx" ON "FileUpload"("createdAt");

-- CreateIndex
CREATE INDEX "FileUpload_expiresAt_idx" ON "FileUpload"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "ApiKey_key_idx" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_isActive_idx" ON "ApiKey"("isActive");

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTemplate" ADD CONSTRAINT "WorkflowTemplate_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
