var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/profile-api.js
var PROFILE_API_PREFIX = "/api/profile";
var SESSION_COOKIE = "mm_session";
var PASSWORD_ITERATIONS = 21e4;
var MAX_JSON_BYTES = 16 * 1024;
var SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1e3;
var SESSION_TOUCH_INTERVAL_MS = 60 * 60 * 1e3;
var GAME_EVENTS_PER_DAY = 500;
var REWARD_EVENTS_PER_DAY = 40;
var REWARD_COOLDOWN_MS = 15e3;
var AVATAR_EVENTS_PER_DAY = 100;
var AVATAR_OPTIONS = Object.freeze({
  characters: Object.freeze([
    "mochi",
    "mango",
    "pandy",
    "neko",
    "zuzu",
    "puddle-pip",
    "toasty-dragon"
  ]),
  frames: Object.freeze([
    "none",
    "scallop",
    "berry",
    "sparkle",
    "bamboo",
    "starlight",
    "flower-crown",
    "world-tour",
    "champion"
  ]),
  backgrounds: Object.freeze([
    "peach-sky",
    "matcha-meadow",
    "candy-clouds",
    "moonlit",
    "cosmic",
    "golden-arcade"
  ])
});
var AVATAR_SETS = Object.freeze({
  character: new Set(AVATAR_OPTIONS.characters),
  frame: new Set(AVATAR_OPTIONS.frames),
  background: new Set(AVATAR_OPTIONS.backgrounds)
});
var ACHIEVEMENT_METRICS = /* @__PURE__ */ new Set([
  "total_score",
  "games_played",
  "wins",
  "rewards_claimed",
  "avatar_changes",
  "distinct_games",
  "best_score"
]);
var REWARD_RULES = Object.freeze({
  coins: Object.freeze({ minimum: 1, maximum: 25, defaultValue: 10 }),
  "extra-life": Object.freeze({ minimum: 1, maximum: 1, defaultValue: 1 }),
  energy: Object.freeze({ minimum: 1, maximum: 5, defaultValue: 3 }),
  "extra-time": Object.freeze({ minimum: 5, maximum: 60, defaultValue: 30 }),
  "power-up": Object.freeze({ minimum: 1, maximum: 1, defaultValue: 1 })
});
var REWARD_ALIASES = Object.freeze({
  life: "extra-life",
  lives: "extra-life",
  time: "extra-time",
  powerup: "power-up"
});
var encoder = new TextEncoder();
var ProfileApiError = class extends Error {
  static {
    __name(this, "ProfileApiError");
  }
  constructor(status, code, message, headers = void 0) {
    super(message);
    this.name = "ProfileApiError";
    this.status = status;
    this.code = code;
    this.headers = headers;
  }
};
function fail(status, code, message, headers) {
  throw new ProfileApiError(status, code, message, headers);
}
__name(fail, "fail");
function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(bytesToBase64Url, "bytesToBase64Url");
function base64UrlToBytes(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new TypeError("Invalid base64url value");
  }
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
__name(base64UrlToBytes, "base64UrlToBytes");
function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}
__name(constantTimeEqual, "constantTimeEqual");
async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}
__name(sha256, "sha256");
async function hashPassword(password, salt, iterations = PASSWORD_ITERATIONS) {
  if (typeof password !== "string") throw new TypeError("Password must be a string");
  if (!Number.isInteger(iterations) || iterations < 1e5 || iterations > 1e6) {
    throw new RangeError("PBKDF2 iterations are outside the accepted range");
  }
  const saltBytes = salt ? base64UrlToBytes(salt) : crypto.getRandomValues(new Uint8Array(16));
  if (saltBytes.byteLength < 16 || saltBytes.byteLength > 64) throw new RangeError("Invalid salt length");
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations },
    key,
    256
  );
  return {
    algorithm: "PBKDF2-SHA256",
    iterations,
    salt: bytesToBase64Url(saltBytes),
    hash: bytesToBase64Url(new Uint8Array(bits))
  };
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, salt, expectedHash, iterations = PASSWORD_ITERATIONS) {
  try {
    const actual = await hashPassword(password, salt, Number(iterations));
    return constantTimeEqual(base64UrlToBytes(actual.hash), base64UrlToBytes(expectedHash));
  } catch {
    return false;
  }
}
__name(verifyPassword, "verifyPassword");
function normaliseUsername(value) {
  if (typeof value !== "string") fail(400, "invalid_username", "Username is required.");
  const username = value.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9_-]{1,22}[a-z0-9])$/.test(username)) {
    fail(400, "invalid_username", "Use 3\u201324 letters, numbers, underscores, or hyphens.");
  }
  return username;
}
__name(normaliseUsername, "normaliseUsername");
function normaliseEmail(value) {
  if (value === void 0 || value === null || value === "") return null;
  if (typeof value !== "string") fail(400, "invalid_email", "Email must be a string.");
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail(400, "invalid_email", "Enter a valid email address.");
  }
  return email;
}
__name(normaliseEmail, "normaliseEmail");
function normaliseDisplayName(value, fallback) {
  const displayName = typeof value === "string" ? value.trim() : fallback;
  if (!displayName || displayName.length > 40 || /[<>\u0000-\u001f\u007f]/.test(displayName)) {
    fail(400, "invalid_display_name", "Display name must be 1\u201340 plain-text characters.");
  }
  return displayName;
}
__name(normaliseDisplayName, "normaliseDisplayName");
function normaliseBio(value) {
  if (value === void 0) return void 0;
  if (typeof value !== "string") fail(400, "invalid_bio", "Bio must be text.");
  const bio = value.trim();
  if (bio.length > 280 || /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(bio)) {
    fail(400, "invalid_bio", "Bio must be at most 280 plain-text characters.");
  }
  return bio;
}
__name(normaliseBio, "normaliseBio");
function validatePasswordInput(password) {
  if (typeof password !== "string" || password.length < 10 || password.length > 128) {
    fail(400, "invalid_password", "Password must be 10\u2013128 characters.");
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    fail(400, "invalid_password", "Password must contain at least one letter and one number.");
  }
  return password;
}
__name(validatePasswordInput, "validatePasswordInput");
function validateAvatarConfig(value, current = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(400, "invalid_avatar", "Avatar must be an object.");
  }
  const avatar = {
    character: value.character ?? current.character ?? "mochi",
    frame: value.frame ?? current.frame ?? "none",
    background: value.background ?? current.background ?? "peach-sky"
  };
  for (const [type, option] of Object.entries(avatar)) {
    if (typeof option !== "string" || !AVATAR_SETS[type].has(option)) {
      fail(400, "invalid_avatar", `Unknown avatar ${type}.`);
    }
  }
  return avatar;
}
__name(validateAvatarConfig, "validateAvatarConfig");
function normaliseGameId(value) {
  if (typeof value !== "string") fail(400, "invalid_game", "Game id is required.");
  const gameId = value.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/.test(gameId)) {
    fail(400, "invalid_game", "Game id is invalid.");
  }
  return gameId;
}
__name(normaliseGameId, "normaliseGameId");
function normaliseEventId(value) {
  if (value === void 0 || value === null || value === "") return crypto.randomUUID();
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{8,80}$/.test(value)) {
    fail(400, "invalid_event_id", "Event id must be 8\u201380 URL-safe characters.");
  }
  return value;
}
__name(normaliseEventId, "normaliseEventId");
function normaliseGameEvent(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(400, "invalid_event", "Game event must be an object.");
  }
  const score = Number(value.score ?? 0);
  const durationMs = Number(value.durationMs ?? 0);
  const outcome = value.outcome ?? "completed";
  if (!Number.isSafeInteger(score) || score < 0 || score > 1e7) {
    fail(400, "invalid_score", "Score must be an integer from 0 to 10,000,000.");
  }
  if (!Number.isSafeInteger(durationMs) || durationMs < 0 || durationMs > 216e5) {
    fail(400, "invalid_duration", "Duration is outside the accepted range.");
  }
  if (!["completed", "win", "loss", "quit"].includes(outcome)) {
    fail(400, "invalid_outcome", "Outcome is invalid.");
  }
  const level = value.level === void 0 ? null : Number(value.level);
  if (level !== null && (!Number.isSafeInteger(level) || level < 0 || level > 1e4)) {
    fail(400, "invalid_level", "Level is outside the accepted range.");
  }
  const mode = value.mode === void 0 ? null : String(value.mode).trim().toLowerCase();
  if (mode !== null && !/^[a-z0-9-]{1,24}$/.test(mode)) fail(400, "invalid_mode", "Mode is invalid.");
  return {
    eventId: normaliseEventId(value.eventId),
    gameId: normaliseGameId(value.gameId),
    score,
    durationMs,
    outcome,
    level,
    mode
  };
}
__name(normaliseGameEvent, "normaliseGameEvent");
function normaliseRewardEvent(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(400, "invalid_event", "Reward event must be an object.");
  }
  const requestedType = String(value.rewardType ?? value.type ?? "").trim().toLowerCase();
  const rewardType = REWARD_ALIASES[requestedType] ?? requestedType;
  const rule = REWARD_RULES[rewardType];
  if (!rule) fail(400, "invalid_reward", "Reward type is invalid.");
  const amount = value.amount === void 0 ? rule.defaultValue : Number(value.amount);
  if (!Number.isSafeInteger(amount) || amount < rule.minimum || amount > rule.maximum) {
    fail(400, "invalid_reward_amount", "Reward amount is outside the accepted range.");
  }
  return {
    eventId: normaliseEventId(value.eventId ?? value.adSessionId),
    gameId: normaliseGameId(value.gameId),
    rewardType,
    amount
  };
}
__name(normaliseRewardEvent, "normaliseRewardEvent");
function isSameOriginRequest(request) {
  if (["GET", "HEAD"].includes(request.method.toUpperCase())) return true;
  const requestUrl = new URL(request.url);
  const fetchSite = (request.headers.get("Sec-Fetch-Site") || "").toLowerCase();
  if (fetchSite === "cross-site") return false;
  const origin = request.headers.get("Origin");
  if (origin) {
    if (origin === "null") return false;
    try {
      return new URL(origin).origin === requestUrl.origin;
    } catch {
      return false;
    }
  }
  const referer = request.headers.get("Referer");
  if (referer) {
    try {
      return new URL(referer).origin === requestUrl.origin;
    } catch {
      return false;
    }
  }
  return fetchSite === "same-origin";
}
__name(isSameOriginRequest, "isSameOriginRequest");
function parseCookies(headerValue) {
  const cookies = {};
  for (const part of String(headerValue || "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    const name = part.slice(0, separator).trim();
    const rawValue = part.slice(separator + 1).trim();
    try {
      cookies[name] = decodeURIComponent(rawValue);
    } catch {
      cookies[name] = rawValue;
    }
  }
  return cookies;
}
__name(parseCookies, "parseCookies");
async function readJson(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    fail(415, "json_required", "Content-Type must be application/json.");
  }
  const declaredSize = Number(request.headers.get("Content-Length") || 0);
  if (declaredSize > MAX_JSON_BYTES) fail(413, "body_too_large", "Request body is too large.");
  const text = await request.text();
  if (encoder.encode(text).byteLength > MAX_JSON_BYTES) fail(413, "body_too_large", "Request body is too large.");
  let value;
  try {
    value = text ? JSON.parse(text) : {};
  } catch {
    fail(400, "invalid_json", "Request body is not valid JSON.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(400, "invalid_json", "JSON body must be an object.");
  }
  return value;
}
__name(readJson, "readJson");
function jsonResponse(payload, status = 200, extraHeaders) {
  const headers = new Headers(extraHeaders);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(JSON.stringify(payload), { status, headers });
}
__name(jsonResponse, "jsonResponse");
function apiErrorResponse(error) {
  if (error instanceof ProfileApiError) {
    return jsonResponse(
      { ok: false, error: { code: error.code, message: error.message } },
      error.status,
      error.headers
    );
  }
  console.error("Profile API error", error);
  return jsonResponse(
    { ok: false, error: { code: "internal_error", message: "The profile service is temporarily unavailable." } },
    500
  );
}
__name(apiErrorResponse, "apiErrorResponse");
function getDatabase(env) {
  return env?.PROFILES_DB ?? env?.DB ?? null;
}
__name(getDatabase, "getDatabase");
function isUniqueConstraintError(error) {
  return String(error?.message || "").includes("UNIQUE constraint failed");
}
__name(isUniqueConstraintError, "isUniqueConstraintError");
function sessionCookie(request, token, maxAgeSeconds) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly${secure}; SameSite=Strict; Max-Age=${maxAgeSeconds}`;
}
__name(sessionCookie, "sessionCookie");
async function buildSession(userId, request) {
  const token = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await sha256(token);
  const userAgent = (request.headers.get("User-Agent") || "").slice(0, 512);
  return {
    token,
    tokenHash,
    userAgentHash: await sha256(userAgent),
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS
  };
}
__name(buildSession, "buildSession");
async function persistSession(db, session) {
  await db.batch([
    db.prepare(`
      DELETE FROM profile_sessions
      WHERE user_id = ? AND (
        expires_at <= ? OR token_hash IN (
          SELECT token_hash FROM profile_sessions
          WHERE user_id = ? ORDER BY created_at DESC LIMIT -1 OFFSET 4
        )
      )
    `).bind(session.userId, session.createdAt, session.userId),
    db.prepare(`
      INSERT INTO profile_sessions
        (token_hash, user_id, created_at, expires_at, last_seen_at, user_agent_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      session.tokenHash,
      session.userId,
      session.createdAt,
      session.expiresAt,
      session.createdAt,
      session.userAgentHash
    )
  ]);
}
__name(persistSession, "persistSession");
async function consumeRateLimit(db, request, action, maximum, windowMs) {
  const address = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() || "unknown";
  const rateKey = await sha256(`${action}:${address}`);
  const now = Date.now();
  const resetBefore = now - windowMs;
  const row = await db.prepare(`
    INSERT INTO profile_rate_limits (rate_key, action, window_start, hits)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(rate_key, action) DO UPDATE SET
      hits = CASE
        WHEN profile_rate_limits.window_start < ? THEN 1
        ELSE profile_rate_limits.hits + 1
      END,
      window_start = CASE
        WHEN profile_rate_limits.window_start < ? THEN excluded.window_start
        ELSE profile_rate_limits.window_start
      END
    RETURNING hits, window_start
  `).bind(rateKey, action, now, resetBefore, resetBefore).first();
  if (!row || Number(row.hits) > maximum) {
    const retryAfter = Math.max(1, Math.ceil((Number(row?.window_start || now) + windowMs - now) / 1e3));
    fail(429, "rate_limited", "Too many attempts. Please wait and try again.", { "Retry-After": String(retryAfter) });
  }
}
__name(consumeRateLimit, "consumeRateLimit");
async function authenticate(db, request, ctx, required = true) {
  const token = parseCookies(request.headers.get("Cookie"))[SESSION_COOKIE];
  if (!token || !/^[A-Za-z0-9_-]{40,64}$/.test(token)) {
    if (required) fail(401, "authentication_required", "Sign in to continue.");
    return null;
  }
  const tokenHash = await sha256(token);
  const now = Date.now();
  const row = await db.prepare(`
    SELECT u.*, s.token_hash AS session_token_hash, s.last_seen_at AS session_last_seen_at
    FROM profile_sessions s
    JOIN profile_users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
    LIMIT 1
  `).bind(tokenHash, now).first();
  if (!row) {
    if (required) fail(401, "authentication_required", "Your session has expired. Please sign in again.");
    return null;
  }
  if (Number(row.session_last_seen_at) < now - SESSION_TOUCH_INTERVAL_MS) {
    const touch = db.prepare("UPDATE profile_sessions SET last_seen_at = ? WHERE token_hash = ?").bind(now, tokenHash).run();
    if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(touch);
    else await touch;
  }
  return row;
}
__name(authenticate, "authenticate");
function statsFromRow(row) {
  return {
    totalScore: Number(row.total_score || 0),
    gamesPlayed: Number(row.games_played || 0),
    wins: Number(row.wins || 0),
    rewardsClaimed: Number(row.rewards_claimed || 0),
    avatarChanges: Number(row.avatar_changes || 0),
    distinctGames: Number(row.distinct_games || 0),
    bestScore: Number(row.best_score || 0),
    coins: Number(row.coins || 0)
  };
}
__name(statsFromRow, "statsFromRow");
function awardFromRow(row) {
  const reward = row.reward_cosmetic_type && row.reward_cosmetic_key ? { type: row.reward_cosmetic_type, key: row.reward_cosmetic_key } : null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    category: row.category,
    points: Number(row.points),
    trophyTier: row.trophy_tier,
    unlockedAt: Number(row.unlocked_at),
    reward
  };
}
__name(awardFromRow, "awardFromRow");
async function getStats(db, userId) {
  const row = await db.prepare(`
    SELECT total_score, games_played, wins, rewards_claimed, avatar_changes,
           distinct_games, best_score, coins
    FROM profile_users WHERE id = ?
  `).bind(userId).first();
  return statsFromRow(row || {});
}
__name(getStats, "getStats");
async function getProfile(db, userId, includePrivate) {
  const results = await db.batch([
    db.prepare(`
      SELECT id, username, email, display_name, bio, avatar_character, avatar_frame,
             avatar_background, total_score, games_played, wins, rewards_claimed,
             avatar_changes, distinct_games, best_score, coins, created_at, updated_at
      FROM profile_users WHERE id = ?
    `).bind(userId),
    db.prepare(`
      SELECT d.id, d.name, d.description, d.icon, d.category, d.points, d.trophy_tier,
             d.reward_cosmetic_type, d.reward_cosmetic_key, ua.unlocked_at
      FROM user_achievements ua
      JOIN achievement_definitions d ON d.id = ua.achievement_id
      WHERE ua.user_id = ?
      ORDER BY ua.unlocked_at DESC, d.sort_order ASC
      LIMIT 100
    `).bind(userId),
    db.prepare(`
      SELECT game_id, plays, wins, total_score, best_score, last_score,
             total_duration_ms, last_played_at
      FROM profile_game_stats WHERE user_id = ?
      ORDER BY best_score DESC, last_played_at DESC LIMIT 25
    `).bind(userId),
    db.prepare(`
      SELECT c.item_type, c.item_key, c.name, c.asset_hint, uc.unlocked_at
      FROM user_cosmetics uc
      JOIN cosmetic_definitions c
        ON c.item_type = uc.item_type AND c.item_key = uc.item_key
      WHERE uc.user_id = ?
      ORDER BY c.item_type, c.sort_order, c.item_key
    `).bind(userId)
  ]);
  const user = results[0]?.results?.[0];
  if (!user) return null;
  const achievements = (results[1]?.results || []).map(awardFromRow);
  const byTier = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
  let points = 0;
  for (const award of achievements) {
    if (Object.hasOwn(byTier, award.trophyTier)) byTier[award.trophyTier] += 1;
    points += award.points;
  }
  const games = (results[2]?.results || []).map((game) => ({
    gameId: game.game_id,
    plays: Number(game.plays),
    wins: Number(game.wins),
    totalScore: Number(game.total_score),
    bestScore: Number(game.best_score),
    lastScore: Number(game.last_score),
    totalDurationMs: Number(game.total_duration_ms),
    lastPlayedAt: Number(game.last_played_at)
  }));
  const cosmetics = { characters: [], frames: [], backgrounds: [] };
  for (const item of results[3]?.results || []) {
    const bucket = item.item_type === "character" ? cosmetics.characters : item.item_type === "frame" ? cosmetics.frames : cosmetics.backgrounds;
    bucket.push({ key: item.item_key, name: item.name, assetHint: item.asset_hint, unlockedAt: Number(item.unlocked_at) });
  }
  const profile = {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    bio: user.bio,
    avatar: {
      character: user.avatar_character,
      frame: user.avatar_frame,
      background: user.avatar_background
    },
    stats: statsFromRow(user),
    achievements,
    trophies: {
      total: achievements.length,
      points,
      byTier,
      latest: achievements.slice(0, 6)
    },
    games,
    memberSince: Number(user.created_at),
    updatedAt: Number(user.updated_at)
  };
  if (includePrivate) {
    profile.email = user.email;
    profile.cosmetics = cosmetics;
  }
  return profile;
}
__name(getProfile, "getProfile");
async function unlockAchievements(db, userId) {
  const statsRow = await db.prepare(`
    SELECT total_score, games_played, wins, rewards_claimed, avatar_changes,
           distinct_games, best_score
    FROM profile_users WHERE id = ?
  `).bind(userId).first();
  if (!statsRow) return [];
  const pending = await db.prepare(`
    SELECT d.*
    FROM achievement_definitions d
    LEFT JOIN user_achievements ua
      ON ua.achievement_id = d.id AND ua.user_id = ?
    WHERE ua.achievement_id IS NULL
    ORDER BY d.sort_order ASC
  `).bind(userId).all();
  const unlockedAt = Date.now();
  const eligible = (pending.results || []).filter((definition) => {
    if (!ACHIEVEMENT_METRICS.has(definition.metric)) return false;
    return Number(statsRow[definition.metric] || 0) >= Number(definition.threshold);
  });
  if (!eligible.length) return [];
  const inserts = eligible.map((definition) => db.prepare(`
    INSERT OR IGNORE INTO user_achievements
      (user_id, achievement_id, progress, unlocked_at)
    VALUES (?, ?, ?, ?)
  `).bind(userId, definition.id, Number(statsRow[definition.metric] || 0), unlockedAt));
  const insertResults = await db.batch(inserts);
  const newlyUnlocked = eligible.filter((_, index) => Number(insertResults[index]?.meta?.changes || 0) > 0);
  const cosmeticAwards = newlyUnlocked.filter((definition) => definition.reward_cosmetic_type && definition.reward_cosmetic_key).map((definition) => db.prepare(`
      INSERT OR IGNORE INTO user_cosmetics (user_id, item_type, item_key, unlocked_at, source)
      SELECT ?, item_type, item_key, ?, ?
      FROM cosmetic_definitions
      WHERE item_type = ? AND item_key = ?
    `).bind(
    userId,
    unlockedAt,
    `achievement:${definition.id}`,
    definition.reward_cosmetic_type,
    definition.reward_cosmetic_key
  ));
  if (cosmeticAwards.length) await db.batch(cosmeticAwards);
  return newlyUnlocked.map((definition) => awardFromRow({ ...definition, unlocked_at: unlockedAt }));
}
__name(unlockAchievements, "unlockAchievements");
async function listAchievements(db, userId) {
  const stats = userId ? await getStats(db, userId) : {};
  const result = await db.prepare(`
    SELECT d.*, ua.unlocked_at
    FROM achievement_definitions d
    LEFT JOIN user_achievements ua
      ON ua.achievement_id = d.id AND ua.user_id = ?
    WHERE d.hidden = 0 OR ua.unlocked_at IS NOT NULL
    ORDER BY d.sort_order ASC
    LIMIT 100
  `).bind(userId || "").all();
  return (result.results || []).map((row) => {
    const metricValue = Number(stats[camelMetric(row.metric)] || 0);
    const threshold = Number(row.threshold);
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      category: row.category,
      points: Number(row.points),
      trophyTier: row.trophy_tier,
      progress: Math.min(metricValue, threshold),
      threshold,
      unlocked: row.unlocked_at !== null && row.unlocked_at !== void 0,
      unlockedAt: row.unlocked_at === null || row.unlocked_at === void 0 ? null : Number(row.unlocked_at),
      reward: row.reward_cosmetic_type && row.reward_cosmetic_key ? { type: row.reward_cosmetic_type, key: row.reward_cosmetic_key } : null
    };
  });
}
__name(listAchievements, "listAchievements");
function camelMetric(metric) {
  return {
    total_score: "totalScore",
    games_played: "gamesPlayed",
    wins: "wins",
    rewards_claimed: "rewardsClaimed",
    avatar_changes: "avatarChanges",
    distinct_games: "distinctGames",
    best_score: "bestScore"
  }[metric];
}
__name(camelMetric, "camelMetric");
async function requireOwnedAvatar(db, userId, avatar) {
  const result = await db.prepare(`
    SELECT COUNT(*) AS owned
    FROM user_cosmetics
    WHERE user_id = ? AND (
      (item_type = 'character' AND item_key = ?) OR
      (item_type = 'frame' AND item_key = ?) OR
      (item_type = 'background' AND item_key = ?)
    )
  `).bind(userId, avatar.character, avatar.frame, avatar.background).first();
  if (Number(result?.owned || 0) !== 3) {
    fail(403, "cosmetic_locked", "One or more selected avatar items are still locked.");
  }
}
__name(requireOwnedAvatar, "requireOwnedAvatar");
async function applyAvatarChange(db, user, avatarInput, suppliedEventId) {
  const current = {
    character: user.avatar_character,
    frame: user.avatar_frame,
    background: user.avatar_background
  };
  const avatar = validateAvatarConfig(avatarInput, current);
  await requireOwnedAvatar(db, user.id, avatar);
  if (avatar.character === current.character && avatar.frame === current.frame && avatar.background === current.background) {
    return { changed: false, duplicate: false, eventId: null, newAchievements: [] };
  }
  const eventId = normaliseEventId(suppliedEventId);
  const now = Date.now();
  const detail = JSON.stringify(avatar);
  const batch = await db.batch([
    db.prepare(`
      INSERT OR IGNORE INTO profile_events
        (event_id, user_id, event_type, game_id, value, detail, processed, created_at)
      SELECT ?, ?, 'avatar', NULL, 1, ?, 0, ?
      WHERE (
        SELECT COUNT(*) FROM profile_events
        WHERE user_id = ? AND event_type = 'avatar' AND created_at >= ?
      ) < ?
    `).bind(eventId, user.id, detail, now, user.id, now - 864e5, AVATAR_EVENTS_PER_DAY),
    db.prepare(`
      UPDATE profile_users
      SET avatar_character = ?, avatar_frame = ?, avatar_background = ?,
          avatar_changes = avatar_changes + 1, updated_at = ?
      WHERE id = ? AND EXISTS (
        SELECT 1 FROM profile_events
        WHERE user_id = ? AND event_id = ? AND processed = 0
      )
    `).bind(avatar.character, avatar.frame, avatar.background, now, user.id, user.id, eventId),
    db.prepare(`
      UPDATE profile_events SET processed = 1
      WHERE user_id = ? AND event_id = ? AND processed = 0
    `).bind(user.id, eventId)
  ]);
  if (Number(batch[0]?.meta?.changes || 0) < 1) {
    const duplicate = await db.prepare(
      "SELECT 1 AS found FROM profile_events WHERE user_id = ? AND event_id = ?"
    ).bind(user.id, eventId).first();
    if (duplicate) return { changed: false, duplicate: true, eventId, newAchievements: [] };
    fail(429, "avatar_rate_limited", "Avatar changes are temporarily limited. Please try again later.");
  }
  return { changed: true, duplicate: false, eventId, newAchievements: await unlockAchievements(db, user.id) };
}
__name(applyAvatarChange, "applyAvatarChange");
async function handleRegister(request, db) {
  await consumeRateLimit(db, request, "register", 5, 60 * 60 * 1e3);
  const body = await readJson(request);
  const username = normaliseUsername(body.username);
  const email = normaliseEmail(body.email);
  const password = validatePasswordInput(body.password);
  const displayName = normaliseDisplayName(body.displayName, username);
  const existing = await db.prepare(`
    SELECT 1 AS found FROM profile_users
    WHERE username = ? COLLATE NOCASE OR (? IS NOT NULL AND email = ? COLLATE NOCASE)
    LIMIT 1
  `).bind(username, email, email).first();
  if (existing) fail(409, "account_exists", "That username or email is already in use.");
  const passwordRecord = await hashPassword(password);
  const userId = crypto.randomUUID();
  const now = Date.now();
  try {
    await db.batch([
      db.prepare(`
        INSERT INTO profile_users
          (id, username, email, password_hash, password_salt, password_iterations,
           display_name, bio, avatar_character, avatar_frame, avatar_background,
           created_at, updated_at, last_login_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, '', 'mochi', 'none', 'peach-sky', ?, ?, ?)
      `).bind(
        userId,
        username,
        email,
        passwordRecord.hash,
        passwordRecord.salt,
        passwordRecord.iterations,
        displayName,
        now,
        now,
        now
      ),
      db.prepare(`
        INSERT INTO user_cosmetics (user_id, item_type, item_key, unlocked_at, source)
        SELECT ?, item_type, item_key, ?, 'starter'
        FROM cosmetic_definitions WHERE starter = 1
      `).bind(userId, now)
    ]);
  } catch (error) {
    if (isUniqueConstraintError(error)) fail(409, "account_exists", "That username or email is already in use.");
    throw error;
  }
  const session = await buildSession(userId, request);
  await persistSession(db, session);
  const profile = await getProfile(db, userId, true);
  return jsonResponse(
    { ok: true, profile },
    201,
    { "Set-Cookie": sessionCookie(request, session.token, Math.floor(SESSION_TTL_MS / 1e3)) }
  );
}
__name(handleRegister, "handleRegister");
async function handleLogin(request, db) {
  await consumeRateLimit(db, request, "login", 12, 15 * 60 * 1e3);
  const body = await readJson(request);
  const login = String(body.login ?? body.username ?? body.email ?? "").trim().toLowerCase();
  if (!login || login.length > 254 || typeof body.password !== "string" || body.password.length > 128) {
    fail(401, "invalid_credentials", "Username/email or password is incorrect.");
  }
  const user = await db.prepare(`
    SELECT * FROM profile_users
    WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE
    LIMIT 1
  `).bind(login, login).first();
  const valid = user ? await verifyPassword(body.password, user.password_salt, user.password_hash, user.password_iterations) : await verifyPassword(
    body.password,
    "AAAAAAAAAAAAAAAAAAAAAA",
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    PASSWORD_ITERATIONS
  );
  if (!user || !valid) fail(401, "invalid_credentials", "Username/email or password is incorrect.");
  const now = Date.now();
  await db.prepare("UPDATE profile_users SET last_login_at = ?, updated_at = ? WHERE id = ?").bind(now, now, user.id).run();
  const session = await buildSession(user.id, request);
  await persistSession(db, session);
  const profile = await getProfile(db, user.id, true);
  return jsonResponse(
    { ok: true, profile },
    200,
    { "Set-Cookie": sessionCookie(request, session.token, Math.floor(SESSION_TTL_MS / 1e3)) }
  );
}
__name(handleLogin, "handleLogin");
async function handleLogout(request, db) {
  const token = parseCookies(request.headers.get("Cookie"))[SESSION_COOKIE];
  if (token && /^[A-Za-z0-9_-]{40,64}$/.test(token)) {
    await db.prepare("DELETE FROM profile_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  }
  return jsonResponse(
    { ok: true },
    200,
    { "Set-Cookie": sessionCookie(request, "", 0) }
  );
}
__name(handleLogout, "handleLogout");
async function handleUpdateProfile(request, db, user) {
  const body = await readJson(request);
  const hasDisplayName = Object.hasOwn(body, "displayName");
  const hasBio = Object.hasOwn(body, "bio");
  const hasAvatar = Object.hasOwn(body, "avatar");
  if (!hasDisplayName && !hasBio && !hasAvatar) {
    fail(400, "empty_update", "Provide a display name, bio, or avatar to update.");
  }
  const displayName = hasDisplayName ? normaliseDisplayName(body.displayName, null) : user.display_name;
  const bio = hasBio ? normaliseBio(body.bio) : user.bio;
  const now = Date.now();
  await db.prepare("UPDATE profile_users SET display_name = ?, bio = ?, updated_at = ? WHERE id = ?").bind(displayName, bio, now, user.id).run();
  let avatarResult = { changed: false, duplicate: false, eventId: null, newAchievements: [] };
  if (hasAvatar) avatarResult = await applyAvatarChange(db, user, body.avatar, body.eventId);
  return jsonResponse({
    ok: true,
    profile: await getProfile(db, user.id, true),
    avatarEvent: {
      changed: avatarResult.changed,
      duplicate: avatarResult.duplicate,
      eventId: avatarResult.eventId
    },
    newAchievements: avatarResult.newAchievements
  });
}
__name(handleUpdateProfile, "handleUpdateProfile");
async function handleGameEvent(request, db, user) {
  const event = normaliseGameEvent(await readJson(request));
  const now = Date.now();
  const win = event.outcome === "win" ? 1 : 0;
  const detail = JSON.stringify({ outcome: event.outcome, level: event.level, mode: event.mode });
  const batch = await db.batch([
    db.prepare(`
      INSERT OR IGNORE INTO profile_events
        (event_id, user_id, event_type, game_id, value, detail, processed, created_at)
      SELECT ?, ?, 'game', ?, ?, ?, 0, ?
      WHERE (
        SELECT COUNT(*) FROM profile_events
        WHERE user_id = ? AND event_type = 'game' AND created_at >= ?
      ) < ?
    `).bind(
      event.eventId,
      user.id,
      event.gameId,
      event.score,
      detail,
      now,
      user.id,
      now - 864e5,
      GAME_EVENTS_PER_DAY
    ),
    db.prepare(`
      INSERT INTO profile_game_stats
        (user_id, game_id, plays, wins, total_score, best_score, last_score,
         total_duration_ms, last_played_at)
      SELECT ?, ?, 1, ?, ?, ?, ?, ?, ?
      WHERE EXISTS (
        SELECT 1 FROM profile_events
        WHERE user_id = ? AND event_id = ? AND processed = 0
      )
      ON CONFLICT(user_id, game_id) DO UPDATE SET
        plays = profile_game_stats.plays + 1,
        wins = profile_game_stats.wins + excluded.wins,
        total_score = profile_game_stats.total_score + excluded.total_score,
        best_score = MAX(profile_game_stats.best_score, excluded.best_score),
        last_score = excluded.last_score,
        total_duration_ms = profile_game_stats.total_duration_ms + excluded.total_duration_ms,
        last_played_at = excluded.last_played_at
    `).bind(
      user.id,
      event.gameId,
      win,
      event.score,
      event.score,
      event.score,
      event.durationMs,
      now,
      user.id,
      event.eventId
    ),
    db.prepare(`
      UPDATE profile_users
      SET total_score = total_score + ?, games_played = games_played + 1,
          wins = wins + ?, best_score = MAX(best_score, ?),
          distinct_games = (SELECT COUNT(*) FROM profile_game_stats WHERE user_id = ?),
          updated_at = ?
      WHERE id = ? AND EXISTS (
        SELECT 1 FROM profile_events
        WHERE user_id = ? AND event_id = ? AND processed = 0
      )
    `).bind(event.score, win, event.score, user.id, now, user.id, user.id, event.eventId),
    db.prepare(`
      UPDATE profile_events SET processed = 1
      WHERE user_id = ? AND event_id = ? AND processed = 0
    `).bind(user.id, event.eventId)
  ]);
  if (Number(batch[0]?.meta?.changes || 0) < 1) {
    const duplicate = await db.prepare(
      "SELECT 1 AS found FROM profile_events WHERE user_id = ? AND event_id = ?"
    ).bind(user.id, event.eventId).first();
    if (duplicate) {
      return jsonResponse({ ok: true, accepted: false, duplicate: true, eventId: event.eventId, stats: await getStats(db, user.id), newAchievements: [] });
    }
    fail(429, "game_event_rate_limited", "Too many game results were submitted today.");
  }
  const newAchievements = await unlockAchievements(db, user.id);
  return jsonResponse({
    ok: true,
    accepted: true,
    duplicate: false,
    eventId: event.eventId,
    stats: await getStats(db, user.id),
    newAchievements
  }, 201);
}
__name(handleGameEvent, "handleGameEvent");
async function handleRewardEvent(request, db, user) {
  const event = normaliseRewardEvent(await readJson(request));
  const now = Date.now();
  const coinAmount = event.rewardType === "coins" ? event.amount : 0;
  const detail = JSON.stringify({ rewardType: event.rewardType, amount: event.amount });
  const batch = await db.batch([
    db.prepare(`
      INSERT OR IGNORE INTO profile_events
        (event_id, user_id, event_type, game_id, value, detail, processed, created_at)
      SELECT ?, ?, 'reward', ?, ?, ?, 0, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM profile_events
        WHERE user_id = ? AND event_type = 'reward' AND created_at > ?
      ) AND (
        SELECT COUNT(*) FROM profile_events
        WHERE user_id = ? AND event_type = 'reward' AND created_at >= ?
      ) < ?
    `).bind(
      event.eventId,
      user.id,
      event.gameId,
      event.amount,
      detail,
      now,
      user.id,
      now - REWARD_COOLDOWN_MS,
      user.id,
      now - 864e5,
      REWARD_EVENTS_PER_DAY
    ),
    db.prepare(`
      UPDATE profile_users
      SET rewards_claimed = rewards_claimed + 1, coins = coins + ?, updated_at = ?
      WHERE id = ? AND EXISTS (
        SELECT 1 FROM profile_events
        WHERE user_id = ? AND event_id = ? AND processed = 0
      )
    `).bind(coinAmount, now, user.id, user.id, event.eventId),
    db.prepare(`
      UPDATE profile_events SET processed = 1
      WHERE user_id = ? AND event_id = ? AND processed = 0
    `).bind(user.id, event.eventId)
  ]);
  if (Number(batch[0]?.meta?.changes || 0) < 1) {
    const duplicate = await db.prepare(
      "SELECT 1 AS found FROM profile_events WHERE user_id = ? AND event_id = ?"
    ).bind(user.id, event.eventId).first();
    if (duplicate) {
      return jsonResponse({
        ok: true,
        accepted: false,
        duplicate: true,
        eventId: event.eventId,
        benefit: { type: event.rewardType, amount: event.amount },
        stats: await getStats(db, user.id),
        newAchievements: []
      });
    }
    const latest = await db.prepare(`
      SELECT MAX(created_at) AS created_at FROM profile_events
      WHERE user_id = ? AND event_type = 'reward'
    `).bind(user.id).first();
    const retryAfter = Math.max(1, Math.ceil((Number(latest?.created_at || now) + REWARD_COOLDOWN_MS - now) / 1e3));
    fail(429, "reward_rate_limited", "Please wait before claiming another reward.", { "Retry-After": String(retryAfter) });
  }
  const newAchievements = await unlockAchievements(db, user.id);
  return jsonResponse({
    ok: true,
    accepted: true,
    duplicate: false,
    eventId: event.eventId,
    benefit: { type: event.rewardType, amount: event.amount },
    stats: await getStats(db, user.id),
    newAchievements
  }, 201);
}
__name(handleRewardEvent, "handleRewardEvent");
async function handleAvatarEvent(request, db, user) {
  const body = await readJson(request);
  const avatarInput = body.avatar && typeof body.avatar === "object" ? body.avatar : body;
  const result = await applyAvatarChange(db, user, avatarInput, body.eventId);
  return jsonResponse({
    ok: true,
    accepted: result.changed,
    duplicate: result.duplicate,
    eventId: result.eventId,
    profile: await getProfile(db, user.id, true),
    newAchievements: result.newAchievements
  }, result.changed ? 201 : 200);
}
__name(handleAvatarEvent, "handleAvatarEvent");
async function handleLeaderboard(url, db) {
  const gameIdValue = url.searchParams.get("gameId");
  const gameId = gameIdValue ? normaliseGameId(gameIdValue) : null;
  const requestedLimit = Number(url.searchParams.get("limit") || 20);
  const limit = Number.isInteger(requestedLimit) ? Math.min(25, Math.max(1, requestedLimit)) : 20;
  const result = gameId ? await db.prepare(`
        SELECT u.username, u.display_name, u.avatar_character, u.avatar_frame,
               u.avatar_background, s.best_score AS score, s.plays, s.wins
        FROM profile_game_stats s
        JOIN profile_users u ON u.id = s.user_id
        WHERE s.game_id = ?
        ORDER BY s.best_score DESC, s.last_played_at ASC LIMIT ?
      `).bind(gameId, limit).all() : await db.prepare(`
        SELECT username, display_name, avatar_character, avatar_frame,
               avatar_background, total_score AS score, games_played AS plays, wins
        FROM profile_users
        ORDER BY total_score DESC, created_at ASC LIMIT ?
      `).bind(limit).all();
  return jsonResponse({
    ok: true,
    gameId,
    entries: (result.results || []).map((row, index) => ({
      rank: index + 1,
      username: row.username,
      displayName: row.display_name,
      avatar: {
        character: row.avatar_character,
        frame: row.avatar_frame,
        background: row.avatar_background
      },
      score: Number(row.score),
      plays: Number(row.plays),
      wins: Number(row.wins)
    }))
  });
}
__name(handleLeaderboard, "handleLeaderboard");
function methodNotAllowed(allowed) {
  return jsonResponse(
    { ok: false, error: { code: "method_not_allowed", message: "Method not allowed." } },
    405,
    { Allow: allowed.join(", ") }
  );
}
__name(methodNotAllowed, "methodNotAllowed");
async function handleProfileApi(request, env, ctx) {
  const url = new URL(request.url);
  if (url.pathname !== PROFILE_API_PREFIX && !url.pathname.startsWith(`${PROFILE_API_PREFIX}/`)) return null;
  const path = url.pathname.length > PROFILE_API_PREFIX.length && url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname;
  const method = request.method.toUpperCase();
  const db = getDatabase(env);
  if (!db) return apiErrorResponse(new ProfileApiError(503, "database_unavailable", "Profile storage is not configured."));
  try {
    if (!["GET", "HEAD"].includes(method) && !isSameOriginRequest(request)) {
      fail(403, "cross_origin_rejected", "This action must come from Mochi Mango Arcade.");
    }
    if (path === `${PROFILE_API_PREFIX}/auth/register`) {
      if (method !== "POST") return methodNotAllowed(["POST"]);
      return await handleRegister(request, db);
    }
    if (path === `${PROFILE_API_PREFIX}/auth/login`) {
      if (method !== "POST") return methodNotAllowed(["POST"]);
      return await handleLogin(request, db);
    }
    if (path === `${PROFILE_API_PREFIX}/auth/logout`) {
      if (method !== "POST") return methodNotAllowed(["POST"]);
      return await handleLogout(request, db);
    }
    if (path === `${PROFILE_API_PREFIX}/me`) {
      const user = await authenticate(db, request, ctx, true);
      if (method === "GET") return jsonResponse({ ok: true, profile: await getProfile(db, user.id, true) });
      if (method === "PATCH") return await handleUpdateProfile(request, db, user);
      return methodNotAllowed(["GET", "PATCH"]);
    }
    if (path === `${PROFILE_API_PREFIX}/events/game`) {
      if (method !== "POST") return methodNotAllowed(["POST"]);
      return await handleGameEvent(request, db, await authenticate(db, request, ctx, true));
    }
    if (path === `${PROFILE_API_PREFIX}/events/reward`) {
      if (method !== "POST") return methodNotAllowed(["POST"]);
      return await handleRewardEvent(request, db, await authenticate(db, request, ctx, true));
    }
    if (path === `${PROFILE_API_PREFIX}/events/avatar`) {
      if (method !== "POST") return methodNotAllowed(["POST"]);
      return await handleAvatarEvent(request, db, await authenticate(db, request, ctx, true));
    }
    if (path === `${PROFILE_API_PREFIX}/achievements`) {
      if (method !== "GET") return methodNotAllowed(["GET"]);
      const user = await authenticate(db, request, ctx, false);
      return jsonResponse({ ok: true, achievements: await listAchievements(db, user?.id || null) });
    }
    if (path === `${PROFILE_API_PREFIX}/leaderboard`) {
      if (method !== "GET") return methodNotAllowed(["GET"]);
      return await handleLeaderboard(url, db);
    }
    if (path.startsWith(`${PROFILE_API_PREFIX}/u/`)) {
      if (method !== "GET") return methodNotAllowed(["GET"]);
      let requestedUsername;
      try {
        requestedUsername = decodeURIComponent(path.slice(`${PROFILE_API_PREFIX}/u/`.length));
      } catch {
        fail(400, "invalid_username", "Username is invalid.");
      }
      const username = normaliseUsername(requestedUsername);
      const user = await db.prepare("SELECT id FROM profile_users WHERE username = ? COLLATE NOCASE LIMIT 1").bind(username).first();
      if (!user) fail(404, "profile_not_found", "Profile not found.");
      return jsonResponse({ ok: true, profile: await getProfile(db, user.id, false) });
    }
    fail(404, "not_found", "Profile endpoint not found.");
  } catch (error) {
    return apiErrorResponse(error);
  }
}
__name(handleProfileApi, "handleProfileApi");

// src/worker.js
var MONETAG_LOADER_TAG = '<script src="/js/monetag-loader.js" defer><\/script>';
function isEmbeddedGameDocument(pathname) {
  return /^\/play\/(?:[^/]+\/)?game(?:\/|$)/.test(pathname);
}
__name(isEmbeddedGameDocument, "isEmbeddedGameDocument");
async function injectPlatformHead(response, pathname) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") || isEmbeddedGameDocument(pathname)) return response;
  const html = await response.text();
  if (html.includes("/js/monetag-loader.js") || !/<\/head>/i.test(html)) {
    return new Response(html, response);
  }
  return new Response(html.replace(/<\/head>/i, `${MONETAG_LOADER_TAG}</head>`), response);
}
__name(injectPlatformHead, "injectPlatformHead");
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const requestHost = (request.headers.get("host") || "").split(":")[0];
    if (url.hostname === "mochimangoarcade.com" && !/^(localhost|127\.0\.0\.1)$/.test(requestHost)) {
      url.hostname = "www.mochimangoarcade.com";
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === "/play/game" || url.pathname.startsWith("/play/game/")) {
      return Response.redirect(new URL("/games/", url), 301);
    }
    const profileResponse = await handleProfileApi(request, env, ctx);
    if (profileResponse) return profileResponse;
    if (url.pathname === "/api/health") return Response.json({ ok: true, name: "Mochi Mango Arcade" });
    if (url.pathname === "/api/games") return env.ASSETS.fetch(new Request(new URL("/assets/data/games.json", url)));
    if (url.pathname === "/api/products") return env.ASSETS.fetch(new Request(new URL("/assets/data/products.json", url)));
    if (url.pathname.startsWith("/api/game/")) {
      const slug = url.pathname.split("/").pop();
      const games = await (await env.ASSETS.fetch(new Request(new URL("/assets/data/games.json", url)))).json();
      const game = games.find((g) => g.slug === slug);
      return Response.json(game || null, { status: game ? 200 : 404 });
    }
    const response = await env.ASSETS.fetch(request);
    return injectPlatformHead(response, url.pathname);
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
