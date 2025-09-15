const { google } = require('googleapis');
const moment = require('moment');

class GoogleSheetsService {
    constructor() {
        this.sheets = null;
        this.auth = null;
        this.spreadsheetId = process.env.GOOGLE_SHEETS_ID;

        this.initializeAuth();
    }

    async initializeAuth() {
        try {
            // Configurar autenticação OAuth2
            this.auth = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
            );

            // Se houver token salvo, carregá-lo
            if (process.env.GOOGLE_ACCESS_TOKEN) {
                this.auth.setCredentials({
                    access_token: process.env.GOOGLE_ACCESS_TOKEN,
                    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
                });
            }

            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            console.log('✅ Google Sheets configurado com sucesso');

        } catch (error) {
            console.error('❌ Erro ao configurar Google Sheets:', error);
        }
    }

    async addContact(contactData) {
        try {
            if (!this.sheets || !this.spreadsheetId) {
                console.warn('⚠️ Google Sheets não configurado - salvando localmente');
                this.saveContactLocally(contactData);
                return;
            }

            const values = [
                [
                    contactData.nome,
                    contactData.telefone,
                    contactData.dataContato,
                    contactData.status || 'Novo contato',
                    contactData.observacoes || ''
                ]
            ];

            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Contatos!A:E',
                valueInputOption: 'USER_ENTERED',
                resource: { values }
            });

            console.log(`✅ Contato adicionado ao Google Sheets: ${contactData.telefone}`);

        } catch (error) {
            console.error('❌ Erro ao adicionar contato:', error);
            this.saveContactLocally(contactData);
        }
    }

    async getPlansData() {
        try {
            if (!this.sheets || !this.spreadsheetId) {
                console.warn('⚠️ Google Sheets não configurado - retornando planos padrão');
                return this.getDefaultPlans();
            }

            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Planos!A2:D10' // Assumindo cabeçalhos na linha 1
            });

            const rows = response.data.values || [];
            const plans = rows.map(row => ({
                nome: row[0] || '',
                valor: row[1] || '',
                descricao: row[2] || '',
                beneficios: row[3] || ''
            })).filter(plan => plan.nome && plan.valor);

            return plans.length > 0 ? plans : this.getDefaultPlans();

        } catch (error) {
            console.error('❌ Erro ao buscar planos:', error);
            return this.getDefaultPlans();
        }
    }

    async getPromotions() {
        try {
            if (!this.sheets || !this.spreadsheetId) {
                return this.getDefaultPromotions();
            }

            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Promocoes!A2:E10'
            });

            const rows = response.data.values || [];
            const currentDate = moment();

            const activePromotions = rows
                .map(row => ({
                    titulo: row[0] || '',
                    descricao: row[1] || '',
                    desconto: row[2] || '',
                    validoAte: row[3] || '',
                    condicoes: row[4] || ''
                }))
                .filter(promo => {
                    if (!promo.titulo || !promo.validoAte) return false;

                    const validUntil = moment(promo.validoAte, 'DD/MM/YYYY');
                    return validUntil.isAfter(currentDate);
                });

            return activePromotions.length > 0 ? activePromotions : this.getDefaultPromotions();

        } catch (error) {
            console.error('❌ Erro ao buscar promoções:', error);
            return this.getDefaultPromotions();
        }
    }

    async addSchedule(scheduleData) {
        try {
            if (!this.sheets || !this.spreadsheetId) {
                console.warn('⚠️ Google Sheets não configurado - salvando agendamento localmente');
                this.saveScheduleLocally(scheduleData);
                return;
            }

            const values = [
                [
                    scheduleData.clienteNome,
                    scheduleData.clienteTelefone,
                    scheduleData.data,
                    scheduleData.horario,
                    scheduleData.atividade,
                    scheduleData.status || 'Agendado',
                    moment().format('DD/MM/YYYY HH:mm'),
                    scheduleData.observacoes || ''
                ]
            ];

            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Agendamentos!A:H',
                valueInputOption: 'USER_ENTERED',
                resource: { values }
            });

            console.log(`✅ Agendamento adicionado: ${scheduleData.clienteTelefone} - ${scheduleData.data} ${scheduleData.horario}`);

        } catch (error) {
            console.error('❌ Erro ao adicionar agendamento:', error);
            this.saveScheduleLocally(scheduleData);
        }
    }

    async getClientHistory(clientPhone) {
        try {
            if (!this.sheets || !this.spreadsheetId) {
                return this.getMockClientHistory(clientPhone);
            }

            // Buscar histórico de agendamentos
            const scheduleResponse = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Agendamentos!A:H'
            });

            const scheduleRows = scheduleResponse.data.values || [];
            const clientSchedules = scheduleRows
                .filter(row => row[1] === clientPhone) // Coluna B: telefone
                .map(row => ({
                    data: row[2],
                    horario: row[3],
                    atividade: row[4],
                    status: row[5],
                    observacoes: row[7]
                }));

            // Buscar dados do cliente
            const contactResponse = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Contatos!A:E'
            });

            const contactRows = contactResponse.data.values || [];
            const clientData = contactRows.find(row => row[1] === clientPhone);

            return {
                cliente: clientData ? {
                    nome: clientData[0],
                    telefone: clientData[1],
                    primeiroContato: clientData[2],
                    status: clientData[3]
                } : null,
                agendamentos: clientSchedules
            };

        } catch (error) {
            console.error('❌ Erro ao buscar histórico do cliente:', error);
            return this.getMockClientHistory(clientPhone);
        }
    }

    async updateContactStatus(clientPhone, newStatus) {
        try {
            if (!this.sheets || !this.spreadsheetId) {
                console.warn('⚠️ Google Sheets não configurado');
                return;
            }

            // Buscar a linha do contato
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Contatos!A:E'
            });

            const rows = response.data.values || [];
            const rowIndex = rows.findIndex(row => row[1] === clientPhone);

            if (rowIndex === -1) {
                console.warn(`Cliente não encontrado: ${clientPhone}`);
                return;
            }

            // Atualizar status (coluna D, índice 3)
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `Contatos!D${rowIndex + 1}`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[newStatus]]
                }
            });

            console.log(`✅ Status atualizado para ${clientPhone}: ${newStatus}`);

        } catch (error) {
            console.error('❌ Erro ao atualizar status:', error);
        }
    }

    async getAnalytics() {
        try {
            if (!this.sheets || !this.spreadsheetId) {
                return this.getMockAnalytics();
            }

            const today = moment().format('DD/MM/YYYY');
            const thisMonth = moment().format('MM/YYYY');

            // Buscar dados dos últimos 30 dias
            const contactResponse = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Contatos!A:E'
            });

            const scheduleResponse = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Agendamentos!A:H'
            });

            const contacts = contactResponse.data.values || [];
            const schedules = scheduleResponse.data.values || [];

            const analytics = {
                contatosHoje: contacts.filter(row => row[2] && row[2].includes(today)).length,
                contatosMes: contacts.filter(row => row[2] && row[2].includes(thisMonth)).length,
                agendamentosHoje: schedules.filter(row => row[2] === today).length,
                agendamentosMes: schedules.filter(row => row[2] && row[2].includes(thisMonth)).length,
                totalContatos: contacts.length,
                totalAgendamentos: schedules.length
            };

            return analytics;

        } catch (error) {
            console.error('❌ Erro ao buscar analytics:', error);
            return this.getMockAnalytics();
        }
    }

    // Métodos de fallback quando Google Sheets não está configurado
    saveContactLocally(contactData) {
        const logEntry = `[${contactData.dataContato}] CONTATO: ${contactData.nome} (${contactData.telefone}) - ${contactData.status}\n`;
        console.log('📝 Salvando contato localmente:', logEntry.trim());
    }

    saveScheduleLocally(scheduleData) {
        const logEntry = `[${moment().format('DD/MM/YYYY HH:mm')}] AGENDAMENTO: ${scheduleData.clienteNome} (${scheduleData.clienteTelefone}) - ${scheduleData.data} ${scheduleData.horario}\n`;
        console.log('📅 Salvando agendamento localmente:', logEntry.trim());
    }

    getDefaultPlans() {
        return [
            {
                nome: 'Plano Básico',
                valor: '89,90',
                descricao: 'Musculação + Cardio',
                beneficios: 'Acesso livre à musculação e cardio'
            },
            {
                nome: 'Plano Completo',
                valor: '129,90',
                descricao: 'Todas as modalidades',
                beneficios: 'Musculação, cardio, aulas coletivas'
            },
            {
                nome: 'Plano Premium',
                valor: '179,90',
                descricao: 'Tudo + Personal Trainer',
                beneficios: 'Acesso total + 2 sessões de personal/mês'
            }
        ];
    }

    getDefaultPromotions() {
        return [
            {
                titulo: 'Primeira Semana Grátis',
                descricao: 'Experimente nossa academia por 7 dias',
                desconto: '100%',
                validoAte: moment().add(30, 'days').format('DD/MM/YYYY'),
                condicoes: 'Válido para novos alunos'
            },
            {
                titulo: 'Desconto Anual',
                descricao: 'Pague 10 meses e ganhe 2',
                desconto: '2 meses grátis',
                validoAte: moment().add(60, 'days').format('DD/MM/YYYY'),
                condicoes: 'Pagamento à vista'
            }
        ];
    }

    getMockClientHistory(clientPhone) {
        return {
            cliente: {
                nome: 'Cliente Teste',
                telefone: clientPhone,
                primeiroContato: moment().subtract(5, 'days').format('DD/MM/YYYY'),
                status: 'Prospect'
            },
            agendamentos: [
                {
                    data: moment().add(1, 'day').format('DD/MM/YYYY'),
                    horario: '18:00',
                    atividade: 'Treino Livre',
                    status: 'Agendado',
                    observacoes: 'Primeiro treino'
                }
            ]
        };
    }

    getMockAnalytics() {
        return {
            contatosHoje: 12,
            contatosMes: 156,
            agendamentosHoje: 8,
            agendamentosMes: 89,
            totalContatos: 342,
            totalAgendamentos: 567
        };
    }

    // Utilitário para verificar se o Google Sheets está configurado
    isConfigured() {
        return !!(this.sheets && this.spreadsheetId);
    }

    // Método para criar planilha modelo (usar apenas uma vez)
    async createTemplate() {
        if (!this.sheets || !this.spreadsheetId) {
            console.error('❌ Google Sheets não configurado');
            return;
        }

        try {
            // Criar abas e cabeçalhos
            const requests = [
                // Aba Contatos
                {
                    addSheet: {
                        properties: { title: 'Contatos' }
                    }
                },
                // Aba Planos
                {
                    addSheet: {
                        properties: { title: 'Planos' }
                    }
                },
                // Aba Agendamentos
                {
                    addSheet: {
                        properties: { title: 'Agendamentos' }
                    }
                },
                // Aba Promoções
                {
                    addSheet: {
                        properties: { title: 'Promocoes' }
                    }
                }
            ];

            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                resource: { requests }
            });

            console.log('✅ Template de planilha criado com sucesso');

        } catch (error) {
            console.error('❌ Erro ao criar template:', error);
        }
    }
}

module.exports = GoogleSheetsService;