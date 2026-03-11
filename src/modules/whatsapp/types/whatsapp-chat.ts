export interface WhatsAppChat {
  id: string;
  organizationId: string;
  instanceId: string;
  leadId: string | null;
  contactPhone: string;
  contactName: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}
