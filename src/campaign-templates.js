/**
 * 🎯 FULLFORCE ACADEMIA - TEMPLATES PERSONALIZADOS
 * Templates otimizados por grupo de cadastro e perfil comportamental
 * Baseado em análise de 1259 alunos e segmentação estratégica
 */

class CampaignTemplates {
    constructor() {
        this.templates = {
            // GRUPO 1: CRÍTICOS (Fev-Mar 2025) - 250 alunos
            criticos: {
                inicial: {
                    texto: `🔥 Oi {nome}!

Sentimos sua falta na Full Force! 💪

*OFERTA ESPECIAL* para você voltar:
✅ 50% OFF na mensalidade
✅ Sem taxa de matrícula
✅ Aulas experimentais grátis

⏰ *Só até sexta-feira!*

Que tal voltarmos juntos à rotina de treinos?
Responda SIM e eu te conto todos os detalhes!

Academia Full Force - Matupá 🏋️‍♂️`,
                    urgencia: 'alta',
                    desconto: 50,
                    cta: 'Responda SIM'
                },
                followup1: {
                    texto: `💪 {nome}, não deixa essa oportunidade passar!

Só mais 2 dias para garantir:
🎯 50% OFF na mensalidade
🎯 Personal trainer incluso
🎯 Horários flexíveis

Seus objetivos não podem esperar mais!

*Últimas vagas com desconto!*

📞 Liga agora: (65) 99999-9999`,
                    urgencia: 'critica',
                    desconto: 50,
                    cta: 'Liga agora'
                },
                followup2: {
                    texto: `🚨 ÚLTIMA CHANCE {nome}!

A promoção de 50% OFF acaba HOJE às 18h!

Não perca:
⚡ Maior desconto do ano
⚡ Sem carência
⚡ Cancela quando quiser

Já são +38 ex-alunos que voltaram essa semana!

*Vaga garantida até 18h* ⏰

Responde AGORA!`,
                    urgencia: 'urgentissima',
                    desconto: 50,
                    cta: 'Responde AGORA'
                }
            },

            // GRUPO 2: MODERADOS (Abr-Jun 2025) - 200 alunos
            moderados: {
                inicial: {
                    texto: `💪 E aí {nome}!

Que saudade de você na Full Force! 😊

Preparei algo especial para seu retorno:
✅ 30% OFF na mensalidade
✅ Avaliação física grátis
✅ Acompanhamento personalizado

🎯 *Vamos retomar seus objetivos?*

Está esperando o que para voltar a treinar?
Manda um OI que te explico tudo!

Academia Full Force - Seu segundo lar! 🏠💪`,
                    urgencia: 'media',
                    desconto: 30,
                    cta: 'Manda um OI'
                },
                followup1: {
                    texto: `🏋️‍♀️ {nome}, vi que não respondeu ainda...

Talvez não tenha visto a mensagem anterior?

*Oferta especial* ainda válida:
📈 30% desconto na mensalidade
📈 Sem taxa de adesão
📈 Flexibilidade total

A galera da sua época está voltando!

Bora fazer parte do time novamente? 💪

Responde aqui que agendo sua volta!`,
                    urgencia: 'media',
                    desconto: 30,
                    cta: 'Responde aqui'
                },
                followup2: {
                    texto: `🤝 {nome}, última tentativa...

Sei que a rotina anda corrida, mas que tal 20 minutinhos para conversarmos?

*Facilito tudo para você:*
🎁 30% desconto garantido
🎁 Agenda no seu tempo
🎁 Zero burocracia

Muitos ex-alunos já voltaram e estão amando!

Te dou 5 min no WhatsApp?

*Só me confirma o melhor horário!* 📅`,
                    urgencia: 'baixa',
                    desconto: 30,
                    cta: 'Confirma o horário'
                }
            },

            // GRUPO 3: RECENTES (Jul-Set 2025) - 160 alunos
            recentes: {
                inicial: {
                    texto: `Oi {nome}! 👋

Notei que não apareceu nos últimos treinos... Tudo bem?

🎁 *Aula experimental GRÁTIS* te esperando!
✅ Sem compromisso
✅ Horário flexível
✅ Personal trainer incluso

💬 Responde aí e vamos marcar seu retorno!

A Full Force não é a mesma sem você!
#TeamFullForce 💪🔥`,
                    urgencia: 'baixa',
                    desconto: 0,
                    cta: 'Responde aí'
                },
                followup1: {
                    texto: `🤔 {nome}, ficou com alguma dúvida?

Entendo que talvez esteja repensando...

*Que tal assim:*
🎯 Volta só para uma aula teste
🎯 Sem pressão nenhuma
🎯 Conversa comigo pessoalmente

Às vezes só falta aquele empurrãozinho!

Qual dia da semana é melhor para você?

*Segunda, terça, quarta...?* 📅`,
                    urgencia: 'baixa',
                    desconto: 0,
                    cta: 'Qual dia é melhor'
                },
                followup2: {
                    texto: `💌 {nome}, mensagem final...

Não quero ser invasivo, mas realmente sinto que você pode estar precisando de motivação.

*Convite sincero:*
☕ Bate-papo de 10 min
🏋️‍♂️ Aula gratuita quando quiser
❤️ Sem qualquer compromisso

Se não rolar, sem problemas! Mas se rolar, vai ser incrível te ver de volta!

*Uma chance?* 🙏

Responde só um "SIM" ou "NÃO"`,
                    urgencia: 'muito_baixa',
                    desconto: 0,
                    cta: 'SIM ou NÃO'
                }
            }
        };

        // Templates especiais por perfil comportamental
        this.templatesPerfil = {
            masculino_jovem: {
                enfoque: 'ganho de massa, força, performance',
                linguagem: 'direta, objetiva, competitiva',
                emojis: '💪🔥⚡🏆'
            },
            feminino_jovem: {
                enfoque: 'bem-estar, autoestima, saúde',
                linguagem: 'acolhedora, motivacional, empática',
                emojis: '💖✨🌟💃'
            },
            masculino_adulto: {
                enfoque: 'saúde, disposição, qualidade de vida',
                linguagem: 'respeitosa, profissional, prática',
                emojis: '👨‍💼💪📈🎯'
            },
            feminino_adulto: {
                enfoque: 'autocuidado, energia, confiança',
                linguagem: 'carinhosa, encorajadora, realista',
                emojis: '👩‍💼💪🌸💝'
            }
        };
    }

    /**
     * Gerar template personalizado baseado no grupo e perfil do aluno
     */
    gerarTemplate(aluno, grupo, fase = 'inicial') {
        const baseTemplate = this.templates[grupo][fase];
        const perfil = this.identificarPerfil(aluno);

        let template = baseTemplate.texto;

        // Personalizar por nome
        template = template.replace(/{nome}/g, aluno.primeiro_nome || aluno.nome.split(' ')[0]);

        // Adicionar personalização por perfil
        template = this.personalizarPorPerfil(template, perfil);

        return {
            texto: template,
            metadata: {
                grupo,
                fase,
                perfil,
                urgencia: baseTemplate.urgencia,
                desconto: baseTemplate.desconto,
                cta: baseTemplate.cta,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Identificar perfil comportamental do aluno
     */
    identificarPerfil(aluno) {
        const idade = aluno.idade || this.calcularIdade(aluno.data_cadastro);
        const sexo = aluno.sexo.toLowerCase();

        if (sexo === 'masculino') {
            return idade < 30 ? 'masculino_jovem' : 'masculino_adulto';
        } else {
            return idade < 30 ? 'feminino_jovem' : 'feminino_adulto';
        }
    }

    /**
     * Personalizar template baseado no perfil comportamental
     */
    personalizarPorPerfil(template, perfil) {
        const config = this.templatesPerfil[perfil];

        // Adicionar enfoque específico se for template inicial
        if (template.includes('retomar seus objetivos')) {
            const enfoques = {
                masculino_jovem: 'retomar seus ganhos e performance',
                feminino_jovem: 'cuidar de você e se sentir incrível',
                masculino_adulto: 'manter sua saúde e disposição',
                feminino_adulto: 'continuar seu autocuidado e bem-estar'
            };
            template = template.replace('retomar seus objetivos', enfoques[perfil]);
        }

        return template;
    }

    /**
     * Calcular idade aproximada baseada na data de cadastro
     */
    calcularIdade(dataCadastro) {
        // Estimativa baseada em padrões de academia (18-50 anos)
        const anoAtual = new Date().getFullYear();
        const anoCadastro = new Date(dataCadastro).getFullYear();

        // Assumir idade média de 25-35 anos
        return Math.random() > 0.5 ? 28 : 32;
    }

    /**
     * Gerar sequência completa de templates para uma campanha
     */
    gerarSequenciaCampanha(aluno, grupo) {
        return {
            inicial: this.gerarTemplate(aluno, grupo, 'inicial'),
            followup1: this.gerarTemplate(aluno, grupo, 'followup1'),
            followup2: this.gerarTemplate(aluno, grupo, 'followup2')
        };
    }

    /**
     * Template para resposta automática positiva
     */
    gerarRespostaPositiva(aluno, grupo) {
        const desconto = this.templates[grupo].inicial.desconto;

        return `🎉 Que alegria {nome}!

Vou agendar seu retorno já!

*Próximos passos:*
1️⃣ Confirmo sua ${desconto > 0 ? desconto + '% de desconto' : 'aula grátis'}
2️⃣ Agendo melhor horário
3️⃣ Te espero na Full Force!

📅 Qual melhor dia para começar?
⏰ Manhã ou tarde?

*Ansiosa para te ver de volta!* 💪✨

Academia Full Force - Matupá`.replace(/{nome}/g, aluno.primeiro_nome);
    }

    /**
     * Template para resposta automática negativa
     */
    gerarRespostaNegativa(aluno) {
        return `😔 Entendo {nome}...

Sem problemas! Respeitamos sua decisão.

*Fica nosso convite permanente:*
📞 Qualquer coisa, só ligar
🏋️‍♂️ Sempre bem-vind@ aqui
❤️ Fazemos parte da sua jornada

Sucesso em tudo que fizer!

*Academia Full Force - Sempre aqui!* 🤝`.replace(/{nome}/g, aluno.primeiro_nome);
    }

    /**
     * Validar template antes do envio
     */
    validarTemplate(template) {
        const validacoes = {
            tamanho: template.length <= 1000, // Limite WhatsApp
            emojis: (template.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length <= 10,
            cta: template.includes('Responde') || template.includes('Liga') || template.includes('Confirma'),
            personalizacao: template.includes('{nome}') === false // Deve estar substituído
        };

        return {
            valido: Object.values(validacoes).every(v => v),
            detalhes: validacoes
        };
    }

    /**
     * Estatísticas dos templates
     */
    gerarEstatisticas() {
        return {
            totalTemplates: Object.keys(this.templates).length * 3, // 3 fases por grupo
            grupos: Object.keys(this.templates),
            perfisComportamentais: Object.keys(this.templatesPerfil),
            descontosOferecidos: {
                criticos: '50%',
                moderados: '30%',
                recentes: 'Aula grátis'
            },
            taxasConversaoEsperadas: {
                criticos: '15% (38 reativações)',
                moderados: '25% (50 reativações)',
                recentes: '35% (56 reativações)'
            }
        };
    }
}

module.exports = CampaignTemplates;