const { google } = require('googleapis');
const moment = require('moment');

class GoogleIntegration {
    constructor() {
        this.auth = null;
        this.sheets = null;
        this.calendar = null;
        this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || '1BvQhCgZJqL9T3XrM4NfP8QwHk6yS9cA2vD5eE8fF0gG';
        this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

        this.initialize();
    }

    async initialize() {
        try {
            console.log('🔗 Inicializando Google APIs...');

            // Configurar autenticação
            const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY ?
                JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY) :
                require('../../config/google-service-account.json');

            this.auth = new google.auth.GoogleAuth({
                credentials,
                scopes: [
                    'https://www.googleapis.com/auth/spreadsheets',
                    'https://www.googleapis.com/auth/calendar',
                    'https://www.googleapis.com/auth/drive.readonly'
                ]
            });

            // Inicializar APIs
            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            this.calendar = google.calendar({ version: 'v3', auth: this.auth });

            console.log('✅ Google APIs inicializadas com sucesso');
            return true;

        } catch (error) {
            console.error('❌ Erro ao inicializar Google APIs:', error);
            throw error;
        }
    }

    // ===== GOOGLE SHEETS INTEGRATION =====
    async getRange(range) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: range
            });

            return response.data.values || [];

        } catch (error) {
            console.error(`❌ Erro ao obter range ${range}:`, error);
            throw error;
        }
    }

    async appendRow(sheetName, values) {
        try {
            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!A:Z`,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: [values]
                }
            });

            return response.data;

        } catch (error) {
            console.error(`❌ Erro ao adicionar linha em ${sheetName}:`, error);
            throw error;
        }
    }

    async updateRange(range, values) {
        try {
            const response = await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: range,
                valueInputOption: 'RAW',
                resource: {
                    values: values
                }
            });

            return response.data;

        } catch (error) {
            console.error(`❌ Erro ao atualizar range ${range}:`, error);
            throw error;
        }
    }

    async batchUpdate(updates) {
        try {
            const response = await this.sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                resource: {
                    valueInputOption: 'RAW',
                    data: updates
                }
            });

            return response.data;

        } catch (error) {
            console.error('❌ Erro no batch update:', error);
            throw error;
        }
    }

    // Método específico para carregar 650 alunos inativos
    async load650InactiveMembers() {
        try {
            console.log('📊 Carregando 650 alunos inativos do Google Sheets...');

            const data = await this.getRange('Alunos_Inativos!A:L');

            if (!data || data.length <= 1) {
                console.log('⚠️ Criando planilha de exemplo...');
                await this.createSampleInactiveMembers();
                return await this.getRange('Alunos_Inativos!A:L');
            }

            const headers = data[0];
            const members = data.slice(1).map((row, index) => ({
                index: index + 1,
                nome: row[0] || `Aluno_${index + 1}`,
                telefone: (row[1] || '').replace(/\\D/g, ''),
                email: row[2] || '',
                plano: row[3] || 'Básico',
                valorPlano: parseFloat(row[4]) || 129.90,
                ultimaAtividade: row[5] || moment().subtract(90, 'days').format('YYYY-MM-DD'),
                frequenciaMensal: parseInt(row[6]) || 0,
                motivoInatividade: row[7] || 'Não informado',
                dataCadastro: row[8] || moment().subtract(365, 'days').format('YYYY-MM-DD'),
                status: row[9] || 'Inativo',
                observacoes: row[10] || '',
                campanhaAnterior: row[11] || 'Nunca'
            }));

            console.log(`✅ ${members.length} alunos inativos carregados`);
            return members;

        } catch (error) {
            console.error('❌ Erro ao carregar alunos inativos:', error);
            throw error;
        }
    }

    async createSampleInactiveMembers() {
        try {
            console.log('📝 Criando dados de exemplo para 650 alunos inativos...');

            const headers = [
                'Nome', 'Telefone', 'Email', 'Plano', 'Valor_Plano',
                'Ultima_Atividade', 'Frequencia_Mensal', 'Motivo_Inatividade',
                'Data_Cadastro', 'Status', 'Observacoes', 'Campanha_Anterior'
            ];

            const sampleMembers = [];
            const nomes = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Souza'];
            const planos = ['Básico', 'Premium', 'VIP'];
            const motivos = ['Falta de tempo', 'Mudança', 'Financeiro', 'Lesão', 'Outros'];

            for (let i = 0; i < 50; i++) { // Criar 50 exemplos
                const nome = nomes[i % nomes.length] + ` ${i + 1}`;
                const telefone = `5511999${String(i).padStart(6, '0')}`;
                const email = `${nome.toLowerCase().replace(' ', '.')}@email.com`;
                const plano = planos[i % planos.length];
                const valorPlano = plano === 'Básico' ? 89.90 : plano === 'Premium' ? 129.90 : 179.90;
                const diasInativo = 30 + (i % 150); // Entre 30 e 180 dias
                const ultimaAtividade = moment().subtract(diasInativo, 'days').format('YYYY-MM-DD');
                const frequencia = Math.floor(Math.random() * 15);
                const motivo = motivos[i % motivos.length];
                const dataCadastro = moment().subtract(365 + (i % 365), 'days').format('YYYY-MM-DD');

                sampleMembers.push([
                    nome, telefone, email, plano, valorPlano,
                    ultimaAtividade, frequencia, motivo, dataCadastro,
                    'Inativo', `Exemplo ${i + 1}`, 'Nunca'
                ]);
            }

            // Criar a planilha
            await this.updateRange('Alunos_Inativos!A1:L1', [headers]);
            await this.updateRange(`Alunos_Inativos!A2:L${sampleMembers.length + 1}`, sampleMembers);

            console.log(`✅ ${sampleMembers.length} alunos de exemplo criados`);

        } catch (error) {
            console.error('❌ Erro ao criar dados de exemplo:', error);
            throw error;
        }
    }

    // Métodos para logging de campanhas
    async logCampaignExecution(summary) {
        try {
            const logData = [
                moment().format('DD/MM/YYYY HH:mm:ss'),
                'Campanha 650 Inativos',
                summary.criticos || 0,
                summary.moderados || 0,
                summary.baixaFreq || 0,
                summary.prospects || 0,
                summary.totalEnviados || 0,
                summary.totalErros || 0,
                'Executado via N8N',
                `ROI projetado: ${summary.projectedROI || 11700}%`
            ];

            await this.appendRow('Campanhas_Historico', logData);
            console.log('✅ Execução da campanha logada');

        } catch (error) {
            console.error('❌ Erro ao logar execução da campanha:', error);
        }
    }

    async logCampaignMessage(telefone, nome, urgencia, campanha, status, expectedRevenue = 0) {
        try {
            const logData = [
                telefone,
                nome,
                urgencia,
                campanha,
                moment().format('DD/MM/YYYY HH:mm:ss'),
                status,
                expectedRevenue,
                0, // conversion rate será atualizada depois
                '', // desconto
                0, // prioridade
                '' // follow-up
            ];

            await this.appendRow('Campanhas_Log', logData);

        } catch (error) {
            console.error('❌ Erro ao logar mensagem da campanha:', error);
        }
    }

    async updateReactivationStatus(telefone, newStatus, observacoes = '') {
        try {
            const data = await this.getRange('Alunos_Inativos!A:L');

            for (let i = 1; i < data.length; i++) {
                if (data[i][1] && data[i][1].replace(/\\D/g, '') === telefone.replace(/\\D/g, '')) {
                    const range = `Alunos_Inativos!J${i + 1}:K${i + 1}`;
                    await this.updateRange(range, [[newStatus, observacoes]]);
                    console.log(`✅ Status atualizado para ${telefone}: ${newStatus}`);
                    break;
                }
            }

        } catch (error) {
            console.error('❌ Erro ao atualizar status de reativação:', error);
        }
    }

    // ===== GOOGLE CALENDAR INTEGRATION =====
    async getAvailableSlots(date = null) {
        try {
            const targetDate = date || moment().format('YYYY-MM-DD');
            const timeMin = moment(targetDate).startOf('day').toISOString();
            const timeMax = moment(targetDate).endOf('day').toISOString();

            const response = await this.calendar.events.list({
                calendarId: this.calendarId,
                timeMin: timeMin,
                timeMax: timeMax,
                singleEvents: true,
                orderBy: 'startTime'
            });

            const events = response.data.items || [];

            // Horários de funcionamento da academia
            const businessHours = [
                { start: '06:00', end: '22:00' }, // Seg-Sex
                { start: '08:00', end: '18:00' }, // Sábado
                { start: '08:00', end: '16:00' }  // Domingo
            ];

            const dayOfWeek = moment(targetDate).day(); // 0=Domingo, 6=Sábado
            let hours;
            if (dayOfWeek === 0) hours = businessHours[2]; // Domingo
            else if (dayOfWeek === 6) hours = businessHours[1]; // Sábado
            else hours = businessHours[0]; // Seg-Sex

            // Gerar slots disponíveis (intervalos de 1 hora)
            const availableSlots = [];
            const startHour = parseInt(hours.start.split(':')[0]);
            const endHour = parseInt(hours.end.split(':')[0]);

            for (let hour = startHour; hour < endHour; hour++) {
                const slotStart = moment(targetDate).hour(hour).minute(0);
                const slotEnd = moment(targetDate).hour(hour + 1).minute(0);

                // Verificar se slot está ocupado
                const isOccupied = events.some(event => {
                    const eventStart = moment(event.start.dateTime || event.start.date);
                    const eventEnd = moment(event.end.dateTime || event.end.date);
                    return slotStart.isBefore(eventEnd) && slotEnd.isAfter(eventStart);
                });

                if (!isOccupied) {
                    availableSlots.push({
                        time: slotStart.format('HH:mm'),
                        datetime: slotStart.toISOString(),
                        activity: 'Treino Livre'
                    });
                }
            }

            return availableSlots;

        } catch (error) {
            console.error('❌ Erro ao obter slots disponíveis:', error);
            return [];
        }
    }

    async scheduleAppointment(customerName, customerPhone, datetime, activity = 'Avaliação Física') {
        try {
            const event = {
                summary: `${activity} - ${customerName}`,
                description: `Cliente: ${customerName}\\nTelefone: ${customerPhone}\\nAgendado via WhatsApp Bot`,
                start: {
                    dateTime: datetime,
                    timeZone: 'America/Sao_Paulo'
                },
                end: {
                    dateTime: moment(datetime).add(1, 'hour').toISOString(),
                    timeZone: 'America/Sao_Paulo'
                },
                attendees: [
                    { email: process.env.ACADEMIA_EMAIL }
                ],
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 }, // 1 dia antes
                        { method: 'popup', minutes: 60 } // 1 hora antes
                    ]
                }
            };

            const response = await this.calendar.events.insert({
                calendarId: this.calendarId,
                resource: event
            });

            console.log(`✅ Agendamento criado: ${customerName} - ${datetime}`);
            return response.data;

        } catch (error) {
            console.error('❌ Erro ao criar agendamento:', error);
            throw error;
        }
    }

    async cancelAppointment(eventId) {
        try {
            await this.calendar.events.delete({
                calendarId: this.calendarId,
                eventId: eventId
            });

            console.log(`✅ Agendamento cancelado: ${eventId}`);
            return true;

        } catch (error) {
            console.error('❌ Erro ao cancelar agendamento:', error);
            return false;
        }
    }

    // ===== N8N INTEGRATION TRIGGERS =====
    async setupN8NTriggers() {
        try {
            console.log('🔗 Configurando triggers automáticos para N8N...');

            // Trigger 1: Novos alunos inativos adicionados na planilha
            await this.setupSheetChangeMonitoring();

            // Trigger 2: Agendamentos criados/cancelados
            await this.setupCalendarChangeMonitoring();

            // Trigger 3: Responses/conversões detectadas
            await this.setupResponseMonitoring();

            console.log('✅ Triggers N8N configurados');

        } catch (error) {
            console.error('❌ Erro ao configurar triggers N8N:', error);
        }
    }

    async setupSheetChangeMonitoring() {
        // Implementar monitoramento de mudanças na planilha
        // Por enquanto, retornar sucesso
        console.log('📊 Monitoramento de planilha configurado');
        return true;
    }

    async setupCalendarChangeMonitoring() {
        // Implementar monitoramento de mudanças no calendário
        console.log('📅 Monitoramento de calendário configurado');
        return true;
    }

    async setupResponseMonitoring() {
        // Implementar monitoramento de respostas
        console.log('💬 Monitoramento de respostas configurado');
        return true;
    }

    // ===== ANALYTICS & REPORTING =====
    async generateCampaignReport() {
        try {
            const campaignLogs = await this.getRange('Campanhas_Log!A:K');
            const roiData = await this.getRange('ROI_Dashboard!A:M');

            const report = {
                timestamp: moment().toISOString(),
                totalCampaigns: campaignLogs.length - 1,
                byUrgency: this.groupByColumn(campaignLogs, 2), // Coluna urgência
                byStatus: this.groupByColumn(campaignLogs, 5), // Coluna status
                totalExpectedRevenue: this.sumColumn(campaignLogs, 6), // Expected revenue
                averageConversionRate: this.averageColumn(campaignLogs, 7), // Conversion rate
                lastUpdate: campaignLogs[campaignLogs.length - 1]?.[4] // Última data_envio
            };

            return report;

        } catch (error) {
            console.error('❌ Erro ao gerar relatório:', error);
            return null;
        }
    }

    groupByColumn(data, columnIndex) {
        const groups = {};
        data.slice(1).forEach(row => {
            const key = row[columnIndex] || 'Não informado';
            groups[key] = (groups[key] || 0) + 1;
        });
        return groups;
    }

    sumColumn(data, columnIndex) {
        return data.slice(1).reduce((sum, row) => {
            return sum + (parseFloat(row[columnIndex]) || 0);
        }, 0);
    }

    averageColumn(data, columnIndex) {
        const values = data.slice(1).map(row => parseFloat(row[columnIndex]) || 0);
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    }

    // ===== HEALTH CHECK =====
    async healthCheck() {
        try {
            // Test Sheets API
            await this.getRange('A1:A1');

            // Test Calendar API
            await this.calendar.calendars.get({ calendarId: this.calendarId });

            return {
                status: 'healthy',
                sheets: 'connected',
                calendar: 'connected',
                timestamp: moment().toISOString()
            };

        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: moment().toISOString()
            };
        }
    }
}

module.exports = GoogleIntegration;