// Backward-compatible wrapper.
// The provider now uses the Baileys server configured via WHATSAPP_SERVER_URL.
import { BaileysProvider } from "./baileys-provider.ts";

export class EvolutionProvider extends BaileysProvider {
  constructor(serverUrl: string) {
    super(serverUrl);
  }
}
