"""MCP Playwright Automation Package for WhatsApp Campaign Systems."""

__version__ = "0.1.0"
__author__ = "FullForce Academia"
__email__ = "dev@fullforce.com"

from .server import PlaywrightAutomationServer
from .n8n_automation import N8NAutomation
from .sheets_automation import GoogleSheetsAutomation
from .waha_automation import WAHAAutomation
from .dashboard_automation import DashboardAutomation
from .health_automation import HealthCheckAutomation

__all__ = [
    "PlaywrightAutomationServer",
    "N8NAutomation",
    "GoogleSheetsAutomation",
    "WAHAAutomation",
    "DashboardAutomation",
    "HealthCheckAutomation"
]