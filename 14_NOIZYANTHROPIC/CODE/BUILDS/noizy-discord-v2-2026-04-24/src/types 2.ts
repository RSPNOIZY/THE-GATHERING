// ============================================================
// NOIZY Discord Agent — Environment Types
// ============================================================

export interface Env {
  // Secrets (wrangler secret put)
  DISCORD_APPLICATION_ID: string;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_BOT_TOKEN: string;
  DISCORD_GUILD_ID?: string;

  // Bindings
  DB: D1Database;
  CACHE: KVNamespace;

  // Vars
  ENVIRONMENT: string;
  AGENT_NAME: string;
  AGENT_VERSION: string;
}

// Discord Interaction Types
export const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5,
} as const;

export const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
  MODAL: 9,
} as const;

export const InteractionResponseFlags = {
  EPHEMERAL: 1 << 6,
} as const;

export interface DiscordInteraction {
  id: string;
  application_id: string;
  type: number;
  data?: {
    id: string;
    name: string;
    options?: Array<{
      name: string;
      type: number;
      value?: string | number | boolean;
      options?: Array<{
        name: string;
        type: number;
        value?: string | number | boolean;
      }>;
    }>;
    custom_id?: string;
    component_type?: number;
    values?: string[];
    components?: any[];
  };
  guild_id?: string;
  channel_id?: string;
  member?: {
    user: DiscordUser;
    roles: string[];
    permissions: string;
    nick?: string;
  };
  user?: DiscordUser;
  token: string;
  version: number;
  message?: any;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  global_name?: string;
}

export interface CommandResponse {
  type: number;
  data?: {
    content?: string;
    embeds?: DiscordEmbed[];
    flags?: number;
    components?: any[];
  };
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
  thumbnail?: { url: string };
  author?: { name: string; icon_url?: string; url?: string };
}

// ── Component Types ────────────────────────────────────────
export const ComponentType = {
  ACTION_ROW: 1,
  BUTTON: 2,
  STRING_SELECT: 3,
  TEXT_INPUT: 4,
  USER_SELECT: 5,
  ROLE_SELECT: 6,
  MENTIONABLE_SELECT: 7,
  CHANNEL_SELECT: 8,
} as const;

export const ButtonStyle = {
  PRIMARY: 1,    // blurple
  SECONDARY: 2,  // grey
  SUCCESS: 3,    // green
  DANGER: 4,     // red
  LINK: 5,       // grey with URL
} as const;

export const TextInputStyle = {
  SHORT: 1,      // single line
  PARAGRAPH: 2,  // multi-line
} as const;

export interface ActionRow {
  type: 1;
  components: (Button | SelectMenu | TextInput)[];
}

export interface Button {
  type: 2;
  style: number;
  label: string;
  custom_id?: string;
  url?: string;
  emoji?: { name: string; id?: string };
  disabled?: boolean;
}

export interface SelectMenu {
  type: 3;
  custom_id: string;
  placeholder?: string;
  min_values?: number;
  max_values?: number;
  options: SelectOption[];
}

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  emoji?: { name: string; id?: string };
  default?: boolean;
}

export interface TextInput {
  type: 4;
  custom_id: string;
  style: number;
  label: string;
  min_length?: number;
  max_length?: number;
  required?: boolean;
  value?: string;
  placeholder?: string;
}

export interface ModalData {
  custom_id: string;
  title: string;
  components: ActionRow[];
}

// ── Admin Role Config ──────────────────────────────────────
export const ADMIN_PERMISSION = BigInt(1 << 3); // ADMINISTRATOR
