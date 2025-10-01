"""Google Sheets automation using Playwright."""

import asyncio
import json
import re
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse, parse_qs

import structlog
from playwright.async_api import BrowserContext, Page
from tenacity import retry, stop_after_attempt, wait_exponential

from .config import AutomationConfig

logger = structlog.get_logger(__name__)


class GoogleSheetsAutomation:
    """Automated Google Sheets management using browser automation."""

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
        """Authenticate with Google Sheets."""
        logger.info("Authenticating with Google Sheets")

        page = self.page

        try:
            # Navigate to Google Sheets
            await page.goto("https://sheets.google.com", timeout=self.config.browser_timeout)
            await page.wait_for_load_state('networkidle')

            # Check if already logged in
            if await page.locator('[data-id="sheets"]').is_visible():
                logger.info("Already authenticated with Google Sheets")
                self.is_authenticated = True
                return

            # Look for sign-in button
            sign_in_button = page.locator('text="Sign in"').or_(page.locator('[data-l="Sign in"]'))
            if await sign_in_button.is_visible():
                await sign_in_button.click()
                await page.wait_for_url("**/accounts.google.com/**")

                # Wait for manual authentication or automatic login
                # In production, you might want to handle OAuth flow programmatically
                await page.wait_for_url("**/sheets.google.com/**", timeout=60000)
                logger.info("Successfully authenticated with Google Sheets")
                self.is_authenticated = True

        except Exception as e:
            logger.error("Google Sheets authentication failed", error=str(e))
            raise

    async def validate_data(self, sheet_url: str, validation_rules: Dict, auto_fix: bool = False) -> Dict:
        """Validate and optionally fix data in Google Sheets."""
        logger.info(f"Validating Google Sheets data: {sheet_url}")

        page = await self._ensure_page()

        try:
            # Navigate to the sheet
            await page.goto(sheet_url, timeout=self.config.browser_timeout)
            await page.wait_for_load_state('networkidle')
            await page.wait_for_selector('[data-t="table-container"]', timeout=15000)

            # Extract sheet data
            sheet_data = await self._extract_sheet_data(page)

            # Perform validation
            validation_results = await self._validate_against_rules(sheet_data, validation_rules)

            # Auto-fix if requested and issues found
            if auto_fix and validation_results["errors"]:
                fix_results = await self._auto_fix_data(page, validation_results["errors"])
                validation_results["fixes_applied"] = fix_results

            return {
                "sheet_url": sheet_url,
                "validation_results": validation_results,
                "total_rows": len(sheet_data),
                "status": "valid" if not validation_results["errors"] else "invalid"
            }

        except Exception as e:
            logger.error("Sheet validation failed", sheet_url=sheet_url, error=str(e))
            raise

    async def _extract_sheet_data(self, page: Page) -> List[List[str]]:
        """Extract data from Google Sheets."""
        # Wait for sheet to load
        await page.wait_for_selector('[role="grid"]')

        data = []

        # Get all rows
        rows = page.locator('[role="row"]')
        row_count = await rows.count()

        logger.info(f"Found {row_count} rows in sheet")

        for i in range(row_count):
            row = rows.nth(i)
            cells = row.locator('[role="gridcell"]')
            cell_count = await cells.count()

            row_data = []
            for j in range(cell_count):
                cell = cells.nth(j)
                # Try to get the cell value from different possible locations
                cell_value = ""

                # Check for input element
                input_elem = cell.locator('input')
                if await input_elem.is_visible():
                    cell_value = await input_elem.get_attribute('value') or ""
                else:
                    # Get text content
                    cell_value = await cell.text_content() or ""

                row_data.append(cell_value.strip())

            if any(cell.strip() for cell in row_data):  # Only include non-empty rows
                data.append(row_data)

        return data

    async def _validate_against_rules(self, data: List[List[str]], rules: Dict) -> Dict:
        """Validate data against provided rules."""
        errors = []
        warnings = []

        # Header validation
        if "required_headers" in rules and data:
            headers = data[0] if data else []
            for required_header in rules["required_headers"]:
                if required_header not in headers:
                    errors.append({
                        "type": "missing_header",
                        "message": f"Required header '{required_header}' not found",
                        "row": 0
                    })

        # Data validation
        if "column_rules" in rules and len(data) > 1:
            headers = data[0] if data else []

            for row_idx, row in enumerate(data[1:], start=1):  # Skip header row
                for col_name, col_rules in rules["column_rules"].items():
                    if col_name in headers:
                        col_idx = headers.index(col_name)
                        if col_idx < len(row):
                            cell_value = row[col_idx]

                            # Required field validation
                            if col_rules.get("required", False) and not cell_value.strip():
                                errors.append({
                                    "type": "required_field_empty",
                                    "message": f"Required field '{col_name}' is empty",
                                    "row": row_idx,
                                    "column": col_name,
                                    "cell": f"{chr(65 + col_idx)}{row_idx + 1}"
                                })

                            # Data type validation
                            if cell_value.strip() and "type" in col_rules:
                                if not self._validate_data_type(cell_value, col_rules["type"]):
                                    errors.append({
                                        "type": "invalid_data_type",
                                        "message": f"Invalid {col_rules['type']} value in '{col_name}'",
                                        "row": row_idx,
                                        "column": col_name,
                                        "value": cell_value,
                                        "cell": f"{chr(65 + col_idx)}{row_idx + 1}"
                                    })

                            # Pattern validation
                            if cell_value.strip() and "pattern" in col_rules:
                                if not re.match(col_rules["pattern"], cell_value):
                                    errors.append({
                                        "type": "pattern_mismatch",
                                        "message": f"Value doesn't match pattern in '{col_name}'",
                                        "row": row_idx,
                                        "column": col_name,
                                        "value": cell_value,
                                        "pattern": col_rules["pattern"],
                                        "cell": f"{chr(65 + col_idx)}{row_idx + 1}"
                                    })

        # Duplicate validation
        if "check_duplicates" in rules:
            for col_name in rules["check_duplicates"]:
                if data and col_name in data[0]:
                    col_idx = data[0].index(col_name)
                    values_seen = {}

                    for row_idx, row in enumerate(data[1:], start=1):
                        if col_idx < len(row) and row[col_idx].strip():
                            value = row[col_idx].strip().lower()
                            if value in values_seen:
                                errors.append({
                                    "type": "duplicate_value",
                                    "message": f"Duplicate value in '{col_name}'",
                                    "row": row_idx,
                                    "column": col_name,
                                    "value": row[col_idx],
                                    "first_occurrence_row": values_seen[value],
                                    "cell": f"{chr(65 + col_idx)}{row_idx + 1}"
                                })
                            else:
                                values_seen[value] = row_idx

        return {
            "errors": errors,
            "warnings": warnings,
            "total_errors": len(errors),
            "total_warnings": len(warnings)
        }

    def _validate_data_type(self, value: str, expected_type: str) -> bool:
        """Validate data type of a cell value."""
        value = value.strip()

        if expected_type == "email":
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            return re.match(email_pattern, value) is not None

        elif expected_type == "phone":
            # Brazilian phone pattern
            phone_pattern = r'^\+?55?\s?\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$'
            return re.match(phone_pattern, value.replace(' ', '')) is not None

        elif expected_type == "number":
            try:
                float(value.replace(',', '.'))
                return True
            except ValueError:
                return False

        elif expected_type == "date":
            # Common date formats
            date_patterns = [
                r'^\d{1,2}/\d{1,2}/\d{4}$',
                r'^\d{4}-\d{1,2}-\d{1,2}$',
                r'^\d{1,2}-\d{1,2}-\d{4}$'
            ]
            return any(re.match(pattern, value) for pattern in date_patterns)

        return True  # Default: accept any value

    async def _auto_fix_data(self, page: Page, errors: List[Dict]) -> Dict:
        """Automatically fix common data issues."""
        fixes_applied = []

        for error in errors:
            if error["type"] == "invalid_data_type" and "cell" in error:
                try:
                    # Navigate to the specific cell
                    cell_address = error["cell"]
                    await self._select_cell(page, cell_address)

                    # Apply automatic fixes based on data type
                    fixed_value = await self._apply_data_type_fix(error["value"], error)

                    if fixed_value != error["value"]:
                        # Update the cell
                        await page.keyboard.type(fixed_value)
                        await page.keyboard.press('Enter')

                        fixes_applied.append({
                            "cell": cell_address,
                            "original_value": error["value"],
                            "fixed_value": fixed_value,
                            "fix_type": "data_type_correction"
                        })

                        await asyncio.sleep(0.5)  # Small delay between fixes

                except Exception as e:
                    logger.warning(f"Failed to auto-fix cell {error.get('cell')}", error=str(e))

        return {
            "total_fixes": len(fixes_applied),
            "fixes": fixes_applied
        }

    async def _select_cell(self, page: Page, cell_address: str):
        """Select a specific cell by address (e.g., 'A1', 'B2')."""
        # Use name box to navigate to cell
        name_box = page.locator('[data-id="name-box"]')
        if await name_box.is_visible():
            await name_box.click()
            await page.keyboard.select_all()
            await page.keyboard.type(cell_address)
            await page.keyboard.press('Enter')
            await asyncio.sleep(1)

    async def _apply_data_type_fix(self, value: str, error: Dict) -> str:
        """Apply automatic data type fixes."""
        column_rules = error.get("column_rules", {})
        expected_type = column_rules.get("type", "")

        if expected_type == "phone":
            # Clean and format phone number
            cleaned = re.sub(r'[^\d+]', '', value)
            if cleaned.startswith('55'):
                cleaned = '+' + cleaned
            elif cleaned.startswith('11') or cleaned.startswith('21'):
                cleaned = '+55' + cleaned
            return cleaned

        elif expected_type == "email":
            # Basic email cleaning
            return value.lower().strip()

        elif expected_type == "number":
            # Convert comma decimal separator to dot
            return value.replace(',', '.')

        return value

    async def campaign_sync(self, sheet_url: str, campaign_data: Dict, sync_direction: str) -> Dict:
        """Synchronize campaign data with Google Sheets."""
        logger.info(f"Syncing campaign data: {sync_direction}")

        page = await self._ensure_page()

        try:
            await page.goto(sheet_url, timeout=self.config.browser_timeout)
            await page.wait_for_load_state('networkidle')
            await page.wait_for_selector('[role="grid"]', timeout=15000)

            if sync_direction == "import":
                return await self._import_from_sheet(page, campaign_data)
            elif sync_direction == "export":
                return await self._export_to_sheet(page, campaign_data)
            elif sync_direction == "bidirectional":
                import_result = await self._import_from_sheet(page, campaign_data)
                export_result = await self._export_to_sheet(page, campaign_data)
                return {
                    "import_result": import_result,
                    "export_result": export_result,
                    "sync_direction": sync_direction
                }
            else:
                raise ValueError(f"Invalid sync direction: {sync_direction}")

        except Exception as e:
            logger.error("Campaign sync failed", sheet_url=sheet_url, error=str(e))
            raise

    async def _import_from_sheet(self, page: Page, campaign_data: Dict) -> Dict:
        """Import data from sheet for campaign."""
        sheet_data = await self._extract_sheet_data(page)

        if not sheet_data:
            return {"status": "no_data", "imported_count": 0}

        headers = sheet_data[0] if sheet_data else []
        data_rows = sheet_data[1:] if len(sheet_data) > 1 else []

        # Convert to campaign format
        imported_contacts = []
        for row in data_rows:
            if len(row) >= len(headers):
                contact = {}
                for i, header in enumerate(headers):
                    if i < len(row):
                        contact[header.lower().replace(' ', '_')] = row[i]

                # Validate required fields for campaign
                if contact.get('phone') or contact.get('whatsapp'):
                    imported_contacts.append(contact)

        return {
            "status": "success",
            "imported_count": len(imported_contacts),
            "contacts": imported_contacts,
            "total_rows": len(data_rows)
        }

    async def _export_to_sheet(self, page: Page, campaign_data: Dict) -> Dict:
        """Export campaign data to sheet."""
        if not campaign_data.get('contacts'):
            return {"status": "no_data", "exported_count": 0}

        # Prepare data for export
        contacts = campaign_data['contacts']

        # Clear existing data (optional)
        if campaign_data.get('clear_existing', False):
            await self._clear_sheet_data(page)

        # Add headers if sheet is empty
        existing_data = await self._extract_sheet_data(page)
        if not existing_data:
            headers = list(contacts[0].keys()) if contacts else []
            await self._add_headers(page, headers)

        # Add contact data
        added_count = 0
        for contact in contacts:
            try:
                await self._add_contact_row(page, contact)
                added_count += 1
            except Exception as e:
                logger.warning(f"Failed to add contact row", contact=contact, error=str(e))

        return {
            "status": "success",
            "exported_count": added_count,
            "total_contacts": len(contacts)
        }

    async def _add_headers(self, page: Page, headers: List[str]):
        """Add headers to the sheet."""
        # Select first row
        await page.click('[role="gridcell"][data-row="0"][data-col="0"]')

        for i, header in enumerate(headers):
            if i > 0:
                await page.keyboard.press('Tab')
            await page.keyboard.type(header)

        await page.keyboard.press('Enter')

    async def _add_contact_row(self, page: Page, contact: Dict):
        """Add a contact row to the sheet."""
        # Find next empty row
        await page.keyboard.press('Control+End')
        await page.keyboard.press('ArrowDown')

        # Add contact data
        for i, (key, value) in enumerate(contact.items()):
            if i > 0:
                await page.keyboard.press('Tab')
            await page.keyboard.type(str(value) if value else "")

        await page.keyboard.press('Enter')

    async def _clear_sheet_data(self, page: Page):
        """Clear all data from the sheet."""
        # Select all data
        await page.keyboard.press('Control+a')
        await page.keyboard.press('Delete')

    async def export_sheet_data(self, sheet_url: str, export_format: str = "csv") -> Dict:
        """Export sheet data in various formats."""
        page = await self._ensure_page()

        await page.goto(sheet_url, timeout=self.config.browser_timeout)
        await page.wait_for_load_state('networkidle')

        # Open File menu
        await page.click('text="File"')
        await page.wait_for_selector('[role="menu"]')

        # Navigate to Download submenu
        await page.hover('text="Download"')
        await page.wait_for_selector('[role="menuitem"]')

        # Select format
        if export_format.lower() == "csv":
            await page.click('text="Comma Separated Values (.csv)"')
        elif export_format.lower() == "xlsx":
            await page.click('text="Microsoft Excel (.xlsx)"')
        elif export_format.lower() == "pdf":
            await page.click('text="PDF Document (.pdf)"')

        # Wait for download
        async with page.expect_download() as download_info:
            pass

        download = await download_info.value

        return {
            "status": "success",
            "format": export_format,
            "filename": download.suggested_filename,
            "download_path": await download.path()
        }

    async def cleanup(self):
        """Clean up resources."""
        if self.page:
            await self.page.close()