/**
 * 🎯 CAMPAIGN CONTROLLER - FullForce Academia
 * Enterprise-ready controller for 650 inactive users campaign
 * ROI Target: 2250%-3750% - Intelligent segmentation & automation
 */

const CampaignModel = require('../models/CampaignModel');
const UserSegmentationModel = require('../models/UserSegmentationModel');
const WAHACloudService = require('../services/waha-cloud-service');
const CampaignScheduler = require('../campaign-scheduler');
const { validateCampaignData, sanitizePhoneNumber } = require('../utils/validators');
const { CampaignError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class CampaignController {
    constructor() {
        this.campaignModel = new CampaignModel();
        this.segmentationModel = new UserSegmentationModel();
        this.wahaService = null;
        this.scheduler = new CampaignScheduler();

        this.campaignMetrics = {
            targetUsers: 650,
            expectedROI: { min: 2250, max: 3750 },
            conversionRates: {
                CRITICA: 0.35,
                ALTA: 0.25,
                MEDIA: 0.15,
                BAIXA: 0.08
            }
        };
    }

    /**
     * Initialize campaign controller with services
     */
    async initialize(databaseService, sheetsService) {
        try {
            this.wahaService = new WAHACloudService(databaseService, sheetsService);
            await this.wahaService.initializeCloudIntegration();

            logger.info('🎯 Campaign Controller initialized successfully');
            return true;
        } catch (error) {
            logger.error('❌ Failed to initialize Campaign Controller:', error);
            throw new CampaignError('Controller initialization failed', error);
        }
    }

    /**
     * Execute the complete 650 inactive users campaign
     */
    async execute650Campaign(options = {}) {
        try {
            logger.info('🚀 Starting 650 Inactive Users Campaign execution...');

            // Step 1: Load and validate inactive users
            const users = await this.loadInactiveUsers();
            if (users.length === 0) {
                throw new CampaignError('No inactive users found for campaign');
            }

            // Step 2: Intelligent segmentation
            const segmentation = await this.performIntelligentSegmentation(users);

            // Step 3: Create campaign record
            const campaign = await this.createCampaignRecord(segmentation, options);

            // Step 4: Execute segmented campaign
            const results = await this.executeSegmentedCampaign(campaign, segmentation, options);

            // Step 5: Calculate and validate ROI
            const roiAnalysis = await this.calculateROIAnalysis(results, segmentation);

            // Step 6: Generate comprehensive report
            const report = await this.generateCampaignReport(campaign, results, roiAnalysis);

            logger.info('✅ Campaign 650 executed successfully', {
                campaignId: campaign.id,
                totalUsers: users.length,
                segments: Object.keys(segmentation.segments).length,
                expectedROI: roiAnalysis.projectedROI
            });

            return {
                success: true,
                campaign,
                segmentation,
                results,
                roiAnalysis,
                report
            };

        } catch (error) {
            logger.error('❌ Campaign 650 execution failed:', error);
            throw new CampaignError('Campaign execution failed', error);
        }
    }

    /**
     * Load 650 inactive users with intelligent filtering
     */
    async loadInactiveUsers() {
        try {
            logger.info('📊 Loading 650 inactive users...');

            const criteria = {
                status: 'inactive',
                hasPhone: true,
                hasValidData: true,
                excludeOptOut: true,
                limit: this.campaignMetrics.targetUsers
            };

            const users = await this.campaignModel.getInactiveUsers(criteria);

            // Validate and clean user data
            const validUsers = users
                .filter(user => this.validateUserData(user))
                .map(user => this.sanitizeUserData(user));

            logger.info(`✅ Loaded ${validUsers.length} valid inactive users`);
            return validUsers;

        } catch (error) {
            logger.error('❌ Failed to load inactive users:', error);
            throw new CampaignError('Failed to load users', error);
        }
    }

    /**
     * Perform intelligent user segmentation for optimal ROI
     */
    async performIntelligentSegmentation(users) {
        try {
            logger.info('🧠 Performing intelligent user segmentation...');

            const segmentation = await this.segmentationModel.segmentUsers(users, {
                algorithm: 'intelligent_priority',
                factors: [
                    'registration_date',
                    'last_activity',
                    'payment_history',
                    'engagement_score',
                    'demographic_data'
                ],
                targetConversion: this.campaignMetrics.conversionRates
            });

            // Validate segmentation quality
            this.validateSegmentationQuality(segmentation);

            logger.info('✅ User segmentation completed', {
                segments: Object.keys(segmentation.segments).length,
                totalUsers: segmentation.totalUsers,
                qualityScore: segmentation.qualityScore
            });

            return segmentation;

        } catch (error) {
            logger.error('❌ Failed to perform segmentation:', error);
            throw new CampaignError('Segmentation failed', error);
        }
    }

    /**
     * Create campaign record in database
     */
    async createCampaignRecord(segmentation, options) {
        try {
            const campaignData = {
                name: 'Campaign 650 Inactive Users',
                type: 'reactivation',
                status: 'active',
                targetUsers: this.campaignMetrics.targetUsers,
                segments: segmentation.segments,
                expectedROI: this.campaignMetrics.expectedROI,
                configuration: {
                    batchSize: options.batchSize || 50,
                    delayBetweenBatches: options.delayBetweenBatches || 30000,
                    maxRetries: options.maxRetries || 3,
                    platform: 'waha-cloud'
                },
                createdAt: new Date(),
                createdBy: 'system'
            };

            validateCampaignData(campaignData);
            const campaign = await this.campaignModel.createCampaign(campaignData);

            logger.info('✅ Campaign record created', { campaignId: campaign.id });
            return campaign;

        } catch (error) {
            logger.error('❌ Failed to create campaign record:', error);
            throw new CampaignError('Campaign creation failed', error);
        }
    }

    /**
     * Execute segmented campaign with intelligent prioritization
     */
    async executeSegmentedCampaign(campaign, segmentation, options) {
        try {
            logger.info('📱 Executing segmented campaign...');

            const results = {
                campaignId: campaign.id,
                segments: {},
                overall: {
                    sent: 0,
                    errors: 0,
                    startTime: new Date(),
                    endTime: null
                }
            };

            // Execute segments by priority (CRITICA -> ALTA -> MEDIA -> BAIXA)
            const priorityOrder = ['CRITICA', 'ALTA', 'MEDIA', 'BAIXA'];

            for (const priority of priorityOrder) {
                const segment = segmentation.segments[priority];
                if (!segment || segment.users.length === 0) continue;

                logger.info(`📤 Processing segment ${priority}: ${segment.users.length} users`);

                const segmentResult = await this.executeSegment(
                    campaign,
                    priority,
                    segment,
                    options
                );

                results.segments[priority] = segmentResult;
                results.overall.sent += segmentResult.sent;
                results.overall.errors += segmentResult.errors;

                // Intelligent delay between segments for rate limiting
                if (priorityOrder.indexOf(priority) < priorityOrder.length - 1) {
                    const delay = this.calculateSegmentDelay(segment.users.length);
                    logger.info(`⏸️ Waiting ${delay/1000}s before next segment...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }

            results.overall.endTime = new Date();
            results.overall.duration = results.overall.endTime - results.overall.startTime;

            // Update campaign status
            await this.campaignModel.updateCampaignResults(campaign.id, results);

            logger.info('✅ Segmented campaign execution completed', {
                totalSent: results.overall.sent,
                totalErrors: results.overall.errors,
                duration: `${results.overall.duration/1000}s`
            });

            return results;

        } catch (error) {
            logger.error('❌ Failed to execute segmented campaign:', error);
            throw new CampaignError('Campaign execution failed', error);
        }
    }

    /**
     * Execute individual segment
     */
    async executeSegment(campaign, priority, segment, options) {
        try {
            const segmentResult = {
                priority,
                users: segment.users.length,
                sent: 0,
                errors: 0,
                details: [],
                startTime: new Date()
            };

            // Use WAHA Cloud Service for actual message sending
            const wahaResults = await this.wahaService.executeCloudCampaign(
                { [priority.toLowerCase()]: segment.users },
                {
                    ...options,
                    campaignId: campaign.id,
                    segment: priority
                }
            );

            // Process WAHA results
            segmentResult.sent = wahaResults.sent;
            segmentResult.errors = wahaResults.errors;
            segmentResult.details = wahaResults.details;
            segmentResult.endTime = new Date();

            // Log segment completion
            await this.logSegmentExecution(campaign.id, priority, segmentResult);

            return segmentResult;

        } catch (error) {
            logger.error(`❌ Failed to execute segment ${priority}:`, error);
            throw new CampaignError(`Segment ${priority} execution failed`, error);
        }
    }

    /**
     * Calculate comprehensive ROI analysis
     */
    async calculateROIAnalysis(results, segmentation) {
        try {
            logger.info('💰 Calculating ROI analysis...');

            const analysis = {
                investment: 1500, // R$ campaign cost
                projectedRevenue: 0,
                projectedReactivations: 0,
                segmentAnalysis: {},
                achievesTarget: false
            };

            // Calculate by segment
            Object.entries(results.segments).forEach(([priority, segmentResult]) => {
                const conversionRate = this.campaignMetrics.conversionRates[priority];
                const avgMonthlyValue = 129.90;
                const monthsProjected = priority === 'BAIXA' ? 3 : 6;

                const reactivations = Math.floor(segmentResult.sent * conversionRate);
                const revenue = reactivations * avgMonthlyValue * monthsProjected;

                analysis.segmentAnalysis[priority] = {
                    sent: segmentResult.sent,
                    expectedReactivations: reactivations,
                    expectedRevenue: revenue,
                    conversionRate,
                    monthsProjected
                };

                analysis.projectedRevenue += revenue;
                analysis.projectedReactivations += reactivations;
            });

            // Calculate ROI
            analysis.roi = ((analysis.projectedRevenue - analysis.investment) / analysis.investment) * 100;
            analysis.achievesTarget = analysis.roi >= this.campaignMetrics.expectedROI.min;

            // Performance metrics
            analysis.performance = {
                successRate: (results.overall.sent / (results.overall.sent + results.overall.errors)) * 100,
                totalProcessed: results.overall.sent + results.overall.errors,
                executionTime: results.overall.duration
            };

            logger.info('✅ ROI analysis completed', {
                roi: `${analysis.roi.toFixed(0)}%`,
                reactivations: analysis.projectedReactivations,
                revenue: `R$ ${analysis.projectedRevenue.toFixed(2)}`,
                achievesTarget: analysis.achievesTarget
            });

            return analysis;

        } catch (error) {
            logger.error('❌ Failed to calculate ROI analysis:', error);
            throw new CampaignError('ROI calculation failed', error);
        }
    }

    /**
     * Generate comprehensive campaign report
     */
    async generateCampaignReport(campaign, results, roiAnalysis) {
        try {
            logger.info('📋 Generating campaign report...');

            const report = {
                campaignId: campaign.id,
                executionDate: new Date(),
                summary: {
                    totalUsers: this.campaignMetrics.targetUsers,
                    processed: results.overall.sent + results.overall.errors,
                    sent: results.overall.sent,
                    errors: results.overall.errors,
                    successRate: roiAnalysis.performance.successRate
                },
                segmentBreakdown: roiAnalysis.segmentAnalysis,
                roiProjection: {
                    investment: roiAnalysis.investment,
                    projectedRevenue: roiAnalysis.projectedRevenue,
                    roi: roiAnalysis.roi,
                    achievesTarget: roiAnalysis.achievesTarget,
                    expectedReactivations: roiAnalysis.projectedReactivations
                },
                performance: {
                    executionTime: results.overall.duration,
                    platform: 'WAHA Cloud',
                    batchProcessing: true,
                    rateCompliance: true
                },
                nextActions: this.generateNextActions(roiAnalysis)
            };

            // Save report to database
            await this.campaignModel.saveCampaignReport(campaign.id, report);

            logger.info('✅ Campaign report generated successfully');
            return report;

        } catch (error) {
            logger.error('❌ Failed to generate campaign report:', error);
            throw new CampaignError('Report generation failed', error);
        }
    }

    /**
     * Helper methods
     */
    validateUserData(user) {
        return user.telefone &&
               user.nome &&
               user.telefone.length >= 10 &&
               !user.optOut;
    }

    sanitizeUserData(user) {
        return {
            ...user,
            telefone: sanitizePhoneNumber(user.telefone),
            nome: user.nome.trim(),
            email: user.email ? user.email.toLowerCase().trim() : null
        };
    }

    validateSegmentationQuality(segmentation) {
        if (segmentation.qualityScore < 0.8) {
            throw new ValidationError('Segmentation quality too low');
        }

        if (segmentation.totalUsers < 500) {
            throw new ValidationError('Insufficient users for campaign');
        }
    }

    calculateSegmentDelay(userCount) {
        // Intelligent delay based on segment size and rate limiting
        const baseDelay = 60000; // 1 minute
        const dynamicDelay = userCount * 100; // 100ms per user
        return Math.min(baseDelay + dynamicDelay, 300000); // Max 5 minutes
    }

    async logSegmentExecution(campaignId, priority, result) {
        await this.campaignModel.logSegmentExecution(campaignId, priority, result);
    }

    generateNextActions(roiAnalysis) {
        const actions = [];

        if (roiAnalysis.achievesTarget) {
            actions.push('Monitor conversion rates over next 30 days');
            actions.push('Prepare follow-up campaigns for non-responders');
        } else {
            actions.push('Analyze low-performing segments');
            actions.push('Optimize message templates');
            actions.push('Consider additional touchpoints');
        }

        actions.push('Track actual ROI vs projections');
        actions.push('Schedule regular campaign optimization');

        return actions;
    }

    /**
     * Get campaign status and metrics
     */
    async getCampaignStatus(campaignId) {
        try {
            const campaign = await this.campaignModel.getCampaign(campaignId);
            const metrics = await this.campaignModel.getCampaignMetrics(campaignId);

            return {
                campaign,
                metrics,
                status: campaign.status,
                progress: this.calculateProgress(metrics)
            };
        } catch (error) {
            logger.error('❌ Failed to get campaign status:', error);
            throw new CampaignError('Status retrieval failed', error);
        }
    }

    calculateProgress(metrics) {
        const total = metrics.sent + metrics.errors + metrics.pending;
        return total > 0 ? ((metrics.sent + metrics.errors) / total) * 100 : 0;
    }
}

module.exports = CampaignController;