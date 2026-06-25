const data = window.BOOK_DATA;

const state = {
  activeChapter: 1,
  pins: [],
};

const coneCopy = {
  probable: ["很可能的未来", "主流设计最常工作的空间：沿着现有趋势继续推进，默认世界大体不变。"],
  plausible: ["合乎情理的未来", "情景规划和前瞻研究的空间：不预测，而是构造足够可信的替代路径。"],
  possible: ["可能的未来", "科学上不违背物理规律，但从今天通往那里仍很难想象。"],
  preferable: ["可取的未来", "价值判断进入设计的位置：我们想要什么，不想要什么，以及谁有权决定。"],
};

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugCase(title) {
  return data.cases.find((item) => item.title === title || item.needle === title);
}

function highlightText(text) {
  let html = escapeHTML(text);

  for (const item of data.cases) {
    const phrases = [item.title, item.needle].filter(Boolean).sort((a, b) => b.length - a.length);
    for (const phrase of phrases) {
      const escaped = escapeHTML(phrase);
      html = html.replaceAll(
        escaped,
        `<button class="case-hit" type="button" data-case-id="${item.id}">${escaped}</button>`
      );
    }
  }

  for (const item of data.terms) {
    const escaped = escapeHTML(item.term);
    html = html.replaceAll(
      escaped,
      `<button class="term-hit" type="button" data-term="${escapeHTML(item.term)}">${escaped}</button>`
    );
  }

  return html;
}

function chapterLabel(id) {
  return `第 ${id} 章`;
}

function renderNav() {
  const rail = document.getElementById("chapterRail");
  rail.innerHTML = "";

  data.chapters.forEach((chapter) => {
    const a = document.createElement("a");
    a.href = `#chapter-${chapter.id}`;
    a.textContent = chapter.id;
    a.title = chapter.title;
    if (chapter.id === state.activeChapter) a.classList.add("active");
    rail.appendChild(a);
  });
}

function renderTerms() {
  const termList = document.getElementById("termList");
  termList.innerHTML = data.terms
    .map((term) => `<button class="term-pill" type="button" data-term="${escapeHTML(term.term)}">${escapeHTML(term.term)}</button>`)
    .join("");
}

function renderBook() {
  const book = document.getElementById("book");
  const renderedFigures = new Set();
  book.innerHTML = data.chapters
    .map((chapter) => {
      const blocks = chapter.blocks
        .map((block, index) => {
          if (typeof block === "object" && block.heading) {
            return `<h3>${escapeHTML(block.heading)}</h3>`;
          }
          const text = String(block);
          const id = `p-${chapter.id}-${index}`;
          const para = `<p class="para" id="${id}" data-chapter="${chapter.id}"><button class="pin-button" type="button" data-pin="${id}" aria-label="收藏此段">•</button>${highlightText(text)}</p>`;
          const inlineFigures = (data.inlineFigures || []).filter((figure) => {
            const key = `${figure.chapter}:${figure.caption}`;
            return figure.chapter === chapter.id && text.includes(figure.match) && !renderedFigures.has(key);
          });
          inlineFigures.forEach((figure) => renderedFigures.add(`${figure.chapter}:${figure.caption}`));
          const figures = inlineFigures.length ? inlineFigureGroup(inlineFigures) : "";
          if (chapter.id === 1 && text.startsWith("很可能的未来 /")) {
            return para + futureMapTemplate() + figures;
          }
          return para + figures;
        })
        .join("");
      return `<section class="chapter" id="chapter-${chapter.id}" data-chapter="${chapter.id}">
        <div class="chapter__number">${chapterLabel(chapter.id)}</div>
        <h2>${escapeHTML(chapter.title)}</h2>
        <p class="chapter__en">${escapeHTML(chapter.english || "")}</p>
        ${blocks}
      </section>`;
    })
    .join("");
}

function inlineFigureGroup(figures) {
  return `<div class="inline-figure-grid ${figures.length === 1 ? "single" : ""}">
    ${figures
      .map(
        (figure) => `<figure class="inline-figure">
          <img src="${escapeHTML(figure.image)}" alt="${escapeHTML(figure.caption)}" loading="lazy" />
          <figcaption>${escapeHTML(figure.caption)}</figcaption>
        </figure>`
      )
      .join("")}
  </div>`;
}

function futureMapTemplate() {
  return `<section class="future-map inline-future-map" aria-labelledby="futureMapTitle">
    <div>
      <p class="eyebrow">PPPP Futures</p>
      <h2 id="futureMapTitle">四个未来锥体</h2>
      <p>
        Dunne & Raby 借用并改造了 Stuart Candy 的未来锥体：设计不只服务于最可能发生的未来，也可以打开合乎情理、可能以及可取的未来。
      </p>
    </div>
    <div class="cone-board" id="coneBoard">
      <button data-cone="probable"><span>Probable</span><b>很可能</b></button>
      <button data-cone="plausible"><span>Plausible</span><b>合乎情理</b></button>
      <button data-cone="possible"><span>Possible</span><b>可能</b></button>
      <button data-cone="preferable"><span>Preferable</span><b>可取</b></button>
    </div>
    <aside class="cone-note" id="coneNote">
      <strong>选择一个未来锥体</strong>
      <p>悬停或点击右侧标签，查看该未来类型在设计实践中的位置。</p>
    </aside>
  </section>`;
}

function caseCard(item) {
  return `<button class="case-card" type="button" data-case-id="${item.id}">
    <span class="case-card__image">
      <img src="${escapeHTML(item.image || "")}" alt="${escapeHTML(item.title)} 案例图片" loading="lazy" />
    </span>
    <div>
      <span class="panel-label">Chapter ${item.chapter}${item.page ? ` · PDF p.${item.page}` : ""}</span>
      <h3>${escapeHTML(item.title)}</h3>
    </div>
    <p>${escapeHTML(item.note)}</p>
    <span class="case-card__footer">原文 / 设计详情 →</span>
  </button>`;
}

function renderCases() {
  document.getElementById("caseRow").innerHTML = data.cases.slice(0, 8).map(caseCard).join("");
  document.getElementById("caseGrid").innerHTML = data.cases.map(caseCard).join("");
}

function openCase(id) {
  const item = data.cases.find((entry) => entry.id === id);
  if (!item) return;
  document.getElementById("modalChapter").textContent = `Chapter ${item.chapter}${item.page ? ` · PDF page ${item.page}` : ""}`;
  document.getElementById("modalTitle").textContent = item.title;
  document.getElementById("modalNote").textContent = item.note;
  document.getElementById("modalExcerpt").textContent = item.excerpt;
  document.getElementById("modalImage").src = item.image || "";
  document.getElementById("modalImage").alt = `${item.title} 案例图片`;
  document.getElementById("modalImageCredit").textContent = item.imageCredit || "";
  document.getElementById("modalPage").textContent = item.page
    ? `短摘录来自 PDF 抽取文本第 ${item.page} 页附近。`
    : "未能从抽取文本中定位页码。";
  document.getElementById("modalJump").href = `#chapter-${item.chapter}`;
  document.getElementById("modalExternal").href = item.url || "#";
  document.getElementById("caseModal").showModal();
}

function openTerm(termName) {
  const term = data.terms.find((item) => item.term === termName);
  if (!term) return;
  document.getElementById("modalChapter").textContent = term.en;
  document.getElementById("modalTitle").textContent = term.term;
  document.getElementById("modalNote").textContent = term.definition;
  document.getElementById("modalExcerpt").textContent = `${term.term} / ${term.en}`;
  document.getElementById("modalPage").textContent = "术语卡片";
  document.getElementById("modalJump").href = "#book";
  document.getElementById("caseModal").showModal();
}

function renderPins() {
  const pins = document.getElementById("pins");
  if (!state.pins.length) {
    pins.className = "pins-empty";
    pins.textContent = "点击正文段落左侧标记收藏摘录。";
    return;
  }
  pins.className = "";
  pins.innerHTML = state.pins
    .map((pin) => `<div class="pin"><a href="#${pin.id}">${escapeHTML(pin.text.slice(0, 120))}</a></div>`)
    .join("");
}

function togglePin(id) {
  const para = document.getElementById(id);
  if (!para) return;
  const existing = state.pins.findIndex((pin) => pin.id === id);
  if (existing >= 0) {
    state.pins.splice(existing, 1);
    para.classList.remove("pinned");
  } else {
    state.pins.unshift({ id, text: para.textContent.replace("•", "").trim() });
    para.classList.add("pinned");
  }
  renderPins();
}

function updateProgress() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  document.getElementById("progress").style.width = `${pct}%`;
  document.getElementById("scrollTop").classList.toggle("visible", window.scrollY > 900);

  const chapters = [...document.querySelectorAll(".chapter")];
  let current = state.activeChapter;
  for (const chapter of chapters) {
    const rect = chapter.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.38) current = Number(chapter.dataset.chapter);
  }
  if (current !== state.activeChapter) {
    state.activeChapter = current;
    document.getElementById("readSignal").textContent = `第 ${current} 章`;
    renderNav();
  }
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const caseTarget = event.target.closest("[data-case-id]");
    if (caseTarget) openCase(caseTarget.dataset.caseId);

    const termTarget = event.target.closest("[data-term]");
    if (termTarget) openTerm(termTarget.dataset.term);

    const pinTarget = event.target.closest("[data-pin]");
    if (pinTarget) togglePin(pinTarget.dataset.pin);
  });

  document.getElementById("modalClose").addEventListener("click", () => {
    document.getElementById("caseModal").close();
  });

  for (const id of ["openCases", "heroCases", "caseStripOpen"]) {
    document.getElementById(id).addEventListener("click", () => {
      document.getElementById("caseDrawer").classList.add("open");
      document.getElementById("caseDrawer").setAttribute("aria-hidden", "false");
    });
  }

  document.getElementById("caseDrawerClose").addEventListener("click", () => {
    document.getElementById("caseDrawer").classList.remove("open");
    document.getElementById("caseDrawer").setAttribute("aria-hidden", "true");
  });

  document.getElementById("caseDrawer").addEventListener("click", (event) => {
    if (event.target.id === "caseDrawer") {
      event.currentTarget.classList.remove("open");
      event.currentTarget.setAttribute("aria-hidden", "true");
    }
  });

  document.getElementById("scrollTop").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.querySelectorAll("[data-cone]").forEach((button) => {
    button.addEventListener("click", () => selectCone(button.dataset.cone));
    button.addEventListener("mouseenter", () => selectCone(button.dataset.cone));
  });

  window.addEventListener("scroll", updateProgress, { passive: true });
}

function selectCone(key) {
  const copy = coneCopy[key];
  if (!copy) return;
  document.querySelectorAll("[data-cone]").forEach((button) => {
    button.classList.toggle("active", button.dataset.cone === key);
  });
  document.getElementById("coneNote").innerHTML = `<strong>${copy[0]}</strong><p>${copy[1]}</p>`;
}

function init() {
  renderNav();
  renderTerms();
  renderBook();
  renderCases();
  bindEvents();
  selectCone("plausible");
  updateProgress();
}

init();
