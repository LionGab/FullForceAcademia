"""N8N workflow automation using Playwright."""

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin

import structlog
from playwright.async_api import BrowserContext, Page
from tenacity import retry, stop_after_attempt, wait_exponential

from .config import AutomationConfig, AutomationSecrets

logger = structlog.get_logger(__name__)


class N8NAutomation:
    """Automated N8N workflow management using browser automation."""

    def __init__(self, context: BrowserContext, config: AutomationConfig):
        self.context = context
        self.config = config
        self.page: Optional[Page] = None
        self.is_authenticated = False

    async def _ensure_page(self) -> Page:
        """Ensure we have a page and are authenticated."""
        if not self.page:
            self.page = await self.context.new_page()
            await self._authenticate()
        return self.page

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def _authenticate(self):
        """Authenticate with N8N."""
        logger.info("Authenticating with N8N")

        page = self.page
        credentials = AutomationSecrets.get_n8n_credentials()

        try:
            # Navigate to N8N
            await page.goto(self.config.n8n.base_url, timeout=self.config.browser_timeout)
            await page.wait_for_load_state('networkidle')

            # Check if already logged in
            if await page.locator('[data-test-id="main-sidebar"]').is_visible():
                logger.info("Already authenticated with N8N")
                self.is_authenticated = True
                return

            # Look for login form
            login_button = page.locator('button[type="submit"]', page.locator('input[type="email"]'))
            if await login_button.count() > 0:
                # Email/password login
                await page.fill('input[type="email"]', credentials["username"])
                await page.fill('input[type="password"]', credentials["password"])
                await login_button.click()

                # Wait for redirect to dashboard
                await page.wait_for_url('**/workflows', timeout=30000)
                logger.info("Successfully authenticated with N8N")
                self.is_authenticated = True

            elif credentials.get("api_key"):
                # API key authentication - inject into headers
                await page.set_extra_http_headers({
                    'X-N8N-API-KEY': credentials["api_key"]
                })
                logger.info("Using API key authentication")
                self.is_authenticated = True

        except Exception as e:
            logger.error("N8N authentication failed", error=str(e))
            raise

    async def deploy_workflow(self, workflow_name: str, workflow_data: Optional[Dict], action: str) -> Dict:
        """Deploy and manage N8N workflows."""
        logger.info(f"N8N workflow action: {action} for {workflow_name}")

        page = await self._ensure_page()

        try:
            # Navigate to workflows page
            await page.goto(f"{self.config.n8n.base_url}/workflows")
            await page.wait_for_load_state('networkidle')

            if action == "deploy":
                return await self._deploy_new_workflow(page, workflow_name, workflow_data)
            elif action == "activate":
                return await self._activate_workflow(page, workflow_name)
            elif action == "deactivate":
                return await self._deactivate_workflow(page, workflow_name)
            elif action == "delete":
                return await self._delete_workflow(page, workflow_name)
            else:
                raise ValueError(f"Unknown action: {action}")

        except Exception as e:
            logger.error(f"Workflow {action} failed", workflow=workflow_name, error=str(e))
            raise

    async def _deploy_new_workflow(self, page: Page, workflow_name: str, workflow_data: Dict) -> Dict:
        """Deploy a new workflow."""
        # Check if workflow already exists
        existing_workflow = await self._find_workflow(page, workflow_name)
        if existing_workflow:
            logger.info(f"Workflow {workflow_name} already exists, updating...")
            await existing_workflow.click()
        else:
            # Create new workflow
            await page.click('[data-test-id="resources-list-add"]')
            await page.wait_for_selector('[data-test-id="node-creator"]')

        # Wait for workflow editor
        await page.wait_for_selector('[data-test-id="workflow-canvas"]')

        # Set workflow name
        name_input = page.locator('[data-test-id="workflow-name-input"]')
        if await name_input.is_visible():
            await name_input.fill(workflow_name)

        # Import workflow data if provided
        if workflow_data:
            await self._import_workflow_data(page, workflow_data)

        # Save workflow
        await page.keyboard.press('Control+s')
        await page.wait_for_selector('[data-test-id="workflow-save-button"]:not([disabled])')

        # Activate workflow
        activate_toggle = page.locator('[data-test-id="workflow-activate-switch"]')
        if await activate_toggle.is_visible() and not await activate_toggle.is_checked():
            await activate_toggle.click()

        logger.info(f"Successfully deployed workflow: {workflow_name}")
        return {
            "status": "success",
            "workflow_name": workflow_name,
            "action": "deployed",
            "url": page.url
        }

    async def _import_workflow_data(self, page: Page, workflow_data: Dict):
        """Import workflow data into the editor."""
        # Open workflow settings menu
        await page.click('[data-test-id="workflow-settings"]')
        await page.wait_for_selector('[data-test-id="workflow-settings-dialog"]')

        # Click Import from URL or JSON
        import_button = page.locator('text="Import from URL"').or_(page.locator('text="Import"'))
        await import_button.click()

        # Paste workflow JSON
        json_textarea = page.locator('[data-test-id="workflow-json-editor"] textarea')
        await json_textarea.fill(json.dumps(workflow_data, indent=2))

        # Import
        await page.click('[data-test-id="workflow-import-button"]')
        await page.wait_for_selector('[data-test-id="workflow-canvas"] .node')

    async def _find_workflow(self, page: Page, workflow_name: str):
        """Find workflow by name in the list."""
        # Search for workflow
        search_input = page.locator('[data-test-id="resources-list-search"]')
        if await search_input.is_visible():
            await search_input.fill(workflow_name)
            await page.wait_for_timeout(1000)

        # Look for workflow in list
        workflow_items = page.locator('[data-test-id="resources-list-item"]')
        count = await workflow_items.count()

        for i in range(count):
            item = workflow_items.nth(i)
            name_element = item.locator('[data-test-id="workflow-card-name"]')
            if await name_element.is_visible():
                name = await name_element.text_content()
                if name and workflow_name.lower() in name.lower():
                    return item

        return None

    async def _activate_workflow(self, page: Page, workflow_name: str) -> Dict:
        """Activate a workflow."""
        workflow_item = await self._find_workflow(page, workflow_name)
        if not workflow_item:
            raise ValueError(f"Workflow not found: {workflow_name}")

        # Click on workflow to open
        await workflow_item.click()
        await page.wait_for_selector('[data-test-id="workflow-canvas"]')

        # Activate workflow
        activate_toggle = page.locator('[data-test-id="workflow-activate-switch"]')
        if await activate_toggle.is_visible() and not await activate_toggle.is_checked():
            await activate_toggle.click()
            await page.wait_for_selector('[data-test-id="workflow-activate-switch"]:checked')

        return {
            "status": "success",
            "workflow_name": workflow_name,
            "action": "activated"
        }

    async def _deactivate_workflow(self, page: Page, workflow_name: str) -> Dict:
        """Deactivate a workflow."""
        workflow_item = await self._find_workflow(page, workflow_name)
        if not workflow_item:
            raise ValueError(f"Workflow not found: {workflow_name}")

        # Click on workflow to open
        await workflow_item.click()
        await page.wait_for_selector('[data-test-id="workflow-canvas"]')

        # Deactivate workflow
        activate_toggle = page.locator('[data-test-id="workflow-activate-switch"]')
        if await activate_toggle.is_visible() and await activate_toggle.is_checked():
            await activate_toggle.click()
            await page.wait_for_selector('[data-test-id="workflow-activate-switch"]:not(:checked)')

        return {
            "status": "success",
            "workflow_name": workflow_name,
            "action": "deactivated"
        }

    async def _delete_workflow(self, page: Page, workflow_name: str) -> Dict:
        """Delete a workflow."""
        workflow_item = await self._find_workflow(page, workflow_name)
        if not workflow_item:
            raise ValueError(f"Workflow not found: {workflow_name}")

        # Right-click for context menu
        await workflow_item.click(button='right')
        await page.wait_for_selector('[data-test-id="context-menu"]')

        # Click delete
        delete_option = page.locator('[data-test-id="context-menu-item-delete"]')
        await delete_option.click()

        # Confirm deletion
        confirm_button = page.locator('[data-test-id="confirm-delete-button"]')
        await confirm_button.click()

        return {
            "status": "success",
            "workflow_name": workflow_name,
            "action": "deleted"
        }

    async def monitor_execution(self, workflow_id: str, execution_id: Optional[str] = None) -> Dict:
        """Monitor workflow executions."""
        logger.info(f"Monitoring N8N execution: {workflow_id}")

        page = await self._ensure_page()

        try:
            # Navigate to executions page
            executions_url = f"{self.config.n8n.base_url}/workflows/{workflow_id}/executions"
            await page.goto(executions_url)
            await page.wait_for_load_state('networkidle')

            if execution_id:
                # Monitor specific execution
                return await self._monitor_specific_execution(page, execution_id)
            else:
                # Get latest executions
                return await self._get_latest_executions(page, workflow_id)

        except Exception as e:
            logger.error("Execution monitoring failed", workflow_id=workflow_id, error=str(e))
            raise

    async def _monitor_specific_execution(self, page: Page, execution_id: str) -> Dict:
        """Monitor a specific execution."""
        # Find execution in list
        execution_row = page.locator(f'[data-test-id="execution-list-item"][data-execution-id="{execution_id}"]')

        if await execution_row.is_visible():
            await execution_row.click()
            await page.wait_for_selector('[data-test-id="execution-details"]')

            # Get execution details
            status = await page.locator('[data-test-id="execution-status"]').text_content()
            start_time = await page.locator('[data-test-id="execution-start-time"]').text_content()
            duration = await page.locator('[data-test-id="execution-duration"]').text_content()

            # Get node execution details
            nodes = []
            node_items = page.locator('[data-test-id="execution-node-item"]')
            count = await node_items.count()

            for i in range(count):
                node = node_items.nth(i)
                node_name = await node.locator('[data-test-id="node-name"]').text_content()
                node_status = await node.locator('[data-test-id="node-status"]').text_content()
                nodes.append({"name": node_name, "status": node_status})

            return {
                "execution_id": execution_id,
                "status": status,
                "start_time": start_time,
                "duration": duration,
                "nodes": nodes
            }
        else:
            raise ValueError(f"Execution not found: {execution_id}")

    async def _get_latest_executions(self, page: Page, workflow_id: str) -> Dict:
        """Get latest workflow executions."""
        executions = []
        execution_rows = page.locator('[data-test-id="execution-list-item"]')
        count = min(await execution_rows.count(), 10)  # Get latest 10

        for i in range(count):
            row = execution_rows.nth(i)
            execution_id = await row.get_attribute('data-execution-id')
            status = await row.locator('[data-test-id="execution-status"]').text_content()
            start_time = await row.locator('[data-test-id="execution-start-time"]').text_content()

            executions.append({
                "execution_id": execution_id,
                "status": status,
                "start_time": start_time
            })

        return {
            "workflow_id": workflow_id,
            "executions": executions,
            "total_count": await execution_rows.count()
        }

    async def get_workflow_status(self, workflow_name: str) -> Dict:
        """Get current workflow status."""
        page = await self._ensure_page()

        await page.goto(f"{self.config.n8n.base_url}/workflows")
        await page.wait_for_load_state('networkidle')

        workflow_item = await self._find_workflow(page, workflow_name)
        if not workflow_item:
            return {"status": "not_found", "workflow_name": workflow_name}

        # Extract status information
        is_active = await workflow_item.locator('[data-test-id="workflow-status-active"]').is_visible()
        last_execution = await workflow_item.locator('[data-test-id="workflow-last-execution"]').text_content()

        return {
            "workflow_name": workflow_name,
            "status": "active" if is_active else "inactive",
            "last_execution": last_execution
        }

    async def cleanup(self):
        """Clean up resources."""
        if self.page:
            await self.page.close()