const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic();

/**
 * ClassifierAgent
 * Reads raw lead data, returns structured JSON classification.
 * Routes downstream agents — nothing sends without this passing first.
 */
async function classifyLead(lead, clientConfig) {
  const { business_name, business_type, services, escalation_keywords } = clientConfig;

  const prompt = `You are a lead classification agent for ${business_name}, a ${business_type}.

Lead submitted:
- Name: ${lead.name}
- Email: ${lead.email}
- Service requested: ${lead.service_requested || 'not specified'}
- Message: ${lead.message || 'none'}

Services offered: ${services.join(', ')}
Escalation keywords to watch for: ${escalation_keywords.join(', ')}

Classify this lead. Respond ONLY with a valid JSON object, no markdown, no explanation:

{
  "lead_type": "booking_ready | needs_qualification | junk",
  "urgency": "high | normal | low",
  "risk_flag": true | false,
  "risk_reason": "string or null",
  "service_match": "matched service name or null",
  "classification_notes": "one sentence summary"
}

Rules:
- booking_ready: person clearly wants to book a specific service
- needs_qualification: interest is present but service/timing unclear
- junk: spam, test, no real intent, or completely off-topic
- risk_flag true if any escalation keyword is present or message seems sensitive
- urgency high if they mention urgency, specific dates, or events`;

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

module.exports = { classifyLead };
