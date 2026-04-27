const cron = require('node-cron');
const clientConfig = require('../config/client.json');
const { generateFollowUp } = require('../agents/FollowUpAgent');
const { sendEmail } = require('../agents/EmailService');
const { getLeadsForFollowUp, updateLead, logEmail, logAgent } = require('../db/queries');

/**
 * Follow-up cron — runs every hour.
 * Status-gated: skips booked, replied, disqualified leads.
 * Fires follow-up 1 at 24hrs, follow-up 2 at 72hrs.
 */
function startFollowUpCron() {
  cron.schedule('0 * * * *', async () => {
    console.log('[FollowUp Cron] Running...');

    const delay1 = clientConfig.followup_delay_hours?.first || 24;
    const delay2 = clientConfig.followup_delay_hours?.second || 72;

    // Follow-up 1
    const fu1Leads = getLeadsForFollowUp(delay1, 'follow_up_1_sent');
    console.log(`[FollowUp Cron] ${fu1Leads.length} leads eligible for follow-up 1`);

    for (const lead of fu1Leads) {
      await sendFollowUp(lead, 1);
    }

    // Follow-up 2
    const fu2Leads = getLeadsForFollowUp(delay2, 'follow_up_2_sent');
    console.log(`[FollowUp Cron] ${fu2Leads.length} leads eligible for follow-up 2`);

    for (const lead of fu2Leads) {
      await sendFollowUp(lead, 2);
    }
  });

  console.log('⏰ Follow-up cron started (hourly)');
}

async function sendFollowUp(lead, sequence) {
  const fu = await generateFollowUp(lead, sequence, clientConfig);

  if (!fu.success) {
    console.error(`[FollowUp #${lead.id}] seq${sequence} generation failed`);
    return;
  }

  try {
    await sendEmail({
      to: lead.email,
      from: { name: clientConfig.reply_from_name, email: clientConfig.reply_from_email },
      subject: fu.data.subject,
      body: fu.data.body,
      smtpConfig: clientConfig.smtp
    });

    const updateFields = sequence === 1
      ? { follow_up_1_sent: 1, follow_up_1_at: new Date().toISOString() }
      : { follow_up_2_sent: 1, follow_up_2_at: new Date().toISOString() };

    updateLead(lead.id, { ...updateFields, status: `follow_up_${sequence}_sent` });
    logEmail(lead.id, `FollowUpAgent_seq${sequence}`, fu.data.subject, fu.data.body);
    logAgent(lead.id, 'FollowUpAgent', `seq${sequence}`, fu.data.subject, fu.tokens);

    console.log(`[FollowUp #${lead.id}] ✅ Follow-up ${sequence} sent to ${lead.email}`);
  } catch (err) {
    console.error(`[FollowUp #${lead.id}] Email failed:`, err.message);
  }
}

module.exports = { startFollowUpCron };
