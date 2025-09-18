# Changelog

All notable changes to FullForce Academia WhatsApp System will be documented in this file.

## [2.0.0] - 2025-09-18 - Stack Baileys + WAHA

### 🚀 **Major Release - Sistema Híbrido**

#### Added
- **Baileys Integration** - Conexão direta WhatsApp via QR Code
- **WAHA Integration** - API HTTP para automação e backup
- **Docker Stack Completo** - WAHA + N8N + PostgreSQL + Redis
- **Sistema Híbrido** - Fallback automático entre Baileys e WAHA
- **Anti-spam Protection** - Rate limiting inteligente
- **Cache Otimizado** - Gestão automática de memória
- **Dashboard Express** - Interface web de monitoramento
- **Health Check System** - Monitoramento de status em tempo real

#### Enhanced
- **Performance** - Cache inteligente e limpeza automática
- **Reliability** - Sistema de backup duplo (Baileys + WAHA)
- **Scalability** - Infraestrutura Docker containerizada
- **Monitoring** - Dashboard e health checks
- **Documentation** - Guias completos de setup e uso

#### Technical Stack
- **Baileys 6.7.5** - WhatsApp Web API
- **WAHA API** - HTTP WhatsApp Interface
- **N8N** - Visual Workflow Automation
- **Docker Compose** - Container Orchestration
- **PostgreSQL 15** - Primary Database
- **Redis 7** - Cache and Queues
- **Express.js 4.19** - Web Server

#### Scripts Added
```bash
npm run docker:up      # Start full stack
npm run docker:down    # Stop all services
npm run docker:logs    # View real-time logs
npm start              # Start WhatsApp bot
npm run dev            # Development mode
```

#### Endpoints Added
- `GET /` - Dashboard principal
- `GET /health` - Health check
- `POST /send/baileys` - Send via Baileys
- `POST /send/waha` - Send via WAHA
- `POST /webhook/waha` - WAHA webhooks

#### Configuration
- **Horário comercial** configurável
- **Rate limiting** personalizável
- **Cache limits** ajustáveis
- **Anti-spam** configurável

### 🔧 **Optimizations**

#### Memory Management
- Cache com limite máximo (1000 mensagens)
- Limpeza automática a cada 5 minutos
- Rate limit cache otimizado
- Garbage collection melhorado

#### Performance
- Debounced message processing
- Intelligent fallback system
- Optimized Docker images
- Reduced logging overhead

#### Reliability
- Connection retry logic
- Automatic session recovery
- Health monitoring
- Error handling melhorado

---

## [1.0.0] - 2025-09-15 - WhatsApp Web.js Original

### Initial Release
- WhatsApp Web.js integration
- Google Calendar integration
- Google Sheets integration
- Basic message handling
- QR Code authentication
- Simple Express server

---

**🔥 FullForce Academia - Evolution Timeline**

- **v1.0** - WhatsApp Web.js básico
- **v2.0** - Stack Híbrido Baileys + WAHA + Docker
- **v3.0** - AI Integration (planned)
- **v4.0** - Multi-Academia Support (planned)