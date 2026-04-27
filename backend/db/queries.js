const { getDb } = require('./init');

function insertLead(data) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO leads (name, email, phone, service_requested, message, source)
    VALUES (@name, @email, @phone, @service_requested, @message, @source)
  `);
  const result = stmt.run(data);
  db.close();
  return result.lastInsertRowid;
}

function updateLead(id, fields) {
  const db = getDb();
  const entries = Object.entries({ ...fields, updated_at: new Date().toISOString() });
  const sets = entries.map(([k]) => `${k} = @${k}`).join(', ');
  const values = Object.fromEntries(entries);
  db.prepare(`UPDATE leads SET ${sets} WHERE id = @id`).run({ ...values, id });
  db.close();
}

function getLead(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  db.close();
  return row;
}

function getLeadsForFollowUp(delayHours, followUpField) {
  const db = getDb();
  const cutoff = new Date(Date.now() - delayHours * 60 * 60 * 1000).toISOString();
  const rows = db.prepare(`
    SELECT * FROM leads
    WHERE ${followUpField} = 0
    AND replied = 0
    AND booked = 0
    AND disqualified = 0
    AND lead_type != 'junk'
    AND first_reply_sent = 1
    AND created_at <= ?
  `).all(cutoff);
  db.close();
  return rows;
}

function getAllLeads(limit = 100) {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT ?').all(limit);
  db.close();
  return rows;
}

function logEmail(leadId, type, subject, body) {
  const db = getDb();
  db.prepare(`
    INSERT INTO email_log (lead_id, email_type, subject, body)
    VALUES (?, ?, ?, ?)
  `).run(leadId, type, subject, body);
  db.close();
}

function logAgent(leadId, agent, inputSummary, outputSummary, tokensUsed) {
  const db = getDb();
  db.prepare(`
    INSERT INTO agent_log (lead_id, agent, input_summary, output_summary, tokens_used)
    VALUES (?, ?, ?, ?, ?)
  `).run(leadId, agent, inputSummary, outputSummary, tokensUsed || 0);
  db.close();
}

module.exports = {
  insertLead, updateLead, getLead,
  getLeadsForFollowUp, getAllLeads,
  logEmail, logAgent
};
