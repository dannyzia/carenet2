/**
 * Per-role card gradients — single source for role selection tiles and dashboard primary actions.
 * Matches the palette used on `/auth/role-selection`.
 */
import type { Role } from "@/frontend/theme/tokens";

export const roleCardGradient: Record<Role, string> = {
  guardian:
    "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FFB3C1 0%, #FF8FA3 100%)",
  patient:
    "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #B8A7FF 0%, #8B7AE8 100%)",
  caregiver:
    "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #A8E063 0%, #7CE577 100%)",
  agency:
    "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #8EC5FC 0%, #5B9FFF 100%)",
  shop:
    "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #00BCD4 0%, #0097A7 100%)",
  moderator:
    "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FFD180 0%, #FFB74D 100%)",
  admin:
    "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #B8A7FF 0%, #8B7AE8 100%)",
};

export function getRoleActionGradient(role: Role): string {
  return roleCardGradient[role] ?? roleCardGradient.guardian;
}
