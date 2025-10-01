"""WAHA WhatsApp API automation using Playwright."""

import asyncio
import json
from typing import Any, Dict, List, Optional

import structlog
from playwright.async_api import BrowserContext, Page
from tenacity import retry, stop_after_attempt, wait_exponential

from .config import AutomationConfig, AutomationSecrets

logger = structlog.get_logger(__name__)


class WAHAAutomation:
    """Automated WAHA WhatsApp API management using browser automation."""

    def __init__(self, context: BrowserContext, config: AutomationConfig):
        self.context = context
        self.config = config
        self.page: Optional[Page] = None
        self.is_authenticated = False

    async def _ensure_page(self) -> Page:
        """Ensure we have a page and can access WAHA."""
        if not self.page:
            self.page = await self.context.new_page()
            await self._connect_to_waha()
        return self.page

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def _connect_to_waha(self):
        """Connect to WAHA interface."""
        logger.info(f"Connecting to WAHA at {self.config.waha.base_url}")

        page = self.page

        try:
            # Navigate to WAHA dashboard
            dashboard_url = f"{self.config.waha.base_url}/dashboard"
            await page.goto(dashboard_url, timeout=self.config.browser_timeout)
            await page.wait_for_load_state('networkidle')

            # Check if WAHA is responding
            if await page.locator('text="WAHA"').is_visible() or await page.locator('[class*="dashboard"]').is_visible():
                logger.info("Successfully connected to WAHA dashboard")
                self.is_authenticated = True
            else:
                # Try the API status endpoint
                api_url = f"{self.config.waha.base_url}/api/status"
                await page.goto(api_url)

                # Check for JSON response
                content = await page.content()
                if '"status"' in content or '"sessions"' in content:
                    logger.info("WAHA API is responding")
                    self.is_authenticated = True
                else:
                    raise Exception("WAHA is not responding properly")

        except Exception as e:
            logger.error("WAHA connection failed", error=str(e))
            raise

    async def monitor_status(self, session_name: Optional[str] = None, detailed: bool = False) -> Dict:
        """Monitor WAHA WhatsApp API status and health."""
        logger.info("Monitoring WAHA status")

        page = await self._ensure_page()

        try:
            # Get API status
            status_url = f"{self.config.waha.base_url}/api/status"
            await page.goto(status_url)
            await page.wait_for_load_state('networkidle')

            # Parse JSON response
            content = await page.content()
            status_data = self._extract_json_from_page(content)

            # Get sessions information
            sessions_url = f"{self.config.waha.base_url}/api/sessions"
            await page.goto(sessions_url)
            await page.wait_for_load_state('networkidle')

            sessions_content = await page.content()
            sessions_data = self._extract_json_from_page(sessions_content)

            result = {
                "api_status": status_data,
                "sessions": sessions_data,
                "timestamp": await self._get_current_timestamp(page)
            }

            # Filter by specific session if requested
            if session_name and sessions_data:
                filtered_sessions = [s for s in sessions_data if s.get('name') == session_name]
                result["sessions"] = filtered_sessions

            # Get detailed information if requested
            if detailed:
                result["detailed_info"] = await self._get_detailed_session_info(page, session_name)

            return result

        except Exception as e:
            logger.error("WAHA status monitoring failed", error=str(e))
            raise

    async def manage_session(self, session_name: str, action: str, config: Optional[Dict] = None) -> Dict:
        """Manage WAHA WhatsApp sessions."""
        logger.info(f"Managing WAHA session {session_name}: {action}")

        page = await self._ensure_page()

        try:
            if action == "start":
                return await self._start_session(page, session_name, config)
            elif action == "stop":
                return await self._stop_session(page, session_name)
            elif action == "restart":
                stop_result = await self._stop_session(page, session_name)
                await asyncio.sleep(2)  # Wait between stop and start
                start_result = await self._start_session(page, session_name, config)
                return {
                    "action": "restart",
                    "stop_result": stop_result,
                    "start_result": start_result,
                    "session_name": session_name
                }
            elif action == "status":
                return await self._get_session_status(page, session_name)
            else:
                raise ValueError(f"Unknown action: {action}")

        except Exception as e:
            logger.error(f"Session management failed: {action}", session=session_name, error=str(e))
            raise

    async def _start_session(self, page: Page, session_name: str, config: Optional[Dict]) -> Dict:
        """Start a WhatsApp session."""
        # Prepare session configuration
        session_config = {
            "name": session_name,
            "config": config or {}
        }

        # POST to sessions endpoint
        await page.goto(f"{self.config.waha.base_url}/api/sessions")

        # Use page.evaluate to make POST request
        result = await page.evaluate(f"""
            fetch('/api/sessions', {{
                method: 'POST',
                headers: {{
                    'Content-Type': 'application/json',
                    'X-API-Key': '{self.config.waha.api_key or ""}'
                }},
                body: JSON.stringify({json.dumps(session_config)})
            }})
            .then(response => response.json())
            .then(data => data)
            .catch(error => ({{error: error.message}}))
        """)

        # Check for QR code if needed
        qr_code_data = await self._check_for_qr_code(page, session_name)
        if qr_code_data:
            result["qr_code"] = qr_code_data

        return {
            "action": "start",
            "session_name": session_name,
            "result": result,
            "status": "success" if not result.get("error") else "error"
        }

    async def _stop_session(self, page: Page, session_name: str) -> Dict:
        """Stop a WhatsApp session."""
        # DELETE session
        result = await page.evaluate(f"""
            fetch('/api/sessions/{session_name}', {{
                method: 'DELETE',
                headers: {{
                    'X-API-Key': '{self.config.waha.api_key or ""}'
                }}
            }})
            .then(response => response.json())
            .then(data => data)
            .catch(error => ({{error: error.message}}))
        """)

        return {
            "action": "stop",
            "session_name": session_name,
            "result": result,
            "status": "success" if not result.get("error") else "error"
        }

    async def _get_session_status(self, page: Page, session_name: str) -> Dict:
        """Get detailed session status."""
        # GET session status
        status_url = f"{self.config.waha.base_url}/api/sessions/{session_name}"
        await page.goto(status_url)
        await page.wait_for_load_state('networkidle')

        content = await page.content()
        session_data = self._extract_json_from_page(content)

        return {
            "session_name": session_name,
            "status": session_data,
            "timestamp": await self._get_current_timestamp(page)
        }

    async def _check_for_qr_code(self, page: Page, session_name: str) -> Optional[Dict]:
        """Check for QR code and capture it."""
        try:
            # Check QR code endpoint
            qr_url = f"{self.config.waha.base_url}/api/sessions/{session_name}/auth/qr"
            await page.goto(qr_url)
            await page.wait_for_load_state('networkidle')

            # Look for QR code image
            qr_image = page.locator('img[src*="qr"]').or_(page.locator('[data-testid="qr-code"]'))

            if await qr_image.is_visible():
                # Take screenshot of QR code
                qr_screenshot = await qr_image.screenshot()

                return {
                    "available": True,
                    "screenshot": qr_screenshot.hex(),
                    "url": qr_url,
                    "message": "QR code is available for scanning"
                }

        except Exception as e:
            logger.debug("No QR code found or error checking", error=str(e))

        return None

    async def _get_detailed_session_info(self, page: Page, session_name: Optional[str] = None) -> Dict:
        """Get detailed information about sessions."""
        detailed_info = {}

        try:
            # Get webhook information
            webhooks_url = f"{self.config.waha.base_url}/api/webhooks"
            await page.goto(webhooks_url)
            await page.wait_for_load_state('networkidle')

            webhooks_content = await page.content()
            webhooks_data = self._extract_json_from_page(webhooks_content)
            detailed_info["webhooks"] = webhooks_data

            # Get messages statistics if session specified
            if session_name:
                # Try to get recent messages
                messages_url = f"{self.config.waha.base_url}/api/sessions/{session_name}/messages"
                await page.goto(messages_url)
                await page.wait_for_load_state('networkidle')

                messages_content = await page.content()
                messages_data = self._extract_json_from_page(messages_content)
                detailed_info["recent_messages"] = messages_data[:10] if messages_data else []

                # Get contacts information
                contacts_url = f"{self.config.waha.base_url}/api/sessions/{session_name}/contacts"
                await page.goto(contacts_url)
                await page.wait_for_load_state('networkidle')

                contacts_content = await page.content()
                contacts_data = self._extract_json_from_page(contacts_content)
                detailed_info["contacts_count"] = len(contacts_data) if contacts_data else 0

        except Exception as e:
            logger.warning("Could not get detailed session info", error=str(e))
            detailed_info["error"] = str(e)

        return detailed_info

    async def send_test_message(self, session_name: str, phone_number: str, message: str) -> Dict:
        """Send a test message to verify session functionality."""
        logger.info(f"Sending test message via session {session_name}")

        page = await self._ensure_page()

        try:
            # Prepare message data
            message_data = {
                "chatId": f"{phone_number}@c.us",
                "text": message
            }

            # Send message via API
            result = await page.evaluate(f"""
                fetch('/api/sessions/{session_name}/messages/text', {{
                    method: 'POST',
                    headers: {{
                        'Content-Type': 'application/json',
                        'X-API-Key': '{self.config.waha.api_key or ""}'
                    }},
                    body: JSON.stringify({json.dumps(message_data)})
                }})
                .then(response => response.json())
                .then(data => data)
                .catch(error => ({{error: error.message}}))
            """)

            return {
                "action": "send_test_message",
                "session_name": session_name,
                "phone_number": phone_number,
                "message": message,
                "result": result,
                "status": "success" if not result.get("error") else "error"
            }

        except Exception as e:
            logger.error("Test message failed", session=session_name, error=str(e))
            raise

    async def monitor_message_queue(self, session_name: str) -> Dict:
        """Monitor message queue and delivery status."""
        page = await self._ensure_page()

        try:
            # Get message statistics
            stats_url = f"{self.config.waha.base_url}/api/sessions/{session_name}/messages/stats"
            await page.goto(stats_url)
            await page.wait_for_load_state('networkidle')

            stats_content = await page.content()
            stats_data = self._extract_json_from_page(stats_content)

            # Get pending/failed messages
            pending_url = f"{self.config.waha.base_url}/api/sessions/{session_name}/messages?status=pending"
            await page.goto(pending_url)
            await page.wait_for_load_state('networkidle')

            pending_content = await page.content()
            pending_data = self._extract_json_from_page(pending_content)

            return {
                "session_name": session_name,
                "stats": stats_data,
                "pending_messages": pending_data,
                "pending_count": len(pending_data) if pending_data else 0,
                "timestamp": await self._get_current_timestamp(page)
            }

        except Exception as e:
            logger.error("Message queue monitoring failed", session=session_name, error=str(e))
            raise

    async def get_session_performance_metrics(self, session_name: str) -> Dict:
        """Get performance metrics for a session."""
        page = await self._ensure_page()

        try:
            # Get various metrics
            metrics = {}

            # Message delivery rate
            messages_url = f"{self.config.waha.base_url}/api/sessions/{session_name}/messages"
            await page.goto(messages_url)
            await page.wait_for_load_state('networkidle')

            messages_content = await page.content()
            messages_data = self._extract_json_from_page(messages_content)

            if messages_data:
                total_messages = len(messages_data)
                delivered_messages = len([m for m in messages_data if m.get('status') == 'delivered'])
                failed_messages = len([m for m in messages_data if m.get('status') == 'failed'])

                metrics.update({
                    "total_messages": total_messages,
                    "delivered_messages": delivered_messages,
                    "failed_messages": failed_messages,
                    "delivery_rate": (delivered_messages / total_messages * 100) if total_messages > 0 else 0,
                    "failure_rate": (failed_messages / total_messages * 100) if total_messages > 0 else 0
                })

            # Session uptime and connection status
            session_status = await self._get_session_status(page, session_name)
            metrics.update({
                "connection_status": session_status.get("status", {}).get("state"),
                "last_activity": session_status.get("status", {}).get("lastActivity"),
                "session_name": session_name
            })

            return metrics

        except Exception as e:
            logger.error("Performance metrics collection failed", session=session_name, error=str(e))
            raise

    def _extract_json_from_page(self, content: str) -> Any:
        """Extract JSON data from page content."""
        try:
            # Look for JSON in pre tags or plain text
            if '<pre>' in content:
                import re
                json_match = re.search(r'<pre[^>]*>(.*?)</pre>', content, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group(1))

            # Try to parse the entire content as JSON
            if content.strip().startswith('{') or content.strip().startswith('['):
                return json.loads(content)

            return None

        except json.JSONDecodeError:
            logger.debug("Could not parse JSON from page content")
            return None

    async def _get_current_timestamp(self, page: Page) -> str:
        """Get current timestamp."""
        return await page.evaluate("new Date().toISOString()")

    async def restart_failed_sessions(self) -> Dict:
        """Automatically restart failed sessions."""
        logger.info("Checking for failed sessions to restart")

        page = await self._ensure_page()
        restarted_sessions = []
        errors = []

        try:
            # Get all sessions
            sessions_url = f"{self.config.waha.base_url}/api/sessions"
            await page.goto(sessions_url)
            await page.wait_for_load_state('networkidle')

            sessions_content = await page.content()
            sessions_data = self._extract_json_from_page(sessions_content)

            if not sessions_data:
                return {"status": "no_sessions", "restarted": [], "errors": []}

            # Check each session status
            for session in sessions_data:
                session_name = session.get("name")
                session_status = session.get("status", {}).get("state")

                if session_status in ["FAILED", "DISCONNECTED", "STOPPED"]:
                    try:
                        logger.info(f"Restarting failed session: {session_name}")
                        restart_result = await self.manage_session(session_name, "restart")

                        if restart_result.get("start_result", {}).get("status") == "success":
                            restarted_sessions.append({
                                "session_name": session_name,
                                "previous_status": session_status,
                                "restart_result": restart_result
                            })
                        else:
                            errors.append({
                                "session_name": session_name,
                                "error": "Restart failed",
                                "details": restart_result
                            })

                    except Exception as e:
                        errors.append({
                            "session_name": session_name,
                            "error": str(e)
                        })

            return {
                "status": "completed",
                "restarted_count": len(restarted_sessions),
                "restarted_sessions": restarted_sessions,
                "errors": errors
            }

        except Exception as e:
            logger.error("Failed session restart process failed", error=str(e))
            raise

    async def cleanup(self):
        """Clean up resources."""
        if self.page:
            await self.page.close()