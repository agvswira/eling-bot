export interface CommandContext {
  sender: string; // nomor WA pengirim (mis. "628123...")
  groupId?: string; // JID grup, undefined jika chat pribadi
  isAdmin: boolean;
}
