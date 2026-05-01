document.addEventListener("DOMContentLoaded", () => {
  for (const [key, pokedex] of Object.entries(pokedexes)) {
    let regionBreaks = getRegionBreaks(key);
    insertRegionTitles(pokedex, regionBreaks);
    pokedex.regionBreaks = regionBreaks;
  }

  loadCaughtStatus();
  loadTCGSets();
  loadCardSets();
  applyDarkMode();

  const lastViewKey = localStorage.getItem("lastViewKey");
  const lastViewFilter = localStorage.getItem("lastViewFilter") || "all";

  if (lastViewKey && (pokedexes[lastViewKey] || medals[lastViewKey])) {
    renderCollection(lastViewKey, lastViewFilter);
  } else {
    goHome();
  }
});

function getRegionBreaks(key) {
  const breakMap = {
    dynamax: REGION_BREAKS_DYNAMAX,
    gigantamax: REGION_BREAKS_GIGANTAMAX,
    mega: REGION_BREAKS_MEGA,
    shinygigantamax: REGION_BREAKS_SHINYGIGANTAMAX,
    lucky: REGION_BREAKS_LUCKY,
    shinydynamax: REGION_BREAKS_SHINYDYNAMAX,
    shadow: REGION_BREAKS_SHADOW,
    purified: REGION_BREAKS_PURIFIED,
    shiny: REGION_BREAKS_SHINY,
    perfectshiny: REGION_BREAKS_PERFECTSHINY,
    shadowshiny: REGION_BREAKS_SHADOWSHINY,
    purifiedshiny: REGION_BREAKS_PURIFIEDSHINY,
    perfectshadow: REGION_BREAKS_PERFECTSHADOW,
    perfectpurified: REGION_BREAKS_PERFECTPURIFIED
  };
  return breakMap[key] || REGION_BREAKS_STANDARD;
}

function insertRegionTitles(pokedex, regionBreaks) {
  const clonedData = [...pokedex.data];
  regionBreaks
    .filter(({ index }) => index <= clonedData.length)
    .slice()
    .reverse()
    .forEach(({ name, index }) => {
      clonedData.splice(index, 0, {
        name: `${name} Region`,
        number: "",
        img: "",
        isRegionTitle: true,
      });
    });
  pokedex.data = clonedData;
}

const currentFilter = {};
const currentSearch = {};
const selectedRegion = {};

function goHome() {
  localStorage.removeItem("lastViewKey");
  localStorage.removeItem("lastViewFilter");

  const app = document.getElementById("app");

  app.innerHTML = `
    <nav class="navbar">
      <a class="navbar-logo">
        <div class="logo-container">
          <i class="fas fa-database logo-icon"></i>
          <span class="logo-text">PokeChase</span>
        </div>
      </a>
      <div class="navbar-links">
        <i class="fas fa-cog settings-icon" onclick="toggleModal()"></i>
      </div>
    </nav>
    
    <div id="pogo" class="section">
      <div class="hero-section">
        <h1 class="main-title">Pokemon Go Collections</h1>
        <p class="hero-subtitle">Track your Pokemon journey across all regions and forms</p>
      </div>

      <div class="collections">
        ${Object.entries(pokedexes).map(([key, dex]) => `
          <div class="collection-card" onclick="renderCollection('${key}')">
            <div class="card-glow"></div>
            <div class="card-icon">📘</div>
            <div class="card-content">
              <h2>${dex.title}</h2>
              <p>${getCaughtCount(dex.data)} / ${dex.total} (${getPercentage(dex.data)}%)</p>
            </div>
          </div>
        `).join('')}
        
        ${Object.entries(medals).map(([key, dex]) => `
          <div class="collection-card" onclick="renderCollection('${key}')">
            <div class="card-glow"></div>
            <div class="card-icon">🏅</div>
            <div class="card-content">
              <h2>${dex.title}</h2>
              <p>${getCaughtCount(dex.data)} / ${dex.total} (${getPercentage(dex.data)}%)</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="copyright-container">
      <h5>© 2025 PokeChase. This website has been made by Cooper.</h5>
    </div>

    <div id="modal" class="modal hidden">
      <div class="modal-content">
        <span class="close-button" onclick="toggleModal()">×</span>
        <h2>Settings</h2>

        <div class="switch-container">
          <label class="switch">
            <input type="checkbox" class="dark-mode-toggle" onchange="toggleDarkMode()">
            <span class="slider"></span>
          </label>
          <span>Dark Mode</span>
        </div>

        <div class="social-button-container">
          <a href="https://discord.gg/h3uBBhu8Cr" target="_blank" class="social-button discord">
            <i class="fab fa-discord"></i>
          </a>
          <a href="https://median.co/share/bnkokxp#apk" target="_blank" class="social-button android">
            <i class="fab fa-android"></i>
          </a>
        </div>
                            <div class="counter-container">
        <h5 class="countertext">Your Visitor Counter:</h5>
        <div id="visitor-count">0</div>
    </div>
      </div>
    </div>
  `;

  let count = localStorage.getItem('visitorCount');
if (!count) count = 0;
count = Number(count) + 1;
localStorage.setItem('visitorCount', count);

// Update the visitor count element text
const visitorCountEl = document.getElementById('visitor-count');
if (visitorCountEl) {
  visitorCountEl.textContent = count;
}

  applyDarkMode();
}

function renderCollection(key, filter = "all", type = "pogo") {
  let collection;
  if (type === "tcg") {
    collection = tcgSets[key];
  } else if (type === "cards") {
    collection = cardSets[key];
  } else {
    collection = pokedexes[key] || medals[key];
  }

  if (!collection) return;

  localStorage.setItem("lastViewKey", key);
  localStorage.setItem("lastViewFilter", filter);

  const app = document.getElementById("app");
  currentFilter[key] = filter;
  const searchTerm = currentSearch[key]?.toLowerCase() || "";

  const filteredList = collection.data.filter(item => {
    if (item.isRegionTitle) return true;
    const matchesFilter = 
      filter === "have" ? item.caught :
      filter === "need" ? !item.caught :
      filter === "favorite" ? item.favorite :
      true;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                         (item.number && item.number.includes(searchTerm));
    return matchesFilter && matchesSearch;
  });

  app.innerHTML = `
    <nav class="navbar">
      <a href="#" class="navbar-logo">
        <div class="logo-container">
          <i class="fas fa-database logo-icon"></i>
          <span class="logo-text">PokeChase</span>
        </div>
      </a>
      <div class="navbar-links">
        <button class="back-button" onclick="goHome()">
          <i class="fas fa-arrow-left"></i>
          <span>Back</span>
        </button>
        <i class="fas fa-cog settings-icon" onclick="toggleModal()"></i>
      </div>
    </nav>
    
    <div class="hero-section">
      <h1 class="main-title">${collection.title}</h1>
      <h2 class="collection-counter">(${getCaughtCount(collection.data)} / ${collection.total})</h2>
    </div>
    
    <div class="filter-bar">
      <button class="${filter === 'all' ? 'active' : ''}" onclick="renderCollection('${key}', 'all', '${type}')">All</button>
      <button class="${filter === 'have' ? 'active' : ''}" onclick="renderCollection('${key}', 'have', '${type}')">Have</button>
      <button class="${filter === 'need' ? 'active' : ''}" onclick="renderCollection('${key}', 'need', '${type}')">Need</button>
      <button class="${filter === 'favorite' ? 'active' : ''}" onclick="renderCollection('${key}', 'favorite', '${type}')">Favorite</button>
    </div>
    
    <div class="search-bar">
      <div class="search-container">
        <i class="fas fa-search search-icon"></i>
        <input id="search-${key}" type="text" placeholder="Search ${type === 'pogo' ? 'Pokemon' : 'cards'}..." />
      </div>
    </div>
    
    <div class="collection-grid">
      ${filteredList.map((item, i) => {
        if (item.isRegionTitle) {
          return `<div class="region-title">${item.name}</div>`;
        }
        const identifier = medals[key] ? item.id : item.number;
        const toggleFunction = type === 'tcg' ? 'toggleTCGCard' : 
                              type === 'cards' ? 'toggleCard' : 'toggleCaught';
        const favoriteFunction = type === 'tcg' ? 'toggleTCGFavorite' : 
                                type === 'cards' ? 'toggleCardFavorite' : 'toggleFavorite';
        
        return `
          <div class="item-card ${item.caught ? 'caught' : ''}" onclick="${toggleFunction}('${key}', '${type === 'tcg' || type === 'cards' ? i : identifier}', this)">
            <img src="${item.img}" alt="${item.name}" loading="lazy" />
            <div class="item-name">${item.name}</div>
            <div class="item-number">${item.number || ''}</div>
            ${item.caught ? '<div class="checkmark"><i class="fas fa-check"></i></div>' : ''}
            <div class="favorite-icon" onclick="event.stopPropagation(); ${favoriteFunction}('${key}', '${type === 'tcg' || type === 'cards' ? i : identifier}', this)">
              <i class="${item.favorite ? 'fas fa-star' : 'far fa-star'}"></i>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <div class="copyright-container">
      <h5>© 2025 PokeChase. Made by Cooper.</h5>
    </div>

    <div id="modal" class="modal hidden">
      <div class="modal-content">
        <span class="close-button" onclick="toggleModal()">×</span>
        <h2>Settings</h2>
        <button class="download-button" onclick="downloadPDF('${key}')">
          <i class="fas fa-download"></i>
          Download PDF
        </button>
      </div>
    </div>
  `;

  setupSearch(key, type);
}

function setupSearch(key, type) {
  const searchInput = document.getElementById(`search-${key}`);
  if (!searchInput) return;

  searchInput.value = currentSearch[key] || "";

  searchInput.addEventListener("input", (e) => {
    currentSearch[key] = e.target.value;
    updateFilteredItems(key, type);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  });
}

function updateFilteredItems(key, type = "pogo") {
  let collection;
  if (type === "tcg") {
    collection = tcgSets[key];
  } else if (type === "cards") {
    collection = cardSets[key];
  } else {
    collection = pokedexes[key] || medals[key];
  }

  const searchTerm = (currentSearch[key] || "").toLowerCase();
  const filter = currentFilter[key] || "all";

  const filteredList = collection.data.filter(item => {
    if (item.isRegionTitle) return true;
    const matchesFilter =
      filter === "have" ? item.caught :
      filter === "need" ? !item.caught :
      filter === "favorite" ? item.favorite :
      true;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
                          (item.number && item.number.includes(searchTerm));
    return matchesFilter && matchesSearch;
  });

  const grid = document.querySelector(".collection-grid");
  if (!grid) return;

  grid.innerHTML = filteredList.map((item, i) => {
    if (item.isRegionTitle) {
      return `<div class="region-title">${item.name}</div>`;
    }

    const identifier = medals[key] ? item.id : item.number;
    const toggleFunction = type === 'tcg' ? 'toggleTCGCard' : 
                          type === 'cards' ? 'toggleCard' : 'toggleCaught';
    const favoriteFunction = type === 'tcg' ? 'toggleTCGFavorite' : 
                            type === 'cards' ? 'toggleCardFavorite' : 'toggleFavorite';

    return `
      <div class="item-card ${item.caught ? 'caught' : ''}" onclick="${toggleFunction}('${key}', '${type === 'tcg' || type === 'cards' ? i : identifier}', this)">
        <img src="${item.img}" alt="${item.name}" loading="lazy" />
        <div class="item-name">${item.name}</div>
        <div class="item-number">${item.number || ''}</div>
        ${item.caught ? '<div class="checkmark"><i class="fas fa-check"></i></div>' : ''}
        <div class="favorite-icon" onclick="event.stopPropagation(); ${favoriteFunction}('${key}', '${type === 'tcg' || type === 'cards' ? i : identifier}', this)">
          <i class="${item.favorite ? 'fas fa-star' : 'far fa-star'}"></i>
        </div>
      </div>
    `;
  }).join('');
}

function toggleModal() {
  const modal = document.getElementById('modal');
  if (modal) modal.classList.toggle('hidden');
}

function toggleCaught(key, id, cardElement) {
  const dex = pokedexes[key] || medals[key];
  const pokemon = dex.data.find(p => (medals[key] ? p.id === id : p.number === id) && !p.isRegionTitle);
  if (!pokemon) return;

  pokemon.caught = !pokemon.caught;
  saveCaughtStatus();
  updateCardAppearance(cardElement, pokemon);
  updateCounter(dex);
}

function toggleFavorite(key, id, iconElement) {
  const dex = pokedexes[key] || medals[key];
  const pokemon = dex.data.find(p => (medals[key] ? p.id === id : p.number === id) && !p.isRegionTitle);
  if (!pokemon) return;

  pokemon.favorite = !pokemon.favorite;
  iconElement.innerHTML = `<i class="${pokemon.favorite ? 'fas fa-star' : 'far fa-star'}"></i>`;
  saveCaughtStatus();
}

function toggleTCGCard(key, index, el) {
  const card = tcgSets[key].data[index];
  card.caught = !card.caught;

  // Update the card's appearance without re-rendering the whole grid
  el.classList.toggle("caught");
  const checkmark = el.querySelector(".checkmark");

  if (card.caught) {
    if (!checkmark) {
      const checkDiv = document.createElement("div");
      checkDiv.className = "checkmark";
      checkDiv.innerHTML = '<i class="fas fa-check"></i>';
      el.appendChild(checkDiv);
    }
  } else {
    if (checkmark) checkmark.remove();
  }

  // Save the updated TCG sets to localStorage
  localStorage.setItem("tcgSets", JSON.stringify(tcgSets));
}

function toggleTCGFavorite(setKey, cardIndex, iconElement) {
  const card = tcgSets[setKey].data[cardIndex];
  card.favorite = !card.favorite;
  iconElement.innerHTML = `<i class="${card.favorite ? 'fas fa-star' : 'far fa-star'}"></i>`;
  localStorage.setItem("tcgSets", JSON.stringify(tcgSets));
}

function toggleCard(setKey, index, el) {
  const card = cardSets[setKey].data[index];
  card.caught = !card.caught;

  // Update the card's appearance without re-rendering the whole grid
  el.classList.toggle("caught");
  const checkmark = el.querySelector(".checkmark");

  if (card.caught) {
    if (!checkmark) {
      const checkDiv = document.createElement("div");
      checkDiv.className = "checkmark";
      checkDiv.innerHTML = '<i class="fas fa-check"></i>';
      el.appendChild(checkDiv);
    }
  } else {
    if (checkmark) checkmark.remove();
  }

  // Save the updated card sets to localStorage
  localStorage.setItem("cardSets", JSON.stringify(cardSets));
}

function toggleCardFavorite(setKey, index, iconElement) {
  const card = cardSets[setKey].data[index];
  card.favorite = !card.favorite;
  iconElement.innerHTML = `<i class="${card.favorite ? 'fas fa-star' : 'far fa-star'}"></i>`;
  localStorage.setItem("cardSets", JSON.stringify(cardSets));
}

function updateCardAppearance(cardElement, pokemon) {
  cardElement.classList.toggle('caught', pokemon.caught);
  const checkmark = cardElement.querySelector(".checkmark");
  if (pokemon.caught && !checkmark) {
    cardElement.insertAdjacentHTML('beforeend', '<div class="checkmark"><i class="fas fa-check"></i></div>');
  } else if (!pokemon.caught && checkmark) {
    checkmark.remove();
  }
}

function updateCounter(collection) {
  const counter = document.querySelector(".collection-counter");
  if (counter) {
    counter.textContent = `(${getCaughtCount(collection.data)} / ${collection.total})`;
  }
}

function toggleDarkMode() {
  const currentState = localStorage.getItem("darkMode") === "enabled";
  const newState = !currentState;
  
  document.body.classList.toggle("dark-mode", newState);
  localStorage.setItem("darkMode", newState ? "enabled" : "disabled");
  
  const toggles = document.querySelectorAll(".dark-mode-toggle");
  toggles.forEach(t => t.checked = newState);
}

function applyDarkMode() {
  const isDarkMode = localStorage.getItem("darkMode") === "enabled";
  document.body.classList.toggle("dark-mode", isDarkMode);
  
  const toggles = document.querySelectorAll(".dark-mode-toggle");
  toggles.forEach(toggle => toggle.checked = isDarkMode);
}

function getCaughtCount(pokemonList) {
  return pokemonList.filter(p => p.caught && !p.isRegionTitle).length;
}

function getPercentage(pokemonList) {
  const total = pokemonList.filter(p => !p.isRegionTitle).length;
  const caught = getCaughtCount(pokemonList);
  return total > 0 ? ((caught / total) * 100).toFixed(1) : "0.0";
}

function saveCaughtStatus() {
  const status = {};

  for (const [dexKey, dex] of Object.entries(pokedexes)) {
    status[dexKey] = {};
    dex.data.forEach(p => {
      if (!p.isRegionTitle) {
        status[dexKey][p.number] = {
          caught: !!p.caught,
          favorite: !!p.favorite
        };
      }
    });
  }

  for (const [medalKey, dex] of Object.entries(medals)) {
    status[medalKey] = {};
    dex.data.forEach((p, i) => {
      if (!p.isRegionTitle) {
        const uniqueKey = `${medalKey}_${i}`;
        status[medalKey][uniqueKey] = {
          caught: !!p.caught,
          favorite: !!p.favorite
        };
      }
    });
  }

  localStorage.setItem("pokemonCaughtStatus", JSON.stringify(status));
}

function loadCaughtStatus() {
  const saved = localStorage.getItem("pokemonCaughtStatus");
  if (!saved) return;

  const status = JSON.parse(saved);

  for (const [dexKey, savedMap] of Object.entries(status)) {
    const dex = pokedexes[dexKey] || medals[dexKey];
    if (!dex) continue;

    dex.data.forEach((p, i) => {
      if (!p.isRegionTitle) {
        if (medals[dexKey]) {
          const uniqueKey = `${dexKey}_${i}`;
          const savedObj = savedMap[uniqueKey];
          if (savedObj) {
            p.caught = savedObj.caught ?? false;
            p.favorite = savedObj.favorite ?? false;
          }
        } else {
          const savedObj = savedMap[p.number];
          if (savedObj) {
            p.caught = savedObj.caught ?? false;
            p.favorite = savedObj.favorite ?? false;
          }
        }
      }
    });
  }
}

function loadTCGSets() {
  const saved = localStorage.getItem("tcgSets");
  if (saved) {
    const parsed = JSON.parse(saved);
    for (const key in parsed) {
      if (tcgSets[key]) {
        const savedData = parsed[key].data;
        const currentData = tcgSets[key].data;
        for (let i = 0; i < currentData.length; i++) {
          if (savedData[i]) {
            currentData[i].caught = savedData[i].caught ?? false;
            currentData[i].favorite = savedData[i].favorite ?? false;
          }
        }
      }
    }
  }
}

function loadCardSets() {
  const saved = localStorage.getItem("cardSets");
  if (saved) {
    const parsed = JSON.parse(saved);
    for (const key in parsed) {
      if (cardSets[key]) {
        const savedData = parsed[key].data;
        const currentData = cardSets[key].data;
        for (let i = 0; i < currentData.length; i++) {
          if (savedData[i]) {
            currentData[i].caught = savedData[i].caught ?? false;
            currentData[i].favorite = savedData[i].favorite ?? false;
          }
        }
      }
    }
  }
}

function downloadPDF(key) {
  const collection = pokedexes[key] || medals[key] || tcgSets[key] || cardSets[key];
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();
  let y = 10;

  doc.setFontSize(16);
  doc.text(`${collection.title} Collection`, 10, y);
  y += 10;

  collection.data.forEach(p => {
    if (p.isRegionTitle) {
      doc.setFontSize(14);
      doc.text(p.name, 10, y);
      y += 8;
    } else {
      let line = `#${p.number} ${p.name}`;
      const tags = [];
      if (p.caught) tags.push("[Caught]");
      if (p.favorite) tags.push("[Favorite]");
      if (tags.length) line += ` ${tags.join(" ")}`;

      doc.setFontSize(12);
      doc.text(line, 10, y);
      y += 6;
    }

    if (y > 280) {
      doc.addPage();
      y = 10;
    }
  });

  doc.save(`${collection.title}.pdf`);
}

const REGION_BREAKS_STANDARD = [
  { name: "Kanto", index: 0 },
  { name: "Johto", index: 151 },
  { name: "Hoenn", index: 251 },
  { name: "Sinnoh", index: 386 },
  { name: "Unova", index: 490 },
  { name: "Kalos", index: 646 },
  { name: "Alola", index: 715 },
  { name: "Galar", index: 795 },
  { name: "Hisui", index: 848 },
  { name: "Paldea", index: 855 },
  { name: "Unidentified", index: 905 },
];

const REGION_BREAKS_SHINY = [
  { name: "Kanto", index: 0 },
  { name: "Johto", index: 151 },
  { name: "Hoenn", index: 251 },
  { name: "Sinnoh", index: 386 },
  { name: "Unova", index: 490 },
  { name: "Kalos", index: 644 },
  { name: "Alola", index: 707 },
  { name: "Galar", index: 771 },
  { name: "Hisui", index: 788 },
  { name: "Paldea", index: 794 },
  { name: "Unidentified", index: 822 },
];

const REGION_BREAKS_PERFECTSHINY = [
  { name: "Kanto", index: 0 },
  { name: "Johto", index: 151 },
  { name: "Hoenn", index: 251 },
  { name: "Sinnoh", index: 386 },
  { name: "Unova", index: 490 },
  { name: "Kalos", index: 644 },
  { name: "Alola", index: 707 },
  { name: "Galar", index: 771 },
  { name: "Hisui", index: 788 },
  { name: "Paldea", index: 793 },
  { name: "Unidentified", index: 821 },
];

const REGION_BREAKS_SHADOWSHINY = [
  { name: "Kanto", index: 0 },
  { name: "Johto", index: 66 },
  { name: "Hoenn", index: 87 },
  { name: "Sinnoh", index: 116 },
  { name: "Galar", index: 128 },
  { name: "Hisui", index: 129 },
];

const REGION_BREAKS_PURIFIEDSHINY = [
  { name: "Kanto", index: 0 },
  { name: "Johto", index: 66 },
  { name: "Hoenn", index: 87 },
  { name: "Sinnoh", index: 116 },
  { name: "Galar", index: 128 },
  { name: "Hisui", index: 129 },
];

const REGION_BREAKS_LUCKY = [
  { name: "Kanto", index: 0 },
  { name: "Johto", index: 150 },
  { name: "Hoenn", index: 249 },
  { name: "Sinnoh", index: 382 },
  { name: "Unova", index: 484 },
  { name: "Kalos", index: 636 },
  { name: "Alola", index: 701 },
  { name: "Galar", index: 778 },
  { name: "Hisui", index: 830 },
  { name: "Paldea", index: 836 },
  { name: "Unidentified", index: 886 },
];

const REGION_BREAKS_SHADOW = [
  { name: "Kanto", index: 0 },
  { name: "Johto", index: 114 },
  { name: "Hoenn", index: 176 },
  { name: "Sinnoh", index: 257 },
  { name: "Unova", index: 316 },
  { name: "Kalos", index: 380 },
  { name: "Galar", index: 388 },
  { name: "Hisui", index: 389 },
  { name: "Paldea", index: 391 },
];

const REGION_BREAKS_PERFECTSHADOW = [
  { name: "Kanto", index: 0 },
  { name: "Johto", index: 114 },
  { name: "Hoenn", index: 176 },
  { name: "Sinnoh", index: 257 },
  { name: "Unova", index: 316 },
  { name: "Kalos", index: 380 },
  { name: "Galar", index: 388 },
  { name: "Hisui", index: 389 },
  { name: "Paldea", index: 391 },
];

const REGION_BREAKS_PERFECTPURIFIED = [
  { name: "Kanto", index: 0 },
  { name: "Johto", index: 114 },
  { name: "Hoenn", index: 176 },
  { name: "Sinnoh", index: 257 },
  { name: "Unova", index: 316 },
  { name: "Kalos", index: 380 },
  { name: "Galar", index: 388 },
  { name: "Hisui", index: 389 },
  { name: "Paldea", index: 391 },
];

const REGION_BREAKS_PURIFIED = [
  { name: "Kanto", index: 0 },
  { name: "Johto", index: 114 },
  { name: "Hoenn", index: 176 },
  { name: "Sinnoh", index: 257 },
  { name: "Unova", index: 316 },
  { name: "Kalos", index: 380 },
  { name: "Galar", index: 388 },
  { name: "Hisui", index: 389 },
  { name: "Paldea", index: 391 },
];

const REGION_BREAKS_DYNAMAX = [
  { name: "Kanto", index: 0 },
  { name: "Johto", index: 24 },
  { name: "Hoenn", index: 29 },
  { name: "Unova", index: 33 },
  { name: "Alola", index: 41 },
  { name: "Galar", index: 42 },
];

const REGION_BREAKS_SHINYDYNAMAX = [...REGION_BREAKS_DYNAMAX];

const REGION_BREAKS_GIGANTAMAX = [
  { name: "Kanto", index: 0 },
  { name: "Galar", index: 8 },
];

const REGION_BREAKS_SHINYGIGANTAMAX = [...REGION_BREAKS_GIGANTAMAX];

const REGION_BREAKS_MEGA = [
  { name: "Kanto", index: 0 },
  { name: "Johto", index: 13 },
  { name: "Hoenn", index: 19 },
  { name: "Sinnoh", index: 38 },
  { name: "Unova", index: 43 },
  { name: "Kalos", index: 44 },
];