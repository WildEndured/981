// ============================================================
//  proportions.js · логика, UI и генератор пресетов пропорций
// ============================================================

const LS_KEY = 'bbox_prop_presets_v6'; // v6 из-за новой логики

function generateFemalePreset(headCount) {
  const N = headCount || 5;
  
  // 1. Шаг 1: Делим bbox на N равных частей (голов)
  const headPercent = 100 / N; // Размер 1 головы в процентах
  
  // 2. Шаг 2: Делим часть головы на 5 равных частей
  const fifthOfHead = headPercent / 5;
  
  // --- Вычисляем ключевые точки ---
  
  // Макушка всегда на 0%
  const crownPct = 0;
  
  // Верхняя часть черепа (3/5 головы)
  const headTopPct = fifthOfHead * 3;
  
  // Центр головы (линия глаз) — 2.5/5
  const eyesPct = fifthOfHead * 2.5;
  
  // Линия подбородка (4-я часть)
  const chinPct = fifthOfHead * 4;
  
  // Основание шеи (5-я часть) — это и есть конец 1-й головы
  const neckPct = fifthOfHead * 5; 
  
  // --- Туловище ---
  // По твоему описанию: Таз (лобок) находится на 3-й голове
  const pubicPct = headPercent * 3;
  
  // Плечи (Шаг 4: шарик плеча = 1/3 груди). Упрощённо ставим чуть ниже шеи.
  const shouldersPct = neckPct + (headPercent * 0.3);
  
  // Соски (Шаг 10: по центру груди)
  const nipplesPct = neckPct + (pubicPct - neckPct) * 0.4; // примерно 40% от торса
  
  // Талия (Шаг 5: средняя треть торса)
  const waistPct = neckPct + (pubicPct - neckPct) * 0.66;
  
  // --- Ноги ---
  // Колени (Шаг 7: посередине между лобком и стопами)
  const kneePct = pubicPct + (100 - pubicPct) * 0.5;
  
  // Лодыжки (чуть выше стоп)
  const anklePct = 100 - (fifthOfHead * 1.5);
  
  // Стопы (всегда 100%)
  const feetPct = 100;

  const lines = [
    // --- Голова и шея ---
    { id: 'crown', label: 'Макушка (0)', percent: crownPct, width: 1.0, enabled: true },
    { id: 'head-top', label: 'Верх черепа (3/5)', percent: headTopPct, width: 0.8, enabled: true },
    { id: 'eyes', label: 'Линия глаз', percent: eyesPct, width: 0.3, enabled: true },
    { id: 'chin', label: 'Подбородок (4/5)', percent: chinPct, width: 1.0, enabled: true },
    { id: 'neck', label: 'Шея (5/5)', percent: neckPct, width: 0.5, enabled: true },

    // --- Туловище ---
    { id: 'shoulders', label: 'Плечи', percent: shouldersPct, width: 0.9, enabled: true },
    { id: 'nipples', label: 'Соски', percent: nipplesPct, width: 0.4, enabled: true },
    { id: 'waist', label: 'Талия', percent: waistPct, width: 0.6, enabled: true },
    { id: 'pubic', label: 'Лобок (3 головы)', percent: pubicPct, width: 1.0, enabled: true },

    // --- Ноги ---
    { id: 'knees', label: 'Колени', percent: kneePct, width: 1.0, enabled: true },
    { id: 'ankles', label: 'Лодыжки', percent: anklePct, width: 0.6, enabled: true },
    { id: 'feet', label: 'Стопы (100)', percent: feetPct, width: 1.0, enabled: true }
  ];

  // Округляем проценты до сотых
  lines.forEach(l => l.percent = +l.percent.toFixed(2));

  return {
    id: 'female-' + N + '-' + Date.now(),
    name: `Фигура · ${N} голов`,
    lines: lines
  };
}

const DEFAULT_PRESETS = [
  generateFemalePreset(5),
  generateFemalePreset(7.5)
];

// ... (Остальной код файла без изменений: loadPropPresets, renderPropLinesList и т.д.)
