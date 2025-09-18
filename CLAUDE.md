# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## High-Level Architecture

This repository is a **multi-project workspace** containing several integrated systems focused on AI-enhanced development, automation tools, and business applications. The key architectural components are:

### Core Projects

#### 1. **SuperClaude Framework** (`./SuperClaude_Framework/`)
- **Purpose**: AI-enhanced development framework and CLI tools
- **Stack**: Python 3.8+, Node.js wrapper, cross-platform automation
- **Key Features**: Command management, structured workflows, PyPI + NPM distribution
- **Entry Points**: `superclaude` command globally via npm (`@bifrost_inc/superclaude`)

#### 2. **MCP Sequential Thinking** (`./mcp-sequential-thinking/`)
- **Purpose**: Model Context Protocol server for structured cognitive processes
- **Stack**: Python 3.10+, MCP protocol implementation, async support
- **Key Features**: Progressive thinking stages, thought tracking, summary generation
- **Development**: `uv sync` for dependencies, `uv run mcp-sequential-thinking` to start

#### 3. **Fitness Academy Automation** (`./fitness-academy-automation/`)
- **Purpose**: Member reactivation automation system with WhatsApp integration
- **Stack**: TypeScript, Node.js, Express, PostgreSQL, Redis, BullMQ
- **Key Features**: A/B testing, LGPD compliance, 30% reactivation target, advanced analytics
- **Testing**: Jest with 80% coverage threshold, comprehensive test suites

#### 4. **Operação Safra Automatizada** (`./Sistemas-PrimeLion/`)
- **Purpose**: Brazilian agribusiness automation with fiscal compliance
- **Stack**: FastAPI, PostgreSQL, Redis, Celery, TOTVS integration
- **Key Features**: NFP-e processing, SEFAZ integration, digital signatures
- **Location**: Project files distributed in multiple backup directories

#### 5. **Claude Configuration System** (`./.claude/`)
- **Purpose**: Enhanced Claude Code behavioral framework
- **Components**: Advanced command definitions, project configurations
- **Key Features**: Custom commands, specialized workflows, enhanced automation

## Development Commands

### SuperClaude Framework
```bash
# Global installation and updates
npm install -g @bifrost_inc/superclaude
superclaude update

# Local development
cd SuperClaude_Framework
npm run update      # Update framework
npm run lint        # Code linting
npm test           # Run tests (currently placeholder)
```

### Fitness Academy Automation
```bash
cd fitness-academy-automation

# Development setup
npm install
npm run dev         # Development server with hot reload
npm run build       # TypeScript compilation

# Testing and quality
npm test            # Jest tests with coverage
npm run test:watch  # Watch mode testing
npm run lint        # ESLint validation
npm run format      # Prettier formatting
npm run validate    # Full validation suite

# Database operations
npm run db:migrate  # Run migrations
npm run db:seed     # Seed database
npm run db:reset    # Full reset

# Campaign management
npm run campaign:import    # Import member data
npm run campaign:launch    # Launch campaigns
npm run campaign:monitor   # Monitor performance
npm run campaign:full      # Complete campaign execution

# Analytics
npm run analytics:dashboard    # Analytics dashboard
npm run analytics:conversion   # Conversion tracking
npm run analytics:all         # All analytics services
```

### MCP Sequential Thinking
```bash
cd mcp-sequential-thinking

# Setup and development
uv sync                      # Install dependencies
uv run mcp-sequential-thinking  # Start MCP server

# Development tools
uv run pytest               # Run tests
uv run black .              # Format code
uv run mypy .               # Type checking
```

### Operação Safra Automatizada (Legacy)
```bash
cd Sistemas-PrimeLion/nfpe-fazenda-brasil

# Environment setup
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt

# Development server
uvicorn src.main:app --reload --port 8000

# Testing and validation
pytest tests/
black src/ tests/          # Code formatting
flake8 src/               # Linting
```

## Architecture Patterns

### Multi-Project Coordination
- **Shared Configuration**: `.claude/` directory contains global Claude Code behavior
- **Framework Integration**: SuperClaude Framework provides tooling across projects
- **Domain Separation**: Business applications isolated in their own directories
- **MCP Integration**: Sequential thinking patterns available workspace-wide
- **Development Consistency**: Standardized tooling and testing approaches

### Technology Stack Patterns

#### **Node.js/TypeScript Projects** (Fitness Academy)
- **Framework**: Express.js with TypeScript, comprehensive type safety
- **Testing**: Jest with 80% coverage requirements, async test support
- **Database**: PostgreSQL with native pg driver, Redis for queuing
- **Queue Processing**: BullMQ for job processing, node-cron for scheduling
- **Code Quality**: ESLint + Prettier, Husky git hooks, conventional commits

#### **Python Projects** (MCP, Legacy Safra)
- **Package Management**: `uv` for modern Python projects, pip for legacy
- **Configuration**: `pyproject.toml` for new projects, requirements.txt for legacy
- **Testing**: pytest with async support, comprehensive coverage
- **Code Quality**: Black formatting, mypy type checking, isort imports

#### **Hybrid Projects** (SuperClaude)
- **Distribution**: NPM wrapper around Python core, cross-platform support
- **Development**: Python backend with Node.js interface layer
- **Installation**: Global npm package with Python dependency management

### Business Application Architecture

#### **Fitness Academy Automation**
- **Multi-tenant**: Support for multiple fitness academies
- **LGPD Compliance**: Brazilian data protection regulations
- **Real-time Analytics**: Campaign performance tracking with dashboards
- **Queue Management**: BullMQ for message processing and retries
- **A/B Testing**: Built-in experimentation framework

## Development Standards

### Code Quality Requirements
- **TypeScript Projects**: Strict type checking, 80% test coverage minimum
- **Python Projects**: Black formatting, mypy type validation, pytest coverage
- **Git Workflow**: Feature branches required, conventional commits preferred
- **Pre-commit Hooks**: Automated linting, formatting, and testing
- **Documentation**: Clear README files, inline documentation for complex logic

### Testing Strategy
- **Unit Tests**: Core business logic with comprehensive edge cases
- **Integration Tests**: API endpoints, database operations, external services
- **Load Testing**: Performance validation for high-throughput scenarios
- **End-to-End**: Critical user journeys and automation workflows

## Common Development Patterns

### Error Handling
```typescript
// Standard async operation pattern (TypeScript)
async function processData(data: InputData): Promise<Result> {
  try {
    const validated = await validateInput(data);
    const processed = await processWithRetry(validated);
    await auditLog.record(processed);
    return processed;
  } catch (error) {
    logger.error('Processing failed', { error, data });
    throw new ProcessingError(error.message);
  }
}
```

```python
# Standard async pattern (Python)
async def process_data(data: dict) -> dict:
    try:
        validated_data = await validate_input(data)
        result = await process_with_retry(validated_data)
        await audit_log.record(result)
        return result
    except ValidationError as e:
        logger.error(f"Validation failed: {e}")
        raise
```

### Performance Targets
- **Fitness Academy APIs**: <500ms p95 response time
- **Campaign Processing**: 1000 messages/minute processing capacity
- **Database Queries**: <100ms for member lookups
- **Analytics Dashboards**: Real-time updates with <3s refresh

### Multi-Project File Organization
- Each project maintains its own `src/`, `tests/`, and `docs/` structure
- Shared utilities and configurations in workspace root
- Project-specific README.md files with setup instructions
- Common development scripts in root-level package.json

## Security Requirements

### Data Protection
- **Environment Variables**: All secrets and API keys stored in .env files
- **LGPD Compliance**: Brazilian data protection requirements for member data
- **Audit Logging**: Comprehensive logging for all data processing operations
- **Access Control**: Role-based permissions for sensitive operations

### Development Security
- **No Hardcoded Secrets**: Use .env files with .env.example templates
- **Input Validation**: Joi schemas for TypeScript, Pydantic for Python
- **Rate Limiting**: Express rate limiting for public endpoints
- **Authentication**: JWT tokens with proper expiration and refresh

## Workspace Commands

### Root Level Operations
```bash
# Global project management
npm install              # Install root dependencies (Google APIs)
npm run superclaude      # SuperClaude framework access

# Cross-project development
cd fitness-academy-automation && npm run dev
cd mcp-sequential-thinking && uv run mcp-sequential-thinking
```

### Testing Across Projects
```bash
# Individual project testing
cd fitness-academy-automation && npm test
cd mcp-sequential-thinking && uv run pytest
cd SuperClaude_Framework && npm test

# Quality checks
cd fitness-academy-automation && npm run validate  # Full validation
cd mcp-sequential-thinking && uv run mypy .       # Type checking
```

This repository represents a diverse collection of automation and AI tools, with a focus on TypeScript business applications, Python AI frameworks, and integrated development tooling.
- to memorize