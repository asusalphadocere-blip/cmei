export interface Note {
  id: string;
  sec: SectionId;
  text: string;
  ts: number;
  votes: number;
}

export type SectionCategory = 'diagnostico' | 'ideacion' | 'seguimiento';

export type SectionId =
  | 'sec1'
  | 'sec2'
  | 'sec3'
  | 'sec4'
  | 'idea'
  | 'prueba'
  | 'aprender'
  | 'paso'
  | 'quien'
  | 'pregunta';

export interface SectionMeta {
  id: SectionId;
  number?: string;
  title: string;
  question: string;
  subtitle: string;
  category: SectionCategory;
  isVotable: boolean; // Columns 1-4 are votable
  colorTheme: 'yellow' | 'pink' | 'purple' | 'cyan';
  icon: string;
}

export const SECTIONS: SectionMeta[] = [
  // Fila 1: 4 Columnas Diagnóstico
  {
    id: 'sec1',
    number: '1',
    title: 'Intereses',
    question: '¿Qué nos importa?',
    subtitle: 'Nuestras motivaciones, áreas de interés y lo que nos mueve en la facultad',
    category: 'diagnostico',
    isVotable: true,
    colorTheme: 'yellow',
    icon: 'Sparkles',
  },
  {
    id: 'sec2',
    number: '2',
    title: 'Habilidades',
    question: '¿Qué sabemos hacer y qué queremos aprender?',
    subtitle: 'Fortalezas técnicas, habilidades blandas, liderazgo y lo que buscamos potenciar',
    category: 'diagnostico',
    isVotable: true,
    colorTheme: 'pink',
    icon: 'Cpu',
  },
  {
    id: 'sec3',
    number: '3',
    title: 'Recursos y apoyos',
    question: '¿Con qué contamos o qué necesitamos?',
    subtitle: 'Redes de apoyo, espacios, laboratorios, mentorías o iniciativas de soporte',
    category: 'diagnostico',
    isVotable: true,
    colorTheme: 'purple',
    icon: 'HeartHandshake',
  },
  {
    id: 'sec4',
    number: '4',
    title: 'Barreras',
    question: '¿Qué nos dificulta avanzar?',
    subtitle: 'Obstáculos, brechas, sesgos o retos cotidianos en la carrera o el entorno',
    category: 'diagnostico',
    isVotable: true,
    colorTheme: 'pink',
    icon: 'ShieldAlert',
  },
  // Probar algo pequeño (3 columnas)
  {
    id: 'idea',
    number: 'A',
    title: 'Idea',
    question: '¿Para quién?',
    subtitle: '¿A quién beneficia directamente esta propuesta o solución pequeña?',
    category: 'ideacion',
    isVotable: false,
    colorTheme: 'cyan',
    icon: 'Lightbulb',
  },
  {
    id: 'prueba',
    number: 'B',
    title: 'Prueba',
    question: '¿Qué podemos probar con lo que ya tenemos?',
    subtitle: 'Un experimento ágil y concreto, viable en el corto plazo',
    category: 'ideacion',
    isVotable: false,
    colorTheme: 'yellow',
    icon: 'FlaskConical',
  },
  {
    id: 'aprender',
    number: 'C',
    title: 'Aprender',
    question: '¿Cómo sabremos si ayudó?',
    subtitle: 'Indicador o señal que nos permitirá saber si funcionó o si ajustamos',
    category: 'ideacion',
    isVotable: false,
    colorTheme: 'purple',
    icon: 'TrendingUp',
  },
  // Seguir conectadas (3 cajas)
  {
    id: 'paso',
    number: 'I',
    title: 'Próximo paso voluntario',
    question: '¿Cuál es el siguiente paso concreto?',
    subtitle: 'Compromiso inmediato o acción para mantener el impulso',
    category: 'seguimiento',
    isVotable: false,
    colorTheme: 'pink',
    icon: 'Compass',
  },
  {
    id: 'quien',
    number: 'II',
    title: '¿Quién quiere aportar?',
    question: '¿Con qué rol o energía te gustaría sumarte?',
    subtitle: 'Facilitación, difusión, organización o apoyo puntual',
    category: 'seguimiento',
    isVotable: false,
    colorTheme: 'cyan',
    icon: 'Users',
  },
  {
    id: 'pregunta',
    number: 'III',
    title: 'Podemos corregir, preguntar o pasar',
    question: '¿Dudas abiertas, mejoras o comentarios?',
    subtitle: 'Espacio para preguntas sin respuesta, precisiones o reflexiones',
    category: 'seguimiento',
    isVotable: false,
    colorTheme: 'yellow',
    icon: 'MessageSquareShare',
  },
];

export const POSTIT_COLORS = [
  { bg: '#ffe48a', text: '#2d2200', border: '#e6c86e', name: 'amarillo' },
  { bg: '#ffc9d1', text: '#3c0a13', border: '#e8a9b3', name: 'rosado' },
  { bg: '#d9c8f5', text: '#210c44', border: '#bfa7e6', name: 'lila' },
];

export function getPostitColor(index: number) {
  return POSTIT_COLORS[Math.abs(index) % POSTIT_COLORS.length];
}
