const express = require('express');
const cors = require('cors');
const moment = require('moment');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data for 650 inactive members
const generate650MockMembers = () => {
    const members = [];
    const nomes = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Souza'];

    for (let i = 0; i < 650; i++) {
        const diasInativo = 30 + (i % 180); // 30-210 dias
        members.push({
            index: i + 1,
            nome: nomes[i % nomes.length] + ` ${i + 1}`,
            telefone: `5511999${String(i).padStart(6, '0')}`,
            email: `user${i + 1}@email.com`,
            plano: ['Básico', 'Premium', 'VIP'][i % 3],
            valorPlano: [89.90, 129.90, 179.90][i % 3],
            ultimaAtividade: moment().subtract(diasInativo, 'days').format('YYYY-MM-DD'),
            diasInativo: diasInativo,
            urgencia: diasInativo >= 90 ? 'CRITICA' :
                     diasInativo >= 60 ? 'ALTA' :
                     diasInativo >= 30 ? 'MEDIA' : 'BAIXA'
        });
    }

    return members;
};

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            database: 'mock',
            whatsapp: 'mock',
            n8n: 'mock'
        },
        campaign650: {
            members: 650,
            ready: true
        }
    });
});

// N8N Integration endpoints
app.get('/api/n8n/health', (req, res) => {
    res.json({
        status: 'healthy',
        n8n: { integration: 'mock', workflows: 'ready' }
    });
});

// 650 Campaign trigger
app.post('/api/trigger-650-campaign', (req, res) => {
    console.log('🚀 Triggering 650 inactive members campaign...');

    const members = generate650MockMembers();

    const segments = {
        criticos: members.filter(m => m.urgencia === 'CRITICA'),
        moderados: members.filter(m => m.urgencia === 'ALTA'),
        baixaFreq: members.filter(m => m.urgencia === 'MEDIA'),
        prospects: members.filter(m => m.urgencia === 'BAIXA')
    };

    // ROI Calculation
    const avgValue = 129.90;
    const investment = 1500;
    const expectedRevenue =
        (segments.criticos.length * 0.35 * avgValue * 6) +
        (segments.moderados.length * 0.25 * avgValue * 6) +
        (segments.baixaFreq.length * 0.15 * avgValue * 6) +
        (segments.prospects.length * 0.08 * avgValue * 3);

    const roi = ((expectedRevenue - investment) / investment * 100).toFixed(0);

    const summary = {
        totalProcessados: 650,
        criticos: segments.criticos.length,
        moderados: segments.moderados.length,
        baixaFreq: segments.baixaFreq.length,
        prospects: segments.prospects.length,
        potentialRevenue: expectedRevenue.toFixed(2),
        investment: investment,
        projectedROI: roi,
        expectedNewMembers: Math.floor(
            (segments.criticos.length * 0.35) +
            (segments.moderados.length * 0.25) +
            (segments.baixaFreq.length * 0.15) +
            (segments.prospects.length * 0.08)
        )
    };

    console.log('✅ Campaign summary:', summary);

    res.json({
        success: true,
        message: 'Campanha 650 inativos simulada com sucesso!',
        summary,
        timestamp: new Date().toISOString()
    });
});

// Dashboard
app.get('/api/dashboard', (req, res) => {
    const members = generate650MockMembers();

    res.json({
        timestamp: new Date().toISOString(),
        services: {
            whatsapp: 'mock',
            database: 'mock',
            google: 'mock',
            n8n: 'mock'
        },
        campaign650: {
            totalMembers: 650,
            segments: {
                criticos: members.filter(m => m.urgencia === 'CRITICA').length,
                moderados: members.filter(m => m.urgencia === 'ALTA').length,
                baixaFreq: members.filter(m => m.urgencia === 'MEDIA').length,
                prospects: members.filter(m => m.urgencia === 'BAIXA').length
            },
            roi: {
                projected: '11700%',
                investment: 'R$ 1.500',
                expectedRevenue: 'R$ 177.000'
            }
        }
    });
});

// ROI Dashboard
app.get('/api/n8n/roi-dashboard', (req, res) => {
    res.json({
        roi: {
            current: '8500',
            projected: '11700',
            investment: 1500,
            revenue: 177000
        },
        campaigns: {
            total: 650,
            sent: 500,
            responses: 75
        },
        conversions: {
            total: 45,
            rate: '15.2',
            bySegment: {
                criticos: 25,
                moderados: 15,
                baixaFreq: 5
            }
        }
    });
});

// Start server
app.listen(port, () => {
    console.log('🚀 FullForce Academia Mock Server rodando na porta', port);
    console.log('📊 Dashboard: http://localhost:' + port + '/api/dashboard');
    console.log('💊 Health: http://localhost:' + port + '/health');
    console.log('🎯 Trigger 650: POST http://localhost:' + port + '/api/trigger-650-campaign');
    console.log('💰 ROI Dashboard: http://localhost:' + port + '/api/n8n/roi-dashboard');
    console.log('');
    console.log('✅ Sistema pronto! 650 alunos inativos | ROI 11.700%');
});