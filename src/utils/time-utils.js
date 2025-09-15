const moment = require('moment');

// Configurar moment para português
moment.locale('pt-br');

/**
 * Verifica se está em horário de funcionamento da academia
 */
function isBusinessHours(dateTime = null) {
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

/**
 * Formata horário para exibição
 */
function formatTime(time) {
    if (typeof time === 'string') {
        return moment(time, 'HH:mm').format('HH:mm');
    }
    return moment(time).format('HH:mm');
}

/**
 * Formata data para exibição
 */
function formatDate(date) {
    return moment(date).format('DD/MM/YYYY');
}

/**
 * Formata data e hora para exibição
 */
function formatDateTime(dateTime) {
    return moment(dateTime).format('DD/MM/YYYY HH:mm');
}

/**
 * Retorna próximo horário disponível
 */
function getNextAvailableSlot() {
    const now = moment();
    let next = now.clone();

    // Se for depois das 22h, próximo dia às 6h
    if (now.hour() >= 22) {
        next = next.add(1, 'day').hour(6).minute(0);
    }
    // Se for antes das 6h, hoje às 6h
    else if (now.hour() < 6) {
        next = next.hour(6).minute(0);
    }
    // Senão, próxima hora cheia
    else {
        next = next.add(1, 'hour').minute(0);
    }

    // Verificar se é dia útil e horário de funcionamento
    while (!isBusinessHours(next)) {
        next = next.add(1, 'hour');

        // Se passou do horário, ir para o próximo dia
        if (next.hour() >= 22 || (next.day() === 6 && next.hour() >= 18) || (next.day() === 0 && next.hour() >= 14)) {
            next = next.add(1, 'day').hour(6).minute(0);
        }

        // Pular domingo se for depois das 14h
        if (next.day() === 0 && next.hour() >= 14) {
            next = next.add(1, 'day').hour(6).minute(0);
        }
    }

    return {
        date: next.format('YYYY-MM-DD'),
        time: next.format('HH:mm'),
        dayName: next.format('dddd'),
        formatted: next.format('dddd, DD/MM às HH:mm')
    };
}

/**
 * Verifica se é horário de pico
 */
function isPeakHour(time = null) {
    const checkTime = time ? moment(time, 'HH:mm') : moment();
    const hour = checkTime.hour();

    // Horários de pico: 7h-9h e 18h-21h
    return (hour >= 7 && hour <= 9) || (hour >= 18 && hour <= 21);
}

/**
 * Calcula duração entre dois horários
 */
function calculateDuration(startTime, endTime) {
    const start = moment(startTime, 'HH:mm');
    const end = moment(endTime, 'HH:mm');

    return end.diff(start, 'minutes');
}

/**
 * Adiciona tempo a um horário
 */
function addTime(time, minutes) {
    return moment(time, 'HH:mm').add(minutes, 'minutes').format('HH:mm');
}

/**
 * Gera horários disponíveis para um dia
 */
function generateDaySlots(date = null) {
    const targetDate = date ? moment(date) : moment();
    const day = targetDate.day();
    const slots = [];

    let startHour, endHour;

    // Definir horários por dia da semana
    if (day >= 1 && day <= 5) { // Segunda a Sexta
        startHour = 6;
        endHour = 22;
    } else if (day === 6) { // Sábado
        startHour = 8;
        endHour = 18;
    } else if (day === 0) { // Domingo
        startHour = 8;
        endHour = 14;
    } else {
        return slots; // Não funciona neste dia
    }

    // Gerar slots de hora em hora
    for (let hour = startHour; hour < endHour; hour++) {
        slots.push({
            time: `${hour.toString().padStart(2, '0')}:00`,
            isPeak: isPeakHour(`${hour}:00`),
            available: true // Por padrão disponível, será verificado com agenda
        });
    }

    return slots;
}

/**
 * Verifica se um horário é válido para agendamento
 */
function isValidScheduleTime(date, time) {
    const scheduleDateTime = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm');
    const now = moment();

    // Não pode agendar no passado
    if (scheduleDateTime.isBefore(now)) {
        return false;
    }

    // Deve estar em horário de funcionamento
    if (!isBusinessHours(scheduleDateTime)) {
        return false;
    }

    // Deve ser com pelo menos 1 hora de antecedência
    if (scheduleDateTime.diff(now, 'hours') < 1) {
        return false;
    }

    return true;
}

/**
 * Formata período de tempo por extenso
 */
function formatTimePeriod(minutes) {
    if (minutes < 60) {
        return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    let result = `${hours} hora${hours !== 1 ? 's' : ''}`;

    if (remainingMinutes > 0) {
        result += ` e ${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`;
    }

    return result;
}

/**
 * Obtém saudação baseada no horário
 */
function getGreeting() {
    const hour = moment().hour();

    if (hour >= 5 && hour < 12) {
        return 'Bom dia';
    } else if (hour >= 12 && hour < 18) {
        return 'Boa tarde';
    } else {
        return 'Boa noite';
    }
}

/**
 * Verifica se é fim de semana
 */
function isWeekend(date = null) {
    const checkDate = date ? moment(date) : moment();
    const day = checkDate.day();
    return day === 0 || day === 6; // Domingo ou Sábado
}

/**
 * Retorna próximos N dias úteis
 */
function getNextBusinessDays(count = 5) {
    const days = [];
    let current = moment().add(1, 'day'); // Começar amanhã

    while (days.length < count) {
        // Pular domingos (academia fecha mais cedo)
        if (current.day() !== 0 || current.hour() < 14) {
            days.push({
                date: current.format('YYYY-MM-DD'),
                dayName: current.format('dddd'),
                formatted: current.format('DD/MM (dddd)')
            });
        }
        current = current.add(1, 'day');
    }

    return days;
}

module.exports = {
    isBusinessHours,
    formatTime,
    formatDate,
    formatDateTime,
    getNextAvailableSlot,
    isPeakHour,
    calculateDuration,
    addTime,
    generateDaySlots,
    isValidScheduleTime,
    formatTimePeriod,
    getGreeting,
    isWeekend,
    getNextBusinessDays
};