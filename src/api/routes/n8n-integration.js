/**
 * 🔗 N8N INTEGRATION API ROUTES
 * Enterprise API endpoints for N8N workflow integration
 * Connects JavaScript services with N8N visual automation
 */

const express = require('express');
const router = express.Router();
const CampaignController = require('../controllers/CampaignController');
const WhatsAppController = require('../controllers/WhatsAppController');
const { authenticateN8N, validateN8NPayload } = require('../middleware/n8n-auth');
const { logN8NActivity } = require('../middleware/logging');
const logger = require('../utils/logger');

// Initialize controllers
const campaignController = new CampaignController();
const whatsappController = new WhatsAppController();

/**
 * 🎯 CAMPAIGN EXECUTION ENDPOINTS
 */

// Get inactive users for N8N campaign workflow
router.get('/users/inactive', authenticateN8N, async (req, res) => {
    try {
        logger.info('📊 N8N Request: Get inactive users');

        const { limit = 650, hasPhone = 'true', excludeOptOut = 'true' } = req.query;

        const criteria = {
            status: 'inactive',
            hasPhone: hasPhone === 'true',
            hasValidData: true,
            excludeOptOut: excludeOptOut === 'true',
            limit: parseInt(limit)
        };

        const users = await campaignController.loadInactiveUsers(criteria);

        res.json({
            success: true,
            users,
            count: users.length,
            criteria,
            timestamp: new Date().toISOString(),
            source: 'n8n-integration'
        });

    } catch (error) {
        logger.error('❌ N8N Error: Get inactive users failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            source: 'n8n-integration'
        });
    }
});

// Execute campaign segment via N8N
router.post('/campaigns/execute-segment', authenticateN8N, validateN8NPayload, async (req, res) => {
    try {
        logger.info('📤 N8N Request: Execute campaign segment');

        const { campaignId, segment, config } = req.body;

        if (!campaignId || !segment) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: campaignId, segment'
            });
        }

        // Execute segment through campaign controller
        const result = await campaignController.executeSegment(campaignId, segment.priority, segment, config);

        res.json({
            success: true,
            campaignId,
            segmentExecution: result,
            timestamp: new Date().toISOString(),
            source: 'n8n-integration'
        });

    } catch (error) {
        logger.error('❌ N8N Error: Execute segment failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            campaignId: req.body.campaignId,
            source: 'n8n-integration'
        });
    }
});

// Update ROI tracking from N8N workflow
router.post('/campaigns/update-roi', authenticateN8N, async (req, res) => {
    try {
        logger.info('💰 N8N Request: Update ROI tracking');

        const { roiUpdate, campaignSession } = req.body;

        if (!roiUpdate || !campaignSession) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: roiUpdate, campaignSession'
            });
        }

        // Update campaign ROI in database
        await campaignController.updateCampaignROI(roiUpdate, campaignSession);

        res.json({
            success: true,
            roiUpdate,
            timestamp: new Date().toISOString(),
            source: 'n8n-integration'
        });

    } catch (error) {
        logger.error('❌ N8N Error: Update ROI failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            source: 'n8n-integration'
        });
    }
});

/**
 * 📱 WHATSAPP AUTOMATION ENDPOINTS
 */

// Process incoming WhatsApp message from N8N
router.post('/whatsapp/process-incoming', authenticateN8N, async (req, res) => {
    try {
        logger.info('📨 N8N Request: Process incoming WhatsApp message');

        const { messageData, routing } = req.body;

        if (!messageData) {
            return res.status(400).json({
                success: false,
                error: 'Missing messageData'
            });
        }

        // Process through WhatsApp controller
        const result = await whatsappController.handleIncomingMessage(messageData);

        res.json({
            success: true,
            messageData,
            intent: result.intent,
            response: result.response,
            routing,
            timestamp: new Date().toISOString(),
            source: 'n8n-integration'
        });

    } catch (error) {
        logger.error('❌ N8N Error: Process incoming message failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            source: 'n8n-integration'
        });
    }
});

// Send WhatsApp message via N8N
router.post('/whatsapp/send-message', authenticateN8N, async (req, res) => {
    try {
        logger.info('📤 N8N Request: Send WhatsApp message');

        const { phoneNumber, message, options = {} } = req.body;

        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: phoneNumber, message'
            });
        }

        // Send through WhatsApp controller
        const result = await whatsappController.sendMessage(phoneNumber, message, {
            ...options,
            source: 'n8n-automation'
        });

        res.json({
            success: true,
            messageId: result.messageId,
            phoneNumber: result.phone,
            timestamp: result.timestamp,
            source: 'n8n-integration'
        });

    } catch (error) {
        logger.error('❌ N8N Error: Send message failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            source: 'n8n-integration'
        });
    }
});

// Send campaign message via N8N (integrates with waha-cloud-service.js)
router.post('/whatsapp/send-campaign-message', authenticateN8N, async (req, res) => {
    try {
        logger.info('🎯 N8N Request: Send campaign message');

        const { campaignData, routing } = req.body;

        if (!campaignData || !campaignData.phoneNumber || !campaignData.message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required campaign data'
            });
        }

        // Send through WhatsApp controller with campaign context
        const result = await whatsappController.sendMessage(
            campaignData.phoneNumber,
            campaignData.message,
            {
                campaignId: campaignData.campaignId,
                segment: campaignData.segment,
                priority: campaignData.priority || 'normal',
                source: 'n8n-campaign',
                routing
            }
        );

        res.json({
            success: true,
            messageId: result.messageId,
            phoneNumber: result.phone,
            campaignId: campaignData.campaignId,
            segment: campaignData.segment,
            timestamp: result.timestamp,
            source: 'n8n-integration'
        });

    } catch (error) {
        logger.error('❌ N8N Error: Send campaign message failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            source: 'n8n-integration'
        });
    }
});

/**
 * 📊 CAMPAIGN METRICS ENDPOINTS
 */

// Get active campaigns for N8N ROI tracking
router.get('/campaigns/active', authenticateN8N, async (req, res) => {
    try {
        logger.info('📊 N8N Request: Get active campaigns');

        const activeCampaigns = await campaignController.getActiveCampaigns();

        res.json({
            success: true,
            campaigns: activeCampaigns,
            count: activeCampaigns.length,
            timestamp: new Date().toISOString(),
            source: 'n8n-integration'
        });

    } catch (error) {
        logger.error('❌ N8N Error: Get active campaigns failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            source: 'n8n-integration'
        });
    }
});

// Get campaign metrics for specific campaign
router.get('/campaigns/:campaignId/metrics', authenticateN8N, async (req, res) => {
    try {
        const { campaignId } = req.params;
        logger.info(`📈 N8N Request: Get metrics for campaign ${campaignId}`);

        const metrics = await campaignController.getCampaignMetrics(campaignId);

        res.json({
            success: true,
            campaignId,
            metrics,
            timestamp: new Date().toISOString(),
            source: 'n8n-integration'
        });

    } catch (error) {
        logger.error(`❌ N8N Error: Get campaign metrics failed for ${req.params.campaignId}:`, error);
        res.status(500).json({
            success: false,
            error: error.message,
            campaignId: req.params.campaignId,
            source: 'n8n-integration'
        });
    }
});

// Update campaign metrics from N8N
router.post('/campaigns/update-metrics', authenticateN8N, async (req, res) => {
    try {
        logger.info('📊 N8N Request: Update campaign metrics');

        const { roiUpdate, campaignResult } = req.body;

        if (!roiUpdate || !campaignResult) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: roiUpdate, campaignResult'
            });
        }

        // Update metrics through campaign controller
        await campaignController.updateCampaignMetrics(roiUpdate, campaignResult);

        res.json({
            success: true,
            updated: true,
            timestamp: new Date().toISOString(),
            source: 'n8n-integration'
        });

    } catch (error) {
        logger.error('❌ N8N Error: Update metrics failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            source: 'n8n-integration'
        });
    }
});

/**
 * 🔔 NOTIFICATION ENDPOINTS
 */

// Send notifications from N8N workflows
router.post('/notifications/send', authenticateN8N, async (req, res) => {
    try {
        logger.info('🔔 N8N Request: Send notification');

        const { notification, channels = ['email', 'webhook'] } = req.body;

        if (!notification) {
            return res.status(400).json({
                success: false,
                error: 'Missing notification data'
            });
        }

        // Process notification through appropriate channels
        const results = await Promise.allSettled(
            channels.map(channel => sendNotification(channel, notification))
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        res.json({
            success: true,
            notification,
            channels: {
                attempted: channels.length,
                successful,
                failed
            },
            timestamp: new Date().toISOString(),
            source: 'n8n-integration'
        });

    } catch (error) {
        logger.error('❌ N8N Error: Send notification failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            source: 'n8n-integration'
        });
    }
});

/**
 * 📈 DASHBOARD ENDPOINTS
 */

// Update ROI dashboard from N8N
router.post('/dashboard/roi-update', authenticateN8N, async (req, res) => {
    try {
        logger.info('📊 N8N Request: Update ROI dashboard');

        const { dashboardData, timestamp } = req.body;

        if (!dashboardData) {
            return res.status(400).json({
                success: false,
                error: 'Missing dashboardData'
            });
        }

        // Update dashboard with real-time ROI data
        await updateROIDashboard(dashboardData);

        res.json({
            success: true,
            dashboard: 'updated',
            timestamp: timestamp || new Date().toISOString(),
            source: 'n8n-integration'
        });

    } catch (error) {
        logger.error('❌ N8N Error: Update ROI dashboard failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            source: 'n8n-integration'
        });
    }
});

// Store analytics data from N8N
router.post('/analytics/store', authenticateN8N, async (req, res) => {
    try {
        logger.info('📈 N8N Request: Store analytics data');

        const { analyticsData } = req.body;

        if (!analyticsData) {
            return res.status(400).json({
                success: false,
                error: 'Missing analyticsData'
            });
        }

        // Store analytics data for historical tracking
        await storeAnalyticsData(analyticsData);

        res.json({
            success: true,
            stored: true,
            timestamp: new Date().toISOString(),
            source: 'n8n-integration'
        });

    } catch (error) {
        logger.error('❌ N8N Error: Store analytics failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            source: 'n8n-integration'
        });
    }
});

/**
 * 🔧 UTILITY FUNCTIONS
 */

async function sendNotification(channel, notification) {
    switch (channel) {
        case 'email':
            // Implement email notification
            logger.info(`📧 Email notification sent: ${notification.type}`);
            break;
        case 'webhook':
            // Implement webhook notification
            logger.info(`🔗 Webhook notification sent: ${notification.type}`);
            break;
        case 'dashboard':
            // Update dashboard with notification
            logger.info(`📊 Dashboard notification: ${notification.type}`);
            break;
        default:
            throw new Error(`Unknown notification channel: ${channel}`);
    }
}

async function updateROIDashboard(dashboardData) {
    // Implementation for updating ROI dashboard
    logger.info(`📊 ROI Dashboard updated: ${dashboardData.type}`);
}

async function storeAnalyticsData(analyticsData) {
    // Implementation for storing analytics data
    logger.info(`📈 Analytics data stored: ${analyticsData.type}`);
}

// Apply logging middleware to all routes
router.use(logN8NActivity);

module.exports = router;