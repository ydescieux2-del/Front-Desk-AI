const express = require('express');
const router = express.Router();
const clientConfig = require('../config/client.json');
const { classifyLead } = require('../agents/ClassifierAgent');
const { generateReply } = require('../agents/ResponderAgent');
const { generateQualification } = require('../agents/QualifierAgent');
const { sendEmail } = require('../agents/EmailService');
const { insertLead, updateLead, logEmail, logAgent } = require('../db/queries');

/**
 * POST /api/lead
 * Main intake endpoint. Accepts form submission, runs full pipeline.
 */
router.post('/', async (req, res) => {
  const { name, email, phone, service_requested, message, source } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email required' });
  }

  // 1. Log lead to DB
  const leadId = insertLead({
    name, email,
    phone: phone || null,
    service_requested: service_requested || null,
    message: message || null,
    source: source || 'api'
  });

  const lead = { id: leadId, name, email, phone, service_requested, message };
  console.log(`[Lead #${leadId}] Intake: ${name} <${email}>`);

  // 2. Classify
  const classification = await classifyLead(lead, clientConfig);

  if (!classification.success) {
    console.error(`[Lead #${leadId}] Classification failed:`, classification.error);
    updateLead(leadId, { status: 'classification_failed' });
    logAgent(leadId, 'ClassifierAgent', JSON.stringify(lead), classification.error, classification.tokens);
    return res.status(200).json({ leadId, status: 'classification_failed' });
  }

  const cls = classification.data;
  console.log(`[Lead #${leadId}] Classified: ${cls.lead_type} | urgency: ${cls.urgency} | risk: ${cls.risk_flag}`);

  updateLead(leadId, {
    lead_type: cls.lead_type,
    urgency: cls.urgency,
    risk_flag: cls.risk_flag ? 1 : 0,
    status: cls.lead_type === 'junk' ? 'disqualified' : 'classified',
    disqualified: cls.lead_type === 'junk' ? 1 : 0,
    classification_json: JSON.stringify(cls)
  });

  logAgent(leadId, 'ClassifierAgent', `${name} / ${service_requested}`, cls.lead_type, classification.tokens);

  // 3. Junk — stop here
  if (cls.lead_type === 'junk') {
    return res.status(200).json({ leadId, status: 'disqualified', reason: 'junk lead' });
  }

  // 4. Risk flag — log for human review, still reply but flag
  if (cls.risk_flag) {
    console.warn(`[Lead #${leadId}] ⚠️  Risk flag: ${cls.risk_reason}`);
    updateLead(leadId, { status: 'needs_review' });
    return res.status(200).json({ leadId, status: 'flagged_for_review', risk_reason: cls.risk_reason });
  }

  // 5. Route to Responder or Qualifier
  let emailPayload;
  let agentName;

  if (cls.lead_type === 'booking_ready') {
    const reply = await generateReply(lead, cls, clientConfig);
    if (!reply.success) {
      console.error(`[Lead #${leadId}] Responder failed`);
      return res.status(200).json({ leadId, status: 'reply_failed' });
    }
    emailPayload = reply.data;
    agentName = 'ResponderAgent';
    logAgent(leadId, 'ResponderAgent', cls.lead_type, emailPayload.subject, reply.tokens);
  } else {
    const qual = await generateQualification(lead, cls, clientConfig);
    if (!qual.success) {
      console.error(`[Lead #${leadId}] Qualifier failed`);
      return res.status(200).json({ leadId, status: 'qualification_failed' });
    }
    emailPayload = qual.data;
    agentName = 'QualifierAgent';
    logAgent(leadId, 'QualifierAgent', cls.lead_type, emailPayload.subject, qual.tokens);
  }

  // 6. Send email
  try {
    await sendEmail({
      to: email,
      from: { name: clientConfig.reply_from_name, email: clientConfig.reply_from_email },
      subject: emailPayload.subject,
      body: emailPayload.body,
      smtpConfig: clientConfig.smtp
    });

    updateLead(leadId, {
      first_reply_sent: 1,
      first_reply_at: new Date().toISOString(),
      status: 'replied_initial'
    });

    logEmail(leadId, agentName, emailPayload.subject, emailPayload.body);
    console.log(`[Lead #${leadId}] ✅ Email sent via ${agentName}`);

    return res.status(200).json({
      leadId,
      status: 'sent',
      agent: agentName,
      classification: cls
    });

  } catch (emailErr) {
    console.error(`[Lead #${leadId}] Email send failed:`, emailErr.message);
    updateLead(leadId, { status: 'email_failed' });
    return res.status(500).json({ leadId, status: 'email_failed', error: emailErr.message });
  }
});

module.exports = router;
