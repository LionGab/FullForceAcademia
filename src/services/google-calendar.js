const { google } = require('googleapis');
const moment = require('moment');

class GoogleCalendarService {
    constructor() {
        this.calendar = null;
        this.auth = null;
        this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

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

            this.calendar = google.calendar({ version: 'v3', auth: this.auth });
            console.log('✅ Google Calendar configurado com sucesso');

        } catch (error) {
            console.error('❌ Erro ao configurar Google Calendar:', error);
        }
    }

    async getAvailableSlots(date = null) {
        try {
            if (!this.calendar) {
                console.warn('⚠️ Google Calendar não configurado');
                return this.getMockAvailableSlots();
            }

            const targetDate = date || moment().format('YYYY-MM-DD');
            const startTime = moment(`${targetDate} 06:00`).toISOString();
            const endTime = moment(`${targetDate} 22:00`).toISOString();

            // Buscar eventos existentes
            const response = await this.calendar.events.list({
                calendarId: this.calendarId,
                timeMin: startTime,
                timeMax: endTime,
                singleEvents: true,
                orderBy: 'startTime'
            });

            const events = response.data.items || [];
            const availableSlots = this.calculateAvailableSlots(events, targetDate);

            return availableSlots;

        } catch (error) {
            console.error('❌ Erro ao buscar slots disponíveis:', error);
            return this.getMockAvailableSlots();
        }
    }

    calculateAvailableSlots(events, date) {
        // Horários padrão de funcionamento
        const workingHours = [
            '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
            '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
        ];

        const availableSlots = [];
        const occupiedTimes = events.map(event => {
            if (event.start && event.start.dateTime) {
                return moment(event.start.dateTime).format('HH:mm');
            }
            return null;
        }).filter(time => time !== null);

        workingHours.forEach(time => {
            if (!occupiedTimes.includes(time)) {
                availableSlots.push({
                    time: time,
                    date: date,
                    activity: 'Treino Livre',
                    duration: 60 // minutos
                });
            }
        });

        return availableSlots.slice(0, 8); // Limitar a 8 slots
    }

    async createEvent(eventData) {
        try {
            if (!this.calendar) {
                console.warn('⚠️ Google Calendar não configurado - simulando criação');
                return { id: 'mock_event_' + Date.now(), status: 'confirmed' };
            }

            const event = {
                summary: eventData.title || 'Treino - Academia Full Force',
                description: eventData.description || `Agendamento via WhatsApp\nCliente: ${eventData.clientName}\nTelefone: ${eventData.clientPhone}`,
                start: {
                    dateTime: moment(`${eventData.date} ${eventData.time}`).toISOString(),
                    timeZone: 'America/Sao_Paulo'
                },
                end: {
                    dateTime: moment(`${eventData.date} ${eventData.time}`).add(1, 'hour').toISOString(),
                    timeZone: 'America/Sao_Paulo'
                },
                attendees: [
                    { email: eventData.clientEmail || 'cliente@academia.com' }
                ],
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'popup', minutes: 60 },
                        { method: 'popup', minutes: 15 }
                    ]
                }
            };

            const response = await this.calendar.events.insert({
                calendarId: this.calendarId,
                resource: event
            });

            console.log(`✅ Evento criado: ${response.data.id}`);
            return response.data;

        } catch (error) {
            console.error('❌ Erro ao criar evento:', error);
            throw error;
        }
    }

    async cancelEvent(eventId) {
        try {
            if (!this.calendar) {
                console.warn('⚠️ Google Calendar não configurado - simulando cancelamento');
                return { status: 'cancelled' };
            }

            await this.calendar.events.delete({
                calendarId: this.calendarId,
                eventId: eventId
            });

            console.log(`✅ Evento cancelado: ${eventId}`);
            return { status: 'cancelled' };

        } catch (error) {
            console.error('❌ Erro ao cancelar evento:', error);
            throw error;
        }
    }

    async getUpcomingEvents(clientPhone) {
        try {
            if (!this.calendar) {
                return this.getMockUpcomingEvents();
            }

            const now = moment().toISOString();
            const nextWeek = moment().add(7, 'days').toISOString();

            const response = await this.calendar.events.list({
                calendarId: this.calendarId,
                timeMin: now,
                timeMax: nextWeek,
                q: clientPhone, // Buscar eventos que contenham o telefone
                singleEvents: true,
                orderBy: 'startTime'
            });

            return response.data.items || [];

        } catch (error) {
            console.error('❌ Erro ao buscar eventos futuros:', error);
            return [];
        }
    }

    async getEvaluationSlots() {
        try {
            // Horários específicos para avaliação física
            const evaluationHours = ['14:00', '15:00', '16:00', '17:00'];
            const availableSlots = [];

            // Próximos 5 dias úteis
            for (let i = 1; i <= 5; i++) {
                const date = moment().add(i, 'days');

                // Pular fins de semana para avaliação
                if (date.day() === 0 || date.day() === 6) continue;

                evaluationHours.forEach(time => {
                    availableSlots.push({
                        date: date.format('YYYY-MM-DD'),
                        time: time,
                        dayName: date.format('dddd'),
                        activity: 'Avaliação Física',
                        duration: 45
                    });
                });
            }

            return availableSlots.slice(0, 6); // Limitar a 6 slots

        } catch (error) {
            console.error('❌ Erro ao buscar slots de avaliação:', error);
            return this.getMockEvaluationSlots();
        }
    }

    // Métodos mock para quando o Google Calendar não estiver configurado
    getMockAvailableSlots() {
        const today = moment().format('YYYY-MM-DD');
        return [
            { time: '07:00', date: today, activity: 'Treino Livre' },
            { time: '09:00', date: today, activity: 'Treino Livre' },
            { time: '14:00', date: today, activity: 'Treino Livre' },
            { time: '16:00', date: today, activity: 'Treino Livre' },
            { time: '18:00', date: today, activity: 'Treino Livre' },
            { time: '20:00', date: today, activity: 'Treino Livre' }
        ];
    }

    getMockUpcomingEvents() {
        return [
            {
                id: 'mock_1',
                summary: 'Treino - Academia Full Force',
                start: { dateTime: moment().add(1, 'day').set('hour', 18).toISOString() }
            }
        ];
    }

    getMockEvaluationSlots() {
        return [
            { date: moment().add(1, 'day').format('YYYY-MM-DD'), time: '14:00', dayName: 'Segunda', activity: 'Avaliação Física' },
            { date: moment().add(2, 'day').format('YYYY-MM-DD'), time: '15:00', dayName: 'Terça', activity: 'Avaliação Física' },
            { date: moment().add(3, 'day').format('YYYY-MM-DD'), time: '16:00', dayName: 'Quarta', activity: 'Avaliação Física' }
        ];
    }

    // Utilitário para verificar se é horário de funcionamento
    isBusinessHours(dateTime = null) {
        const checkTime = dateTime ? moment(dateTime) : moment();
        const hour = checkTime.hour();
        const day = checkTime.day();

        // Segunda a Sexta: 6h às 22h
        if (day >= 1 && day <= 5) {
            return hour >= 6 && hour < 22;
        }

        // Sábado: 8h às 18h
        if (day === 6) {
            return hour >= 8 && hour < 18;
        }

        // Domingo: 8h às 14h
        if (day === 0) {
            return hour >= 8 && hour < 14;
        }

        return false;
    }
}

module.exports = GoogleCalendarService;