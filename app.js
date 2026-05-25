const API_BASE = "https://api.anitabi.cn";

const PRESETS = {
  kyoto: ["115908", "2581", "126461"],
  "japan-classics": ["115908", "126461", "111723", "1428"],
};

const FALLBACK_POINTS = [
  {
    id: "demo-uji-1",
    bangumiId: 115908,
    workTitle: "吹响吧！上低音号",
    name: "宇治桥",
    image: "https://image.anitabi.cn/points/115908/qys7fu.jpg?plan=h160",
    ep: 1,
    s: 1,
    geo: [34.8914, 135.8069],
    origin: "Anitabi demo fallback",
    originURL: "https://anitabi.cn/map?bangumiId=115908",
  },
  {
    id: "demo-uji-2",
    bangumiId: 115908,
    workTitle: "吹响吧！上低音号",
    name: "宇治神社附近",
    image: "https://image.anitabi.cn/bangumi/115908.jpg?plan=h160",
    ep: 1,
    s: 1,
    geo: [34.8919, 135.8112],
    origin: "Anitabi demo fallback",
    originURL: "https://anitabi.cn/map?bangumiId=115908",
  },
  {
    id: "demo-kyoto-1",
    bangumiId: 2581,
    workTitle: "轻音少女",
    name: "京都市内巡礼点",
    image: "https://image.anitabi.cn/bangumi/2581.jpg?plan=h160",
    ep: 1,
    s: 1,
    geo: [35.0116, 135.7681],
    origin: "Anitabi demo fallback",
    originURL: "https://anitabi.cn/map?bangumiId=2581",
  },
];

const state = {
  points: [],
  markers: [],
  routeLine: null,
  currentView: "route",
};

const $ = (id) => document.getElementById(id);

const map = L.map("map", { zoomControl: true }).setView([34.8909, 135.8074], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const userMarker = L.marker([34.8909, 135.8074], {
  title: "当前位置",
}).addTo(map);

function setStatus(message) {
  $("status").textContent = message;
}

function getLocation() {
  return {
    lat: Number($("latInput").value),
    lng: Number($("lngInput").value),
  };
}

function syncUserMarker() {
  const location = getLocation();
  if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
    throw new Error("请输入有效经纬度");
  }
  userMarker.setLatLng([location.lat, location.lng]).bindPopup("当前位置");
  map.setView([location.lat, location.lng], Math.max(map.getZoom(), 12));
  return location;
}

function getSubjectIds() {
  const raw = $("subjectInput").value;
  return [...new Set(raw.split(/[,，\s]+/).map((id) => id.trim()).filter(Boolean))];
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
  try {
    const batches = await Promise.all(ids.map(fetchSubjectPoints));
    const points = batches.flat();
    if (points.length === 0) throw new Error("没有读取到含坐标的地标");
    state.points = points;
    setStatus(`已读取 ${points.length} 个地标，来自 ${ids.length} 个作品。`);
    return points;
  } catch (error) {
    console.warn(error);
    state.points = FALLBACK_POINTS.map((point) => ({
      ...point,
      displayName: point.name,
    }));
    setStatus("Anitabi API 暂不可用，已切换到内置示例数据。");
    return state.points;
  }
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
  const routePointIds = new Set(routeDays.flat().map((point) => point.id));

  points.forEach((point) => {
    const marker = L.marker([point.geo[0], point.geo[1]])
      .bindPopup(`<strong>${escapeHtml(point.displayName)}</strong><br>${escapeHtml(point.workTitle)}`)
      .addTo(map);
    if (routePointIds.has(point.id)) marker.setZIndexOffset(1000);
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

async function planTrip(nearbyOnly = false) {
  try {
    const location = syncUserMarker();
    const radiusKm = Number($("radiusSelect").value);
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

$("presetSelect").addEventListener("change", (event) => {
  const ids = PRESETS[event.target.value];
  if (ids) $("subjectInput").value = ids.join(", ");
});

$("demoLocationBtn").addEventListener("click", () => {
  $("latInput").value = "34.8909";
  $("lngInput").value = "135.8074";
  syncUserMarker();
});

$("locateBtn").addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("当前浏览器不支持定位。");
    return;
  }
  setStatus("正在请求浏览器定位...");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      $("latInput").value = position.coords.latitude.toFixed(6);
      $("lngInput").value = position.coords.longitude.toFixed(6);
      syncUserMarker();
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

planTrip(false);
