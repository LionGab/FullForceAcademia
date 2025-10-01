"""Main MCP Playwright Automation Server."""

import asyncio
import logging
import os
from typing import Any, Dict, List, Optional

import structlog
from mcp import Server, types
from mcp.server.models import InitializationOptions
from playwright.async_api import async_playwright, Browser, Page

from .n8n_automation import N8NAutomation
from .sheets_automation import GoogleSheetsAutomation
from .waha_automation import WAHAAutomation
from .dashboard_automation import DashboardAutomation
from .health_automation import HealthCheckAutomation
from .config import AutomationConfig

logger = structlog.get_logger(__name__)


class PlaywrightAutomationServer:
    """MCP server for Playwright-based web automation."""

    def __init__(self):
        self.app = Server("playwright-automation")
        self.config = AutomationConfig()
        self.browser: Optional[Browser] = None
        self.context = None
        self.playwright = None

        # Automation modules
        self.n8n_automation = None
        self.sheets_automation = None
        self.waha_automation = None
        self.dashboard_automation = None
        self.health_automation = None

        self._setup_handlers()

    def _setup_handlers(self):
        """Set up MCP request handlers."""

        @self.app.list_tools()
        async def handle_list_tools() -> List[types.Tool]:
            """List available automation tools."""
            return [
                types.Tool(
                    name="n8n_deploy_workflow",
                    description="Deploy and manage N8N workflows",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "workflow_name": {"type": "string"},
                            "workflow_data": {"type": "object"},
                            "action": {"type": "string", "enum": ["deploy", "activate", "deactivate", "delete"]}
                        },
                        "required": ["workflow_name", "action"]
                    }
                ),
                types.Tool(
                    name="n8n_monitor_execution",
                    description="Monitor N8N workflow executions",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "workflow_id": {"type": "string"},
                            "execution_id": {"type": "string", "optional": True}
                        },
                        "required": ["workflow_id"]
                    }
                ),
                types.Tool(
                    name="sheets_validate_data",
                    description="Validate and update Google Sheets data",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "sheet_url": {"type": "string"},
                            "validation_rules": {"type": "object"},
                            "auto_fix": {"type": "boolean", "default": False}
                        },
                        "required": ["sheet_url"]
                    }
                ),
                types.Tool(
                    name="sheets_campaign_sync",
                    description="Synchronize campaign data with Google Sheets",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "sheet_url": {"type": "string"},
                            "campaign_data": {"type": "object"},
                            "sync_direction": {"type": "string", "enum": ["import", "export", "bidirectional"]}
                        },
                        "required": ["sheet_url", "sync_direction"]
                    }
                ),
                types.Tool(
                    name="waha_monitor_status",
                    description="Monitor WAHA WhatsApp API status and health",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "session_name": {"type": "string"},
                            "detailed": {"type": "boolean", "default": False}
                        }
                    }
                ),
                types.Tool(
                    name="waha_manage_session",
                    description="Manage WAHA WhatsApp sessions",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "session_name": {"type": "string"},
                            "action": {"type": "string", "enum": ["start", "stop", "restart", "status"]},
                            "config": {"type": "object", "optional": True}
                        },
                        "required": ["session_name", "action"]
                    }
                ),
                types.Tool(
                    name="dashboard_monitor",
                    description="Monitor campaign analytics dashboards",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "dashboard_url": {"type": "string"},
                            "metrics": {"type": "array", "items": {"type": "string"}},
                            "alert_thresholds": {"type": "object", "optional": True}
                        },
                        "required": ["dashboard_url"]
                    }
                ),
                types.Tool(
                    name="dashboard_export_report",
                    description="Export dashboard reports and analytics",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "dashboard_url": {"type": "string"},
                            "report_type": {"type": "string", "enum": ["pdf", "csv", "screenshot"]},
                            "date_range": {"type": "object"}
                        },
                        "required": ["dashboard_url", "report_type"]
                    }
                ),
                types.Tool(
                    name="health_check_system",
                    description="Perform comprehensive system health checks",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "components": {"type": "array", "items": {"type": "string"}},
                            "recovery_mode": {"type": "boolean", "default": False}
                        }
                    }
                ),
                types.Tool(
                    name="error_recovery_auto",
                    description="Automated error recovery and system healing",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "error_type": {"type": "string"},
                            "component": {"type": "string"},
                            "recovery_strategy": {"type": "string", "enum": ["restart", "reset", "rollback", "manual"]}
                        },
                        "required": ["error_type", "component"]
                    }
                ),
                types.Tool(
                    name="automation_sequence",
                    description="Execute complex automation sequences with sequential thinking",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "sequence_name": {"type": "string"},
                            "steps": {"type": "array", "items": {"type": "object"}},
                            "thinking_mode": {"type": "boolean", "default": True}
                        },
                        "required": ["sequence_name", "steps"]
                    }
                )
            ]

        @self.app.call_tool()
        async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[types.TextContent]:
            """Handle tool calls."""
            try:
                await self._ensure_browser()

                if name == "n8n_deploy_workflow":
                    result = await self.n8n_automation.deploy_workflow(
                        arguments["workflow_name"],
                        arguments.get("workflow_data"),
                        arguments["action"]
                    )
                elif name == "n8n_monitor_execution":
                    result = await self.n8n_automation.monitor_execution(
                        arguments["workflow_id"],
                        arguments.get("execution_id")
                    )
                elif name == "sheets_validate_data":
                    result = await self.sheets_automation.validate_data(
                        arguments["sheet_url"],
                        arguments.get("validation_rules", {}),
                        arguments.get("auto_fix", False)
                    )
                elif name == "sheets_campaign_sync":
                    result = await self.sheets_automation.campaign_sync(
                        arguments["sheet_url"],
                        arguments.get("campaign_data", {}),
                        arguments["sync_direction"]
                    )
                elif name == "waha_monitor_status":
                    result = await self.waha_automation.monitor_status(
                        arguments.get("session_name"),
                        arguments.get("detailed", False)
                    )
                elif name == "waha_manage_session":
                    result = await self.waha_automation.manage_session(
                        arguments["session_name"],
                        arguments["action"],
                        arguments.get("config")
                    )
                elif name == "dashboard_monitor":
                    result = await self.dashboard_automation.monitor(
                        arguments["dashboard_url"],
                        arguments.get("metrics", []),
                        arguments.get("alert_thresholds", {})
                    )
                elif name == "dashboard_export_report":
                    result = await self.dashboard_automation.export_report(
                        arguments["dashboard_url"],
                        arguments["report_type"],
                        arguments.get("date_range", {})
                    )
                elif name == "health_check_system":
                    result = await self.health_automation.system_check(
                        arguments.get("components", []),
                        arguments.get("recovery_mode", False)
                    )
                elif name == "error_recovery_auto":
                    result = await self.health_automation.auto_recovery(
                        arguments["error_type"],
                        arguments["component"],
                        arguments.get("recovery_strategy", "restart")
                    )
                elif name == "automation_sequence":
                    result = await self._execute_automation_sequence(
                        arguments["sequence_name"],
                        arguments["steps"],
                        arguments.get("thinking_mode", True)
                    )
                else:
                    raise ValueError(f"Unknown tool: {name}")

                return [types.TextContent(type="text", text=str(result))]

            except Exception as e:
                logger.error(f"Tool execution failed: {name}", error=str(e))
                return [types.TextContent(
                    type="text",
                    text=f"Error executing {name}: {str(e)}"
                )]

    async def _ensure_browser(self):
        """Ensure browser is initialized."""
        if not self.browser:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=self.config.headless,
                args=['--no-sandbox', '--disable-dev-shm-usage']
            )
            self.context = await self.browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            )

            # Initialize automation modules
            self.n8n_automation = N8NAutomation(self.context, self.config)
            self.sheets_automation = GoogleSheetsAutomation(self.context, self.config)
            self.waha_automation = WAHAAutomation(self.context, self.config)
            self.dashboard_automation = DashboardAutomation(self.context, self.config)
            self.health_automation = HealthCheckAutomation(self.context, self.config)

    async def _execute_automation_sequence(self, sequence_name: str, steps: List[Dict], thinking_mode: bool) -> Dict:
        """Execute complex automation sequence with optional sequential thinking."""
        logger.info(f"Executing automation sequence: {sequence_name}")

        results = []
        context = {}

        for i, step in enumerate(steps):
            step_name = step.get("name", f"Step {i+1}")
            tool_name = step.get("tool")
            arguments = step.get("arguments", {})

            # Apply context variables to arguments
            if "context" in step:
                for key, value in step["context"].items():
                    if isinstance(value, str) and value.startswith("$"):
                        context_key = value[1:]
                        if context_key in context:
                            arguments[key] = context[context_key]

            try:
                logger.info(f"Executing step: {step_name}")

                if thinking_mode:
                    # Use sequential thinking for complex decisions
                    thinking_result = await self._apply_sequential_thinking(step_name, arguments)
                    if thinking_result.get("modified_arguments"):
                        arguments.update(thinking_result["modified_arguments"])

                # Execute the step
                if tool_name == "n8n_deploy_workflow":
                    result = await self.n8n_automation.deploy_workflow(
                        arguments["workflow_name"],
                        arguments.get("workflow_data"),
                        arguments["action"]
                    )
                elif tool_name == "sheets_validate_data":
                    result = await self.sheets_automation.validate_data(
                        arguments["sheet_url"],
                        arguments.get("validation_rules", {}),
                        arguments.get("auto_fix", False)
                    )
                # Add other tool mappings...

                results.append({
                    "step": step_name,
                    "status": "success",
                    "result": result
                })

                # Update context with results
                if step.get("output_to_context"):
                    context.update(step["output_to_context"])

            except Exception as e:
                logger.error(f"Step {step_name} failed", error=str(e))
                results.append({
                    "step": step_name,
                    "status": "error",
                    "error": str(e)
                })

                if step.get("critical", False):
                    break

        return {
            "sequence": sequence_name,
            "results": results,
            "context": context,
            "status": "completed" if all(r["status"] == "success" for r in results) else "partial"
        }

    async def _apply_sequential_thinking(self, step_name: str, arguments: Dict) -> Dict:
        """Apply sequential thinking to automation decisions."""
        # This would integrate with the MCP sequential thinking server
        # For now, return basic optimization
        return {
            "thinking_applied": True,
            "step": step_name,
            "modified_arguments": {}
        }

    async def cleanup(self):
        """Clean up resources."""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def run(self):
        """Run the MCP server."""
        async with self.app:
            await self.app.run()


async def main():
    """Main entry point."""
    server = PlaywrightAutomationServer()
    try:
        await server.run()
    finally:
        await server.cleanup()


if __name__ == "__main__":
    asyncio.run(main())