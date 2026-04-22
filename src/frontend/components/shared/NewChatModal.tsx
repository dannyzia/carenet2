/**
 * NewChatModal — Autocomplete search modal for starting new conversations
 *
 * Shows grouped suggestions:
 * - Agencies (all agencies)
 * - Active Job Contacts (guardians, patients, fellow caregivers from active jobs)
 */
import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import {
  Search,
  X,
  Building2,
  Users,
  User,
  UserCircle,
  Check,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/frontend/theme/tokens";
import { caregiverContactsService, type CaregiverContact } from "@/backend/services/caregiverContacts.service";
import { useAuth } from "@/backend/store";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact: (contact: CaregiverContact) => void;
  accentColor: string;
}

const ROLE_ICONS: Record<string, ReactNode> = {
  agency: <Building2 className="w-4 h-4" />,
  guardian: <User className="w-4 h-4" />,
  patient: <UserCircle className="w-4 h-4" />,
  caregiver: <Users className="w-4 h-4" />,
};


export function NewChatModal({ isOpen, onClose, onSelectContact, accentColor }: NewChatModalProps) {
  const { t } = useTranslation("chat");
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<CaregiverContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      loadContacts("");
    } else {
      setSearchQuery("");
      setContacts([]);
    }
    // Cleanup debounce on unmount
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [isOpen]);

  // Debounced search
  const loadContacts = useCallback(async (query: string) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const results = await caregiverContactsService.searchContacts(user.id, query);
      setContacts(results);
      setSelectedIndex(0);
    } catch (err) {
      console.error("[NewChatModal] Failed to load contacts:", err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      loadContacts(value);
    }, 300);
  };

  const handleSelect = (contact: CaregiverContact) => {
    onSelectContact(contact);
    setSearchQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (contacts.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % contacts.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + contacts.length) % contacts.length);
        break;
      case "Enter":
        e.preventDefault();
        if (contacts[selectedIndex]) {
          handleSelect(contacts[selectedIndex]);
        }
        break;
      case "Escape":
        onClose();
        break;
    }
  };

  // Group contacts by group
  const groupedContacts = (contacts || []).reduce(
    (acc, contact) => {
      if (!acc[contact.group]) acc[contact.group] = [];
      acc[contact.group].push(contact);
      return acc;
    },
    {} as Record<string, CaregiverContact[]>
  );

  const agencies = groupedContacts["agencies"] || [];
  const jobContacts = groupedContacts["active_job_contacts"] || [];

  if (!isOpen) return null;

  return (
    <div
      data-testid="modal-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg mx-4 rounded-xl shadow-xl overflow-hidden"
        style={{ background: cn.bgCard }}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: cn.borderLight }}
        >
          <h2 className="text-lg font-semibold" style={{ color: cn.textHeading }}>
            {t("newChat")}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:opacity-70 transition-opacity"
            style={{ color: cn.textSecondary }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: cn.textSecondary }}
            />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={t("searchContacts")}
              className="w-full pl-10 pr-4 py-3 rounded-lg border outline-none focus:ring-2 text-sm"
              style={{
                borderColor: cn.border,
                background: cn.bgInput,
                color: cn.text,
                boxShadow: "none",
              }}
            />
          </div>
        </div>

        {/* Results */}
        <div
          className="max-h-[50vh] overflow-y-auto"
          style={{ background: cn.bgCard }}
        >
          {loading && (
            <div className="p-4 text-center text-sm" style={{ color: cn.textSecondary }}>
              {t("loading")}
            </div>
          )}

          {!loading && contacts.length === 0 && (
            <div className="p-6 text-center">
              <Users className="w-10 h-10 mx-auto mb-2" style={{ color: cn.borderLight }} />
              <p className="text-sm" style={{ color: cn.textSecondary }}>
                {searchQuery ? t("noContactsFound") : t("noContactsAvailable")}
              </p>
            </div>
          )}

          {/* Agencies Section */}
          {agencies.length > 0 && (
            <div>
              <div
                className="px-4 py-2 text-xs font-medium uppercase tracking-wide"
                style={{ color: cn.textSecondary, background: cn.bgPage }}
              >
                {t("section.agencies")}
              </div>
              {agencies.map((contact, idx) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  isSelected={contacts.indexOf(contact) === selectedIndex}
                  accentColor={accentColor}
                  onClick={() => handleSelect(contact)}
                  t={t}
                />
              ))}
            </div>
          )}

          {/* Active Job Contacts Section */}
          {jobContacts.length > 0 && (
            <div>
              <div
                className="px-4 py-2 text-xs font-medium uppercase tracking-wide"
                style={{ color: cn.textSecondary, background: cn.bgPage }}
              >
                {t("section.jobContacts")}
              </div>
              {jobContacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  isSelected={contacts.indexOf(contact) === selectedIndex}
                  accentColor={accentColor}
                  onClick={() => handleSelect(contact)}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Contact row component
interface ContactRowProps {
  contact: CaregiverContact;
  isSelected: boolean;
  accentColor: string;
  onClick: () => void;
  t: (key: string) => string;
}

function ContactRow({ contact, isSelected, accentColor, onClick, t }: ContactRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors cn-touch-target"
      style={{
        background: isSelected ? `${accentColor}15` : "transparent",
        borderLeft: isSelected ? `3px solid ${accentColor}` : "3px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = `${accentColor}08`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ background: accentColor }}
      >
        {contact.avatar && contact.avatar.startsWith("http") ? (
          <img
            src={contact.avatar}
            alt={contact.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-white text-sm font-medium">
            {contact.avatar || contact.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-medium text-sm truncate"
            style={{ color: cn.textHeading }}
          >
            {contact.name}
          </span>
          {/* Role badge */}
          <span
            className="px-2 py-0.5 rounded-full text-xs flex items-center gap-1"
            style={{
              background: `${accentColor}20`,
              color: accentColor,
            }}
          >
            {ROLE_ICONS[contact.role] || <User className="w-3 h-3" />}
            {t(`contactRole.${contact.role}`) || contact.role}
          </span>
        </div>
        {/* Job title (if available for active job contacts) */}
        {contact.jobTitle && (
          <div className="text-xs truncate" style={{ color: cn.textSecondary }}>
            {contact.jobTitle}
          </div>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && <Check className="w-5 h-5 shrink-0" style={{ color: accentColor }} />}
    </button>
  );
}
