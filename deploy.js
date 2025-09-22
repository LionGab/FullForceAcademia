#!/usr/bin/env node

/**
 * FullForce Academia - Main Deployment Launcher
 * Single entry point for complete campaign deployment
 */

const path = require('path');
const OneClickDeployment = require('./scripts/one-click-deployment');

console.log('🚀 FullForce Academia - Campaign Deployment Launcher');
console.log('==================================================');
console.log('');
console.log('🎯 Target: Deploy automated reactivation campaign for 650 inactive users');
console.log('💰 Expected ROI: R$ 11,700');
console.log('⚡ Workflow: Complete WhatsApp automation with N8N + WAHA + Google Sheets');
console.log('');

// Launch deployment
const deployment = new OneClickDeployment();
deployment.execute()
  .then((success) => {
    if (success) {
      console.log('\n🎉 CAMPAIGN DEPLOYMENT SUCCESSFUL!');
      console.log('Your automated reactivation system is now live and processing users.');
    } else {
      console.log('\n❌ DEPLOYMENT FAILED');
      console.log('Please check the error messages above and try again.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 CRITICAL ERROR:', error.message);
    process.exit(1);
  });