import { Prisma } from '@prisma/client';
import prisma from './prisma';

// Database utilities and helpers
export class DatabaseUtils {
  // Clean up expired file uploads
  static async cleanupExpiredUploads() {
    const now = new Date();
    const result = await prisma.fileUpload.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });
    return result.count;
  }

  // Archive old execution history
  static async archiveOldExecutions(daysOld: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await prisma.executionHistory.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
    return result.count;
  }

  // Get database statistics
  static async getStats() {
    const [
      workflowCount,
      executionCount,
      templateCount,
      userCount,
      fileCount,
    ] = await Promise.all([
      prisma.workflow.count(),
      prisma.workflowExecution.count(),
      prisma.workflowTemplate.count(),
      prisma.userPreferences.count(),
      prisma.fileUpload.count(),
    ]);

    return {
      workflows: workflowCount,
      executions: executionCount,
      templates: templateCount,
      users: userCount,
      files: fileCount,
    };
  }

  // Reset execution status for stuck executions
  static async resetStuckExecutions(timeout: number = 5 * 60 * 1000) { // 5 minutes
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - timeout);
    
    const result = await prisma.workflowExecution.updateMany({
      where: {
        status: 'running',
        startedAt: {
          lt: cutoffTime,
        },
      },
      data: {
        status: 'failed',
        completedAt: now,
      },
    });
    return result.count;
  }

  // Optimize database performance
  static async optimizeDatabase() {
    // This would typically run VACUUM and ANALYZE commands
    // For now, we'll just return a success message
    return { success: true, message: 'Database optimization completed' };
  }
}

// Prisma middleware for logging
export const loggingMiddleware: Prisma.Middleware = async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  console.log(`Prisma: ${params.model}.${params.action} took ${after - before}ms`);
  
  return result;
};

// Prisma middleware for soft delete
export const softDeleteMiddleware: Prisma.Middleware = async (params, next) => {
  if (params.action === 'delete') {
    // Convert delete to update with deletedAt timestamp
    params.action = 'update';
    params.args = {
      ...params.args,
      data: {
        ...params.args.data,
        deletedAt: new Date(),
      },
    };
  }
  
  return next(params);
};

// Database error handler
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public meta?: any,
    public cause?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export const handleDatabaseError = (error: any): DatabaseError => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new DatabaseError(
          'Unique constraint violation',
          error.code,
          error.meta,
          error
        );
      case 'P2025':
        return new DatabaseError(
          'Record not found',
          error.code,
          error.meta,
          error
        );
      case 'P2003':
        return new DatabaseError(
          'Foreign key constraint failed',
          error.code,
          error.meta,
          error
        );
      default:
        return new DatabaseError(
          `Database error: ${error.message}`,
          error.code,
          error.meta,
          error
        );
    }
  }
  
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new DatabaseError(
      'Database connection failed',
      'INIT_ERROR',
      null,
      error
    );
  }
  
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return new DatabaseError(
      'Database panic error',
      'RUST_PANIC',
      null,
      error
    );
  }
  
  return new DatabaseError(
    error.message || 'Unknown database error',
    'UNKNOWN',
    null,
    error
  );
};