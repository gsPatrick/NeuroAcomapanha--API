// Catálogo de rótulos do registro diário. Espelha o que o app mostra à AT (marcações rápidas e prancheta):
// o backend só precisa dos rótulos para contar ao redator (IA) o que foi marcado. Chave desconhecida cai no próprio key.
export const MARK_LABELS = {
  calm: 'Calmo(a)', happy: 'Animado(a)', anxious: 'Ansioso(a)', irritated: 'Irritado(a)', sad: 'Choroso(a)', tired: 'Cansado(a)',
  crisis: 'Crise', refusal: 'Recusa / birra', escape: 'Tentativa de fuga', stereotypy: 'Estereotipia', aggression: 'Agressividade', overload: 'Sobrecarga sensorial',
  snack: 'Lanche / refeição', water: 'Água', bathroom: 'Banheiro', medication: 'Medicação', rest: 'Descanso', break: 'Pausa',
  activityDone: 'Concluiu a atividade', askedHelp: 'Pediu ajuda', followedRule: 'Seguiu a instrução', interacted: 'Interagiu com alguém', eyeContact: 'Contato visual', newSkill: 'Algo novo',
};

// type: yesno (padrão) | choice | check | text
export const QUESTION_LABELS = {
  arrivedHow: { label: 'Como chegou?', type: 'choice' }, enteredCalmly: { label: 'Entrou na sala tranquilamente?' }, helpFarewell: { label: 'Precisou de ajuda para se despedir da família?' },
  didAlone: { label: 'Fez sozinho(a)?' }, helpType: { label: 'Que tipo de ajuda?', type: 'text' }, finished: { label: 'Terminou as atividades?' }, gaveUp: { label: 'Desistiu no meio?' },
  focused: { label: 'Manteve a concentração?' }, distracted: { label: 'Distraiu-se?' }, redirect: { label: 'Precisou de redirecionamento?' }, timeOnTask: { label: 'Quanto tempo permaneceu na tarefa?', type: 'text' },
  askedHelp: { label: 'Pediu ajuda?' }, answeredCall: { label: 'Respondeu quando chamado(a)?' }, spoke: { label: 'Conversou espontaneamente?' }, expressedNeeds: { label: 'Expressou necessidades?' },
  playedWithPeers: { label: 'Brincou com os colegas?' }, preferredAlone: { label: 'Preferiu ficar sozinho(a)?' }, groupParticipation: { label: 'Participou em grupo?' }, teacherInteraction: { label: 'Interagiu com o(a) professor(a)?' },
  frustration: { label: 'Frustração?' }, crying: { label: 'Choro?' }, joy: { label: 'Alegria?' }, anxiety: { label: 'Ansiedade?' }, regulated: { label: 'Como se regulou?', type: 'text' },
  crisis: { label: 'Crise?' }, repetitive: { label: 'Comportamentos repetitivos?' }, leftRoom: { label: 'Saiu da sala?' }, sensory: { label: 'Sensibilidade sensorial?' },
  understood: { label: 'Entendeu as orientações?' }, repeat: { label: 'Precisou repetir?' }, learnedNew: { label: 'Aprendeu algo novo?' }, difficulty: { label: 'Dificuldade específica?' },
  whatIDid: { label: 'O que fiz para ajudar?', type: 'text' }, verbalCues: { label: 'Pistas verbais', type: 'check' }, redirected: { label: 'Redirecionei a atenção', type: 'check' }, autonomy: { label: 'Incentivei a autonomia', type: 'check' }, socialMediation: { label: 'Mediação social', type: 'check' }, otherHelp: { label: 'Outro', type: 'text' },
  snackAte: { label: 'Como foi a alimentação?', type: 'choice' }, snackAlone: { label: 'Comeu sozinho(a)?' }, snackSeated: { label: 'Ficou sentado(a) durante o lanche?' }, snackNew: { label: 'Aceitou alimentos novos?' }, snackAsked: { label: 'Pediu o que queria (água, lanche)?' }, snackPeers: { label: 'Interagiu com os colegas?' }, snackNote: { label: 'Observação sobre o lanche', type: 'text' },
  routineChange: { label: 'Mudança de rotina?' }, tripExam: { label: 'Passeio ou prova?' }, teacherAbsent: { label: 'Professor(a) faltou?' }, sick: { label: 'Gripado(a) ou sonolento(a)?' }, otherFact: { label: 'Outro fato relevante?', type: 'text' },
};

export const SUMMARY_LABELS = {
  easy: 'O que fez com facilidade?', hard: 'Maior dificuldade', worked: 'O que funcionou?', progress: 'Evolução percebida', family: 'Se a família perguntasse como foi o dia, eu diria:',
};

export const BLOCK_KINDS = ['welcome', 'class', 'snack', 'play', 'other'];
export const DEFAULT_SUSPENSION_NOTE = 'atendimento suspenso pela família.';
