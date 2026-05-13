const searchInput = document.getElementById("blog-search");
const featuredContainer = document.getElementById("blog-featured");
const gridContainer = document.getElementById("blog-grid");
const emptyState = document.getElementById("blog-empty");

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function articleMatches(article, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    article.title,
    article.excerpt,
    article.img_banner,
    ...(article.tags || []),
  ]
    .join(" ")
    .toLowerCase();

  return normalize(haystack).includes(normalize(query));
}

function getArticleUrl(article) {
  return `/blog/${article.slug}`;
}

function renderFeatured(article) {
  if (!article) {
    featuredContainer.innerHTML = "";
    return;
  }

  featuredContainer.innerHTML = `
    <article class="featured-card">
      <a class="featured-card-link" href="${getArticleUrl(article)}">
        <div class="featured-copy">
          <div>
            <h2>${article.title}</h2>
            <p>${article.excerpt}</p>
          </div>
          <div class="tag-row">
            ${(article.tags || []).map((tag) => `<span>${tag}</span>`).join("")}
          </div>
        </div>
        <figure class="featured-image">
          <img src="${article.img_banner}" alt="${article.title}">
        </figure>
      </a>
    </article>
  `;
}

function renderCards(articles) {
  gridContainer.innerHTML = articles
    .map(
      (article) => `
      <article class="blog-card">
        <a class="blog-card-link" href="${getArticleUrl(article)}">
          <img src="${article.img_banner}" alt="${article.title}">
          <div class="blog-card-body">
            <h3>${article.title}</h3>
            <p>${article.excerpt}</p>
          </div>
        </a>
      </article>
    `
    )
    .join("");
}

function renderResults(allArticles, query) {
  const filtered = allArticles.filter((article) => articleMatches(article, query));

  if (filtered.length === 0) {
    renderFeatured(null);
    gridContainer.innerHTML = "";
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  renderFeatured(filtered[0]);
  renderCards(filtered.slice(1));
}

async function initBlogMock() {
  try {
    const response = await fetch("/static/data/blogs.json", { cache: "no-store" });
    const allArticles = await response.json();

    renderResults(allArticles, "");

    searchInput.addEventListener("input", (event) => {
      renderResults(allArticles, event.target.value);
    });
  } catch (error) {
    emptyState.hidden = false;
  }
}

initBlogMock();
