// Dados iniciais da Amanda (AT) e da criança que ela acompanha. A senha NÃO fica aqui: ver scripts/seed.js.
export const amanda = {
  fullName: 'Amanda Brandão',
  email: 'amandabpleite@gmail.com',
  role: 'Acompanhante terapêutica (AT)',
  // Ilustração enquanto ela não coloca uma foto.
  avatar: { hair: 'long', hairColor: 'brown', skin: 'tan', clothing: 'peach', tile: 'peach' },
};

const week = (classes, welcome = true) => ({ attends: true, welcome, classes });

export const amandaChildren = [
  {
    name: 'Maria Fernanda Soares Silva', // o nome completo sai no campo PACIENTE do relatório
    avatar: { hair: 'ponytail', hairColor: 'ginger', skin: 'light', clothing: 'navy', tile: 'peach' },
    // Segunda a sexta, sempre com acolhimento; as aulas mudam a cada dia (a AT ajusta em "Refazer cadastro").
    routine: {
      0: { attends: false, welcome: false, classes: [] },
      1: week(['Português', 'Matemática', 'Ciências']),
      2: week(['Português', 'Matemática', 'História', 'Educação Física']),
      3: week(['Português', 'Matemática', 'Geografia', 'Artes']),
      4: week(['Português', 'Matemática', 'Inglês', 'Ciências']),
      5: week(['Português', 'Matemática', 'Educação Física']),
      6: { attends: false, welcome: false, classes: [] },
    },
  },
];
