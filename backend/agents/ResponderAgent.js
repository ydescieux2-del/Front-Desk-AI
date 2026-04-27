const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic();

/**
 * ResponderAgent
 * Generates the first outbound email for booking_ready leads.
 * Injects dynamic context: name, service, booking link, hours.
 */
async function generateReply(lead, classification, clientConfig) {
  const {
    business_name, business_type, tone,
    booking_link, hours, location, services
  } = clientConfig;

  const prompt = `You are the front desk AI for ${business_name}, a ${business_type} in ${location}.
Tone: ${tone}
Hours: ${hours}
Services: ${services.join(', ')}
Booking link: ${booking_link}

Write a reply email to this lead. Be warm, specific, and end with the booking link.

Lead details:
- Name: ${lead.name}
- Service they want: ${classification.service_match || lead.service_requested || 'general inquiry'}
- Urgency: ${classification.urgency}
- Original message: ${lead.message || 'none'}

Rules:
- Use their first name
- Reference the specific service they mentioned
- Keep it under 120 words
- End with a clear CTA and the booking link
- Do NOT mention AI, automation, or this being a template
- Sound like a real human receptionist

Respond with ONLY a JSON object, no markdown:
{
  "subject": "email subject line",
  "body": "full email body as plain text with line breaks as \\n"
}`;

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }]
  });

  const raw = response.content[0].text.trim();

  try {
    const parsed = JSON.parse(raw);
    return {
      success: true,
      data: parsed,
      tokens: response.usage.input_tokens + response.usage.output_tokens
    };
  } catch {
    return {
      success: false,
      error: 'JSON parse failed',
      raw,
      tokens: response.usage.input_tokens + response.usage.output_tokens
    };
  }
}

module.exports = { generateReply };
