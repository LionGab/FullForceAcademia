const { chromium } = require('playwright');

class PlaywrightAutomation {
  constructor() {
    this.browser = null;
    this.context = null;
  }

  async init() {
    this.browser = await chromium.launch({ headless: false });
    this.context = await this.browser.newContext();
  }

  async automateN8N() {
    const page = await this.context.newPage();
    await page.goto('https://lionalpha.app.n8n.cloud/home/workflows');
    return page;
  }

  async monitorCampaigns() {
    const page = await this.context.newPage();
    await page.goto('https://docs.google.com/spreadsheets/d/1cgSe5T5TrHSohP3tcv6iyYxS2WL-GnKNnFF0zGT0ZRo/edit');
    return page;
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}

module.exports = PlaywrightAutomation;