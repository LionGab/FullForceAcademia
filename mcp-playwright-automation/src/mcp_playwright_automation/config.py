"""Configuration management for Playwright automation."""

import os
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()


class N8NConfig(BaseModel):
    """N8N configuration."""
    base_url: str = Field(default="https://lionalpha.app.n8n.cloud")
    api_key: Optional[str] = Field(default=None)
    username: Optional[str] = Field(default=None)
    password: Optional[str] = Field(default=None)
    timeout: int = Field(default=30000)


class GoogleSheetsConfig(BaseModel):
    """Google Sheets configuration."""
    credentials_path: Optional[str] = Field(default=None)
    service_account_key: Optional[str] = Field(default=None)
    default_sheet_id: Optional[str] = Field(default=None)
    scopes: List[str] = Field(default=[
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ])


class WAHAConfig(BaseModel):
    """WAHA WhatsApp API configuration."""
    base_url: str = Field(default="http://localhost:3000")
    api_key: Optional[str] = Field(default=None)
    default_session: str = Field(default="default")
    webhook_url: Optional[str] = Field(default=None)
    timeout: int = Field(default=15000)


class DashboardConfig(BaseModel):
    """Dashboard monitoring configuration."""
    urls: Dict[str, str] = Field(default_factory=dict)
    refresh_interval: int = Field(default=30000)
    alert_endpoints: List[str] = Field(default_factory=list)
    screenshot_path: str = Field(default="./screenshots")


class HealthCheckConfig(BaseModel):
    """Health check configuration."""
    endpoints: List[str] = Field(default_factory=list)
    check_interval: int = Field(default=60000)
    retry_attempts: int = Field(default=3)
    recovery_actions: Dict[str, str] = Field(default_factory=dict)


class AutomationConfig(BaseModel):
    """Main automation configuration."""

    # Browser settings
    headless: bool = Field(default=True)
    browser_timeout: int = Field(default=30000)
    page_timeout: int = Field(default=15000)

    # Component configurations
    n8n: N8NConfig = Field(default_factory=N8NConfig)
    google_sheets: GoogleSheetsConfig = Field(default_factory=GoogleSheetsConfig)
    waha: WAHAConfig = Field(default_factory=WAHAConfig)
    dashboard: DashboardConfig = Field(default_factory=DashboardConfig)
    health_check: HealthCheckConfig = Field(default_factory=HealthCheckConfig)

    # Logging and monitoring
    log_level: str = Field(default="INFO")
    enable_screenshots: bool = Field(default=True)
    enable_video_recording: bool = Field(default=False)

    # Sequential thinking integration
    sequential_thinking_url: str = Field(default="http://localhost:8001")
    enable_ai_optimization: bool = Field(default=True)

    def __init__(self, **data):
        super().__init__(**data)
        self._load_from_env()

    def _load_from_env(self):
        """Load configuration from environment variables."""

        # Browser settings
        if os.getenv("PLAYWRIGHT_HEADLESS"):
            self.headless = os.getenv("PLAYWRIGHT_HEADLESS").lower() == "true"

        # N8N settings
        if os.getenv("N8N_BASE_URL"):
            self.n8n.base_url = os.getenv("N8N_BASE_URL")
        if os.getenv("N8N_API_KEY"):
            self.n8n.api_key = os.getenv("N8N_API_KEY")
        if os.getenv("N8N_USERNAME"):
            self.n8n.username = os.getenv("N8N_USERNAME")
        if os.getenv("N8N_PASSWORD"):
            self.n8n.password = os.getenv("N8N_PASSWORD")

        # Google Sheets settings
        if os.getenv("GOOGLE_CREDENTIALS_PATH"):
            self.google_sheets.credentials_path = os.getenv("GOOGLE_CREDENTIALS_PATH")
        if os.getenv("GOOGLE_SERVICE_ACCOUNT_KEY"):
            self.google_sheets.service_account_key = os.getenv("GOOGLE_SERVICE_ACCOUNT_KEY")
        if os.getenv("GOOGLE_SHEET_ID"):
            self.google_sheets.default_sheet_id = os.getenv("GOOGLE_SHEET_ID")

        # WAHA settings
        if os.getenv("WAHA_BASE_URL"):
            self.waha.base_url = os.getenv("WAHA_BASE_URL")
        if os.getenv("WAHA_API_KEY"):
            self.waha.api_key = os.getenv("WAHA_API_KEY")
        if os.getenv("WAHA_DEFAULT_SESSION"):
            self.waha.default_session = os.getenv("WAHA_DEFAULT_SESSION")

        # Dashboard settings
        if os.getenv("DASHBOARD_URLS"):
            urls = os.getenv("DASHBOARD_URLS").split(",")
            self.dashboard.urls = {url.split("=")[0]: url.split("=")[1] for url in urls if "=" in url}

        # Health check settings
        if os.getenv("HEALTH_CHECK_ENDPOINTS"):
            self.health_check.endpoints = os.getenv("HEALTH_CHECK_ENDPOINTS").split(",")

        # Sequential thinking
        if os.getenv("SEQUENTIAL_THINKING_URL"):
            self.sequential_thinking_url = os.getenv("SEQUENTIAL_THINKING_URL")


class AutomationSecrets:
    """Secure secrets management."""

    @staticmethod
    def get_n8n_credentials() -> Dict[str, str]:
        """Get N8N credentials securely."""
        return {
            "username": os.getenv("N8N_USERNAME", ""),
            "password": os.getenv("N8N_PASSWORD", ""),
            "api_key": os.getenv("N8N_API_KEY", "")
        }

    @staticmethod
    def get_google_credentials() -> Optional[str]:
        """Get Google credentials path or service account key."""
        return (
            os.getenv("GOOGLE_CREDENTIALS_PATH") or
            os.getenv("GOOGLE_SERVICE_ACCOUNT_KEY")
        )

    @staticmethod
    def get_waha_api_key() -> Optional[str]:
        """Get WAHA API key."""
        return os.getenv("WAHA_API_KEY")