export interface EmailPayload {
  to: string
  subject: string
  body: string
}

// Consider using nodemailer (maybe add some env for the smtp conf)
export async function sendEmail(payload: EmailPayload): Promise<void> {
  console.log('📧 Email sent: ', JSON.stringify(payload, null, 2))
}
