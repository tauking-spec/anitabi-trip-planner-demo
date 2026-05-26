const API_BASE = "https://api.anitabi.cn";
const BANGUMI_API_BASE = "https://api.bgm.tv";
const NOMINATIM_API_BASE = "https://nominatim.openstreetmap.org";
const GRAPHHOPPER_API_BASE = "https://graphhopper.com/api/1";
const GRAPHHOPPER_STORAGE_KEY = "anitabi.graphhopper";
const GRAPHHOPPER_REQUEST_INTERVAL_MS = 2500;
const GRAPHHOPPER_RATE_LIMIT_RETRY_MS = 20000;

const state = {
  points: [],
  markers: [],
  pointMarkers: new Map(),
  clusterMarkers: new Map(),
  focusMarker: null,
  routeLine: null,
  rangeCircle: null,
  currentView: "route",
  selectedSubjects: [],
  searchResults: [],
  anitabiCoverage: new Map(),
  expandedClusters: new Map(),
  routeClusters: [],
  routeDays: [],
  language: "zh",
};

const $ = (id) => document.getElementById(id);

const I18N = {
  zh: {
    panelLabel: "路线规划控制面板",
    appTitle: "Anitabi 巡礼路线",
    appSubtitle: "基于公开 API 的非商业路线规划原型",
    language: "语言",
    notice: "数据来自 Anitabi 开放 API，遵循 CC BY-NC-SA 4.0。位置只在当前浏览器中计算。",
    currentLocation: "当前位置",
    locationSearch: "地点搜索",
    locationPlaceholder: "输入城市、车站或景点，如 京都站",
    search: "搜索",
    latitude: "纬度",
    longitude: "经度",
    mapClickHint: "也可以直接点击地图选择出发点。",
    subjectSet: "作品集合",
    bangumiSearch: "Bangumi 动画搜索",
    bangumiPlaceholder: "输入作品名，如 吹响吧 上低音号",
    searchResults: "搜索结果",
    selectAll: "一键全选",
    selectCovered: "全选已收录",
    selectedSubjects: "已选作品",
    removeMissing: "移除未收录",
    clearAll: "一键移除",
    subjectIds: "Bangumi subject ID，用逗号分隔",
    subjectPlaceholder: "例如 115908, 2581",
    subjectHint: "搜索使用 Bangumi 公开 API；手动 ID 输入仍保留，便于导入榜单或外部映射结果。",
    tripParams: "旅行参数",
    days: "天数",
    stopsPerDay: "每天最多地点",
    radius: "搜索半径",
    unlimited: "不限",
    dayStart: "每日开始",
    dayEnd: "每日结束",
    intensity: "路线强度",
    relaxed: "轻松",
    standard: "标准",
    hardcore: "硬核",
    routeMode: "路线模式",
    normalRoute: "完整路线",
    denseRoute: "只看高密度区域",
    loopRoute: "环路路线",
    graphhopperSettings: "GraphHopper 路线增强",
    enableGraphhopper: "使用 GraphHopper 真实道路路线",
    graphhopperKey: "GraphHopper API key",
    graphhopperKeyPlaceholder: "只保存在当前浏览器",
    graphhopperProfile: "交通方式",
    profileFoot: "步行",
    profileBike: "骑行",
    profileCar: "驾车",
    graphhopperHint: "API key 只保存在 localStorage，不会写入分享链接或提交到仓库。",
    planRoute: "生成路线",
    nearbyOnly: "只看附近",
    exportKml: "导出 KML",
    shareLink: "分享链接",
    ready: "准备就绪",
    mapResults: "地图与结果",
    mapToolbar: "地图工具栏",
    locateCurrent: "定位当前位置",
    zoomIn: "放大",
    zoomOut: "缩小",
    route: "路线",
    nearbySpots: "附近圣地",
    chooseAndPlan: "请选择作品集合并生成路线。",
    chooseAndNearby: "请选择作品集合，然后查看附近圣地。",
    noSelectedSubjects: "尚未选择作品。可以搜索 Bangumi 条目或手动输入 ID。",
    searchPrompt: "搜索作品后会显示候选条目。",
    allSearchSelected: "搜索结果都已加入作品集合。",
    deleteCluster: "删除此大巡礼点",
    clusterDeleted: "已删除大巡礼点并重新连接路线。",
    manualInput: "手动输入",
    noNewSearchResults: "当前搜索结果没有可新增作品。",
    noCoveredSearchResults: "当前没有已确认收录且可新增的搜索结果。",
    stillCheckingCoverage: "仍有作品正在检查 Anitabi 收录状态，请稍后再试。",
    addedSearchResults: "已加入 {count} 个搜索结果。",
    addedCoveredResults: "已加入 {count} 个已收录作品。",
    noSelectedStatus: "当前没有已选作品。",
    clearedSubjects: "已清空已选作品。",
    noMissingSubjects: "当前没有已确认未收录的作品。",
    removedMissingSubjects: "已移除 {count} 个 Anitabi 未收录作品。",
    remove: "移除",
    add: "加入",
    notCollected: "未收录",
    checkingAnitabi: "正在检查 Anitabi",
    anitabiSpots: "Anitabi {count} 个巡礼点",
    hasPilgrimagePoints: "已收录巡礼点",
    graphhopperMissingKey: "已启用 GraphHopper，但还没有填写 API key，当前使用直线估算路线。",
    graphhopperRouting: "正在使用 GraphHopper 计算真实道路路线...",
    graphhopperReady: "GraphHopper 真实道路路线已应用。",
    graphhopperFailed: "GraphHopper 路线请求失败，已保留直线估算路线。",
    graphhopperRateLimited: "GraphHopper 分钟限流已触发，本次已停止请求并保留直线估算路线。",
    graphhopperRetrying: "GraphHopper 触发限流，等待后重试中...",
    graphhopperProgress: "GraphHopper 路线段 {current}/{total}",
    graphhopperSaved: "GraphHopper 设置已保存在当前浏览器。",
  },
  en: {
    panelLabel: "Route planning controls",
    appTitle: "Anitabi Pilgrimage Routes",
    appSubtitle: "A non-commercial route planning prototype based on public APIs",
    language: "Language",
    notice: "Data comes from the Anitabi public API under CC BY-NC-SA 4.0. Your location is processed only in this browser.",
    currentLocation: "Current Location",
    locationSearch: "Location Search",
    locationPlaceholder: "Enter a city, station, or landmark, e.g. Kyoto Station",
    search: "Search",
    latitude: "Latitude",
    longitude: "Longitude",
    mapClickHint: "You can also click the map to choose the starting point.",
    subjectSet: "Anime Set",
    bangumiSearch: "Bangumi Anime Search",
    bangumiPlaceholder: "Enter an anime title, e.g. Sound! Euphonium",
    searchResults: "Search Results",
    selectAll: "Select All",
    selectCovered: "Select Covered",
    selectedSubjects: "Selected Anime",
    removeMissing: "Remove Missing",
    clearAll: "Clear All",
    subjectIds: "Bangumi subject IDs, separated by commas",
    subjectPlaceholder: "e.g. 115908, 2581",
    subjectHint: "Search uses the Bangumi public API. Manual ID input is kept for imports and external mappings.",
    tripParams: "Trip Settings",
    days: "Days",
    stopsPerDay: "Max Stops / Day",
    radius: "Search Radius",
    unlimited: "Unlimited",
    dayStart: "Day Start",
    dayEnd: "Day End",
    intensity: "Route Intensity",
    relaxed: "Relaxed",
    standard: "Standard",
    hardcore: "Hardcore",
    routeMode: "Route Mode",
    normalRoute: "Full Route",
    denseRoute: "Dense Areas Only",
    loopRoute: "Loop Route",
    graphhopperSettings: "GraphHopper Route Enhancement",
    enableGraphhopper: "Use GraphHopper real road routes",
    graphhopperKey: "GraphHopper API key",
    graphhopperKeyPlaceholder: "Stored only in this browser",
    graphhopperProfile: "Transport Mode",
    profileFoot: "Walking",
    profileBike: "Cycling",
    profileCar: "Driving",
    graphhopperHint: "The API key is stored only in localStorage. It is not added to share links or committed to the repo.",
    planRoute: "Plan Route",
    nearbyOnly: "Nearby Only",
    exportKml: "Export KML",
    shareLink: "Share Link",
    ready: "Ready",
    mapResults: "Map and results",
    mapToolbar: "Map toolbar",
    locateCurrent: "Locate current position",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    route: "Route",
    nearbySpots: "Nearby Spots",
    chooseAndPlan: "Select anime and plan a route.",
    chooseAndNearby: "Select anime, then view nearby spots.",
    noSelectedSubjects: "No anime selected. Search Bangumi or enter IDs manually.",
    searchPrompt: "Search results will appear here.",
    allSearchSelected: "All search results have been selected.",
    deleteCluster: "Delete this area",
    clusterDeleted: "Deleted the area and reconnected the route.",
    manualInput: "Manual input",
    noNewSearchResults: "No new anime can be added from the current search results.",
    noCoveredSearchResults: "No confirmed covered search result can be added.",
    stillCheckingCoverage: "Some anime are still being checked by Anitabi. Try again shortly.",
    addedSearchResults: "Added {count} search results.",
    addedCoveredResults: "Added {count} covered anime.",
    noSelectedStatus: "No anime selected.",
    clearedSubjects: "Cleared selected anime.",
    noMissingSubjects: "No confirmed missing anime to remove.",
    removedMissingSubjects: "Removed {count} anime not collected by Anitabi.",
    remove: "Remove",
    add: "Add",
    notCollected: "Not collected",
    checkingAnitabi: "Checking Anitabi",
    anitabiSpots: "Anitabi {count} spots",
    hasPilgrimagePoints: "Pilgrimage spots found",
    graphhopperMissingKey: "GraphHopper is enabled, but no API key is set. Using straight-line estimates.",
    graphhopperRouting: "Calculating real road routes with GraphHopper...",
    graphhopperReady: "GraphHopper road routes applied.",
    graphhopperFailed: "GraphHopper routing failed. Kept straight-line estimates.",
    graphhopperRateLimited: "GraphHopper minute limit was hit. Stopped requests and kept straight-line estimates.",
    graphhopperRetrying: "GraphHopper rate limit hit. Waiting before retry...",
    graphhopperProgress: "GraphHopper route leg {current}/{total}",
    graphhopperSaved: "GraphHopper settings saved in this browser.",
  },
};

function t(key, values = {}) {
  let text = I18N[state.language]?.[key] || I18N.zh[key] || key;
  Object.entries(values).forEach(([name, value]) => {
    text = text.replaceAll(`{${name}}`, value);
  });
  return text;
}

function applyLanguage(language = state.language) {
  state.language = language;
  document.documentElement.lang = language === "en" ? "en" : "zh-CN";
  document.title = language === "en" ? "Anitabi Trip Planner Demo" : "Anitabi 巡礼路线 Demo";
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-attr]").forEach((element) => {
    element.dataset.i18nAttr.split(";").forEach((entry) => {
      const [attr, key] = entry.split(":");
      if (attr && key) element.setAttribute(attr, t(key));
    });
  });
  $("languageSelect").value = state.language;
  renderSelectedSubjects();
  renderBangumiSearchResults(state.searchResults);
  if (state.routeClusters.length === 0) renderInitialPanels();
}

const map = L.map("map", { zoomControl: false }).setView([34.8909, 135.8074], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const startIcon = L.divIcon({
  className: "",
  html: '<span class="map-marker start-marker">起</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18],
});

const pilgrimageIcon = L.divIcon({
  className: "",
  html: '<span class="map-marker pilgrimage-marker">巡</span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

function routeIcon(index) {
  return L.divIcon({
    className: "",
    html: `<span class="map-marker route-marker">${index + 1}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

const userMarker = L.marker([34.8909, 135.8074], {
  title: "当前位置",
  icon: startIcon,
}).addTo(map);

function setStatus(message) {
  $("status").textContent = message;
}

function getRadiusKm() {
  return Number($("radiusSelect").value);
}

function getRouteMode() {
  return $("routeModeSelect").value;
}

function graphHopperSettings() {
  return {
    enabled: $("graphhopperEnabled").checked,
    key: $("graphhopperKeyInput").value.trim(),
    profile: $("graphhopperProfileSelect").value,
  };
}

function loadGraphHopperSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(GRAPHHOPPER_STORAGE_KEY) || "{}");
    $("graphhopperEnabled").checked = Boolean(saved.enabled);
    $("graphhopperKeyInput").value = saved.key || "";
    $("graphhopperProfileSelect").value = saved.profile || "foot";
  } catch {
    $("graphhopperProfileSelect").value = "foot";
  }
  updateGraphHopperDetailsVisibility();
}

function saveGraphHopperSettings(showStatus = true) {
  localStorage.setItem(GRAPHHOPPER_STORAGE_KEY, JSON.stringify(graphHopperSettings()));
  updateGraphHopperDetailsVisibility();
  if (showStatus) setStatus(t("graphhopperSaved"));
}

function updateGraphHopperDetailsVisibility() {
  $("graphhopperDetails").classList.toggle("hidden", !$("graphhopperEnabled").checked);
}

function setGraphHopperProgress(current = 0, total = 0, visible = total > 0) {
  const progress = $("graphhopperProgress");
  const fill = $("graphhopperProgressFill");
  const text = $("graphhopperProgressText");
  progress.classList.toggle("hidden", !visible);
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  fill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  text.textContent = visible ? t("graphhopperProgress", { current, total }) : "";
}

function getIntensitySettings() {
  const value = $("intensitySelect").value;
  return {
    relaxed: { stopMinutes: 60, stopMultiplier: 0.75 },
    standard: { stopMinutes: 40, stopMultiplier: 1 },
    hardcore: { stopMinutes: 25, stopMultiplier: 1.25 },
  }[value] || { stopMinutes: 40, stopMultiplier: 1 };
}

function timeToMinutes(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function dailyBudgetMinutes() {
  const start = timeToMinutes($("dayStartInput").value || "10:00");
  const end = timeToMinutes($("dayEndInput").value || "18:00");
  return Math.max(120, end > start ? end - start : 480);
}

function moveMapTo(latLng, zoom = 14, animate = true) {
  map.stop();
  map.invalidateSize({ pan: false });
  if (animate) {
    map.flyTo(latLng, zoom, { animate: true, duration: 0.75, easeLinearity: 0.35 });
  } else {
    map.setView(latLng, zoom, { animate: false });
  }
  requestAnimationFrame(() => {
    map.invalidateSize({ pan: false });
    if (!animate) map.panTo(latLng, { animate: false });
  });
}

function setLocation(lat, lng, label = "当前位置", zoom = 14) {
  $("latInput").value = Number(lat).toFixed(6);
  $("lngInput").value = Number(lng).toFixed(6);
  const location = syncUserMarker(label, zoom);
  return location;
}

function getLocation() {
  return {
    lat: Number($("latInput").value),
    lng: Number($("lngInput").value),
  };
}

function syncUserMarker(label = "当前位置", zoom = 14) {
  const location = getLocation();
  if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
    throw new Error("请输入有效经纬度");
  }
  userMarker.setLatLng([location.lat, location.lng]).bindPopup(escapeHtml(label));
  renderRangeCircle(location);
  moveMapTo([location.lat, location.lng], zoom, true);
  return location;
}

function renderRangeCircle(location = getLocation()) {
  if (state.rangeCircle) {
    state.rangeCircle.remove();
    state.rangeCircle = null;
  }

  const radiusKm = getRadiusKm();
  if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng) || radiusKm >= 99999) return;

  state.rangeCircle = L.circle([location.lat, location.lng], {
    radius: radiusKm * 1000,
    color: "#d9482f",
    weight: 2,
    opacity: 0.78,
    fillColor: "#d9482f",
    fillOpacity: 0.08,
    interactive: false,
  }).addTo(map);
}

function getSubjectIds() {
  const raw = $("subjectInput").value;
  return [...new Set(raw.split(/[,，\s]+/).map((id) => id.trim()).filter(Boolean))];
}

function subjectCover(subject) {
  return subject.images?.grid || subject.images?.small || subject.images?.common || "";
}

function subjectTitle(subject) {
  return subject.name_cn || subject.name || `Bangumi ${subject.id}`;
}

function subjectMeta(subject) {
  const score = subject.rating?.score ? `评分 ${subject.rating.score}` : "暂无评分";
  const rank = subject.rating?.rank ? `Rank #${subject.rating.rank}` : "暂无排名";
  const date = subject.date || "日期未知";
  return `${date} · ${score} · ${rank}`;
}

function syncSubjectInputFromState() {
  $("subjectInput").value = state.selectedSubjects.map((subject) => subject.id).join(", ");
  updateShareUrl(false);
}

function syncStateFromSubjectInput() {
  const existing = new Map(state.selectedSubjects.map((subject) => [String(subject.id), subject]));
  state.selectedSubjects = getSubjectIds().map((id) => existing.get(String(id)) || {
    id: String(id),
    title: `Bangumi ${id}`,
    image: "",
    meta: t("manualInput"),
  });
  renderSelectedSubjects();
  state.selectedSubjects.forEach((subject) => checkAnitabiCoverage(subject));
}

function addSelectedSubject(subject) {
  const id = String(subject.id);
  if (state.selectedSubjects.some((item) => String(item.id) === id)) return;
  state.selectedSubjects.push(subjectToSelection(subject));
  syncSubjectInputFromState();
  renderSelectedSubjects();
  checkAnitabiCoverage(state.selectedSubjects[state.selectedSubjects.length - 1]);
  renderBangumiSearchResults(state.searchResults);
}

function subjectToSelection(subject) {
  return {
    id: String(subject.id),
    title: subjectTitle(subject),
    name: subject.name || "",
    image: subjectCover(subject),
    meta: subjectMeta(subject),
  };
}

function selectAllSearchResults() {
  const selectedIds = new Set(state.selectedSubjects.map((subject) => String(subject.id)));
  const subjectsToAdd = state.searchResults.filter((subject) => !selectedIds.has(String(subject.id)));
  if (subjectsToAdd.length === 0) {
    setStatus(t("noNewSearchResults"));
    return;
  }
  subjectsToAdd.forEach((subject) => state.selectedSubjects.push(subjectToSelection(subject)));
  syncSubjectInputFromState();
  renderSelectedSubjects();
  subjectsToAdd.forEach((subject) => checkAnitabiCoverage(subject));
  renderBangumiSearchResults(state.searchResults);
  setStatus(t("addedSearchResults", { count: subjectsToAdd.length }));
}

function selectCoveredSearchResults() {
  const selectedIds = new Set(state.selectedSubjects.map((subject) => String(subject.id)));
  const pending = state.searchResults.some((subject) => !state.anitabiCoverage.has(String(subject.id)));
  const subjectsToAdd = state.searchResults.filter((subject) => {
    const id = String(subject.id);
    return !selectedIds.has(id) && state.anitabiCoverage.get(id)?.status === "available";
  });

  if (subjectsToAdd.length === 0) {
    setStatus(pending ? t("stillCheckingCoverage") : t("noCoveredSearchResults"));
    return;
  }

  subjectsToAdd.forEach((subject) => state.selectedSubjects.push(subjectToSelection(subject)));
  syncSubjectInputFromState();
  renderSelectedSubjects();
  renderBangumiSearchResults(state.searchResults);
  setStatus(t("addedCoveredResults", { count: subjectsToAdd.length }));
}

function clearSelectedSubjects() {
  if (state.selectedSubjects.length === 0) {
    setStatus(t("noSelectedStatus"));
    return;
  }
  state.selectedSubjects = [];
  syncSubjectInputFromState();
  renderSelectedSubjects();
  renderBangumiSearchResults(state.searchResults);
  setStatus(t("clearedSubjects"));
}

function removeMissingSubjects() {
  const before = state.selectedSubjects.length;
  state.selectedSubjects = state.selectedSubjects.filter((subject) => (
    state.anitabiCoverage.get(String(subject.id))?.status !== "missing"
  ));
  const removed = before - state.selectedSubjects.length;
  if (removed === 0) {
    setStatus(t("noMissingSubjects"));
    return;
  }
  syncSubjectInputFromState();
  renderSelectedSubjects();
  renderBangumiSearchResults(state.searchResults);
  setStatus(t("removedMissingSubjects", { count: removed }));
}

function removeSelectedSubject(subjectId) {
  state.selectedSubjects = state.selectedSubjects.filter((subject) => String(subject.id) !== String(subjectId));
  syncSubjectInputFromState();
  renderSelectedSubjects();
  renderBangumiSearchResults(state.searchResults);
}

function renderSelectedSubjects() {
  const container = $("selectedSubjects");
  container.innerHTML = "";
  if (state.selectedSubjects.length === 0) {
    container.innerHTML = `<div class="empty">${t("noSelectedSubjects")}</div>`;
    return;
  }

  state.selectedSubjects.forEach((subject) => {
    const item = document.createElement("div");
    const coverage = state.anitabiCoverage.get(String(subject.id));
    item.className = `subject-chip${coverage?.status === "missing" ? " unavailable" : ""}`;
    const coverageText = coverage
      ? ` · ${coverage.status === "available" ? t("anitabiSpots", { count: coverage.count }) : t("notCollected")}`
      : ` · ${t("checkingAnitabi")}`;
    item.innerHTML = `
      <img alt="" src="${subject.image || ""}" loading="lazy" />
      <div class="subject-title">
        <strong>${escapeHtml(subject.title)}</strong>
        <span>${escapeHtml((subject.meta || `Bangumi ${subject.id}`) + coverageText)}</span>
      </div>
      <button class="secondary mini-button" type="button" data-remove-subject="${subject.id}">${t("remove")}</button>
    `;
    container.appendChild(item);
  });
}

function renderBangumiSearchResults(subjects) {
  const container = $("bangumiSearchResults");
  container.innerHTML = "";
  const selectedIds = new Set(state.selectedSubjects.map((subject) => String(subject.id)));
  const availableSubjects = subjects.filter((subject) => !selectedIds.has(String(subject.id)));

  if (subjects.length === 0) {
    container.innerHTML = `<div class="empty">${t("searchPrompt")}</div>`;
    return;
  }

  if (availableSubjects.length === 0) {
    container.innerHTML = `<div class="empty">${t("allSearchSelected")}</div>`;
    return;
  }

  availableSubjects.forEach((subject) => {
    const item = document.createElement("div");
    const coverage = state.anitabiCoverage.get(String(subject.id));
    item.className = `subject-result${coverage?.status === "missing" ? " unavailable" : ""}${coverage?.status === "available" ? " available" : ""}`;
    const coverageText = coverage
      ? ` · ${coverage.status === "available" ? t("hasPilgrimagePoints") + ` ${coverage.count}` : t("notCollected")}`
      : ` · ${t("checkingAnitabi")}`;
    item.innerHTML = `
      <img alt="" src="${subjectCover(subject)}" loading="lazy" />
      <div class="subject-title">
        <strong>${escapeHtml(subjectTitle(subject))}</strong>
        <span>${escapeHtml(subjectMeta(subject) + coverageText)}</span>
      </div>
      <button class="mini-button" type="button" data-add-subject="${subject.id}">${t("add")}</button>
    `;
    item.querySelector("[data-add-subject]").addEventListener("click", () => addSelectedSubject(subject));
    container.appendChild(item);
  });
}

async function checkAnitabiCoverage(subject) {
  const id = String(subject.id);
  if (state.anitabiCoverage.has(id)) return state.anitabiCoverage.get(id);
  try {
    const response = await fetch(`${API_BASE}/bangumi/${id}/points/detail?haveImage=false`);
    if (!response.ok) throw new Error("not available");
    const points = await response.json();
    const count = Array.isArray(points) ? points.filter((point) => Array.isArray(point.geo)).length : 0;
    state.anitabiCoverage.set(id, {
      status: count > 0 ? "available" : "missing",
      count,
    });
  } catch {
    state.anitabiCoverage.set(id, { status: "missing", count: 0 });
  }
  renderSelectedSubjects();
  renderBangumiSearchResults(state.searchResults);
  return state.anitabiCoverage.get(id);
}

async function searchBangumiSubjects() {
  const keyword = $("bangumiSearchInput").value.trim();
  if (!keyword) {
    setStatus("请输入 Bangumi 搜索关键词。");
    return;
  }

  setStatus(`正在搜索 Bangumi：${keyword}`);
  try {
    const response = await fetch(`${BANGUMI_API_BASE}/v0/search/subjects?limit=8&offset=0`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        keyword,
        sort: "rank",
        filter: {
          type: [2],
          nsfw: false,
        },
      }),
    });
    if (!response.ok) throw new Error(`Bangumi API 请求失败：${response.status}`);
    const payload = await response.json();
    const subjects = Array.isArray(payload.data) ? payload.data : [];
    state.searchResults = subjects;
    renderBangumiSearchResults(subjects);
    subjects.forEach((subject) => checkAnitabiCoverage(subject));
    setStatus(`Bangumi 返回 ${subjects.length} 个动画条目。`);
  } catch (error) {
    console.warn(error);
    $("bangumiSearchResults").innerHTML =
      '<div class="empty">Bangumi 搜索暂不可用。可以继续手动输入 Bangumi subject ID。</div>';
    setStatus(error.message);
  }
}

function renderLocationSearchResults(results) {
  const container = $("locationSearchResults");
  container.innerHTML = "";
  if (results.length === 0) {
    container.innerHTML = '<div class="empty">没有找到地点。</div>';
    return;
  }

  results.forEach((place) => {
    const item = document.createElement("div");
    item.className = "location-result";
    const lat = Number(place.lat);
    const lng = Number(place.lon);
    const name = place.name || place.display_name?.split(",")[0] || "搜索结果";
    item.innerHTML = `
      <div class="location-title">
        <strong>${escapeHtml(name)}</strong>
        <span>${escapeHtml(place.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`)}</span>
      </div>
      <button class="mini-button" type="button">选择</button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      setLocation(lat, lng, name);
      $("locationSearchResults").innerHTML = "";
      setStatus(`已选择出发点：${name}`);
    });
    container.appendChild(item);
  });
}

async function searchLocations() {
  const query = $("locationSearchInput").value.trim();
  if (!query) {
    setStatus("请输入地点关键词。");
    return;
  }

  setStatus(`正在搜索地点：${query}`);
  try {
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      addressdetails: "1",
      limit: "6",
      "accept-language": "zh-CN,zh,en,ja",
    });
    const response = await fetch(`${NOMINATIM_API_BASE}/search?${params.toString()}`, {
      headers: {
        accept: "application/json",
      },
    });
    if (!response.ok) throw new Error(`地点搜索请求失败：${response.status}`);
    const results = await response.json();
    renderLocationSearchResults(Array.isArray(results) ? results : []);
    setStatus(`地点搜索返回 ${Array.isArray(results) ? results.length : 0} 个候选。`);
  } catch (error) {
    console.warn(error);
    $("locationSearchResults").innerHTML =
      '<div class="empty">地点搜索暂不可用。可以点击地图选点或手动输入经纬度。</div>';
    setStatus(error.message);
  }
}

function secondsToText(seconds) {
  if (!Number.isFinite(seconds)) return "";
  const minute = Math.floor(seconds / 60);
  const second = Math.floor(seconds % 60);
  return `${minute}:${String(second).padStart(2, "0")}`;
}

function haversineKm(a, b) {
  const earthRadius = 6371;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function normalizePoint(point, subject) {
  const title = subject.cn || subject.title || `Bangumi ${subject.id}`;
  return {
    ...point,
    bangumiId: subject.id,
    workTitle: title,
    displayName: point.cn || point.name || "未命名地标",
    image: point.image ? point.image.replace("plan=h160", "plan=h360") : subject.cover,
    origin: point.origin || "Anitabi",
    originURL: point.originURL || `https://anitabi.cn/map?bangumiId=${subject.id}`,
  };
}

async function fetchSubjectPoints(subjectId) {
  const liteUrl = `${API_BASE}/bangumi/${subjectId}/lite`;
  const detailUrl = `${API_BASE}/bangumi/${subjectId}/points/detail?haveImage=true`;
  const [liteRes, detailRes] = await Promise.all([fetch(liteUrl), fetch(detailUrl)]);

  if (liteRes.status === 404 && detailRes.ok) return [];

  if (!liteRes.ok || !detailRes.ok) {
    throw new Error(`Anitabi API 请求失败：${subjectId}`);
  }

  const subject = await liteRes.json();
  const detailPoints = await detailRes.json();
  const points = Array.isArray(detailPoints) && detailPoints.length > 0
    ? detailPoints
    : subject.litePoints || [];

  return points.filter((point) => Array.isArray(point.geo)).map((point) => normalizePoint(point, subject));
}

async function loadPoints() {
  const ids = getSubjectIds();
  if (ids.length === 0) throw new Error("请至少输入一个 Bangumi subject ID");

  setStatus(`正在读取 ${ids.length} 个作品的 Anitabi 地标...`);
  const results = await Promise.allSettled(ids.map(fetchSubjectPoints));
  const failedIds = results
    .map((result, index) => (result.status === "rejected" ? ids[index] : null))
    .filter(Boolean);
  const batches = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
  const points = batches.flat();
  if (points.length === 0) {
    throw new Error("没有读取到含坐标的地标。可能是这些 Bangumi 条目尚未被 Anitabi 收录，或没有巡礼点。");
  }
  state.points = points;
  const failedText = failedIds.length ? `；${failedIds.length} 个作品请求失败` : "";
  setStatus(`已读取 ${points.length} 个地标，来自 ${ids.length - failedIds.length} 个作品${failedText}。`);
  return points;
}

function rankedNearby(points, location, radiusKm) {
  return points
    .map((point) => ({
      ...point,
      distanceKm: haversineKm(location, { lat: point.geo[0], lng: point.geo[1] }),
    }))
    .filter((point) => point.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

function centroid(points) {
  return {
    lat: points.reduce((sum, point) => sum + point.geo[0], 0) / points.length,
    lng: points.reduce((sum, point) => sum + point.geo[1], 0) / points.length,
  };
}

function clusterPoints(points, thresholdKm = 0.25) {
  const clusters = [];
  points.forEach((point) => {
    let bestCluster = null;
    let bestDistance = Infinity;
    clusters.forEach((cluster) => {
      const distance = haversineKm(cluster.center, { lat: point.geo[0], lng: point.geo[1] });
      if (distance < bestDistance) {
        bestCluster = cluster;
        bestDistance = distance;
      }
    });

    if (bestCluster && bestDistance <= thresholdKm) {
      bestCluster.points.push(point);
      bestCluster.center = centroid(bestCluster.points);
    } else {
      clusters.push({
        id: `cluster-${point.id}`,
        points: [point],
        center: { lat: point.geo[0], lng: point.geo[1] },
      });
    }
  });

  return clusters.map((cluster) => {
    const works = [...new Set(cluster.points.map((point) => point.workTitle))];
    const primary = cluster.points[0];
    const clusterRadiusKm = Math.max(
      0,
      ...cluster.points.map((point) => haversineKm(cluster.center, { lat: point.geo[0], lng: point.geo[1] })),
    );
    return {
      ...cluster,
      displayName: cluster.points.length === 1 ? primary.displayName : `${primary.displayName} 周边`,
      workSummary: works.slice(0, 3).join(" / ") + (works.length > 3 ? ` 等 ${works.length} 部作品` : ""),
      image: primary.image,
      clusterRadiusKm,
      pointCount: cluster.points.length,
    };
  });
}

function transportForDistance(distanceKm) {
  if (distanceKm <= 0.8) {
    return { mode: "步行", time: `${Math.max(6, Math.round((distanceKm / 4.5) * 60))} 分钟` };
  }
  if (distanceKm <= 5) {
    return { mode: "步行或公交", time: `${Math.round((distanceKm / 16) * 60 + 8)} 分钟` };
  }
  if (distanceKm <= 25) {
    return { mode: "公交/铁路", time: `${Math.round((distanceKm / 28) * 60 + 15)} 分钟` };
  }
  return { mode: "铁路/自驾", time: `${Math.round((distanceKm / 55) * 60 + 20)} 分钟` };
}

function recomputeRouteLegs(routeDays) {
  const origin = getLocation();
  routeDays.forEach((dayClusters) => {
    dayClusters.forEach((cluster, index) => {
      const previous = index === 0 ? origin : dayClusters[index - 1].center;
      cluster.legKm = haversineKm(previous, cluster.center);
      cluster.transport = transportForDistance(cluster.legKm);
      delete cluster.legGeometry;
      delete cluster.returnGeometry;
      delete cluster.returnKm;
      delete cluster.returnTransport;
    });
  });
}

function graphHopperProfileLabel(profile = graphHopperSettings().profile) {
  return {
    foot: t("profileFoot"),
    bike: t("profileBike"),
    car: t("profileCar"),
  }[profile] || profile;
}

function graphHopperErrorMessage(payload) {
  return String(payload?.message || payload?.hints?.map((hint) => hint.message).join(" ") || "");
}

function isGraphHopperRateLimit(error) {
  return /limit|credit|rate|quota|violated/i.test(error.message);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForGraphHopperSlot(lastRequestAt) {
  const elapsed = Date.now() - lastRequestAt.value;
  const waitMs = Math.max(0, GRAPHHOPPER_REQUEST_INTERVAL_MS - elapsed);
  if (waitMs > 0) await sleep(waitMs);
  lastRequestAt.value = Date.now();
}

async function fetchGraphHopperLeg(from, to, settings, lastRequestAt) {
  await waitForGraphHopperSlot(lastRequestAt);
  const params = new URLSearchParams({
    profile: settings.profile,
    locale: state.language === "en" ? "en" : "zh-CN",
    points_encoded: "false",
    instructions: "false",
    calc_points: "true",
    key: settings.key,
  });
  params.append("point", `${from.lat},${from.lng}`);
  params.append("point", `${to.lat},${to.lng}`);

  const response = await fetch(`${GRAPHHOPPER_API_BASE}/route?${params.toString()}`);
  const payload = await response.json();
  if (!response.ok) throw new Error(`GraphHopper ${response.status}: ${graphHopperErrorMessage(payload)}`);
  const path = payload.paths?.[0];
  if (!path) throw new Error("GraphHopper route missing");

  return {
    distanceKm: path.distance / 1000,
    minutes: Math.max(1, Math.round(path.time / 60000)),
    geometry: (path.points?.coordinates || []).map(([lng, lat]) => [lat, lng]),
  };
}

async function fetchGraphHopperLegWithRetry(from, to, settings, lastRequestAt) {
  try {
    return await fetchGraphHopperLeg(from, to, settings, lastRequestAt);
  } catch (error) {
    if (!isGraphHopperRateLimit(error)) throw error;
    setStatus(t("graphhopperRetrying"));
    await sleep(GRAPHHOPPER_RATE_LIMIT_RETRY_MS);
    return fetchGraphHopperLeg(from, to, settings, lastRequestAt);
  }
}

async function enhanceRouteWithGraphHopper(routeDays) {
  const settings = graphHopperSettings();
  if (!settings.enabled || routeDays.length === 0) return { applied: false, skipped: true };
  if (!settings.key) {
    setStatus(t("graphhopperMissingKey"));
    return { applied: false, skipped: true, missingKey: true };
  }

  setStatus(t("graphhopperRouting"));
  const origin = getLocation();
  const totalLegs = routeDays.reduce((sum, dayClusters) => (
    sum + dayClusters.length + (getRouteMode() === "loop" && dayClusters.length > 0 ? 1 : 0)
  ), 0);
  const lastRequestAt = { value: 0 };
  let completedLegs = 0;
  setGraphHopperProgress(0, totalLegs, true);
  try {
    for (const dayClusters of routeDays) {
      for (let index = 0; index < dayClusters.length; index += 1) {
        const previous = index === 0 ? origin : dayClusters[index - 1].center;
        const cluster = dayClusters[index];
        const leg = await fetchGraphHopperLegWithRetry(previous, cluster.center, settings, lastRequestAt);
        cluster.legKm = leg.distanceKm;
        cluster.transport = { mode: graphHopperProfileLabel(settings.profile), time: `${leg.minutes} 分钟` };
        cluster.legGeometry = leg.geometry;
        completedLegs += 1;
        setGraphHopperProgress(completedLegs, totalLegs, true);
      }

      if (getRouteMode() === "loop" && dayClusters.length > 0) {
        const last = dayClusters[dayClusters.length - 1];
        const returnLeg = await fetchGraphHopperLegWithRetry(last.center, origin, settings, lastRequestAt);
        last.returnKm = returnLeg.distanceKm;
        last.returnTransport = { mode: graphHopperProfileLabel(settings.profile), time: `${returnLeg.minutes} 分钟` };
        last.returnGeometry = returnLeg.geometry;
        completedLegs += 1;
        setGraphHopperProgress(completedLegs, totalLegs, true);
      }
    }
    setTimeout(() => setGraphHopperProgress(0, 0, false), 1200);
    return { applied: true };
  } catch (error) {
    console.warn(error);
    recomputeRouteLegs(routeDays);
    setGraphHopperProgress(0, 0, false);
    return { applied: false, error, rateLimited: isGraphHopperRateLimit(error) };
  }
}

function travelMinutes(distanceKm) {
  return Number(transportForDistance(distanceKm).time.replace(/\D/g, "")) || 0;
}

function orderClustersForLoop(clusters, origin) {
  if (clusters.length <= 2) return clusters;
  const center = {
    lat: clusters.reduce((sum, cluster) => sum + cluster.center.lat, 0) / clusters.length,
    lng: clusters.reduce((sum, cluster) => sum + cluster.center.lng, 0) / clusters.length,
  };
  const sorted = [...clusters].sort((a, b) => (
    Math.atan2(a.center.lat - center.lat, a.center.lng - center.lng) -
    Math.atan2(b.center.lat - center.lat, b.center.lng - center.lng)
  ));
  const startIndex = sorted.reduce((bestIndex, cluster, index) => (
    haversineKm(origin, cluster.center) < haversineKm(origin, sorted[bestIndex].center) ? index : bestIndex
  ), 0);
  const clockwise = [...sorted.slice(startIndex), ...sorted.slice(0, startIndex)];
  const counterClockwise = [clockwise[0], ...clockwise.slice(1).reverse()];
  const clockwiseEnd = haversineKm(origin, clockwise[clockwise.length - 1].center);
  const counterEnd = haversineKm(origin, counterClockwise[counterClockwise.length - 1].center);
  return clockwiseEnd <= counterEnd ? clockwise : counterClockwise;
}

function orderClustersByNearest(clusters, location, days, stopsPerDay, options = {}) {
  const remaining = [...clusters];
  const route = [];
  const settings = getIntensitySettings();
  const budget = dailyBudgetMinutes();
  const effectiveStops = Math.max(1, Math.round(stopsPerDay * settings.stopMultiplier));
  let cursor = { lat: location.lat, lng: location.lng };

  for (let day = 0; day < days; day += 1) {
    const stops = [];
    let usedMinutes = 0;
    for (let i = 0; i < effectiveStops && remaining.length > 0; i += 1) {
      remaining.sort((a, b) => {
        const da = haversineKm(cursor, a.center);
        const db = haversineKm(cursor, b.center);
        return da - db;
      });
      const next = remaining.shift();
      next.legKm = haversineKm(cursor, next.center);
      next.transport = transportForDistance(next.legKm);
      const nextMinutes = travelMinutes(next.legKm) + settings.stopMinutes;
      if (stops.length > 0 && usedMinutes + nextMinutes > budget) {
        remaining.unshift(next);
        break;
      }
      next.stayMinutes = settings.stopMinutes;
      stops.push(next);
      usedMinutes += nextMinutes;
      cursor = next.center;
    }
    if (stops.length > 0) {
      const orderedStops = options.loop ? orderClustersForLoop(stops, location) : stops;
      orderedStops.forEach((stop, index) => {
        const previous = index === 0 ? location : orderedStops[index - 1].center;
        stop.legKm = haversineKm(previous, stop.center);
        stop.transport = transportForDistance(stop.legKm);
      });
      route.push(orderedStops);
    }
  }

  return route;
}

function buildRoute(points, location, days, stopsPerDay, mode = "normal") {
  let clusters = clusterPoints(points);
  if (mode === "dense" || mode === "loop") {
    const limit = Math.max(1, days * stopsPerDay);
    clusters = clusters
      .sort((a, b) => b.pointCount - a.pointCount || haversineKm(location, a.center) - haversineKm(location, b.center))
      .slice(0, limit);
  }
  return orderClustersByNearest(clusters, location, days, stopsPerDay, { loop: mode === "loop" });
}

function clearMap() {
  state.markers.forEach((marker) => marker.remove());
  state.markers = [];
  state.pointMarkers.clear();
  state.clusterMarkers.clear();
  if (state.focusMarker) {
    state.focusMarker.remove();
    state.focusMarker = null;
  }
  if (state.routeLine) {
    state.routeLine.remove();
    state.routeLine = null;
  }
}

function pointPopupHtml(point) {
  const ep = point.ep ? `第 ${point.ep} 集` : "集数未知";
  const time = point.s ? ` · ${secondsToText(point.s)}` : "";
  const image = point.image ? `<img src="${point.image}" alt="${escapeHtml(point.displayName)} 截图" loading="lazy" />` : "";
  return `
    <div class="point-popup">
      ${image}
      <strong>${escapeHtml(point.displayName)}</strong>
      <p>${escapeHtml(point.workTitle)} · ${ep}${time}</p>
      <p>来源：${escapeHtml(point.origin || "Anitabi")}</p>
    </div>
  `;
}

function renderMap(points, routeDays = []) {
  clearMap();
  const routeClusters = routeDays.flat();
  const routeIndexes = new Map(routeClusters.map((cluster, index) => [cluster.id, index]));

  if (routeClusters.length === 0) {
    points.forEach((point) => {
      const marker = L.marker([point.geo[0], point.geo[1]], {
        icon: pilgrimageIcon,
      })
        .bindPopup(pointPopupHtml(point))
        .addTo(map);
      state.pointMarkers.set(point.id, marker);
      state.markers.push(marker);
    });
  }

  routeClusters.forEach((cluster) => {
    const routeIndex = routeIndexes.get(cluster.id);
    const marker = L.marker([cluster.center.lat, cluster.center.lng], {
      icon: routeIcon(routeIndex),
    })
      .bindPopup(clusterPopupHtml(cluster))
      .addTo(map);
    marker.setZIndexOffset(1000);
    state.clusterMarkers.set(cluster.id, marker);
    state.markers.push(marker);
  });

  const start = getLocation();
  const graphHopperLines = routeClusters.flatMap((cluster) => [
    ...(cluster.legGeometry?.length ? [cluster.legGeometry] : []),
    ...(cluster.returnGeometry?.length ? [cluster.returnGeometry] : []),
  ]);
  if (graphHopperLines.length > 0) {
    state.routeLine = L.layerGroup(graphHopperLines.map((line) => (
      L.polyline(line, { color: "#147d64", weight: 4, opacity: 0.82 })
    ))).addTo(map);
  } else {
    const line = getRouteMode() === "loop"
      ? [[start.lat, start.lng], ...routeClusters.map((cluster) => [cluster.center.lat, cluster.center.lng]), [start.lat, start.lng]]
      : routeClusters.map((cluster) => [cluster.center.lat, cluster.center.lng]);
    if (line.length > 1) {
      state.routeLine = L.polyline(line, { color: "#147d64", weight: 4, opacity: 0.8 }).addTo(map);
    }
  }

  const bounds = L.latLngBounds([
    [Number($("latInput").value), Number($("lngInput").value)],
    ...points.map((point) => [point.geo[0], point.geo[1]]),
  ]);
  if (routeClusters.length > 0) {
    centerMapOnStart();
  } else if (bounds.isValid()) {
    map.fitBounds(bounds.pad(0.18));
  }
}

function centerMapOnStart() {
  const start = getLocation();
  const latLng = [start.lat, start.lng];
  const recenter = (animate = true) => {
    map.stop();
    map.invalidateSize({ pan: false });
    map.setView(latLng, 13, { animate: false });
    if (animate) map.flyTo(latLng, 13, { animate: true, duration: 0.55, easeLinearity: 0.35 });
  };
  requestAnimationFrame(() => {
    recenter(true);
    setTimeout(() => recenter(true), 220);
    setTimeout(() => recenter(false), 650);
  });
}

async function rerenderCurrentRoute() {
  recomputeRouteLegs(state.routeDays);
  const graphHopperResult = await enhanceRouteWithGraphHopper(state.routeDays);
  state.routeClusters = state.routeDays.flat();
  renderMap(state.points, state.routeDays);
  renderRoute(state.routeDays);
  return graphHopperResult;
}

function clusterPopupHtml(cluster) {
  const pointItems = cluster.points.slice(0, 12).map((point) => (
    `<li><button type="button" data-focus-point="${point.id}">
      ${point.image ? `<img src="${point.image}" alt="" loading="lazy" />` : ""}
      <span><strong>${escapeHtml(point.displayName)}</strong><small>${escapeHtml(point.workTitle)}</small></span>
    </button></li>`
  )).join("");
  const more = cluster.points.length > 12 ? `<li>还有 ${cluster.points.length - 12} 个巡礼点</li>` : "";
  return `
    <div class="cluster-popup">
      <strong>${escapeHtml(cluster.displayName)}</strong>
      <p>${cluster.pointCount} 个巡礼点 · ${escapeHtml(cluster.workSummary)}</p>
      <button class="cluster-delete" type="button" data-delete-cluster="${cluster.id}">${t("deleteCluster")}</button>
      <ul>${pointItems}${more}</ul>
    </div>
  `;
}

async function deleteCluster(clusterId) {
  const before = state.routeClusters.length;
  state.routeDays = state.routeDays
    .map((dayClusters) => dayClusters.filter((cluster) => cluster.id !== clusterId))
    .filter((dayClusters) => dayClusters.length > 0);
  state.expandedClusters.delete(clusterId);
  if (state.routeDays.flat().length === before) return;
  const graphHopperResult = await rerenderCurrentRoute();
  const graphHopperText = graphHopperResult?.rateLimited
    ? t("graphhopperRateLimited")
    : (graphHopperResult?.error ? t("graphhopperFailed") : "");
  setStatus(graphHopperText ? `${t("clusterDeleted")} ${graphHopperText}` : t("clusterDeleted"));
}

function focusPoint(point) {
  if (!point) return;
  const latLng = [point.geo[0], point.geo[1]];
  let marker = state.pointMarkers.get(point.id);
  if (state.focusMarker && marker !== state.focusMarker) {
    state.focusMarker.remove();
    state.focusMarker = null;
  }
  if (!marker) {
    marker = L.marker(latLng, { icon: pilgrimageIcon })
      .bindPopup(pointPopupHtml(point))
      .addTo(map);
    marker.setZIndexOffset(1200);
    state.focusMarker = marker;
  }
  map.invalidateSize();
  map.setView(latLng, Math.max(map.getZoom(), 17), { animate: true });
  marker.openPopup();
}

function focusCluster(cluster) {
  if (!cluster) return;
  const marker = state.clusterMarkers.get(cluster.id);
  const latLng = [cluster.center.lat, cluster.center.lng];
  map.invalidateSize();
  map.setView(latLng, Math.max(map.getZoom(), 16), { animate: true });
  if (marker) marker.openPopup();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function mapsUrl(points) {
  const params = points.map((point) => `${point.center.lat},${point.center.lng}`).join("/");
  return `https://www.google.com/maps/dir/${params}`;
}

function createPointCard(point, index) {
  const template = $("pointCardTemplate");
  const card = template.content.firstElementChild.cloneNode(true);
  const image = card.querySelector(".point-image");
  card.dataset.pointId = point.id;
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  image.src = point.image || "";
  image.alt = `${point.displayName} 截图`;
  card.querySelector(".point-topline").textContent =
    `${index + 1}. ${point.workTitle}${point.distanceKm ? ` · ${point.distanceKm.toFixed(1)} km` : ""}`;
  card.querySelector("h3").textContent = point.displayName;
  const ep = point.ep ? `第 ${point.ep} 集` : "集数未知";
  const time = point.s ? ` · ${secondsToText(point.s)}` : "";
  const leg = point.legKm ? ` · 本段约 ${point.legKm.toFixed(1)} km` : "";
  card.querySelector(".meta").textContent = `${ep}${time}${leg} · 来源：${point.origin}`;

  const links = card.querySelector(".links");
  links.innerHTML = `
    <a href="${point.originURL}" target="_blank" rel="noopener noreferrer">来源链接</a>
    <a href="https://anitabi.cn/map?bangumiId=${point.bangumiId}" target="_blank" rel="noopener noreferrer">Anitabi 地图</a>
  `;
  return card;
}

function renderClusterPoints(cluster, list) {
  list.innerHTML = "";
  const visibleCount = Math.min(
    state.expandedClusters.get(cluster.id) || 4,
    cluster.points.length,
  );
  cluster.points.slice(0, visibleCount).forEach((point, pointIndex) => {
    list.appendChild(createPointCard(point, pointIndex));
  });
  if (cluster.points.length > visibleCount) {
    const remaining = cluster.points.length - visibleCount;
    const more = document.createElement("button");
    more.className = "cluster-more";
    more.type = "button";
    more.dataset.expandCluster = cluster.id;
    more.textContent = `还有 ${remaining} 个巡礼点在该区域内，点击展开 ${Math.min(10, remaining)} 个。`;
    list.appendChild(more);
  }
}

function createClusterCard(cluster, index) {
  const card = document.createElement("article");
  card.className = "cluster-card";
  card.dataset.clusterId = cluster.id;
  const totalInnerKm = Math.max(0.1, cluster.clusterRadiusKm * 2);
  const returnText = cluster.returnKm
    ? ` · 返程约 ${cluster.returnKm.toFixed(1)} km · ${cluster.returnTransport?.time || ""}`
    : "";
  card.innerHTML = `
    <div class="cluster-heading">
      <div>
        <div class="point-topline">${index + 1}. ${cluster.transport.mode} · 上一段约 ${cluster.legKm.toFixed(1)} km · ${cluster.transport.time}${returnText} · 建议停留 ${cluster.stayMinutes || 40} 分钟</div>
        <h3>${escapeHtml(cluster.displayName)}</h3>
        <p class="meta">${cluster.pointCount} 个巡礼点 · ${escapeHtml(cluster.workSummary)} · 区域内约 ${totalInnerKm.toFixed(1)} km</p>
      </div>
      <span class="cluster-actions">
        <button class="secondary micro-button" type="button" data-delete-cluster="${cluster.id}">${t("deleteCluster")}</button>
        <a href="https://www.google.com/maps/search/?api=1&query=${cluster.center.lat},${cluster.center.lng}" target="_blank" rel="noopener noreferrer">打开地点</a>
      </span>
    </div>
    <div class="cluster-points"></div>
  `;
  const list = card.querySelector(".cluster-points");
  renderClusterPoints(cluster, list);
  card.querySelector(".cluster-heading").addEventListener("click", (event) => {
    if (event.target.closest("a, button")) return;
    focusCluster(cluster);
  });
  return card;
}

function renderRoute(routeDays) {
  const panel = $("routePanel");
  panel.innerHTML = "";
  if (routeDays.length === 0) {
    panel.innerHTML = '<div class="empty">当前条件下没有可规划的路线，尝试扩大半径或更换作品集合。</div>';
    return;
  }

  routeDays.forEach((dayClusters, dayIndex) => {
    const block = document.createElement("section");
    block.className = "day-block";
    const totalKm = dayClusters.reduce((sum, cluster) => sum + (cluster.legKm || 0) + (cluster.returnKm || 0), 0);
    const totalPoints = dayClusters.reduce((sum, cluster) => sum + cluster.pointCount, 0);
    block.innerHTML = `
      <div class="day-header">
        <h2>第 ${dayIndex + 1} 天 · ${dayClusters.length} 个大巡礼点 · ${totalPoints} 个巡礼点 · 段间约 ${totalKm.toFixed(1)} km</h2>
        <a href="${mapsUrl(dayClusters)}" target="_blank" rel="noopener noreferrer">打开导航</a>
      </div>
    `;
    dayClusters.forEach((cluster, index) => block.appendChild(createClusterCard(cluster, index)));
    panel.appendChild(block);
  });
}

function renderNearby(points) {
  const panel = $("nearbyPanel");
  panel.innerHTML = "";
  if (points.length === 0) {
    panel.innerHTML = '<div class="empty">附近没有匹配地标，尝试扩大半径或更换作品集合。</div>';
    return;
  }
  points.slice(0, 24).forEach((point, index) => panel.appendChild(createPointCard(point, index)));
}

function findPointById(pointId) {
  return state.points.find((point) => point.id === pointId);
}

function findClusterById(clusterId) {
  return state.routeClusters.find((cluster) => cluster.id === clusterId);
}

function updateShareUrl(push = false) {
  const params = new URLSearchParams();
  const location = getLocation();
  const ids = getSubjectIds();
  if (ids.length > 0) params.set("subjects", ids.join(","));
  if (Number.isFinite(location.lat) && Number.isFinite(location.lng)) {
    params.set("lat", location.lat.toFixed(6));
    params.set("lng", location.lng.toFixed(6));
  }
  params.set("radius", String(getRadiusKm()));
  params.set("days", $("daysInput").value);
  params.set("stops", $("stopsInput").value);
  params.set("mode", getRouteMode());
  params.set("intensity", $("intensitySelect").value);
  params.set("start", $("dayStartInput").value);
  params.set("end", $("dayEndInput").value);
  params.set("lang", state.language);
  const url = `${window.location.pathname}?${params.toString()}`;
  window.history[push ? "pushState" : "replaceState"](null, "", url);
}

async function shareCurrentRoute() {
  updateShareUrl(true);
  const url = window.location.href;
  try {
    await navigator.clipboard.writeText(url);
    setStatus("分享链接已复制到剪贴板。");
  } catch {
    setStatus(`分享链接已更新到地址栏：${url}`);
  }
}

function applyUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const subjects = params.get("subjects");
  if (subjects) {
    $("subjectInput").value = subjects;
    syncStateFromSubjectInput();
  }
  if (params.has("lat")) $("latInput").value = params.get("lat");
  if (params.has("lng")) $("lngInput").value = params.get("lng");
  if (params.has("radius")) $("radiusSelect").value = params.get("radius");
  if (params.has("days")) $("daysInput").value = params.get("days");
  if (params.has("stops")) $("stopsInput").value = params.get("stops");
  if (params.has("mode")) $("routeModeSelect").value = params.get("mode");
  if (params.has("intensity")) $("intensitySelect").value = params.get("intensity");
  if (params.has("start")) $("dayStartInput").value = params.get("start");
  if (params.has("end")) $("dayEndInput").value = params.get("end");
  if (params.has("lang")) applyLanguage(params.get("lang") === "en" ? "en" : "zh");
  syncUserMarker("分享链接");
}

function kmlEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[char]);
}

function pointDescription(point) {
  const ep = point.ep ? `第 ${point.ep} 集` : "集数未知";
  const time = point.s ? ` ${secondsToText(point.s)}` : "";
  return `${point.workTitle}\n${ep}${time}\n来源：${point.origin || "Anitabi"}\n${point.originURL || ""}`;
}

function buildKml() {
  if (state.routeDays.length === 0) {
    throw new Error("请先生成路线，再导出 KML。");
  }
  const dayFolders = state.routeDays.map((dayClusters, dayIndex) => {
    const start = getLocation();
    const coordinates = dayClusters.map((cluster) => `${cluster.center.lng},${cluster.center.lat},0`);
    if (getRouteMode() === "loop") {
      coordinates.unshift(`${start.lng},${start.lat},0`);
      coordinates.push(`${start.lng},${start.lat},0`);
    }
    const lineCoordinates = coordinates.join(" ");
    const clusterPlacemarks = dayClusters.map((cluster, index) => `
    <Placemark>
      <name>${index + 1}. ${kmlEscape(cluster.displayName)}</name>
      <description>${kmlEscape(`${cluster.pointCount} 个巡礼点\n${cluster.workSummary}`)}</description>
      <Point><coordinates>${cluster.center.lng},${cluster.center.lat},0</coordinates></Point>
    </Placemark>
  `).join("");
    const pointPlacemarks = dayClusters.flatMap((cluster) => cluster.points.map((point) => `
    <Placemark>
      <name>${kmlEscape(point.displayName)}</name>
      <description>${kmlEscape(pointDescription(point))}</description>
      <Point><coordinates>${point.geo[1]},${point.geo[0]},0</coordinates></Point>
    </Placemark>
  `)).join("");
    return `
    <Folder>
      <name>第 ${dayIndex + 1} 天</name>
      <Folder><name>大巡礼点</name>${clusterPlacemarks}</Folder>
      <Folder><name>小巡礼点</name>${pointPlacemarks}</Folder>
      <Placemark>
        <name>第 ${dayIndex + 1} 天访问顺序</name>
        <LineString>
          <tessellate>1</tessellate>
          <coordinates>${lineCoordinates}</coordinates>
        </LineString>
      </Placemark>
    </Folder>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Anitabi 巡礼路线</name>
    ${dayFolders}
  </Document>
</kml>`;
}

function exportKml() {
  try {
    const blob = new Blob([buildKml()], {
      type: "application/vnd.google-earth.kml+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `anitabi-route-${new Date().toISOString().slice(0, 10)}.kml`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("已导出 KML。可在 Google My Maps 中新建地图并导入该文件。");
  } catch (error) {
    setStatus(error.message);
  }
}

function renderInitialPanels() {
  $("routePanel").innerHTML = `<div class="empty">${t("chooseAndPlan")}</div>`;
  $("nearbyPanel").innerHTML = `<div class="empty">${t("chooseAndNearby")}</div>`;
}

async function planTrip(nearbyOnly = false) {
  try {
    const location = syncUserMarker();
    const radiusKm = getRadiusKm();
    if (getSubjectIds().length === 0) {
      throw new Error("Anitabi 公开 API 目前只支持按 Bangumi 作品 ID 获取地标；不选作品的全站最近圣地路线需要后端维护授权地标索引或等待 Anitabi 提供附近地标 API。");
    }
    const points = await loadPoints();
    const nearby = rankedNearby(points, location, radiusKm);
    const days = Number($("daysInput").value);
    const stops = Number($("stopsInput").value);
    const routeDays = nearbyOnly ? [] : buildRoute(nearby, location, days, stops, getRouteMode());
    const graphHopperResult = nearbyOnly ? { applied: false, skipped: true } : await enhanceRouteWithGraphHopper(routeDays);
    state.expandedClusters.clear();
    state.routeClusters = routeDays.flat();
    state.routeDays = routeDays;

    renderMap(nearby.length ? nearby : points, routeDays);
    renderRoute(routeDays);
    renderNearby(nearby);
    setActiveTab(nearbyOnly ? "nearby" : "route");
    if (!nearbyOnly && routeDays.length > 0) centerMapOnStart();

    if (nearby.length === 0) {
      setStatus(`已读取 ${points.length} 个地标，但半径内没有匹配项。`);
    } else {
      const modeText = !nearbyOnly && getRouteMode() === "dense"
        ? "，已优先选择高密度区域"
        : (!nearbyOnly && getRouteMode() === "loop" ? "，已尽量生成环路" : "");
      const graphHopperText = graphHopperResult.applied
        ? ` ${t("graphhopperReady")}`
        : (
          graphHopperResult.rateLimited
            ? ` ${t("graphhopperRateLimited")}`
            : (graphHopperResult.error ? ` ${t("graphhopperFailed")}` : (graphHopperResult.missingKey ? ` ${t("graphhopperMissingKey")}` : ""))
        );
      setStatus(`找到 ${nearby.length} 个半径内地标${nearbyOnly ? "。" : `${modeText}，路线已生成。`}${graphHopperText}`);
    }
  } catch (error) {
    setStatus(error.message);
  }
}

function setActiveTab(tab) {
  state.currentView = tab;
  $("routeTab").classList.toggle("active", tab === "route");
  $("nearbyTab").classList.toggle("active", tab === "nearby");
  $("routePanel").classList.toggle("hidden", tab !== "route");
  $("nearbyPanel").classList.toggle("hidden", tab !== "nearby");
}

function locateCurrentPosition() {
  if (!navigator.geolocation) {
    setStatus("当前浏览器不支持定位。");
    return;
  }
  setStatus("正在请求浏览器定位...");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      setLocation(position.coords.latitude, position.coords.longitude, "浏览器定位");
      setStatus("已更新当前位置。");
    },
    (error) => setStatus(`定位失败：${error.message}`),
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

$("planBtn").addEventListener("click", () => planTrip(false));
$("nearbyBtn").addEventListener("click", () => planTrip(true));
$("exportKmlBtn").addEventListener("click", () => exportKml());
$("shareBtn").addEventListener("click", () => shareCurrentRoute());
$("mapZoomInBtn").addEventListener("click", () => map.zoomIn());
$("mapZoomOutBtn").addEventListener("click", () => map.zoomOut());
$("mapLocateBtn").addEventListener("click", () => locateCurrentPosition());
$("routeTab").addEventListener("click", () => setActiveTab("route"));
$("nearbyTab").addEventListener("click", () => setActiveTab("nearby"));
$("radiusSelect").addEventListener("change", () => {
  renderRangeCircle();
  updateShareUrl(false);
  setStatus(getRadiusKm() >= 99999 ? "搜索范围已设为不限。" : `搜索范围已更新为 ${getRadiusKm()} km。`);
});
$("daysInput").addEventListener("change", () => updateShareUrl(false));
$("stopsInput").addEventListener("change", () => updateShareUrl(false));
$("routeModeSelect").addEventListener("change", () => updateShareUrl(false));
$("intensitySelect").addEventListener("change", () => updateShareUrl(false));
$("dayStartInput").addEventListener("change", () => updateShareUrl(false));
$("dayEndInput").addEventListener("change", () => updateShareUrl(false));
$("graphhopperEnabled").addEventListener("change", () => saveGraphHopperSettings());
$("graphhopperKeyInput").addEventListener("change", () => saveGraphHopperSettings());
$("graphhopperProfileSelect").addEventListener("change", () => saveGraphHopperSettings());
$("languageSelect").addEventListener("change", (event) => {
  applyLanguage(event.target.value);
  updateShareUrl(false);
  setStatus(t("ready"));
});
$("latInput").addEventListener("change", () => {
  try {
    syncUserMarker("手动输入");
    updateShareUrl(false);
    setStatus("已通过经纬度更新出发点。");
  } catch (error) {
    setStatus(error.message);
  }
});
$("lngInput").addEventListener("change", () => {
  try {
    syncUserMarker("手动输入");
    updateShareUrl(false);
    setStatus("已通过经纬度更新出发点。");
  } catch (error) {
    setStatus(error.message);
  }
});
$("locationSearchBtn").addEventListener("click", () => searchLocations());
$("locationSearchInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchLocations();
});
$("bangumiSearchBtn").addEventListener("click", () => searchBangumiSubjects());
$("bangumiSearchInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchBangumiSubjects();
});
$("selectCoveredSubjectsBtn").addEventListener("click", () => selectCoveredSearchResults());
$("selectAllSubjectsBtn").addEventListener("click", () => selectAllSearchResults());
$("clearSubjectsBtn").addEventListener("click", () => clearSelectedSubjects());
$("removeMissingSubjectsBtn").addEventListener("click", () => removeMissingSubjects());
$("subjectInput").addEventListener("change", () => syncStateFromSubjectInput());
$("selectedSubjects").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-subject]");
  if (button) removeSelectedSubject(button.dataset.removeSubject);
});
$("routePanel").addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-cluster]");
  if (deleteButton) {
    deleteCluster(deleteButton.dataset.deleteCluster);
    return;
  }
  const expandButton = event.target.closest("[data-expand-cluster]");
  if (expandButton) {
    const clusterCard = expandButton.closest("[data-cluster-id]");
    const cluster = findClusterById(expandButton.dataset.expandCluster);
    const currentCount = state.expandedClusters.get(expandButton.dataset.expandCluster) || 4;
    state.expandedClusters.set(expandButton.dataset.expandCluster, currentCount + 10);
    if (cluster && clusterCard) {
      renderClusterPoints(cluster, clusterCard.querySelector(".cluster-points"));
    }
    return;
  }
  const pointCard = event.target.closest("[data-point-id]");
  if (pointCard && !event.target.closest("a")) {
    focusPoint(findPointById(pointCard.dataset.pointId));
  }
});
$("nearbyPanel").addEventListener("click", (event) => {
  const pointCard = event.target.closest("[data-point-id]");
  if (pointCard && !event.target.closest("a")) focusPoint(findPointById(pointCard.dataset.pointId));
});
map.on("popupopen", (event) => {
  const popupElement = event.popup.getElement();
  popupElement?.querySelectorAll("[data-delete-cluster]").forEach((button) => {
    button.addEventListener("click", () => deleteCluster(button.dataset.deleteCluster));
  });
  popupElement?.querySelectorAll("[data-focus-point]").forEach((button) => {
    button.addEventListener("click", () => focusPoint(findPointById(button.dataset.focusPoint)));
  });
});
map.on("click", (event) => {
  if (event.originalEvent.target.closest?.(".leaflet-marker-icon, .leaflet-popup")) return;
  setLocation(event.latlng.lat, event.latlng.lng, "地图选点", 15);
  updateShareUrl(false);
  setStatus("已通过地图点击更新出发点。");
});

loadGraphHopperSettings();
applyLanguage(new URLSearchParams(window.location.search).get("lang") === "en" ? "en" : "zh");
applyUrlParams();
renderInitialPanels();
renderRangeCircle();
setStatus(t("chooseAndPlan"));
