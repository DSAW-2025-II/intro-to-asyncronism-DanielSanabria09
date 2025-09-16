// Elementos del HTML
const btn = document.getElementById("btn");
const input = document.getElementById("pokemonInput");
const output = document.getElementById("output");
const loader = document.getElementById("loader");

// Variables de estado
let currentType = "all"; 
let offset = 0;
let isLoading = false;
let filteredPokemonList = []; 
let filterOffset = 0; 

// Modal
const modal = document.getElementById("pokemonModal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");

// Cerrar modal
closeModal.addEventListener("click", () => {
  modal.classList.remove("active");
});
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("active");
  }
});

// Permitir Enter además del clic
input.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    btn.click();
  }
});

// Cargar Pokemons
async function loadPokemons() {
  if (isLoading) return;
  isLoading = true;

  loader.style.display = "block"; // mostrar simbolo de cargando

  try {
    const res = await fetch(`${CONFIG.BASE_URL}/pokemon?limit=${CONFIG.LIMIT}&offset=${offset}`);
    const data = await res.json();

    for (let pokemon of data.results) {
      const resPoke = await fetch(pokemon.url);
      const pokeData = await resPoke.json();  
      renderCard(pokeData);
    }

    offset += CONFIG.LIMIT;
  } catch (err) {
    console.error(err);
    output.innerHTML += "<p style='color:red;'>Error al cargar Pokémon</p>";
  } finally {
    loader.style.display = "none"; // ocultar simbolo de cargando
    isLoading = false;
  }
}

// Renderizar tarjeta en el menú principal
function renderCard(data) {
  const name = data.name.charAt(0).toUpperCase() + data.name.slice(1);
  const number = data.id;

  const card = document.createElement("div");
  card.classList.add("pokemon-card");

  // Detectar tipo principal
  const mainType = data.types[0].type.name;
  card.classList.add(mainType);

  const img = document.createElement("img");
  img.src = data.sprites.front_default;
  img.alt = name;

  const title = document.createElement("h2");
  title.textContent = `#${number} ${name}`;

  // Badge con tipos
  const typeContainer = document.createElement("div");
  typeContainer.classList.add("types");
  data.types.forEach(t => {
    const typeSpan = document.createElement("span");
    typeSpan.textContent = t.type.name.toUpperCase();
    typeSpan.classList.add("type-badge", t.type.name);
    typeContainer.appendChild(typeSpan);
  });

  card.appendChild(title);
  card.appendChild(img);
  card.appendChild(typeContainer);

  // Abrir modal al hacer clic
  card.addEventListener("click", () => showPokemonModal(data));

  output.appendChild(card);
}

// Botones de tipos
const typeButtons = document.querySelectorAll(".type-btn");

typeButtons.forEach(button => {
  button.addEventListener("click", async () => {
    typeButtons.forEach(b => b.classList.remove("active-type"));
    button.classList.add("active-type");

    const type = button.getAttribute("data-type");
    currentType = type;
    output.innerHTML = ""; 

    if (type === "all") {
      offset = 0;
      filteredPokemonList = [];
      loadPokemons();
      return;
    }

    try {
      const res = await fetch(`${CONFIG.BASE_URL}/type/${type}`);
      const data = await res.json();

      filteredPokemonList = data.pokemon.map(p => p.pokemon);
      filterOffset = 0;

      loadFilteredPokemons();
    } catch (err) {
      console.error(err);
      output.innerHTML = `<p style="color:red;">Error cargando Pokémon de tipo ${type}</p>`;
    }
  });
});

// Función para cargar los Pokemones por filtro
async function loadFilteredPokemons() {
  if (filterOffset >= filteredPokemonList.length) return;

  const nextBatch = filteredPokemonList.slice(filterOffset, filterOffset + CONFIG.FILTER_LIMIT);
  filterOffset += CONFIG.FILTER_LIMIT;

  for (let poke of nextBatch) {
    const pokeRes = await fetch(poke.url);
    const pokeData = await pokeRes.json();
    renderCard(pokeData);
  }
}

// Mostrar el modal con tabs
function showPokemonModal(pokemonData) {
  modal.classList.add("active");

  const mainType = pokemonData.types[0].type.name;

  const modalContent = modal.querySelector(".modal-content");
  modalContent.className = "modal-content"; 
  modalContent.classList.add(mainType);

  modalBody.innerHTML = `
    <h2>#${pokemonData.id} ${pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1)}</h2>
    <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}">

    <div class="tabs">
      <button class="tab-btn active" data-tab="about">About</button>
      <button class="tab-btn" data-tab="stats">Stats</button>
      <button class="tab-btn" data-tab="evolutions">Evolutions</button>
    </div>

    <div id="tab-content"></div>
  `;

  const tabButtons = modalBody.querySelectorAll(".tab-btn");

  function switchTab(content) {
    const tabContent = modalBody.querySelector("#tab-content");
    const currentPanel = tabContent.querySelector(".tab-panel.active");

    const newPanel = document.createElement("div");
    newPanel.classList.add("tab-panel");
    newPanel.innerHTML = content;
    tabContent.appendChild(newPanel);

    void newPanel.offsetWidth;

    if (currentPanel) {
      currentPanel.classList.remove("active");
      currentPanel.classList.add("exit");
      setTimeout(() => currentPanel.remove(), 400);
    }

    newPanel.classList.add("active");
  }

  // Cargar Tab de Información
  function loadAbout() {
    switchTab(`
      <p><strong>Peso:</strong> ${pokemonData.weight/10} Kg</p>
      <p><strong>Altura:</strong> ${pokemonData.height/10} m</p>
      <p><strong>Tipos:</strong> ${pokemonData.types.map(t => t.type.name).join(", ")}</p>
    `);
  }

  // Cargar Tab de las Estadisticas
  function loadStats() {
    const colors = {
      hp: "#4caf50",
      attack: "#f44336",
      defense: "#ff9800",
      "special-attack": "#2196f3",
      "special-defense": "#9c27b0",
      speed: "#ffeb3b"
    };

    const statsHTML = pokemonData.stats.map(s => {
      const statName = s.stat.name.toUpperCase();
      const value = s.base_stat;
      const percent = Math.min(100, Math.round((value / 255) * 100));
      const color = colors[s.stat.name] || "#999";

      return `
        <div class="stat">
          <div class="stat-name">${statName}</div>
          <div class="stat-bar">
            <div class="stat-fill" style="width:${percent}%; background:${color}"></div>
          </div>
          <div class="stat-value">${value}</div>
        </div>
      `;
    }).join("");

    switchTab(statsHTML);
  }

  // Cargar Tab de las Evoluciones
  async function loadEvolutions() {
    try {
      const speciesRes = await fetch(`${CONFIG.BASE_URL}/pokemon-species/${pokemonData.id}`);
      const speciesData = await speciesRes.json();

      const evoRes = await fetch(speciesData.evolution_chain.url);
      const evoData = await evoRes.json();

      let chain = evoData.chain;
      const evoList = [];

      while (chain) {
        evoList.push(chain.species.name);
        chain = chain.evolves_to[0]; 
      }

      const evoContainer = document.createElement("div");
      evoContainer.classList.add("evo-chain");

      for (let i = 0; i < evoList.length; i++) {
        const pokeName = evoList[i];
        const pokeRes = await fetch(`${CONFIG.BASE_URL}/pokemon/${pokeName}`);
        const pokeData = await pokeRes.json();

        const evoDiv = document.createElement("div");
        evoDiv.classList.add("evo-item");
        evoDiv.innerHTML = `
          <img src="${pokeData.sprites.front_default}" alt="${pokeName}">
          <p>${pokeName.charAt(0).toUpperCase() + pokeName.slice(1)}</p>
        `;
        evoContainer.appendChild(evoDiv);

        if (i < evoList.length - 1) {
          const arrow = document.createElement("span");
          arrow.classList.add("evo-arrow");
          arrow.textContent = "→";
          evoContainer.appendChild(arrow);
        }
      }

      switchTab(evoContainer.outerHTML);
    } catch (err) {
      switchTab(`<p style="color:red;">Error cargando evoluciones</p>`);
    }
  }

  //Primero se cargar el tab de información, pero si se clicka otro tab este se muestra
  loadAbout(); 
  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      tabButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      const tab = button.getAttribute("data-tab");
      if (tab === "about") loadAbout();
      else if (tab === "stats") loadStats();
      else if (tab === "evolutions") loadEvolutions();
    });
  });
}

// Scroll infinito
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
    if (currentType === "all") {
      loadPokemons();
    } else {
      loadFilteredPokemons();
    }
  }
});

// Buscar Pokémon
btn.addEventListener("click", async () => {
  const pokemonName = input.value.toLowerCase();
  output.innerHTML = "";

  if (!pokemonName) {
    offset = 0;
    loadPokemons();
    return;
  }

  try {
    const res = await fetch(`${CONFIG.BASE_URL}/pokemon/${pokemonName}`);
    if (!res.ok) throw new Error("Pokémon no encontrado");
    const data = await res.json();

    renderCard(data);
  } catch (err) {
    output.innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
});

// Carga Inicial
loadPokemons();



