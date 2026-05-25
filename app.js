const API_BASE = "https://api.anitabi.cn";
const BANGUMI_API_BASE = "https://api.bgm.tv";
const NOMINATIM_API_BASE = "https://nominatim.openstreetmap.org";

const state = {
  points: [],
  markers: [],
  routeLine: null,
  rangeCircle: null,
  currentView: "route",
  selectedSubjects: [],
};

const $ = (id) => document.getElementById(id);

const map = L.map("map", { zoomControl: true }).setView([34.8909, 135.8074], 12);
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

function setLocation(lat, lng, label = "当前位置") {
  $("latInput").value = Number(lat).toFixed(6);
  $("lngInput").value = Number(lng).toFixed(6);
  const location = syncUserMarker(label);
  return location;
}

function getLocation() {
  return {
    lat: Number($("latInput").value),
    lng: Number($("lngInput").value),
  };
}

function syncUserMarker(label = "当前位置") {
  const location = getLocation();
  if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
    throw new Error("请输入有效经纬度");
  }
  userMarker.setLatLng([location.lat, location.lng]).bindPopup(escapeHtml(label));
  renderRangeCircle(location);
  map.setView([location.lat, location.lng], Math.max(map.getZoom(), 12));
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
}

function syncStateFromSubjectInput() {
  const existing = new Map(state.selectedSubjects.map((subject) => [String(subject.id), subject]));
  state.selectedSubjects = getSubjectIds().map((id) => existing.get(String(id)) || {
    id: String(id),
    title: `Bangumi ${id}`,
    image: "",
    meta: "手动输入",
  });
  renderSelectedSubjects();
}

function addSelectedSubject(subject) {
  const id = String(subject.id);
  if (state.selectedSubjects.some((item) => String(item.id) === id)) return;
  state.selectedSubjects.push({
    id,
    title: subjectTitle(subject),
    name: subject.name || "",
    image: subjectCover(subject),
    meta: subjectMeta(subject),
  });
  syncSubjectInputFromState();
  renderSelectedSubjects();
}

function removeSelectedSubject(subjectId) {
  state.selectedSubjects = state.selectedSubjects.filter((subject) => String(subject.id) !== String(subjectId));
  syncSubjectInputFromState();
  renderSelectedSubjects();
}

function renderSelectedSubjects() {
  const container = $("selectedSubjects");
  container.innerHTML = "";
  if (state.selectedSubjects.length === 0) {
    container.innerHTML = '<div class="empty">尚未选择作品。可以搜索 Bangumi 条目或手动输入 ID。</div>';
    return;
  }

  state.selectedSubjects.forEach((subject) => {
    const item = document.createElement("div");
    item.className = "subject-chip";
    item.innerHTML = `
      <img alt="" src="${subject.image || ""}" loading="lazy" />
      <div class="subject-title">
        <strong>${escapeHtml(subject.title)}</strong>
        <span>${escapeHtml(subject.meta || `Bangumi ${subject.id}`)}</span>
      </div>
      <button class="secondary mini-button" type="button" data-remove-subject="${subject.id}">移除</button>
    `;
    container.appendChild(item);
  });
}

function renderBangumiSearchResults(subjects) {
  const container = $("bangumiSearchResults");
  container.innerHTML = "";
  if (subjects.length === 0) {
    container.innerHTML = '<div class="empty">没有找到动画条目。</div>';
    return;
  }

  subjects.forEach((subject) => {
    const item = document.createElement("div");
    item.className = "subject-result";
    item.innerHTML = `
      <img alt="" src="${subjectCover(subject)}" loading="lazy" />
      <div class="subject-title">
        <strong>${escapeHtml(subjectTitle(subject))}</strong>
        <span>${escapeHtml(subjectMeta(subject))}</span>
      </div>
      <button class="mini-button" type="button" data-add-subject="${subject.id}">加入</button>
    `;
    item.querySelector("[data-add-subject]").addEventListener("click", () => addSelectedSubject(subject));
    container.appendChild(item);
  });
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
    renderBangumiSearchResults(subjects);
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
  const batches = await Promise.all(ids.map(fetchSubjectPoints));
  const points = batches.flat();
  if (points.length === 0) throw new Error("没有读取到含坐标的地标");
  state.points = points;
  setStatus(`已读取 ${points.length} 个地标，来自 ${ids.length} 个作品。`);
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

function buildRoute(points, location, days, stopsPerDay) {
  const remaining = [...points];
  const route = [];
  let cursor = { lat: location.lat, lng: location.lng };

  for (let day = 0; day < days; day += 1) {
    const stops = [];
    for (let i = 0; i < stopsPerDay && remaining.length > 0; i += 1) {
      remaining.sort((a, b) => {
        const da = haversineKm(cursor, { lat: a.geo[0], lng: a.geo[1] });
        const db = haversineKm(cursor, { lat: b.geo[0], lng: b.geo[1] });
        return da - db;
      });
      const next = remaining.shift();
      next.legKm = haversineKm(cursor, { lat: next.geo[0], lng: next.geo[1] });
      stops.push(next);
      cursor = { lat: next.geo[0], lng: next.geo[1] };
    }
    if (stops.length > 0) route.push(stops);
  }

  return route;
}

function clearMap() {
  state.markers.forEach((marker) => marker.remove());
  state.markers = [];
  if (state.routeLine) {
    state.routeLine.remove();
    state.routeLine = null;
  }
}

function renderMap(points, routeDays = []) {
  clearMap();
  const routeIndexes = new Map(routeDays.flat().map((point, index) => [point.id, index]));

  points.forEach((point) => {
    const routeIndex = routeIndexes.get(point.id);
    const marker = L.marker([point.geo[0], point.geo[1]], {
      icon: routeIndex === undefined ? pilgrimageIcon : routeIcon(routeIndex),
    })
      .bindPopup(`<strong>${escapeHtml(point.displayName)}</strong><br>${escapeHtml(point.workTitle)}`)
      .addTo(map);
    if (routeIndex !== undefined) marker.setZIndexOffset(1000);
    state.markers.push(marker);
  });

  const line = routeDays.flat().map((point) => [point.geo[0], point.geo[1]]);
  if (line.length > 1) {
    state.routeLine = L.polyline(line, { color: "#147d64", weight: 4, opacity: 0.8 }).addTo(map);
  }

  const bounds = L.latLngBounds([
    [Number($("latInput").value), Number($("lngInput").value)],
    ...points.map((point) => [point.geo[0], point.geo[1]]),
  ]);
  if (bounds.isValid()) map.fitBounds(bounds.pad(0.18));
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
  const params = points.map((point) => `${point.geo[0]},${point.geo[1]}`).join("/");
  return `https://www.google.com/maps/dir/${params}`;
}

function createPointCard(point, index) {
  const template = $("pointCardTemplate");
  const card = template.content.firstElementChild.cloneNode(true);
  const image = card.querySelector(".point-image");
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

function renderRoute(routeDays) {
  const panel = $("routePanel");
  panel.innerHTML = "";
  if (routeDays.length === 0) {
    panel.innerHTML = '<div class="empty">当前条件下没有可规划的路线，尝试扩大半径或更换作品集合。</div>';
    return;
  }

  routeDays.forEach((dayPoints, dayIndex) => {
    const block = document.createElement("section");
    block.className = "day-block";
    const totalKm = dayPoints.reduce((sum, point) => sum + (point.legKm || 0), 0);
    block.innerHTML = `
      <div class="day-header">
        <h2>第 ${dayIndex + 1} 天 · ${dayPoints.length} 个地点 · 约 ${totalKm.toFixed(1)} km</h2>
        <a href="${mapsUrl(dayPoints)}" target="_blank" rel="noopener noreferrer">打开导航</a>
      </div>
    `;
    dayPoints.forEach((point, index) => block.appendChild(createPointCard(point, index)));
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

function renderInitialPanels() {
  $("routePanel").innerHTML = '<div class="empty">请选择作品集合，然后生成路线。</div>';
  $("nearbyPanel").innerHTML = '<div class="empty">请选择作品集合，然后查看附近圣地。</div>';
}

async function planTrip(nearbyOnly = false) {
  try {
    const location = syncUserMarker();
    const radiusKm = getRadiusKm();
    const points = await loadPoints();
    const nearby = rankedNearby(points, location, radiusKm);
    const days = Number($("daysInput").value);
    const stops = Number($("stopsInput").value);
    const routeDays = nearbyOnly ? [] : buildRoute(nearby, location, days, stops);

    renderMap(nearby.length ? nearby : points, routeDays);
    renderRoute(routeDays);
    renderNearby(nearby);
    setActiveTab(nearbyOnly ? "nearby" : "route");

    if (nearby.length === 0) {
      setStatus(`已读取 ${points.length} 个地标，但半径内没有匹配项。`);
    } else {
      setStatus(`找到 ${nearby.length} 个半径内地标${nearbyOnly ? "。" : "，路线已生成。"}`);
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

$("locateBtn").addEventListener("click", () => {
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
});

$("planBtn").addEventListener("click", () => planTrip(false));
$("nearbyBtn").addEventListener("click", () => planTrip(true));
$("routeTab").addEventListener("click", () => setActiveTab("route"));
$("nearbyTab").addEventListener("click", () => setActiveTab("nearby"));
$("radiusSelect").addEventListener("change", () => {
  renderRangeCircle();
  setStatus(getRadiusKm() >= 99999 ? "搜索范围已设为不限。" : `搜索范围已更新为 ${getRadiusKm()} km。`);
});
$("latInput").addEventListener("change", () => {
  try {
    syncUserMarker("手动输入");
    setStatus("已通过经纬度更新出发点。");
  } catch (error) {
    setStatus(error.message);
  }
});
$("lngInput").addEventListener("change", () => {
  try {
    syncUserMarker("手动输入");
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
$("subjectInput").addEventListener("change", () => syncStateFromSubjectInput());
$("selectedSubjects").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-subject]");
  if (button) removeSelectedSubject(button.dataset.removeSubject);
});
map.on("click", (event) => {
  setLocation(event.latlng.lat, event.latlng.lng, "地图选点");
  setStatus("已通过地图点击更新出发点。");
});

renderSelectedSubjects();
renderInitialPanels();
renderRangeCircle();
setStatus("请选择作品集合并生成路线。");
