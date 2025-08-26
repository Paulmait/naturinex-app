const { CloudTasksClient } = require('@google-cloud/tasks');
const admin = require('firebase-admin');

// Initialize Cloud Tasks client
const tasksClient = new CloudTasksClient();

// Configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'naturinex-app';
const LOCATION = process.env.CLOUD_TASKS_LOCATION || 'us-central1';
const QUEUE = process.env.CLOUD_TASKS_QUEUE || 'substance-ingestion';
const SERVICE_URL = process.env.SERVICE_URL || 'https://naturinex-app-zsga.onrender.com';

/**
 * Create a Cloud Task for substance ingestion
 */
async function createIngestionTask(substanceInfo, options = {}) {
  const {
    scheduledTime = null, // When to run (null = immediately)
    priority = 'normal' // 'high', 'normal', 'low'
  } = options;
  
  // Construct the task
  const task = {
    httpRequest: {
      httpMethod: 'POST',
      url: `${SERVICE_URL}/api/functions/ingest-substance`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CLOUD_TASKS_SERVICE_KEY}`
      },
      body: Buffer.from(JSON.stringify({
        substance: substanceInfo,
        timestamp: new Date().toISOString()
      })).toString('base64')
    }
  };
  
  // Add scheduling if specified
  if (scheduledTime) {
    task.scheduleTime = {
      seconds: Math.floor(scheduledTime.getTime() / 1000)
    };
  }
  
  // Set priority
  if (priority === 'high') {
    task.dispatchDeadline = { seconds: 600 }; // 10 minutes
  } else if (priority === 'low') {
    task.dispatchDeadline = { seconds: 3600 }; // 1 hour
  }
  
  // Construct the queue path
  const parent = tasksClient.queuePath(PROJECT_ID, LOCATION, QUEUE);
  
  try {
    // Create the task
    const [response] = await tasksClient.createTask({ parent, task });
    console.log(`Created task: ${response.name}`);
    
    // Log to Firestore
    await logTaskCreation(response.name, substanceInfo);
    
    return response;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

/**
 * Create batch ingestion tasks
 */
async function createBatchIngestionTasks(substances, options = {}) {
  const {
    batchSize = 10,
    delayBetweenBatches = 60 // seconds
  } = options;
  
  const tasks = [];
  let batchNumber = 0;
  
  for (let i = 0; i < substances.length; i += batchSize) {
    const batch = substances.slice(i, i + batchSize);
    const scheduledTime = new Date(Date.now() + (batchNumber * delayBetweenBatches * 1000));
    
    const task = {
      httpRequest: {
        httpMethod: 'POST',
        url: `${SERVICE_URL}/api/functions/batch-ingest`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CLOUD_TASKS_SERVICE_KEY}`
        },
        body: Buffer.from(JSON.stringify({
          substances: batch,
          batchNumber,
          totalBatches: Math.ceil(substances.length / batchSize)
        })).toString('base64')
      },
      scheduleTime: {
        seconds: Math.floor(scheduledTime.getTime() / 1000)
      }
    };
    
    tasks.push(task);
    batchNumber++;
  }
  
  // Create all tasks
  const parent = tasksClient.queuePath(PROJECT_ID, LOCATION, QUEUE);
  const results = [];
  
  for (const task of tasks) {
    try {
      const [response] = await tasksClient.createTask({ parent, task });
      results.push(response);
    } catch (error) {
      console.error('Error creating batch task:', error);
    }
  }
  
  return results;
}

/**
 * Schedule recurring ingestion
 */
async function scheduleRecurringIngestion(source, schedule) {
  // This would typically be done via Cloud Scheduler, but here's the task creation
  const task = {
    httpRequest: {
      httpMethod: 'POST',
      url: `${SERVICE_URL}/api/functions/scheduled-ingestion`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CLOUD_TASKS_SERVICE_KEY}`
      },
      body: Buffer.from(JSON.stringify({
        source,
        schedule,
        timestamp: new Date().toISOString()
      })).toString('base64')
    }
  };
  
  const parent = tasksClient.queuePath(PROJECT_ID, LOCATION, QUEUE);
  
  try {
    const [response] = await tasksClient.createTask({ parent, task });
    return response;
  } catch (error) {
    console.error('Error creating recurring task:', error);
    throw error;
  }
}

/**
 * Get task queue statistics
 */
async function getQueueStats() {
  const parent = tasksClient.queuePath(PROJECT_ID, LOCATION, QUEUE);
  
  try {
    const [queue] = await tasksClient.getQueue({ name: parent });
    
    return {
      name: queue.name,
      state: queue.state,
      rateLimits: queue.rateLimits,
      retryConfig: queue.retryConfig,
      stats: await getQueueTaskCount(parent)
    };
  } catch (error) {
    console.error('Error getting queue stats:', error);
    throw error;
  }
}

/**
 * Get count of tasks in queue
 */
async function getQueueTaskCount(queuePath) {
  try {
    const [tasks] = await tasksClient.listTasks({ parent: queuePath });
    
    const stats = {
      total: 0,
      scheduled: 0,
      running: 0
    };
    
    for (const task of tasks) {
      stats.total++;
      if (task.scheduleTime && new Date(task.scheduleTime.seconds * 1000) > new Date()) {
        stats.scheduled++;
      }
      if (task.firstAttempt && !task.lastAttempt) {
        stats.running++;
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Error counting tasks:', error);
    return { total: 0, scheduled: 0, running: 0 };
  }
}

/**
 * Cancel a task
 */
async function cancelTask(taskName) {
  try {
    await tasksClient.deleteTask({ name: taskName });
    console.log(`Cancelled task: ${taskName}`);
    return true;
  } catch (error) {
    console.error('Error cancelling task:', error);
    return false;
  }
}

/**
 * Log task creation to Firestore
 */
async function logTaskCreation(taskName, substanceInfo) {
  try {
    await admin.firestore().collection('taskLogs').add({
      taskName,
      substance: substanceInfo,
      status: 'created',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging task:', error);
  }
}

/**
 * Cloud Function handlers
 */
module.exports = {
  // Task creators
  createIngestionTask,
  createBatchIngestionTasks,
  scheduleRecurringIngestion,
  
  // Management
  getQueueStats,
  cancelTask,
  
  // HTTP endpoints for Cloud Functions
  handleIngestionTask: async (req, res) => {
    // Verify the request is from Cloud Tasks
    const taskName = req.headers['x-cloudtasks-taskname'];
    if (!taskName) {
      return res.status(403).json({ error: 'Invalid request source' });
    }
    
    try {
      const { substance } = req.body;
      console.log(`Processing ingestion task for: ${substance.name}`);
      
      // Import and run the ingestion
      const { ingestSubstance } = require('./dataIngestion');
      const result = await ingestSubstance(substance);
      
      // Log completion
      await admin.firestore().collection('taskLogs').add({
        taskName,
        substance,
        status: 'completed',
        result: { id: result.id, qualityScore: result.metadata.qualityScore },
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      res.json({ success: true, result });
    } catch (error) {
      console.error('Task processing error:', error);
      
      // Log failure
      await admin.firestore().collection('taskLogs').add({
        taskName,
        status: 'failed',
        error: error.message,
        failedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Return 500 to trigger retry
      res.status(500).json({ error: error.message });
    }
  },
  
  // Batch handler
  handleBatchIngestion: async (req, res) => {
    const taskName = req.headers['x-cloudtasks-taskname'];
    if (!taskName) {
      return res.status(403).json({ error: 'Invalid request source' });
    }
    
    try {
      const { substances, batchNumber, totalBatches } = req.body;
      console.log(`Processing batch ${batchNumber + 1}/${totalBatches}`);
      
      const { ingestSubstance } = require('./dataIngestion');
      const results = [];
      
      for (const substance of substances) {
        try {
          const result = await ingestSubstance(substance);
          results.push({ success: true, substance: substance.name, id: result.id });
        } catch (error) {
          results.push({ success: false, substance: substance.name, error: error.message });
        }
      }
      
      res.json({ success: true, batchNumber, results });
    } catch (error) {
      console.error('Batch processing error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};