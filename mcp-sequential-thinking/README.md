# MCP Sequential Thinking Server

A Model Context Protocol (MCP) server that provides structured sequential thinking capabilities for WhatsApp automation orchestration. This server enables intelligent campaign management with advanced decision-making, real-time optimization, and comprehensive error handling.

## Features

### 🧠 Structured Sequential Thinking
- **Multi-stage Analysis**: Break down complex automation tasks into sequential, traceable steps
- **Context-Aware Processing**: Maintain context across thinking stages for coherent decision-making
- **Adaptive Strategies**: Adjust thinking patterns based on real-time performance data

### 📊 Google Sheets Integration
- **Intelligent Data Processing**: Advanced parsing and validation of student data
- **Smart Segmentation**: ML-driven audience segmentation with behavioral analysis
- **Data Quality Monitoring**: Continuous data quality assessment and cleaning

### 🎯 User Segmentation Engine
- **Behavioral Clustering**: Advanced clustering algorithms for user segmentation
- **Lifetime Value Calculation**: Predictive LTV modeling for targeting optimization
- **Reactivation Probability**: ML-based probability scoring for campaign prioritization

### 📅 Message Scheduling Optimization
- **Timing Intelligence**: Optimal message timing based on user behavior patterns
- **Rate Limiting**: Smart rate limiting to avoid spam detection
- **A/B Testing**: Built-in A/B testing for timing and content optimization

### 💰 ROI Tracking & Analytics
- **Real-time ROI Calculation**: Continuous ROI monitoring with projections
- **Performance Metrics**: Comprehensive performance tracking and analytics
- **Conversion Attribution**: Detailed conversion tracking and attribution

### 🛡️ Error Handling & Recovery
- **Intelligent Error Classification**: Automatic error categorization and severity assessment
- **Recovery Strategies**: Multiple recovery patterns including circuit breakers and fallbacks
- **Resilient Operations**: Automatic retry with exponential backoff for transient failures

### 📈 Performance Monitoring
- **Real-time Alerts**: Intelligent alerting based on performance thresholds
- **Optimization Engine**: Automatic optimization recommendations and implementation
- **Trend Analysis**: Performance trend analysis with predictive insights

## Installation

### Prerequisites
- Python 3.10 or higher
- Node.js 16+ (for integration with existing WhatsApp system)
- PostgreSQL (for data storage)
- Redis (for queue management)

### Setup

1. **Clone and Install Dependencies**
```bash
cd mcp-sequential-thinking
pip install -e .
```

2. **Install Development Dependencies**
```bash
pip install -e .[dev]
```

3. **Environment Configuration**
Create a `.env` file with the following variables:
```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_automation

# Redis Configuration
REDIS_URL=redis://localhost:6379

# WhatsApp Integration
WHATSAPP_API_URL=http://localhost:3001
WHATSAPP_API_TOKEN=your_whatsapp_token

# Google Sheets Integration
GOOGLE_SHEETS_API_KEY=your_google_api_key
GOOGLE_SHEETS_CREDENTIALS_PATH=/path/to/credentials.json

# N8N Integration
N8N_URL=http://localhost:5678
N8N_API_TOKEN=your_n8n_token

# Monitoring & Alerting
ALERT_WEBHOOK_URL=your_alert_webhook_url
LOG_LEVEL=INFO

# Campaign Configuration
DEFAULT_ROI_TARGET=2250.0
DEFAULT_RESPONSE_RATE_TARGET=0.22
DEFAULT_CONVERSION_RATE_TARGET=0.144
```

## Usage

### Starting the MCP Server

```bash
# Start the server
uv run mcp-sequential-thinking

# Or use the Python module directly
python -m mcp_sequential_thinking.server
```

### Integration with Claude Code

Add to your Claude Code configuration:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "uv",
      "args": ["run", "mcp-sequential-thinking"],
      "cwd": "/path/to/mcp-sequential-thinking"
    }
  }
}
```

### Integration with Existing WhatsApp System

The MCP server is designed to integrate seamlessly with the existing WhatsApp automation system:

```javascript
// In your existing WhatsApp system
const mcpClient = new MCPClient('sequential-thinking');

// Start campaign thinking
const campaignResult = await mcpClient.callTool('start_campaign_thinking', {
  campaign_config: {
    campaign_id: 'campaign_650_reactivation',
    target_audience_size: 650,
    roi_target: 2250.0,
    budget_limit: 5000.0,
    data_sources: {
      google_sheets_url: 'https://docs.google.com/spreadsheets/d/...',
      student_data: '/path/to/student_data.csv'
    },
    target_metrics: {
      response_rate: 0.22,
      conversion_rate: 0.144,
      cost_per_acquisition: 50.0
    }
  }
});

// Monitor progress
const status = await mcpClient.callTool('get_thinking_status', {
  pattern_id: campaignResult.pattern_id
});

// Track ROI
await mcpClient.callTool('track_campaign_roi', {
  campaign_id: 'campaign_650_reactivation',
  investment: 1000.0,
  revenue: 3500.0,
  conversion_data: {
    student_id: 'student_123',
    conversion_type: 'reactivation'
  }
});
```

## Available Tools

### Campaign Management
- **`start_campaign_thinking`**: Start structured thinking process for a campaign
- **`get_thinking_status`**: Get current status of thinking patterns
- **`execute_workflow`**: Execute complete automation workflows

### Performance Tracking
- **`track_campaign_roi`**: Track ROI metrics and conversions
- **`analyze_performance`**: Analyze campaign performance with insights
- **`start_monitoring`**: Start real-time performance monitoring

### Optimization
- **`optimize_campaign`**: Execute optimization strategies
- **`get_optimization_recommendations`**: Get intelligent optimization recommendations
- **`simulate_campaign_outcome`**: Simulate potential campaign outcomes

### Error Handling
- **`handle_error`**: Handle and recover from campaign errors

## Resources

### Available Resources
- **`thinking://campaigns`**: Active campaign information
- **`thinking://patterns`**: Available thinking patterns and statistics
- **`thinking://performance`**: Real-time performance metrics
- **`thinking://errors`**: Error logs and recovery information
- **`thinking://optimizations`**: Optimization opportunities and recommendations

## Architecture

### Core Components

1. **ThinkingEngine**: Core sequential thinking orchestration
2. **WorkflowOrchestrator**: Complete workflow management
3. **ROITracker**: Real-time ROI calculation and tracking
4. **PerformanceMonitor**: Performance monitoring with intelligent alerting
5. **ErrorHandlingEngine**: Comprehensive error handling and recovery
6. **OptimizationEngine**: Intelligent optimization recommendations

### Thinking Stages

The sequential thinking process follows these stages:

1. **Analysis**: Data analysis and pattern recognition
2. **Planning**: Strategy formulation and planning
3. **Segmentation**: Intelligent audience segmentation
4. **Optimization**: Performance optimization
5. **Execution**: Campaign execution coordination
6. **Monitoring**: Real-time monitoring and alerting
7. **Evaluation**: Performance evaluation and assessment
8. **Adaptation**: Strategy adaptation based on results

### Integration Points

- **WhatsApp Master System**: Direct integration with existing automation
- **Google Sheets**: Real-time data processing and validation
- **N8N Workflows**: Workflow orchestration and automation
- **PostgreSQL**: Data persistence and analytics
- **Redis**: Queue management and caching

## Configuration

### Thinking Pattern Configuration

```python
# Custom thinking pattern
class CustomCampaignThinking(ThinkingPattern):
    def __init__(self, context: ThinkingContext):
        super().__init__(
            name="Custom Campaign Pattern",
            description="Specialized thinking for custom campaigns",
            context=context,
            steps=self._generate_custom_steps(context),
            success_criteria={
                "custom_metric": 100.0,
                "roi_achieved": context.roi_target
            }
        )
```

### Monitoring Configuration

```python
# Custom monitoring thresholds
monitor.alert_thresholds[MetricType.RESPONSE_RATE] = {
    "critical_low": 0.05,
    "warning_low": 0.15,
    "target": 0.25,
    "warning_high": 0.40,
    "critical_high": 0.60
}
```

## Development

### Running Tests

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=src --cov-report=html

# Run specific test category
uv run pytest tests/test_thinking.py
```

### Code Quality

```bash
# Format code
uv run black src/ tests/

# Type checking
uv run mypy src/

# Linting
uv run flake8 src/
```

### Pre-commit Hooks

```bash
# Install pre-commit hooks
pre-commit install

# Run hooks manually
pre-commit run --all-files
```

## Monitoring & Alerts

### Performance Metrics

The system tracks comprehensive performance metrics:

- **Response Rate**: Message response rates by segment
- **Conversion Rate**: Conversion rates and attribution
- **ROI**: Real-time ROI calculation with projections
- **Delivery Rate**: Message delivery success rates
- **Engagement Score**: Overall engagement metrics
- **Error Rate**: Error frequency and recovery success

### Alert Configuration

Alerts are automatically generated based on configurable thresholds:

```python
# Example alert configuration
{
    MetricType.ROI: {
        "critical_low": 500.0,
        "warning_low": 1500.0,
        "target": 2250.0
    },
    MetricType.RESPONSE_RATE: {
        "critical_low": 0.05,
        "warning_low": 0.15,
        "target": 0.22
    }
}
```

## Troubleshooting

### Common Issues

1. **Connection Errors**: Check database and Redis connectivity
2. **Authentication Failures**: Verify API tokens and credentials
3. **Rate Limiting**: Adjust sending rates in configuration
4. **Memory Issues**: Monitor memory usage for large datasets

### Debugging

Enable debug logging:

```env
LOG_LEVEL=DEBUG
```

Check error logs:

```bash
# View error statistics
curl -X GET http://localhost:8000/thinking://errors

# Check circuit breaker status
curl -X GET http://localhost:8000/thinking://performance
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

## Changelog

### v0.1.0 (Current)
- Initial release
- Complete MCP server implementation
- WhatsApp automation integration
- Advanced thinking patterns
- ROI tracking and optimization
- Error handling and recovery
- Performance monitoring and alerting