const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic();

/**
 * FollowUpAgent
 * Generates follow-up emails for leads that haven't booked or replied.
 * Status-gated: never fires if booked, replied, or disqualified.
 * sequence: 1 = 24hr, 2 = 72hr
 */
async function generateFollowUp(lead, sequence, clientConfig) {
  const { business_name, business_type, tone, booking_link, services } = clientConfig;

  const angle = sequence === 1
    ? 'gentle reminder — just checking if they saw your last message'
    : 'softer curiosity angle — ask if they have any questions, no pressure';

  const prompt = `You are the front desk AI for ${business_name}, a ${business_type}.
Tone: ${tone}
Services: ${services.join(', ')}
Booking link: ${booking_link}

Write follow-up email #${sequence} to a lead who hasn't replied or booked yet.
Angle: ${angle}

Lead context:
- Name: ${lead.name}
- Service they originally asked about: ${lead.service_requested || 'general inquiry'}
- Days since first contact: ${sequence === 1 ? '1' : '3'}

Rules:
- Under 80 words
- No desperation, no urgency pressure
- Sound human and warm
- Include booking link naturally in sequence 1, softly in sequence 2
- Do NOT mention this is automated

Respond ONLY with a JSON object, no markdown:
{
  "subject": "email subject line",
  "body": "email body with \\n line breaks"
}`;

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 300,
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

module.exports = { generateFollowUp };
