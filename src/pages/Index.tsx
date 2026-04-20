import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Типы ───────────────────────────────────────────────────────────────────
type Theme = "light" | "dark" | "midnight" | "rose";
type Message = {
  id: number;
  author: string;
  avatar: string;
  text?: string;
  sticker?: string;
  time: string;
  isAdmin?: boolean;
};
type Channel = {
  id: string;
  name: string;
  type: "text" | "voice" | "news";
  locked?: boolean;
};

// ─── Данные ──────────────────────────────────────────────────────────────────
const ACCOUNTS: Record<string, { password: string; isAdmin: boolean; avatar: string }> = {
  rounding: { password: "09082606", isAdmin: true, avatar: "R" },
};

const CHANNELS: Channel[] = [
  { id: "news", name: "rounding-news", type: "news", locked: true },
  { id: "general", name: "общий", type: "text" },
  { id: "minecraft", name: "minecraft", type: "text" },
  { id: "offtopic", name: "оффтоп", type: "text" },
  { id: "voice1", name: "Общий", type: "voice" },
  { id: "voice2", name: "Игровой", type: "voice" },
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  news: [
    {
      id: 1,
      author: "rounding",
      avatar: "R",
      text: "🎮 Добро пожаловать на сервер Rimbas! Это сервер для Minecraft 1.21.11 — поддерживаются как лицензия, так и пиратка. Приятной игры!",
      time: "Сегодня в 12:00",
      isAdmin: true,
    },
    {
      id: 2,
      author: "rounding",
      avatar: "R",
      text: "📌 Версия сервера: **1.21.11**. Вход для всех — лицензионных и пиратских аккаунтов. IP сервера будет опубликован здесь.",
      time: "Сегодня в 12:01",
      isAdmin: true,
    },
  ],
  general: [
    {
      id: 1,
      author: "Steve",
      avatar: "S",
      text: "Привет всем! Рад быть здесь 👋",
      time: "Сегодня в 11:30",
    },
    {
      id: 2,
      author: "Alex",
      avatar: "A",
      text: "Когда запуск сервера?",
      time: "Сегодня в 11:32",
    },
  ],
  minecraft: [
    {
      id: 1,
      author: "Creeper",
      avatar: "C",
      text: "Кто хочет строить вместе? 🏗️",
      time: "Сегодня в 10:00",
    },
  ],
  offtopic: [],
};

const STICKERS = [
  { id: "s1", emoji: "😂", label: "смех" },
  { id: "s2", emoji: "😭", label: "плач" },
  { id: "s3", emoji: "🔥", label: "огонь" },
  { id: "s4", emoji: "❤️", label: "сердце" },
  { id: "s5", emoji: "👍", label: "лайк" },
  { id: "s6", emoji: "🤙", label: "круто" },
  { id: "s7", emoji: "😎", label: "крутой" },
  { id: "s8", emoji: "🥳", label: "праздник" },
  { id: "s9", emoji: "💀", label: "череп" },
  { id: "s10", emoji: "🗿", label: "камень" },
  { id: "s11", emoji: "🤡", label: "клоун" },
  { id: "s12", emoji: "🐸", label: "лягушка" },
  // Telegram-like
  { id: "t1", emoji: "🌚", label: "тёмная луна" },
  { id: "t2", emoji: "👀", label: "глаза" },
  { id: "t3", emoji: "🤔", label: "думаю" },
  { id: "t4", emoji: "💅", label: "ногти" },
  { id: "t5", emoji: "🫡", label: "салют" },
  { id: "t6", emoji: "🫠", label: "плавлюсь" },
  { id: "t7", emoji: "🤯", label: "взрыв мозга" },
  { id: "t8", emoji: "🥹", label: "слёзы радости" },
];

const THEMES: { id: Theme; label: string; bg: string; sidebar: string; accent: string }[] = [
  { id: "light", label: "Светлая", bg: "#f8fafc", sidebar: "#f1f5f9", accent: "#e11d48" },
  { id: "dark", label: "Тёмная", bg: "#1e1e2e", sidebar: "#181825", accent: "#f38ba8" },
  { id: "midnight", label: "Полночь", bg: "#0f0f1a", sidebar: "#090912", accent: "#7c3aed" },
  { id: "rose", label: "Розовая", bg: "#fff1f5", sidebar: "#ffe4e6", accent: "#be123c" },
];

// ─── Главный компонент ────────────────────────────────────────────────────────
export default function Index() {
  const [user, setUser] = useState<{ name: string; isAdmin: boolean; avatar: string } | null>(null);
  const [loginForm, setLoginForm] = useState({ name: "", password: "", error: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", password: "", error: "" });
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  const [currentChannel, setCurrentChannel] = useState<Channel>(CHANNELS[0]);
  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [inVoice, setInVoice] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [nextId, setNextId] = useState(1000);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const T = THEMES.find((t) => t.id === theme)!;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentChannel]);

  // ── Авторизация ──────────────────────────────────────────────────────────
  const handleLogin = () => {
    const acc = ACCOUNTS[loginForm.name.toLowerCase()];
    if (!acc) return setLoginForm((f) => ({ ...f, error: "Пользователь не найден" }));
    if (acc.password !== loginForm.password)
      return setLoginForm((f) => ({ ...f, error: "Неверный пароль" }));
    setUser({ name: loginForm.name, isAdmin: acc.isAdmin, avatar: acc.avatar });
  };

  const handleRegister = () => {
    if (!registerForm.name.trim()) return setRegisterForm((f) => ({ ...f, error: "Введите никнейм" }));
    if (registerForm.name.toLowerCase() === "rounding")
      return setRegisterForm((f) => ({ ...f, error: "Этот ник занят" }));
    if (registerForm.password.length < 4)
      return setRegisterForm((f) => ({ ...f, error: "Пароль минимум 4 символа" }));
    ACCOUNTS[registerForm.name.toLowerCase()] = {
      password: registerForm.password,
      isAdmin: false,
      avatar: registerForm.name[0].toUpperCase(),
    };
    setUser({ name: registerForm.name, isAdmin: false, avatar: registerForm.name[0].toUpperCase() });
  };

  // ── Отправка сообщения ───────────────────────────────────────────────────
  const canWrite = () => {
    if (currentChannel.locked && !user?.isAdmin) return false;
    return true;
  };

  const sendMessage = (text?: string, sticker?: string) => {
    if (!user || !canWrite()) return;
    const msg: Message = {
      id: nextId,
      author: user.name,
      avatar: user.avatar,
      text,
      sticker,
      time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      isAdmin: user.isAdmin,
    };
    setMessages((prev) => ({
      ...prev,
      [currentChannel.id]: [...(prev[currentChannel.id] ?? []), msg],
    }));
    setNextId((n) => n + 1);
    setInputText("");
    setShowStickers(false);
  };

  // ── Цвета темы ───────────────────────────────────────────────────────────
  const isDark = theme === "dark" || theme === "midnight";
  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const mutedColor = isDark ? "#94a3b8" : "#64748b";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const inputBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)";
  const hoverBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const activeBg = isDark ? "rgba(255,255,255,0.12)" : "rgba(225,29,72,0.10)";

  // ─────────────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${T.accent}22, ${T.bg})`, backgroundColor: T.bg }}
      >
        <div
          className="w-full max-w-sm rounded-2xl shadow-2xl p-8"
          style={{ background: theme === "dark" || theme === "midnight" ? "#1e1e2e" : "#ffffff", border: `1px solid ${borderColor}` }}
        >
          {/* Логотип */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white mb-3 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.accent}88)` }}
            >
              R
            </div>
            <h1 className="text-2xl font-black" style={{ color: textColor }}>
              Rimbas
            </h1>
            <p className="text-xs mt-1" style={{ color: mutedColor }}>
              Minecraft 1.21.11 • Лицензия и пиратка
            </p>
          </div>

          {/* Табы */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: inputBg }}
          >
            {(["login", "register"] as const).map((tab) => (
              <button
                key={tab}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: authTab === tab ? T.accent : "transparent",
                  color: authTab === tab ? "#fff" : mutedColor,
                }}
                onClick={() => setAuthTab(tab)}
              >
                {tab === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>

          {authTab === "login" ? (
            <div className="space-y-3">
              <input
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition"
                placeholder="Никнейм"
                style={{ background: inputBg, color: textColor, border: `1px solid ${borderColor}` }}
                value={loginForm.name}
                onChange={(e) => setLoginForm((f) => ({ ...f, name: e.target.value, error: "" }))}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition"
                placeholder="Пароль"
                style={{ background: inputBg, color: textColor, border: `1px solid ${borderColor}` }}
                value={loginForm.password}
                onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value, error: "" }))}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              {loginForm.error && <p className="text-xs text-red-500">{loginForm.error}</p>}
              <button
                className="w-full py-3 rounded-xl font-bold text-white transition hover:opacity-90"
                style={{ background: T.accent }}
                onClick={handleLogin}
              >
                Войти
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition"
                placeholder="Придумайте никнейм"
                style={{ background: inputBg, color: textColor, border: `1px solid ${borderColor}` }}
                value={registerForm.name}
                onChange={(e) => setRegisterForm((f) => ({ ...f, name: e.target.value, error: "" }))}
              />
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition"
                placeholder="Придумайте пароль"
                style={{ background: inputBg, color: textColor, border: `1px solid ${borderColor}` }}
                value={registerForm.password}
                onChange={(e) => setRegisterForm((f) => ({ ...f, password: e.target.value, error: "" }))}
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              />
              {registerForm.error && <p className="text-xs text-red-500">{registerForm.error}</p>}
              <button
                className="w-full py-3 rounded-xl font-bold text-white transition hover:opacity-90"
                style={{ background: T.accent }}
                onClick={handleRegister}
              >
                Создать аккаунт
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Основной интерфейс ───────────────────────────────────────────────────
  const channelMessages = messages[currentChannel.id] ?? [];

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: T.bg, color: textColor }}>
      {/* Боковая панель */}
      <aside
        className={`${mobileSidebar ? "flex" : "hidden"} md:flex flex-col w-64 shrink-0 border-r`}
        style={{ background: T.sidebar, borderColor }}
      >
        {/* Заголовок */}
        <div
          className="flex items-center justify-between px-4 py-4 border-b font-black text-lg shadow-sm"
          style={{ borderColor, color: T.accent }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black"
              style={{ background: T.accent }}
            >
              R
            </div>
            Rimbas
          </div>
          <button
            className="md:hidden p-1 rounded-lg"
            style={{ color: mutedColor }}
            onClick={() => setMobileSidebar(false)}
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Каналы */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {/* Текстовые */}
          <p className="text-xs font-bold uppercase px-2 mb-1" style={{ color: mutedColor }}>
            Текстовые каналы
          </p>
          {CHANNELS.filter((c) => c.type !== "voice").map((ch) => (
            <button
              key={ch.id}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all text-left"
              style={{
                background: currentChannel.id === ch.id ? activeBg : "transparent",
                color: currentChannel.id === ch.id ? T.accent : mutedColor,
                fontWeight: currentChannel.id === ch.id ? 600 : 400,
              }}
              onClick={() => {
                setCurrentChannel(ch);
                setMobileSidebar(false);
              }}
            >
              {ch.type === "news" ? (
                <Icon name="Megaphone" size={15} />
              ) : (
                <Icon name="Hash" size={15} />
              )}
              <span className="truncate">{ch.name}</span>
              {ch.locked && <Icon name="Lock" size={11} className="ml-auto shrink-0" />}
            </button>
          ))}

          {/* Голосовые */}
          <p className="text-xs font-bold uppercase px-2 mt-4 mb-1" style={{ color: mutedColor }}>
            Голосовые каналы
          </p>
          {CHANNELS.filter((c) => c.type === "voice").map((ch) => (
            <button
              key={ch.id}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all text-left"
              style={{
                background: inVoice && currentChannel.id === ch.id ? activeBg : "transparent",
                color: mutedColor,
              }}
              onClick={() => {
                setCurrentChannel(ch);
                setInVoice(true);
                setMobileSidebar(false);
              }}
            >
              <Icon name="Volume2" size={15} />
              <span className="truncate">{ch.name}</span>
            </button>
          ))}
        </div>

        {/* Пользователь */}
        <div
          className="flex items-center gap-3 px-3 py-3 border-t"
          style={{ borderColor, background: isDark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.03)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: T.accent }}
          >
            {user.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: textColor }}>
              {user.name}
            </div>
            {user.isAdmin && (
              <div className="text-xs font-medium" style={{ color: T.accent }}>
                Администратор
              </div>
            )}
          </div>
          <button
            className="p-1.5 rounded-lg transition hover:opacity-70"
            style={{ color: mutedColor }}
            title="Сменить тему"
            onClick={() => setShowThemes(!showThemes)}
          >
            <Icon name="Palette" size={16} />
          </button>
          <button
            className="p-1.5 rounded-lg transition hover:opacity-70"
            style={{ color: mutedColor }}
            title="Выйти"
            onClick={() => setUser(null)}
          >
            <Icon name="LogOut" size={16} />
          </button>
        </div>
      </aside>

      {/* Панель выбора темы */}
      {showThemes && (
        <div
          className="fixed bottom-16 left-2 z-50 rounded-2xl shadow-2xl p-4 w-56"
          style={{ background: T.sidebar, border: `1px solid ${borderColor}` }}
        >
          <p className="text-xs font-bold uppercase mb-3" style={{ color: mutedColor }}>
            Тема оформления
          </p>
          <div className="space-y-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition"
                style={{
                  background: theme === t.id ? activeBg : "transparent",
                  color: theme === t.id ? T.accent : textColor,
                  fontWeight: theme === t.id ? 600 : 400,
                }}
                onClick={() => {
                  setTheme(t.id);
                  setShowThemes(false);
                }}
              >
                <div className="w-5 h-5 rounded-full border-2 border-white shadow" style={{ background: t.accent }} />
                {t.label}
                {theme === t.id && <Icon name="Check" size={14} className="ml-auto" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Основная область */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Шапка канала */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
          style={{ borderColor, background: T.bg }}
        >
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: mutedColor }}
            onClick={() => setMobileSidebar(true)}
          >
            <Icon name="Menu" size={20} />
          </button>

          {currentChannel.type === "voice" ? (
            <Icon name="Volume2" size={18} style={{ color: mutedColor }} />
          ) : currentChannel.type === "news" ? (
            <Icon name="Megaphone" size={18} style={{ color: T.accent }} />
          ) : (
            <Icon name="Hash" size={18} style={{ color: mutedColor }} />
          )}

          <span className="font-bold text-base" style={{ color: textColor }}>
            {currentChannel.name}
          </span>

          {currentChannel.locked && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: `${T.accent}22`, color: T.accent }}
            >
              Только для чтения
            </span>
          )}

          {currentChannel.type === "voice" && (
            <div className="ml-auto flex items-center gap-2">
              {inVoice ? (
                <button
                  className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
                  style={{ background: "#ef4444" }}
                  onClick={() => setInVoice(false)}
                >
                  <Icon name="PhoneOff" size={14} />
                  Покинуть
                </button>
              ) : (
                <button
                  className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
                  style={{ background: "#22c55e" }}
                  onClick={() => setInVoice(true)}
                >
                  <Icon name="Phone" size={14} />
                  Войти
                </button>
              )}
            </div>
          )}
        </div>

        {/* Голосовой режим */}
        {currentChannel.type === "voice" ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center shadow-xl"
              style={{ background: inVoice ? `${T.accent}22` : inputBg }}
            >
              <Icon name={inVoice ? "Mic" : "MicOff"} size={40} style={{ color: inVoice ? T.accent : mutedColor }} />
            </div>
            <div className="text-center">
              <p className="font-bold text-lg" style={{ color: textColor }}>
                {currentChannel.name}
              </p>
              <p className="text-sm mt-1" style={{ color: mutedColor }}>
                {inVoice ? "Вы в голосовом канале" : "Нажмите «Войти» чтобы подключиться"}
              </p>
            </div>
            {inVoice && (
              <div className="flex gap-3">
                <button
                  className="w-12 h-12 rounded-full flex items-center justify-center transition hover:opacity-80"
                  style={{ background: inputBg }}
                  title="Микрофон"
                >
                  <Icon name="Mic" size={20} style={{ color: T.accent }} />
                </button>
                <button
                  className="w-12 h-12 rounded-full flex items-center justify-center transition hover:opacity-80"
                  style={{ background: inputBg }}
                  title="Наушники"
                >
                  <Icon name="Headphones" size={20} style={{ color: textColor }} />
                </button>
                <button
                  className="w-12 h-12 rounded-full flex items-center justify-center transition hover:opacity-80"
                  style={{ background: "#ef444422" }}
                  title="Покинуть"
                  onClick={() => setInVoice(false)}
                >
                  <Icon name="PhoneOff" size={20} style={{ color: "#ef4444" }} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Сообщения */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {channelMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
                  <Icon name="MessageCircle" size={48} style={{ color: mutedColor }} />
                  <p style={{ color: mutedColor }}>Пока нет сообщений</p>
                </div>
              )}
              {channelMessages.map((msg) => (
                <div key={msg.id} className="flex gap-3 group">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5"
                    style={{ background: msg.isAdmin ? T.accent : `hsl(${msg.id * 47 % 360}, 60%, 55%)` }}
                  >
                    {msg.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-bold" style={{ color: msg.isAdmin ? T.accent : textColor }}>
                        {msg.author}
                      </span>
                      {msg.isAdmin && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                          style={{ background: T.accent, color: "#fff" }}
                        >
                          ADMIN
                        </span>
                      )}
                      <span className="text-xs" style={{ color: mutedColor }}>
                        {msg.time}
                      </span>
                    </div>
                    {msg.sticker ? (
                      <span className="text-4xl leading-none">{msg.sticker}</span>
                    ) : (
                      <p className="text-sm mt-0.5 leading-relaxed" style={{ color: textColor }}>
                        {msg.text}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Стикеры */}
            {showStickers && (
              <div
                className="mx-4 mb-2 p-3 rounded-2xl border"
                style={{ background: T.sidebar, borderColor }}
              >
                <p className="text-xs font-bold uppercase mb-2" style={{ color: mutedColor }}>
                  Стикеры
                </p>
                <div className="flex flex-wrap gap-2">
                  {STICKERS.map((s) => (
                    <button
                      key={s.id}
                      className="w-10 h-10 text-2xl rounded-xl flex items-center justify-center transition hover:scale-125"
                      style={{ background: hoverBg }}
                      title={s.label}
                      onClick={() => sendMessage(undefined, s.emoji)}
                    >
                      {s.emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ввод */}
            <div className="px-4 pb-4 shrink-0">
              {!canWrite() ? (
                <div
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm"
                  style={{ background: inputBg, color: mutedColor }}
                >
                  <Icon name="Lock" size={16} />
                  В этот канал могут писать только администраторы
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl border"
                  style={{ background: inputBg, borderColor }}
                >
                  <button
                    className="p-1.5 rounded-lg transition hover:opacity-70"
                    style={{ color: showStickers ? T.accent : mutedColor }}
                    onClick={() => setShowStickers(!showStickers)}
                    title="Стикеры"
                  >
                    <Icon name="Smile" size={20} />
                  </button>
                  <input
                    className="flex-1 bg-transparent outline-none text-sm"
                    placeholder={`Написать в #${currentChannel.name}...`}
                    style={{ color: textColor }}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && inputText.trim()) {
                        e.preventDefault();
                        sendMessage(inputText.trim());
                      }
                    }}
                  />
                  <button
                    className="p-1.5 rounded-lg transition hover:opacity-70 disabled:opacity-30"
                    style={{ color: inputText.trim() ? T.accent : mutedColor }}
                    disabled={!inputText.trim()}
                    onClick={() => inputText.trim() && sendMessage(inputText.trim())}
                  >
                    <Icon name="Send" size={18} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
