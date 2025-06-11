  /****************************************************
     * Anime Explorer – Final One-Page Application
     * Using Jikan API (free, up to ~400 results)
     * Layout: 4 cards per row, 20 results per page
     * Sorting, search and full-screen detail modal ("Leggi di più")
     * Author: Bocaletto Luca
     ****************************************************/
    document.addEventListener("DOMContentLoaded", function() {
      // Global Variables
      let animeData = [];
      let currentSortedData = [];
      let currentPage = 1;
      const pageSize = 20;
      let animeChart;
      
      // Setting current year in footer
      document.getElementById("currentYear").textContent = new Date().getFullYear();
      
      // Theme Toggle
      const themeToggle = document.getElementById("themeToggle");
      const themeText = document.getElementById("themeText");
      themeToggle.addEventListener("change", function() {
        if (this.checked) {
          document.body.classList.replace("day", "night");
          themeText.textContent = "Night";
        } else {
          document.body.classList.replace("night", "day");
          themeText.textContent = "Day";
        }
      });
      
      /* ===== API FUNCTIONS ===== */
      async function loadTopAnime() {
        try {
          let page = 1, results = [];
          // Itera fino a 16 pagine (16 x 25 = circa 400 risultati)
          while(page <= 16) {
            const response = await fetch("https://api.jikan.moe/v4/top/anime?page=" + page);
            if (!response.ok) {
              console.error("Errore nella pagina " + page + ": " + response.status);
              break;
            }
            const data = await response.json();
            if(data.data.length === 0) break;
            results = results.concat(data.data);
            page++;
          }
          animeData = results;
          sortByScore();
        } catch (error) {
          console.error(error);
          document.getElementById("animeContainer").innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        }
      }
      
      async function searchAnime(query) {
        try {
          const response = await fetch("https://api.jikan.moe/v4/anime?q=" + encodeURIComponent(query) + "&limit=25");
          if (!response.ok) throw new Error("Errore nella ricerca: " + response.status);
          const data = await response.json();
          animeData = data.data;
          sortByScore();
        } catch (error) {
          console.error(error);
          document.getElementById("animeContainer").innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        }
      }
      
      /* ===== SORTING FUNCTIONS ===== */
      function sortByScore() {
        const sorted = animeData.slice().sort((a, b) => (b.score || 0) - (a.score || 0));
        updateSortedData(sorted);
      }
      function sortByTitle() {
        const sorted = animeData.slice().sort((a, b) => a.title.localeCompare(b.title));
        updateSortedData(sorted);
      }
      function sortByEpisodes() {
        const sorted = animeData.slice().sort((a, b) => (b.episodes || 0) - (a.episodes || 0));
        updateSortedData(sorted);
      }
      
      function updateSortedData(sortedArray) {
        currentSortedData = sortedArray;
        currentPage = 1;
        displayPage();
        updateChart(sortedArray);
      }
      
      /* ===== PAGINATION ===== */
      function displayPage() {
        const startIdx = (currentPage - 1) * pageSize;
        const pageData = currentSortedData.slice(startIdx, startIdx + pageSize);
        displayAnimeCards(pageData);
        generatePagination(currentSortedData.length);
      }
      
      function generatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / pageSize);
        let html = "";
        if (totalPages <= 1) {
          document.getElementById("paginationContainer").innerHTML = "";
          return;
        }
        html += `<li class="page-item ${currentPage === 1 ? "disabled" : ""}">
                   <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Prev</a>
                 </li>`;
        for (let i = 1; i <= totalPages; i++) {
          html += `<li class="page-item ${currentPage === i ? "active" : ""}">
                     <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                   </li>`;
        }
        html += `<li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
                   <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
                 </li>`;
        document.getElementById("paginationContainer").innerHTML = html;
      }
      
      window.changePage = function(page) {
        currentPage = page;
        displayPage();
      }
      
      /* ===== DISPLAY ANIME CARDS (4 per row) ===== */
      function displayAnimeCards(dataArray) {
        const container = document.getElementById("animeContainer");
        container.innerHTML = "";
        if (dataArray.length === 0) {
          container.innerHTML = "<p class='text-center'>Nessun anime trovato.</p>";
          return;
        }
        const row = document.createElement("div");
        row.className = "row";
        dataArray.forEach(anime => {
          const title = anime.title || "N/D";
          const imageUrl = (anime.images && anime.images.jpg && anime.images.jpg.image_url) || "https://via.placeholder.com/120";
          const score = anime.score || "N/D";
          const episodes = anime.episodes || "N/D";
          let synopsis = anime.synopsis ? anime.synopsis.substring(0, 200) + "..." : "Descrizione non disponibile.";
          const col = document.createElement("div");
          col.className = "col-md-3";
          col.innerHTML = `
            <div class="anime-card h-100">
              <img src="${imageUrl}" alt="${escapeHtml(title)}">
              <div class="card-body">
                <h4>${escapeHtml(title)}</h4>
                <p><strong>Punteggio:</strong> ${score}</p>
                <p><strong>Episodi:</strong> ${episodes}</p>
                <p>${escapeHtml(synopsis)}</p>
                <button class="btn btn-sm btn-secondary" onclick="loadAnimeDetails('${anime.mal_id}')">Leggi di più</button>
              </div>
            </div>
          `;
          row.appendChild(col);
        });
        container.appendChild(row);
      }
      
      /* ===== UPDATE CHART (Top 10 by Score) ===== */
      function updateChart(dataArray) {
        const top10 = dataArray.slice().sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0,10);
        const labels = top10.map(a => a.title.substring(0,20) + (a.title.length > 20 ? "..." : ""));
        const scores = top10.map(a => a.score || 0);
        const ctx = document.getElementById("animeChart").getContext("2d");
        if (animeChart instanceof Chart) {
          animeChart.destroy();
        }
        animeChart = new Chart(ctx, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [{
              label: "Punteggio",
              data: scores,
              backgroundColor: "rgba(54, 162, 235, 0.6)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
          }
        });
      }
      
      /* ===== DETAIL MODAL (Fullscreen) ===== */
      function openDetailModal(title, contentHTML) {
        const modalTitle = document.getElementById("detailModalLabel");
        const modalBody  = document.getElementById("modalBodyContent");
        modalTitle.textContent = title;
        modalBody.innerHTML    = contentHTML;
        const modalElem = document.getElementById("detailModal");
        const modal = new bootstrap.Modal(modalElem, { backdrop: "static" });
        modal.show();
      }
      
      /* ===== LOAD ANIME DETAILS VIA JIKAN API (Incl. Image & Styled Layout) ===== */
      async function loadAnimeDetails(mal_id) {
        try {
          const response = await fetch("https://api.jikan.moe/v4/anime/" + mal_id);
          if (!response.ok) throw new Error("Errore nel caricamento dei dettagli: " + response.status);
          const data = await response.json();
          const anime = data.data;
          const title = anime.title || "N/D";
          const score = anime.score || "N/D";
          const episodes = anime.episodes || "N/D";
          const synopsis = anime.synopsis || "Nessuna descrizione disponibile.";
          const genres = anime.genres.map(g => g.name).join(", ");
          const link = anime.url;
          
          // Crea una sezione per l'immagine se disponibile
          let imageHtml = "";
          if (anime.images && anime.images.jpg && anime.images.jpg.image_url) {
            imageHtml = `<img src="${anime.images.jpg.image_url}" alt="${escapeHtml(title)}" class="img-fluid mb-3" style="max-height:300px; object-fit:cover;">`;
          }
          
          // Layout dettagliato: due colonne (immagine + dati)
          let detailHtml = `
            <div class="container-fluid">
              <div class="row">
                <div class="col-md-4">
                  ${imageHtml}
                </div>
                <div class="col-md-8">
                  <h2>${escapeHtml(title)}</h2>
                  <p><strong>Punteggio:</strong> ${score}</p>
                  <p><strong>Episodi:</strong> ${episodes}</p>
                  <p><strong>Generi:</strong> ${escapeHtml(genres)}</p>
                  <p><strong>Sinossi:</strong><br>${escapeHtml(synopsis)}</p>
                  <p><a href="${link}" target="_blank" class="btn btn-sm btn-primary">Visualizza su MyAnimeList</a></p>
                </div>
              </div>
            </div>
          `;
          openDetailModal(title, detailHtml);
        } catch (error) {
          console.error(error);
          openDetailModal("Errore", `<p class="text-danger">${error.message}</p>`);
        }
      }
      
      /* ===== UTILITY: Escape HTML ===== */
      function escapeHtml(text) {
        if (typeof text !== "string") return text;
        const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
        return text.replace(/[&<>"']/g, m => map[m]);
      }
      
      /* ===== RESET DETAIL MODAL on Close ===== */
      document.getElementById("detailModal").addEventListener("hidden.bs.modal", function() {
        document.getElementById("modalBodyContent").innerHTML = "";
        document.body.style.overflow = "auto";
      });
      
      /* ===== EVENT LISTENERS ===== */
      document.getElementById("btnTop").addEventListener("click", loadTopAnime);
      document.getElementById("btnSearch").addEventListener("click", function() {
        const query = document.getElementById("queryInput").value.trim();
        if (query.length === 0) return;
        searchAnime(query);
      });
      document.getElementById("btnScore").addEventListener("click", sortByScore);
      document.getElementById("btnTitle").addEventListener("click", sortByTitle);
      document.getElementById("btnEpisodes").addEventListener("click", sortByEpisodes);
      
      document.getElementById("eventSearchBtn").addEventListener("click", function () {
        const query = document.getElementById("eventSearchInput").value.toLowerCase();
        const filtered = animeData.filter(ev =>
          ev.title.toLowerCase().includes(query) ||
          ev.synopsis.toLowerCase().includes(query)
        );
        displayAnimeCards(filtered);
      });
      
      /* ===== INITIALIZATION ===== */
      function updateViews() {
        // Visualizzazione iniziale: carica i Top Anime
        loadTopAnime();
      }
      
      updateViews();
      
      // Esponi le funzioni globalmente per gli attributi inline
      window.loadAnimeDetails = loadAnimeDetails;
      window.escapeHtml = escapeHtml;
      window.changePage = changePage;
    });
