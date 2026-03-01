import { PrismaClient } from '@prisma/client';
import prisma from '../src/lib/db/prisma';

const seedDatabase = async () => {
  try {
    // Clear existing data
    await prisma.workflowExecution.deleteMany();
    await prisma.workflowTemplate.deleteMany();
    await prisma.userPreferences.deleteMany();
    await prisma.fileUpload.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.executionHistory.deleteMany();
    await prisma.workflow.deleteMany();

    console.log('Database cleared successfully');

    // Create sample workflows
    const sampleWorkflows = [
      {
        name: 'Product Marketing Kit Generator',
        description: 'Generate marketing materials from product images and videos',
        nodes: [],
        edges: [],
        userId: 'user_123',
        tags: ['marketing', 'automation', 'ai'],
      },
      {
        name: 'Content Creation Pipeline',
        description: 'Automated content creation with AI',
        nodes: [],
        edges: [],
        userId: 'user_123',
        tags: ['content', 'ai', 'automation'],
      },
    ];

    for (const workflow of sampleWorkflows) {
      await prisma.workflow.create({ data: workflow });
    }

    console.log('Sample workflows created successfully');

    // Create user preferences
    await prisma.userPreferences.create({
      data: {
        userId: 'user_123',
        theme: 'dark',
        autoSave: true,
        autoSaveInterval: 30000,
        notifications: {
          email: true,
          browser: true,
          execution: true,
        },
        editor: {
          snapToGrid: true,
          gridSize: 20,
          showGrid: true,
          showMinimap: