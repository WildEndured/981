// База данных перспективных направлений
const perspectives = [
  { name: "Искусственный интеллект", category: "tech", rating: 9.5, growth: 92, desc: "Разработка и внедрение AI-решений в бизнес и повседневную жизнь." },
  { name: "Возобновляемая энергетика", category: "tech", rating: 9.0, growth: 88, desc: "Солнечные, ветровые и водородные технологии — глобальный тренд." },
  { name: "Кибербезопасность", category: "tech", rating: 9.2, growth: 85, desc: "Защита данных и инфраструктуры в эпоху цифровизации." },
  { name: "Финтех", category: "finance", rating: 8.8, growth: 80, desc: "Цифровые банки, блокчейн, платёжные системы нового поколения." },
  { name: "Зелёные инвестиции", category: "finance", rating: 8.5, growth: 78, desc: "ESG-инвестиции и углеродные рынки." },
  { name: "Разработка ПО", category: "career", rating: 8.9, growth: 83, desc: "Fullstack, mobile, DevOps — стабильный спрос на разработчиков." },
  { name: "Data Science", category: "career", rating: 9.1, growth: 90, desc: "Анализ данных, ML-инженерия, продуктовые аналитики." },
  { name: "Биотехнологии", category: "tech", rating: 8.7, growth: 82, desc: "Генная инженерия, персонализированная медицина, фарма." },
  { name: "Электронная коммерция", category: "business", rating: 8.4, growth: 76, desc: "Маркетплейсы, D2C-бренды, логистика и автоматизация продаж." },
  { name: "Образовательные технологии", category: "business", rating: 8.2, growth: 72, desc: "EdTech, онлайн-курсы, микрообучение." },
  { name: "Космическая индустрия", category: "tech", rating: 8.6, growth: 75, desc: "Частные запуски, спутниковые системы, космический туризм." },
  { name: "Виртуальная и доп. реальность", category: "tech", rating: 8.3, growth: 74, desc: "AR/VR в образовании, играх, промышленности." },
];

// DOM-элементы
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortFilter = document.getElementById("sortFilter");
const resultsEl = document.getElementById("results");
const countEl = document.getElementById("count");
const avgEl = document.getElementById("avgRating");

const categoryNames = {
  tech: "Технологии",
  finance: "Финансы",
  career: "Карьера",
  business: "Бизнес",
};

// Рендер
function render() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const sort = sortFilter.value;

  let filtered = perspectives.filter(p => {
    const matchQuery = p.name.toLowerCase().includes(query) ||
                       p.desc.toLowerCase().includes(query);
    const matchCat = category === "all" || p.category === category;
    return matchQuery && matchCat;
  });

  filtered.sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "growth") return b.growth - a.growth;
    return a.name.localeCompare(b.name, "ru");
  });

  // Статистика
  countEl.textContent = filtered.length;
  avgEl.textContent = filtered.length
    ? (filtered.reduce((s, p) => s + p.rating, 0) / filtered.length).toFixed(1)
    : "0";

  // Рендер карточек
  if (filtered.length === 0) {
    resultsEl.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#888;">
      Ничего не найдено. Попробуйте другой запрос.
    </p>`;
    return;
  }

  resultsEl.innerHTML = filtered.map(p => `
    <div class="card">
      <span class="category">${categoryNames[p.category]}</span>
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="metrics">
        <span>Рейтинг: <span class="rating">⭐ ${p.rating}</span></span>
        <span>Рост: <span class="growth">📈 ${p.growth}%</span></span>
      </div>
    </div>
  `).join("");
}

// Слушатели
searchInput.addEventListener("input", render);
categoryFilter.addEventListener("change", render);
sortFilter.addEventListener("change", render);

// Первый рендер
render();
