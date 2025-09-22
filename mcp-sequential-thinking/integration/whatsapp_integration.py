"""
WhatsApp System Integration Module

This module provides seamless integration between the MCP Sequential Thinking Server
and the existing WhatsApp automation system, enabling intelligent orchestration
of campaign workflows.
"""

import asyncio
import json
import logging
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timedelta
import aiohttp
import websockets
from dataclasses import dataclass

from ..src.mcp_sequential_thinking.thinking import ThinkingContext, WhatsAppCampaignThinking
from ..src.mcp_sequential_thinking.workflows import WorkflowOrchestrator
from ..src.mcp_sequential_thinking.monitoring import ROITracker, PerformanceMonitor


@dataclass
class WhatsAppIntegrationConfig:
    """Configuration for WhatsApp system integration"""
    whatsapp_api_url: str
    whatsapp_api_token: str
    mcp_server_url: str
    webhook_url: str
    campaign_webhook_url: str
    database_url: str
    redis_url: str
    enable_real_time_sync: bool = True
    sync_interval_seconds: int = 30
    max_retry_attempts: int = 3


class WhatsAppMCPBridge:
    """Bridge between WhatsApp system and MCP Sequential Thinking Server"""

    def __init__(self, config: WhatsAppIntegrationConfig):
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.workflow_orchestrator = WorkflowOrchestrator()
        self.roi_tracker = ROITracker()
        self.performance_monitor = PerformanceMonitor()

        # State management
        self.active_campaigns: Dict[str, Dict[str, Any]] = {}
        self.sync_tasks: Dict[str, asyncio.Task] = {}
        self.webhook_handlers: Dict[str, Callable] = {}

        self._setup_webhook_handlers()

    def _setup_webhook_handlers(self):
        """Setup webhook handlers for different events"""
        self.webhook_handlers = {
            "campaign_start": self._handle_campaign_start,
            "message_sent": self._handle_message_sent,
            "message_delivered": self._handle_message_delivered,
            "message_response": self._handle_message_response,
            "conversion_event": self._handle_conversion_event,
            "error_event": self._handle_error_event,
            "performance_update": self._handle_performance_update
        }

    async def start_integration(self):
        """Start the integration bridge"""
        self.logger.info("Starting WhatsApp MCP Bridge")

        # Start webhook server
        webhook_task = asyncio.create_task(self._start_webhook_server())

        # Start real-time sync if enabled
        if self.config.enable_real_time_sync:
            sync_task = asyncio.create_task(self._start_real_time_sync())

        # Start performance monitoring
        monitor_task = asyncio.create_task(self._start_performance_monitoring())

        self.logger.info("WhatsApp MCP Bridge started successfully")

    async def initiate_intelligent_campaign(self, campaign_data: Dict[str, Any]) -> str:
        """Initiate an intelligent campaign using MCP thinking patterns"""

        campaign_id = campaign_data.get("campaign_id", f"campaign_{int(datetime.now().timestamp())}")

        self.logger.info(f"Initiating intelligent campaign: {campaign_id}")

        # Create thinking context from campaign data
        thinking_context = ThinkingContext(
            campaign_id=campaign_id,
            target_audience_size=campaign_data.get("target_audience_size", 650),
            roi_target=campaign_data.get("roi_target", 2250.0),
            budget_limit=campaign_data.get("budget_limit", 5000.0),
            time_constraints=campaign_data.get("time_constraints", {}),
            current_performance={},
            historical_data=campaign_data.get("historical_data", []),
            external_factors=campaign_data.get("external_factors", {})
        )

        # Start sequential thinking process
        campaign_thinking = WhatsAppCampaignThinking(context=thinking_context)

        # Integrate with workflow orchestrator
        workflow_config = {
            "campaign_id": campaign_id,
            "target_audience_size": thinking_context.target_audience_size,
            "roi_target": thinking_context.roi_target,
            "budget_limit": thinking_context.budget_limit,
            "time_constraints": thinking_context.time_constraints,
            "data_sources": campaign_data.get("data_sources", {}),
            "target_metrics": campaign_data.get("target_metrics", {}),
            "constraints": campaign_data.get("constraints", {})
        }

        workflow_id = await self.workflow_orchestrator.start_campaign_workflow(workflow_config)

        # Store campaign information
        self.active_campaigns[campaign_id] = {
            "thinking_context": thinking_context,
            "workflow_id": workflow_id,
            "start_time": datetime.now(),
            "status": "active",
            "config": campaign_data
        }

        # Start monitoring for this campaign
        monitoring_task = await self.performance_monitor.start_monitoring(campaign_id)
        self.sync_tasks[campaign_id] = monitoring_task

        # Notify WhatsApp system of campaign initiation
        await self._notify_whatsapp_system("campaign_initiated", {
            "campaign_id": campaign_id,
            "workflow_id": workflow_id,
            "intelligent_features_enabled": True
        })

        return campaign_id

    async def sync_campaign_data(self, campaign_id: str) -> Dict[str, Any]:
        """Sync campaign data between WhatsApp system and MCP"""

        # Get data from WhatsApp system
        whatsapp_data = await self._fetch_whatsapp_campaign_data(campaign_id)

        # Update MCP tracking
        if whatsapp_data:
            # Update ROI tracking
            for conversion in whatsapp_data.get("conversions", []):
                await self.roi_tracker.track_conversion(
                    campaign_id,
                    conversion["student_id"],
                    conversion["revenue"],
                    conversion.get("conversion_type", "reactivation")
                )

            # Update investment tracking
            if "investment" in whatsapp_data:
                await self.roi_tracker.track_investment(
                    campaign_id,
                    whatsapp_data["investment"],
                    whatsapp_data.get("investment_category", "operational")
                )

        # Get MCP insights
        mcp_insights = await self._get_mcp_insights(campaign_id)

        # Send optimization recommendations to WhatsApp system
        if mcp_insights.get("optimization_recommendations"):
            await self._send_optimization_to_whatsapp(campaign_id, mcp_insights)

        return {
            "sync_timestamp": datetime.now().isoformat(),
            "whatsapp_data": whatsapp_data,
            "mcp_insights": mcp_insights,
            "sync_status": "success"
        }

    async def _handle_campaign_start(self, event_data: Dict[str, Any]):
        """Handle campaign start event from WhatsApp system"""
        campaign_id = event_data.get("campaign_id")

        if campaign_id not in self.active_campaigns:
            # Auto-initiate intelligent features for existing campaign
            await self.initiate_intelligent_campaign(event_data)

        self.logger.info(f"Campaign start handled: {campaign_id}")

    async def _handle_message_sent(self, event_data: Dict[str, Any]):
        """Handle message sent event"""
        campaign_id = event_data.get("campaign_id")
        message_count = event_data.get("message_count", 1)

        if campaign_id in self.active_campaigns:
            # Update performance tracking
            # This would integrate with actual performance monitoring
            pass

        self.logger.debug(f"Message sent event: {campaign_id}, count: {message_count}")

    async def _handle_message_delivered(self, event_data: Dict[str, Any]):
        """Handle message delivered event"""
        campaign_id = event_data.get("campaign_id")
        delivery_status = event_data.get("delivery_status")

        if campaign_id in self.active_campaigns:
            # Update delivery metrics
            # This would integrate with performance monitoring
            pass

        self.logger.debug(f"Message delivered: {campaign_id}, status: {delivery_status}")

    async def _handle_message_response(self, event_data: Dict[str, Any]):
        """Handle message response event"""
        campaign_id = event_data.get("campaign_id")
        student_id = event_data.get("student_id")
        response_type = event_data.get("response_type")

        if campaign_id in self.active_campaigns:
            # Track response for analytics
            self.logger.info(f"Response received: {campaign_id}, student: {student_id}, type: {response_type}")

            # Check if this should trigger optimization
            await self._check_optimization_triggers(campaign_id)

    async def _handle_conversion_event(self, event_data: Dict[str, Any]):
        """Handle conversion event"""
        campaign_id = event_data.get("campaign_id")
        student_id = event_data.get("student_id")
        revenue = event_data.get("revenue", 0)
        conversion_type = event_data.get("conversion_type", "reactivation")

        if campaign_id in self.active_campaigns:
            # Track conversion in ROI tracker
            await self.roi_tracker.track_conversion(
                campaign_id, student_id, revenue, conversion_type
            )

            self.logger.info(f"Conversion tracked: {campaign_id}, revenue: {revenue}")

    async def _handle_error_event(self, event_data: Dict[str, Any]):
        """Handle error event from WhatsApp system"""
        campaign_id = event_data.get("campaign_id")
        error_type = event_data.get("error_type")
        error_message = event_data.get("error_message")

        self.logger.error(f"WhatsApp error: {campaign_id}, type: {error_type}, message: {error_message}")

        # This would integrate with the error handling system
        # await self.error_handler.handle_whatsapp_error(error_type, error_message, campaign_id)

    async def _handle_performance_update(self, event_data: Dict[str, Any]):
        """Handle performance update event"""
        campaign_id = event_data.get("campaign_id")
        metrics = event_data.get("metrics", {})

        if campaign_id in self.active_campaigns:
            # Update performance metrics
            self.logger.debug(f"Performance update: {campaign_id}, metrics: {metrics}")

    async def _start_webhook_server(self):
        """Start webhook server to receive events from WhatsApp system"""
        from aiohttp import web

        async def webhook_handler(request):
            try:
                data = await request.json()
                event_type = data.get("event_type")

                if event_type in self.webhook_handlers:
                    await self.webhook_handlers[event_type](data)
                    return web.json_response({"status": "success"})
                else:
                    self.logger.warning(f"Unknown event type: {event_type}")
                    return web.json_response({"status": "unknown_event"}, status=400)

            except Exception as e:
                self.logger.error(f"Webhook handler error: {str(e)}")
                return web.json_response({"status": "error", "message": str(e)}, status=500)

        app = web.Application()
        app.router.add_post('/webhook/whatsapp', webhook_handler)

        runner = web.AppRunner(app)
        await runner.setup()

        site = web.TCPSite(runner, 'localhost', 8080)
        await site.start()

        self.logger.info("Webhook server started on http://localhost:8080")

    async def _start_real_time_sync(self):
        """Start real-time synchronization with WhatsApp system"""
        while True:
            try:
                for campaign_id in list(self.active_campaigns.keys()):
                    await self.sync_campaign_data(campaign_id)

                await asyncio.sleep(self.config.sync_interval_seconds)

            except Exception as e:
                self.logger.error(f"Real-time sync error: {str(e)}")
                await asyncio.sleep(60)  # Wait longer on error

    async def _start_performance_monitoring(self):
        """Start performance monitoring across all campaigns"""
        while True:
            try:
                for campaign_id in self.active_campaigns:
                    # Get performance summary
                    performance = await self.performance_monitor.get_performance_summary(campaign_id)

                    # Check if optimization is needed
                    if self._needs_optimization(performance):
                        await self._trigger_automatic_optimization(campaign_id, performance)

                await asyncio.sleep(300)  # Check every 5 minutes

            except Exception as e:
                self.logger.error(f"Performance monitoring error: {str(e)}")
                await asyncio.sleep(300)

    async def _fetch_whatsapp_campaign_data(self, campaign_id: str) -> Optional[Dict[str, Any]]:
        """Fetch campaign data from WhatsApp system"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.config.whatsapp_api_url}/api/campaign/{campaign_id}/data"
                headers = {"Authorization": f"Bearer {self.config.whatsapp_api_token}"}

                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        self.logger.warning(f"Failed to fetch WhatsApp data: {response.status}")
                        return None

        except Exception as e:
            self.logger.error(f"Error fetching WhatsApp data: {str(e)}")
            return None

    async def _get_mcp_insights(self, campaign_id: str) -> Dict[str, Any]:
        """Get insights from MCP Sequential Thinking Server"""
        try:
            # Get ROI calculation
            roi_calc = await self.roi_tracker.calculate_real_time_roi(campaign_id)

            # Get performance summary
            performance = await self.performance_monitor.get_performance_summary(campaign_id)

            # Get optimization recommendations
            # optimization_analysis = await self.optimization_engine.analyze_optimization_opportunities(campaign_id)

            return {
                "roi_analysis": {
                    "current_roi": roi_calc.roi_percentage,
                    "total_revenue": roi_calc.total_revenue,
                    "net_profit": roi_calc.net_profit,
                    "projections": roi_calc.projections
                },
                "performance_metrics": performance,
                "optimization_recommendations": [],  # optimization_analysis.get("recommended_next_steps", []),
                "insights_timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            self.logger.error(f"Error getting MCP insights: {str(e)}")
            return {}

    async def _send_optimization_to_whatsapp(self, campaign_id: str, insights: Dict[str, Any]):
        """Send optimization recommendations to WhatsApp system"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.config.whatsapp_api_url}/api/campaign/{campaign_id}/optimize"
                headers = {
                    "Authorization": f"Bearer {self.config.whatsapp_api_token}",
                    "Content-Type": "application/json"
                }

                optimization_data = {
                    "campaign_id": campaign_id,
                    "recommendations": insights.get("optimization_recommendations", []),
                    "performance_data": insights.get("performance_metrics", {}),
                    "roi_data": insights.get("roi_analysis", {}),
                    "timestamp": datetime.now().isoformat()
                }

                async with session.post(url, headers=headers, json=optimization_data) as response:
                    if response.status == 200:
                        self.logger.info(f"Optimization sent to WhatsApp system: {campaign_id}")
                    else:
                        self.logger.warning(f"Failed to send optimization: {response.status}")

        except Exception as e:
            self.logger.error(f"Error sending optimization: {str(e)}")

    async def _notify_whatsapp_system(self, event_type: str, data: Dict[str, Any]):
        """Notify WhatsApp system of events from MCP"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.config.whatsapp_api_url}/api/mcp/notify"
                headers = {
                    "Authorization": f"Bearer {self.config.whatsapp_api_token}",
                    "Content-Type": "application/json"
                }

                notification_data = {
                    "event_type": event_type,
                    "data": data,
                    "timestamp": datetime.now().isoformat(),
                    "source": "mcp_sequential_thinking"
                }

                async with session.post(url, headers=headers, json=notification_data) as response:
                    if response.status == 200:
                        self.logger.debug(f"Notification sent: {event_type}")
                    else:
                        self.logger.warning(f"Failed to send notification: {response.status}")

        except Exception as e:
            self.logger.error(f"Error sending notification: {str(e)}")

    def _needs_optimization(self, performance: Dict[str, Any]) -> bool:
        """Check if campaign needs optimization based on performance"""
        metrics = performance.get("metrics", {})

        # Check response rate
        response_rate = metrics.get("response_rate", {}).get("current", 0)
        if response_rate < 0.15:  # Below 15%
            return True

        # Check conversion rate
        conversion_rate = metrics.get("conversion_rate", {}).get("current", 0)
        if conversion_rate < 0.10:  # Below 10%
            return True

        # Check ROI
        roi = metrics.get("roi", {}).get("current", 0)
        if roi < 1500:  # Below 1500% ROI
            return True

        return False

    async def _trigger_automatic_optimization(self, campaign_id: str, performance: Dict[str, Any]):
        """Trigger automatic optimization based on performance"""
        self.logger.info(f"Triggering automatic optimization for campaign: {campaign_id}")

        # Determine optimization strategy
        optimization_actions = []

        metrics = performance.get("metrics", {})

        if metrics.get("response_rate", {}).get("current", 0) < 0.15:
            optimization_actions.append("improve_message_timing")
            optimization_actions.append("increase_personalization")

        if metrics.get("conversion_rate", {}).get("current", 0) < 0.10:
            optimization_actions.append("strengthen_call_to_action")
            optimization_actions.append("adjust_offer_strategy")

        # Send optimization actions to WhatsApp system
        await self._send_optimization_to_whatsapp(campaign_id, {
            "optimization_recommendations": optimization_actions,
            "performance_metrics": metrics,
            "trigger_reason": "automatic_optimization"
        })

    async def _check_optimization_triggers(self, campaign_id: str):
        """Check if optimization should be triggered based on recent events"""
        # This could implement more sophisticated trigger logic
        # For now, just get current performance and check
        performance = await self.performance_monitor.get_performance_summary(campaign_id)

        if self._needs_optimization(performance):
            await self._trigger_automatic_optimization(campaign_id, performance)

    async def get_integration_status(self) -> Dict[str, Any]:
        """Get current integration status"""
        return {
            "bridge_status": "active",
            "active_campaigns": len(self.active_campaigns),
            "sync_tasks": len(self.sync_tasks),
            "real_time_sync_enabled": self.config.enable_real_time_sync,
            "last_sync": datetime.now().isoformat(),
            "webhook_handlers": list(self.webhook_handlers.keys()),
            "config": {
                "whatsapp_api_url": self.config.whatsapp_api_url,
                "sync_interval": self.config.sync_interval_seconds,
                "max_retry_attempts": self.config.max_retry_attempts
            }
        }

    async def stop_integration(self):
        """Stop the integration bridge"""
        self.logger.info("Stopping WhatsApp MCP Bridge")

        # Cancel all sync tasks
        for task in self.sync_tasks.values():
            task.cancel()

        # Stop monitoring
        await self.performance_monitor.stop_monitoring()

        self.logger.info("WhatsApp MCP Bridge stopped")


# Example usage and initialization
async def initialize_integration():
    """Initialize WhatsApp MCP integration"""

    config = WhatsAppIntegrationConfig(
        whatsapp_api_url="http://localhost:3001",
        whatsapp_api_token="your_whatsapp_token",
        mcp_server_url="http://localhost:8000",
        webhook_url="http://localhost:8080/webhook/whatsapp",
        campaign_webhook_url="http://localhost:3001/webhook/mcp",
        database_url="postgresql://postgres:password@localhost:5432/whatsapp_automation",
        redis_url="redis://localhost:6379",
        enable_real_time_sync=True,
        sync_interval_seconds=30
    )

    bridge = WhatsAppMCPBridge(config)
    await bridge.start_integration()

    return bridge


if __name__ == "__main__":
    # Example of running the integration
    async def main():
        bridge = await initialize_integration()

        # Keep running
        try:
            while True:
                await asyncio.sleep(60)
        except KeyboardInterrupt:
            await bridge.stop_integration()

    asyncio.run(main())