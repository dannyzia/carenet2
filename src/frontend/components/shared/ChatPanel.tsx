/**
 * ChatPanel — unified messaging UI used across all role-specific message pages.
 *
 * Props:
 * - conversations: list from messageService.getConversations(role)
 * - accentColor: hex color for accent (e.g. cn.pink, cn.green)
 * - accentGradient: CSS gradient string for sent message bubbles
 * - initialConvoId: optional conversation to auto-select (from ?to= param or default)
 * - onSend: callback when user sends a message
 * - roleFilter: optional — show role filter dropdown (agency page)
 * - roleLabels: optional — custom role label map
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Send, Paperclip, Phone, Video, MoreVertical,
  Check, CheckCheck, ChevronLeft, MessageSquare, Pin,
} from "lucide-react";
import { cn } from "@/frontend/theme/tokens";
import { messageService } from "@/backend/services";
import type { ConversationItem, ChatMessage } from "@/backend/models";
import { useUnreadCountsCtx } from "@/frontend/hooks/UnreadCountsContext";

export interface ChatPanelProps {
  conversations: ConversationItem[];
  accentColor: string;
  accentGradient: string;
  initialConvoId?: string | null;
  showRoleFilter?: boolean;
  roleLabels?: Record<string, string>;
}

const DEFAULT_ROLE_LABELS: Record<string, string> = {
  caregiver: "Caregiver",
  guardian: "Guardian",
  patient: "Patient",
  agency: "Agency",
  doctor: "Doctor",
  admin: "Platform",
  moderator: "Moderator",
  internal: "Internal",
};

export function ChatPanel({
  conversations,
  accentColor,
  accentGradient,
  initialConvoId,
  showRoleFilter,
  roleLabels = DEFAULT_ROLE_LABELS,
}: ChatPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (!initialConvoId) return null;
    // If initialConvoId matches a conversation, use it directly
    const directMatch = conversations.find((c) => c.id === initialConvoId);
    if (directMatch) return directMatch.id;
    // If it's a ?to=userId, find a conversation with that user (fuzzy match on name/id)
    // In Supabase mode, getOrCreateConversation would handle this
    // For mock mode, fall back to first conversation
    return conversations[0]?.id ?? null;
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  // Mobile toggles list vs chat; desktop layout ignores this (both panes always shown).
  // When a conversation is pre-selected, open the chat pane on mobile so the composer is mounted.
  const [sidebarOpen, setSidebarOpen] = useState(() => !initialConvoId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConvo = conversations.find((c) => c.id === selectedId);
  const { decrementMessages } = useUnreadCountsCtx();

  // Track which conversations we've already marked as read (optimistic)
  const markedReadRef = useRef<Set<string>>(new Set());

  // Load messages when active conversation changes
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setLoadingMsgs(true);
    messageService.getMessages(selectedId).then((msgs) => {
      if (!cancelled) {
        setMessages(msgs);
        setLoadingMsgs(false);
      }
    });

    // Optimistically decrement the global badge for this convo's unread count
    const convo = conversations.find((c) => c.id === selectedId);
    if (convo && convo.unread > 0 && !markedReadRef.current.has(selectedId)) {
      markedReadRef.current.add(selectedId);
      decrementMessages(convo.unread);
      // Fire-and-forget: persist read status in Supabase
      messageService.markConversationRead(selectedId);
    }

    return () => { cancelled = true; };
  }, [selectedId, conversations, decrementMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectConvo = useCallback((id: string) => {
    setSelectedId(id);
    setSidebarOpen(false);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !selectedId) return;
    const text = input.trim();
    setInput("");
    // Optimistic: append immediately
    const optimistic: ChatMessage = {
      id: `opt-${Date.now()}`,
      sender: "self",
      senderName: "Me",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    // Call service
    try {
      const real = await messageService.sendMessage(selectedId, text);
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? real : m))
      );
    } catch {
      // Keep optimistic on failure
    }
  }, [input, selectedId]);

  // Filter conversations
  const filtered = conversations
    .filter((c) => {
      if (filterRole !== "all" && c.role !== filterRole) return false;
      if (searchQuery) return c.name.toLowerCase().includes(searchQuery.toLowerCase());
      return true;
    })
    .sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));

  const roles = [...new Set(conversations.map((c) => c.role))];

  // ─── Conversation List ───
  const ConvoList = (
    <div className="flex flex-col h-full overflow-hidden rounded-xl" style={{ background: cn.bgCard, boxShadow: cn.shadowCard }}>
      <div className="p-4 space-y-3" style={{ borderBottom: `1px solid ${cn.borderLight}` }}>
        <h2 className="text-xl" style={{ color: cn.textHeading }}>Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: cn.textSecondary }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="cn-input pl-9 h-10 text-xs w-full"
          />
        </div>
        {showRoleFilter && (
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: cn.border, background: cn.bgInput, color: cn.text }}
          >
            <option value="all">All</option>
            {roles.map((r) => (
              <option key={r} value={r}>{roleLabels[r] || r}</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex-1 overflow-y-auto cn-scroll-mobile">
        {filtered.length === 0 && (
          <div className="p-6 text-center">
            <MessageSquare className="w-10 h-10 mx-auto mb-2" style={{ color: cn.borderLight }} />
            <p className="text-sm" style={{ color: cn.textSecondary }}>No conversations found</p>
          </div>
        )}
        {filtered.map((convo) => {
          const isActive = selectedId === convo.id;
          return (
            <button
              key={convo.id}
              onClick={() => selectConvo(convo.id)}
              className="w-full p-4 flex items-center gap-3 text-left transition-all cn-touch-target"
              style={{
                background: isActive ? `${accentColor}10` : "transparent",
                borderLeft: isActive ? `3px solid ${accentColor}` : "3px solid transparent",
                borderBottom: `1px solid ${cn.borderLight}`,
              }}
            >
              <div className="relative shrink-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm"
                  style={{ background: accentColor }}
                >
                  {convo.avatar?.slice(0, 2) || convo.name.charAt(0)}
                </div>
                {convo.online && (
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                    style={{ background: cn.green, borderColor: cn.bgCard }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {convo.pinned && <Pin className="w-3 h-3 shrink-0" style={{ color: cn.textSecondary }} />}
                    <span className="text-sm truncate" style={{ color: cn.text, fontWeight: convo.unread > 0 ? 600 : 400 }}>
                      {convo.name}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] shrink-0"
                      style={{ background: `${accentColor}15`, color: accentColor }}
                    >
                      {roleLabels[convo.role] || convo.role}
                    </span>
                  </div>
                  <span className="text-[10px] shrink-0 ml-1" style={{ color: cn.textSecondary }}>{convo.lastTime}</span>
                </div>
                <p className="text-xs truncate mt-0.5" style={{ color: convo.unread > 0 ? cn.text : cn.textSecondary }}>
                  {convo.lastMessage}
                </p>
              </div>
              {convo.unread > 0 && (
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white shrink-0"
                  style={{ background: accentColor }}
                >
                  {convo.unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ─── Chat Area ───
  const ChatArea = activeConvo ? (
    <div className="flex flex-col h-full overflow-hidden rounded-xl" style={{ background: cn.bgCard, boxShadow: cn.shadowCard }}>
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${cn.borderLight}` }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedId(null); setSidebarOpen(true); }}
            className="lg:hidden p-2 -ml-2 rounded-lg cn-touch-target"
            style={{ color: cn.text }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm"
            style={{ background: accentColor }}
          >
            {activeConvo.avatar?.slice(0, 2) || activeConvo.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm" style={{ color: cn.textHeading }}>{activeConvo.name}</p>
            <p className="text-[10px] flex items-center gap-1" style={{ color: activeConvo.online ? cn.green : cn.textSecondary }}>
              {activeConvo.online && <span className="w-1.5 h-1.5 rounded-full" style={{ background: cn.green }} />}
              {activeConvo.online ? "Online" : "Offline"} &middot; {roleLabels[activeConvo.role] || activeConvo.role}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-all cn-touch-target"><Phone className="w-4 h-4" style={{ color: cn.textSecondary }} /></button>
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-all cn-touch-target"><Video className="w-4 h-4" style={{ color: cn.textSecondary }} /></button>
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-all cn-touch-target"><MoreVertical className="w-4 h-4" style={{ color: cn.textSecondary }} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 cn-scroll-mobile" style={{ background: cn.bgInput }}>
        {loadingMsgs ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: cn.borderLight, borderTopColor: accentColor }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-10 h-10 mb-2" style={{ color: cn.borderLight }} />
            <p className="text-sm" style={{ color: cn.textSecondary }}>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border" style={{ background: cn.bgCard, color: cn.textSecondary, borderColor: cn.borderLight }}>
                Today
              </span>
            </div>
            {messages.map((msg) => {
              const isSelf = msg.sender === "self";
              return (
                <div key={msg.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%] md:max-w-[70%]">
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm ${isSelf ? "rounded-br-sm" : "rounded-bl-sm"}`}
                      style={{
                        background: isSelf ? accentGradient : cn.bgCard,
                        color: isSelf ? "white" : cn.text,
                        border: isSelf ? "none" : `1px solid ${cn.borderLight}`,
                      }}
                    >
                      {msg.text}
                    </div>
                    <div className={`flex items-center gap-1 mt-1 ${isSelf ? "justify-end" : "justify-start"}`}>
                      <span className="text-[10px]" style={{ color: cn.textSecondary }}>{msg.time}</span>
                      {isSelf && (
                        msg.read
                          ? <CheckCheck className="w-3 h-3" style={{ color: accentColor }} />
                          : <Check className="w-3 h-3" style={{ color: cn.textSecondary }} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-3 md:p-4 cn-safe-bottom" style={{ borderTop: `1px solid ${cn.borderLight}` }}>
        <div className="flex gap-2 md:gap-3 items-center">
          <button className="p-2 rounded-lg cn-touch-target" style={{ color: cn.textSecondary }}>
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type your message..."
              className="cn-input h-11 md:h-12 pr-12 w-full"
              style={{ fontSize: "16px" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl text-white hover:opacity-90 transition-all disabled:opacity-50"
              style={{ background: accentColor }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="hidden lg:flex flex-1 items-center justify-center rounded-xl" style={{ background: cn.bgCard, boxShadow: cn.shadowCard }}>
      <div className="text-center">
        <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: cn.borderLight }} />
        <p className="text-sm" style={{ color: cn.textSecondary }}>Select a conversation to start messaging</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: side-by-side */}
      <div className="hidden lg:flex h-[calc(100vh-140px)] gap-6">
        <div className="w-80 shrink-0">{ConvoList}</div>
        <div className="flex-1">{ChatArea}</div>
      </div>
      {/* Mobile: toggle */}
      <div className="lg:hidden h-[calc(100vh-120px)]">
        {sidebarOpen ? ConvoList : ChatArea}
      </div>
    </>
  );
}