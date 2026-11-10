// Conta de TESTE com a semana atual preenchida, para gerar um relatório e ver como fica. Não mexe na conta real da Amanda.
export const testUser = {
  fullName: 'Amanda Teste',
  email: 'amanda.teste@neuroacompanha.com',
  role: 'Acompanhante terapêutica (AT)',
  avatar: { hair: 'long', hairColor: 'brown', skin: 'tan', clothing: 'peach', tile: 'peach' },
};

const week = (classes, welcome = true) => ({ attends: true, welcome, classes });
const off = { attends: false, welcome: false, classes: [] };

export const testChild = {
  name: 'Maria Fernanda Soares Silva',
  avatar: { hair: 'ponytail', hairColor: 'ginger', skin: 'light', clothing: 'navy', tile: 'peach' },
  routine: {
    0: off,
    1: week(['Português', 'Matemática', 'Ciências']),
    2: week(['Português', 'Matemática', 'História', 'Educação Física']),
    3: week(['Português', 'Matemática', 'Geografia', 'Artes']),
    4: week(['Português', 'Matemática', 'Inglês', 'Ciências']),
    5: week(['Português', 'Matemática', 'Educação Física']),
    6: off,
  },
};

// Anotações no jeito que a AT escreve no dia a dia (informal): a IA transforma em texto de relatório.
// `marks`: marcações rápidas; `answers`: prancheta; `occurrence`: gera a tabela de comportamentos (ABC).
const NOTES = {
  welcome: [
    { note: 'chegou animada, cumprimentou a professora e os colegas sozinha. guardou a mochila e sentou no lugar sem eu precisar chamar', marks: ['happy', 'interacted'], answers: { arrivedHow: 'Feliz', enteredCalmly: 'yes' } },
    { note: 'chegou meio quietinha, demorou pra se despedir da mae mas depois entrou tranquila. cumprimentou a professora quando ela falou bom dia', marks: ['calm'], answers: { arrivedHow: 'Sonolento(a)', helpFarewell: 'yes' } },
  ],
  'Português': [
    { note: 'a professora pediu leitura de um texto curto em voz alta, ela leu sozinha e respondeu 3 perguntas sobre o texto. na escrita precisou que eu lembrasse de começar a frase com letra maiúscula', marks: ['activityDone', 'followedRule'], answers: { didAlone: 'yes', finished: 'yes' } },
    { note: 'ditado de palavras com R e RR. errou duas palavras mas se corrigiu quando eu li devagar. terminou a atividade do caderno', marks: ['activityDone'], answers: { finished: 'yes', repeat: 'yes' } },
  ],
  'Matemática': [
    { note: 'depois da atividade do livro a professora resolveu fazer o bingo com numeros multiplos triplos (mas ela falou antes ta exemplo multiplo de 6) maria ganhou duas vezes mas teve dificuldade em pensar nos numeros porq a professora pediu para que escolhesse 6 numero de 1 a 10 e depois de 20 a 30 sla e ela nao consegiu pensar nos numeros e eu tive que escrever todos os numeros pra ela eaxolher 6 dentre eles', marks: ['askedHelp', 'newSkill'], answers: { helpType: { obs: 'Escrevi os números para ela escolher' } } },
    { note: 'trabalhou subtração com material dourado. fez as duas primeiras contas sozinha, na terceira pediu ajuda e eu mostrei com as peças. ficou feliz quando acertou', marks: ['activityDone', 'askedHelp'], answers: { didAlone: 'yes', learnedNew: 'yes' } },
  ],
  'Ciências': [
    { note: 'experimento com água e corante. observou a mistura, falou que a água mudou de cor e registrou no caderno com ajuda para organizar o desenho. se incomodou um pouco com o barulho dos colegas e colocou as mãos nos ouvidos', marks: ['interacted', 'overload'], answers: { sensory: 'yes' }, occurrence: { key: 'overload', antecedent: 'Barulho alto dos colegas durante o experimento', consequence: 'Saímos 2 minutos pro corredor e ela voltou calma' } },
  ],
  'História': [
    { note: 'aula sobre os povos indígenas, assistiu o vídeo com atenção e contou pra professora o que lembrou. no caderno copiou o título e desenhou uma oca', marks: ['activityDone', 'interacted'], answers: { focused: 'yes' } },
  ],
  'Geografia': [
    { note: 'trabalharam com mapa do Brasil, ela encontrou o estado onde mora e apontou as regiões que a professora pediu. precisou de uma pista verbal pra achar o Nordeste', marks: ['followedRule'], answers: { understood: 'yes', verbalCues: 'yes' } },
  ],
  'Inglês': [
    { note: 'aula de cores em inglês, repetiu as palavras junto com a turma e acertou red, blue e green no jogo. na hora de escrever precisou de modelo na lousa', marks: ['happy', 'activityDone'], answers: { learnedNew: 'yes' } },
  ],
  'Artes': [
    { note: 'pintura livre com guache. escolheu as cores sozinha e fez um desenho da família. dividiu o pincel com uma colega', marks: ['interacted', 'activityDone'], answers: { didAlone: 'yes' } },
  ],
  'Educação Física': [
    { note: 'circuito com cones e bambolês. fez o circuito inteiro, esperou a vez na fila com minha ajuda lembrando de quem era a vez. na corrida ficou cansada e pediu pra beber água', marks: ['askedHelp', 'water'], answers: { groupParticipation: 'yes' } },
  ],
  snack: [
    { note: 'lanchou sozinha, abriu a lancheira e comeu quase tudo. sentou com duas colegas e conversou', marks: ['snack', 'interacted'], answers: { playedWithPeers: 'yes' } },
  ],
  play: [
    { note: 'brincou de pega-pega com as colegas por um tempo. depois quis ficar sozinha no balanço, respeitei e fiquei por perto. na volta pra sala aceitou bem a troca de atividade', marks: ['calm', 'break'], answers: { preferredAlone: 'yes' } },
    { note: 'brincadeira de roda com a turma toda, participou cantando. teve uma recusa pra voltar pra sala, falou que nao queria, esperei 1 minuto e avisei que depois teria mais, ela foi', marks: ['interacted', 'refusal'], answers: { groupParticipation: 'yes' }, occurrence: { key: 'refusal', antecedent: 'Pedi para voltar para a sala no fim do recreio', consequence: 'Esperei 1 minuto, antecipei o que viria e ela voltou' } },
  ],
};

export const summaries = [
  { easy: 'Leitura em voz alta e as atividades de aula', hard: 'Escolher números sem apoio e esperar a vez', worked: 'Escrever as opções para ela escolher; antecipar o que vem depois', progress: 'Pediu ajuda mais vezes por conta própria', family: 'Foi um dia bom, participou de quase tudo e teve um momento difícil, mas se recuperou rápido.' },
  { easy: 'Brincadeiras e as atividades com material concreto', hard: 'Barulho da sala no experimento', worked: 'Pausa curta fora da sala e elogio logo depois da tarefa', progress: 'Contou espontaneamente o que aprendeu', family: 'Dia tranquilo, participou bastante e fez novos vínculos com os colegas.' },
];

export { NOTES };
