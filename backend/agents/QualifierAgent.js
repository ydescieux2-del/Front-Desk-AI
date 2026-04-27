const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic();

/**
 * QualifierAgent
 * For needs_qualification leads only.
 * Asks ONE smart question to move the lead toward booking.
 */
async function generateQualification(lead, classification, clientConfig) {
  const { business_name, business_type, tone, services, booking_link } = clientConfig;

  const prompt = `You are the front desk AI for ${business_name}, a ${business_type}.
Tone: ${tone}
Services offered: ${services.join(', ')}

This lead needs a qualification question before we send a booking link.

Lead:
- Name: ${lead.name}
- What they said: ${lead.message || lead.service_requested || 'no detail provided'}
- Classification notes: ${classification.classification_notes}

Write a short, warm reply that:
1. Acknowledges their interest by name
2. Asks ONE clarifying question to understand what they want
3. Does NOT send the booking link yet
4. Sounds like a real human, under 80 words

Respond ONLY with a JSON object, no markdown:
{
  "subject": "email subject line",
  "body": "email body as plain text with \\n line breaks"
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

module.exports = { generateQualification };
