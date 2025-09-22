"""Campaign dashboard automation using Playwright."""

import asyncio
import json
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import structlog
from playwright.async_api import BrowserContext, Page
from tenacity import retry, stop_after_attempt, wait_exponential

from .config import AutomationConfig

logger = structlog.get_logger(__name__)


class DashboardAutomation:
    """Automated campaign dashboard monitoring and management."""

    def __init__(self, context: BrowserContext, config: AutomationConfig):
        self.context = context
        self.config = config
        self.page: Optional[Page] = None
        self.screenshots_dir = config.dashboard.screenshot_path

        # Ensure screenshots directory exists
        os.makedirs(self.screenshots_dir, exist_ok=True)

    async def _ensure_page(self) -> Page:
        """Ensure we have a page ready."""
        if not self.page:
            self.page = await self.context.new_page()
        return self.page

    async def monitor(self, dashboard_url: str, metrics: List[str], alert_thresholds: Dict = None) -> Dict:
        """Monitor campaign analytics dashboards."""
        logger.info(f"Monitoring dashboard: {dashboard_url}")

        page = await self._ensure_page()
        alert_thresholds = alert_thresholds or {}

        try:
            await page.goto(dashboard_url, timeout=self.config.browser_timeout)
            await page.wait_for_load_state('networkidle')

            # Take dashboard screenshot
            screenshot_path = await self._take_screenshot(page, "dashboard_monitor")

            # Extract metrics data
            extracted_metrics = await self._extract_metrics(page, metrics)

            # Check for alerts
            alerts = await self._check_alerts(extracted_metrics, alert_thresholds)

            # Get campaign performance data
            performance_data = await self._extract_performance_data(page)

            return {
                "dashboard_url": dashboard_url,
                "screenshot_path": screenshot_path,
                "metrics": extracted_metrics,
                "performance": performance_data,
                "alerts": alerts,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }

        except Exception as e:
            logger.error("Dashboard monitoring failed", url=dashboard_url, error=str(e))
            raise

    async def _extract_metrics(self, page: Page, metrics: List[str]) -> Dict:
        """Extract specific metrics from the dashboard."""
        extracted = {}

        for metric in metrics:
            try:
                value = await self._extract_metric_value(page, metric)
                extracted[metric] = value
            except Exception as e:
                logger.warning(f"Failed to extract metric: {metric}", error=str(e))
                extracted[metric] = None

        return extracted

    async def _extract_metric_value(self, page: Page, metric: str) -> Any:
        """Extract a specific metric value from the dashboard."""
        metric_lower = metric.lower()

        # Common metric selectors based on typical dashboard patterns
        selectors = {
            'total_messages': [
                '[data-metric="total-messages"]',
                'text=Total Messages',
                '.metric-total-messages',
                '[aria-label*="total messages"]'
            ],
            'delivered_messages': [
                '[data-metric="delivered"]',
                'text=Delivered',
                '.metric-delivered',
                '[aria-label*="delivered"]'
            ],
            'failed_messages': [
                '[data-metric="failed"]',
                'text=Failed',
                '.metric-failed',
                '[aria-label*="failed"]'
            ],
            'delivery_rate': [
                '[data-metric="delivery-rate"]',
                'text=Delivery Rate',
                '.metric-delivery-rate',
                '[aria-label*="delivery rate"]'
            ],
            'response_rate': [
                '[data-metric="response-rate"]',
                'text=Response Rate',
                '.metric-response-rate',
                '[aria-label*="response rate"]'
            ],
            'active_campaigns': [
                '[data-metric="active-campaigns"]',
                'text=Active Campaigns',
                '.metric-active-campaigns',
                '[aria-label*="active campaigns"]'
            ],
            'conversion_rate': [
                '[data-metric="conversion-rate"]',
                'text=Conversion Rate',
                '.metric-conversion-rate',
                '[aria-label*="conversion"]'
            ]
        }

        # Try to find the metric using various selectors
        if metric_lower in selectors:
            for selector in selectors[metric_lower]:
                try:
                    element = page.locator(selector)
                    if await element.is_visible():
                        text = await element.text_content()
                        return self._parse_metric_value(text)
                except:
                    continue

        # Fallback: search for text containing the metric name
        try:
            # Look for elements containing the metric name
            elements = page.locator(f'text="{metric}"').or_(
                page.locator(f'[aria-label*="{metric_lower}"]')
            )

            count = await elements.count()
            for i in range(count):
                element = elements.nth(i)
                parent = element.locator('..')  # Get parent element

                # Look for numbers in parent or sibling elements
                numbers = await parent.locator('[class*="number"], [class*="value"], [class*="metric"]').all()
                for number_elem in numbers:
                    text = await number_elem.text_content()
                    if text and any(c.isdigit() for c in text):
                        return self._parse_metric_value(text)

        except Exception as e:
            logger.debug(f"Fallback metric extraction failed for {metric}", error=str(e))

        return None

    def _parse_metric_value(self, text: str) -> Any:
        """Parse metric value from text."""
        if not text:
            return None

        text = text.strip()

        # Handle percentage values
        if '%' in text:
            try:
                return float(text.replace('%', '').replace(',', '.'))
            except ValueError:
                return text

        # Handle number values with common formatting
        import re
        number_match = re.search(r'[\d,]+\.?\d*', text.replace(' ', ''))
        if number_match:
            try:
                number_str = number_match.group().replace(',', '')
                if '.' in number_str:
                    return float(number_str)
                else:
                    return int(number_str)
            except ValueError:
                pass

        return text

    async def _extract_performance_data(self, page: Page) -> Dict:
        """Extract general performance data from dashboard."""
        performance = {}

        try:
            # Look for common dashboard elements
            charts = page.locator('[class*="chart"], [class*="graph"], canvas')
            chart_count = await charts.count()
            performance['charts_found'] = chart_count

            # Extract table data if present
            tables = page.locator('table')
            table_count = await tables.count()
            if table_count > 0:
                table_data = await self._extract_table_data(page, tables.first)
                performance['table_data'] = table_data

            # Look for summary cards/widgets
            cards = page.locator('[class*="card"], [class*="widget"], [class*="summary"]')
            card_count = await cards.count()
            performance['summary_cards'] = card_count

            # Extract any visible numbers (potential KPIs)
            kpi_elements = page.locator('[class*="kpi"], [class*="metric"], [class*="stat"]')
            kpis = []
            kpi_count = await kpi_elements.count()

            for i in range(min(kpi_count, 10)):  # Limit to 10 KPIs
                element = kpi_elements.nth(i)
                if await element.is_visible():
                    text = await element.text_content()
                    if text and text.strip():
                        kpis.append(text.strip())

            performance['kpis'] = kpis

        except Exception as e:
            logger.warning("Failed to extract performance data", error=str(e))
            performance['error'] = str(e)

        return performance

    async def _extract_table_data(self, page: Page, table_locator) -> List[Dict]:
        """Extract data from the first table found."""
        try:
            rows = table_locator.locator('tr')
            row_count = await rows.count()

            if row_count < 2:  # No data rows
                return []

            # Get headers
            header_row = rows.first
            header_cells = header_row.locator('th, td')
            headers = []
            header_count = await header_cells.count()

            for i in range(header_count):
                header_text = await header_cells.nth(i).text_content()
                headers.append(header_text.strip() if header_text else f"Column_{i}")

            # Get data rows (limit to first 5 for performance)
            data = []
            for i in range(1, min(row_count, 6)):
                row = rows.nth(i)
                cells = row.locator('td')
                cell_count = await cells.count()

                row_data = {}
                for j in range(min(cell_count, len(headers))):
                    cell_text = await cells.nth(j).text_content()
                    row_data[headers[j]] = cell_text.strip() if cell_text else ""

                data.append(row_data)

            return data

        except Exception as e:
            logger.warning("Failed to extract table data", error=str(e))
            return []

    async def _check_alerts(self, metrics: Dict, thresholds: Dict) -> List[Dict]:
        """Check metrics against alert thresholds."""
        alerts = []

        for metric_name, threshold_config in thresholds.items():
            if metric_name in metrics and metrics[metric_name] is not None:
                value = metrics[metric_name]

                try:
                    # Convert to number if possible
                    if isinstance(value, str):
                        value = float(value.replace('%', '').replace(',', '.'))

                    # Check thresholds
                    if 'min' in threshold_config and value < threshold_config['min']:
                        alerts.append({
                            'type': 'below_minimum',
                            'metric': metric_name,
                            'current_value': value,
                            'threshold': threshold_config['min'],
                            'severity': threshold_config.get('severity', 'warning')
                        })

                    if 'max' in threshold_config and value > threshold_config['max']:
                        alerts.append({
                            'type': 'above_maximum',
                            'metric': metric_name,
                            'current_value': value,
                            'threshold': threshold_config['max'],
                            'severity': threshold_config.get('severity', 'warning')
                        })

                except (ValueError, TypeError):
                    logger.debug(f"Could not check numeric threshold for {metric_name}")

        return alerts

    async def _take_screenshot(self, page: Page, prefix: str) -> str:
        """Take a screenshot of the current page."""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{prefix}_{timestamp}.png"
        filepath = os.path.join(self.screenshots_dir, filename)

        await page.screenshot(path=filepath, full_page=True)
        return filepath

    async def export_report(self, dashboard_url: str, report_type: str, date_range: Dict = None) -> Dict:
        """Export dashboard reports and analytics."""
        logger.info(f"Exporting {report_type} report from {dashboard_url}")

        page = await self._ensure_page()

        try:
            await page.goto(dashboard_url, timeout=self.config.browser_timeout)
            await page.wait_for_load_state('networkidle')

            if report_type == "screenshot":
                return await self._export_screenshot_report(page, dashboard_url, date_range)
            elif report_type == "pdf":
                return await self._export_pdf_report(page, dashboard_url, date_range)
            elif report_type == "csv":
                return await self._export_csv_report(page, dashboard_url, date_range)
            else:
                raise ValueError(f"Unsupported report type: {report_type}")

        except Exception as e:
            logger.error(f"Report export failed: {report_type}", url=dashboard_url, error=str(e))
            raise

    async def _export_screenshot_report(self, page: Page, dashboard_url: str, date_range: Dict) -> Dict:
        """Export dashboard as screenshot."""
        # Apply date range filter if provided
        if date_range:
            await self._apply_date_filter(page, date_range)

        # Take full page screenshot
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"dashboard_report_{timestamp}.png"
        filepath = os.path.join(self.screenshots_dir, filename)

        await page.screenshot(path=filepath, full_page=True)

        # Also take screenshots of individual charts/sections
        charts = page.locator('[class*="chart"], [class*="graph"], canvas')
        chart_count = await charts.count()
        chart_screenshots = []

        for i in range(min(chart_count, 5)):  # Limit to 5 charts
            try:
                chart = charts.nth(i)
                if await chart.is_visible():
                    chart_filename = f"chart_{i+1}_{timestamp}.png"
                    chart_filepath = os.path.join(self.screenshots_dir, chart_filename)
                    await chart.screenshot(path=chart_filepath)
                    chart_screenshots.append(chart_filepath)
            except Exception as e:
                logger.warning(f"Failed to screenshot chart {i+1}", error=str(e))

        return {
            "type": "screenshot",
            "main_screenshot": filepath,
            "chart_screenshots": chart_screenshots,
            "total_charts": chart_count,
            "dashboard_url": dashboard_url,
            "timestamp": timestamp
        }

    async def _export_pdf_report(self, page: Page, dashboard_url: str, date_range: Dict) -> Dict:
        """Export dashboard as PDF."""
        # Apply date range filter if provided
        if date_range:
            await self._apply_date_filter(page, date_range)

        # Generate PDF
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"dashboard_report_{timestamp}.pdf"
        filepath = os.path.join(self.screenshots_dir, filename)

        await page.pdf(
            path=filepath,
            format='A4',
            print_background=True,
            margin={'top': '1cm', 'right': '1cm', 'bottom': '1cm', 'left': '1cm'}
        )

        return {
            "type": "pdf",
            "filepath": filepath,
            "dashboard_url": dashboard_url,
            "timestamp": timestamp
        }

    async def _export_csv_report(self, page: Page, dashboard_url: str, date_range: Dict) -> Dict:
        """Export dashboard data as CSV."""
        # Apply date range filter if provided
        if date_range:
            await self._apply_date_filter(page, date_range)

        # Look for export/download buttons
        export_buttons = page.locator(
            'text="Export"'
        ).or_(page.locator(
            'text="Download"'
        )).or_(page.locator(
            '[aria-label*="export"]'
        )).or_(page.locator(
            '[title*="export"]'
        ))

        csv_exported = False
        download_path = None

        if await export_buttons.count() > 0:
            try:
                # Try to find CSV export option
                csv_button = page.locator('text="CSV"').or_(
                    page.locator('[aria-label*="csv"]')
                ).or_(page.locator('[title*="csv"]'))

                if await csv_button.count() > 0:
                    async with page.expect_download() as download_info:
                        await csv_button.first.click()

                    download = await download_info.value
                    download_path = await download.path()
                    csv_exported = True

                elif await export_buttons.count() > 0:
                    # Try first export button
                    async with page.expect_download() as download_info:
                        await export_buttons.first.click()

                    download = await download_info.value
                    download_path = await download.path()
                    csv_exported = True

            except Exception as e:
                logger.warning("Failed to export via buttons", error=str(e))

        # Fallback: extract table data and create CSV
        if not csv_exported:
            tables = page.locator('table')
            if await tables.count() > 0:
                table_data = await self._extract_table_data(page, tables.first)

                if table_data:
                    import csv
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    filename = f"dashboard_data_{timestamp}.csv"
                    filepath = os.path.join(self.screenshots_dir, filename)

                    with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                        if table_data:
                            fieldnames = table_data[0].keys()
                            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                            writer.writeheader()
                            writer.writerows(table_data)

                    download_path = filepath
                    csv_exported = True

        return {
            "type": "csv",
            "exported": csv_exported,
            "filepath": download_path,
            "dashboard_url": dashboard_url,
            "timestamp": datetime.now().strftime('%Y%m%d_%H%M%S')
        }

    async def _apply_date_filter(self, page: Page, date_range: Dict):
        """Apply date range filter to dashboard."""
        try:
            start_date = date_range.get('start_date')
            end_date = date_range.get('end_date')

            if not start_date or not end_date:
                return

            # Look for date picker elements
            date_selectors = [
                '[data-testid="date-picker"]',
                '[aria-label*="date"]',
                '[placeholder*="date"]',
                'input[type="date"]',
                '.date-picker',
                '.datepicker'
            ]

            date_picker_found = False

            for selector in date_selectors:
                date_inputs = page.locator(selector)
                count = await date_inputs.count()

                if count >= 2:  # Start and end date
                    try:
                        await date_inputs.nth(0).fill(start_date)
                        await date_inputs.nth(1).fill(end_date)

                        # Apply the filter
                        apply_button = page.locator('text="Apply"').or_(
                            page.locator('[type="submit"]')
                        )
                        if await apply_button.count() > 0:
                            await apply_button.first.click()

                        await page.wait_for_load_state('networkidle')
                        date_picker_found = True
                        break

                    except Exception as e:
                        logger.debug(f"Date picker attempt failed: {selector}", error=str(e))

            if not date_picker_found:
                logger.warning("Could not find date picker to apply date range")

        except Exception as e:
            logger.warning("Failed to apply date filter", error=str(e))

    async def monitor_realtime(self, dashboard_url: str, interval_seconds: int = 30, duration_minutes: int = 60) -> Dict:
        """Monitor dashboard in real-time with periodic updates."""
        logger.info(f"Starting real-time monitoring for {duration_minutes} minutes")

        page = await self._ensure_page()
        start_time = datetime.now()
        end_time = start_time + timedelta(minutes=duration_minutes)
        snapshots = []

        try:
            await page.goto(dashboard_url, timeout=self.config.browser_timeout)
            await page.wait_for_load_state('networkidle')

            while datetime.now() < end_time:
                # Take snapshot
                snapshot_time = datetime.now()
                metrics = await self._extract_metrics(page, [
                    'total_messages', 'delivered_messages', 'failed_messages',
                    'delivery_rate', 'response_rate'
                ])

                snapshot = {
                    'timestamp': snapshot_time.isoformat(),
                    'metrics': metrics
                }
                snapshots.append(snapshot)

                # Take screenshot every 10 minutes
                if len(snapshots) % (600 // interval_seconds) == 0:
                    screenshot_path = await self._take_screenshot(
                        page, f"realtime_{len(snapshots)}"
                    )
                    snapshot['screenshot'] = screenshot_path

                logger.info(f"Real-time snapshot {len(snapshots)}: {metrics}")

                # Wait for next interval
                await asyncio.sleep(interval_seconds)

                # Refresh page data
                await page.reload()
                await page.wait_for_load_state('networkidle')

        except Exception as e:
            logger.error("Real-time monitoring failed", error=str(e))
            raise

        return {
            "monitoring_duration_minutes": duration_minutes,
            "interval_seconds": interval_seconds,
            "total_snapshots": len(snapshots),
            "snapshots": snapshots,
            "start_time": start_time.isoformat(),
            "end_time": datetime.now().isoformat()
        }

    async def cleanup(self):
        """Clean up resources."""
        if self.page:
            await self.page.close()