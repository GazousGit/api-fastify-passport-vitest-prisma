export interface SmsPayload {
  to: string
  body: string
}

// I don't think there's any free SMS service available (need to dig a bit)
export async function sendSms(payload: SmsPayload): Promise<void> {
  console.log('📱 SMS sent: ', JSON.stringify(payload, null, 2))
}
