function normalizedEmail(student) {
  const email = String(student?.email || "").trim();
  if (email.includes("@")) {
    return email;
  }

  const identifier = String(student?.phone || "").trim();
  return identifier.includes("@") ? identifier : "";
}

function normalizedPhone(student) {
  const phone = String(student?.phone || "").trim();
  if (phone.includes("@")) {
    return "";
  }

  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`;
  }

  return phone;
}

export async function triggerOnboardingWorkflow({ student }) {
  const apiKey = String(process.env.NOVU_SECRET_KEY || process.env.NOVU_API_KEY || "").trim();
  const subscriberId = String(student?.id || student?.phone || student?.email || "").trim();
  if (!apiKey || !subscriberId) {
    return;
  }

  try {
    await fetch("https://api.novu.co/v1/events/trigger", {
      method: "POST",
      headers: {
        Authorization: `ApiKey ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "onboarding-demo-workflow",
        to: {
          subscriberId,
          firstName: String(student.full_name || "").trim(),
          ...(normalizedEmail(student) ? { email: normalizedEmail(student) } : {}),
          ...(normalizedPhone(student) ? { phone: normalizedPhone(student) } : {}),
          timezone: "Asia/Calcutta"
        },
        payload: {}
      })
    });
  } catch {
  }
}

export async function sendPasswordOtpNotifications({ student, otp }) {
  const message = `Crab Learn password verification code: ${otp}. It expires in 10 minutes. Do not share this code.`;
  const deliveries = await sendNotifications({
    recipients: [student],
    workflowId: process.env.NOVU_PASSWORD_WORKFLOW || "password-otp",
    payload: {
      otp,
      otpCode: otp,
      expiresInMinutes: 10,
      subject: "Crab Learn password verification code",
      message
    },
    logLabel: "password-otp"
  });
  return deliveries[0] || notConfiguredDelivery();
}

export async function sendPasswordUpdatedNotification({ student }) {
  const deliveries = await sendNotifications({
    recipients: [student],
    workflowId: process.env.NOVU_PASSWORD_UPDATED_WORKFLOW || "password-updated",
    payload: {
      subject: "Your Crab Learn password was updated",
      message: "Your Crab Learn password was updated successfully. If you did not make this change, contact your administrator immediately."
    },
    logLabel: "password-updated"
  });
  return deliveries[0] || notConfiguredDelivery();
}

export async function sendApprovalStatusNotification({ student, status, reviewedBy }) {
  const normalizedStatus = String(status || "").trim().toLowerCase();
  const approved = normalizedStatus === "approved";
  const subject = approved
    ? "Your Crab Learn account was approved"
    : "Update on your Crab Learn account request";
  const message = approved
    ? `Your Crab Learn ${student?.role === "teacher" ? "educator" : "student"} account has been approved${reviewedBy ? ` by ${reviewedBy}` : ""}. You can now sign in.`
    : `Your Crab Learn ${student?.role === "teacher" ? "educator" : "student"} account request was denied${reviewedBy ? ` by ${reviewedBy}` : ""}. Please contact support if you need more information.`;

  return sendNotifications({
    recipients: [student],
    workflowId: process.env.NOVU_ACCOUNT_STATUS_WORKFLOW || "account-approval-status",
    payload: { subject, message, status: normalizedStatus, reviewedBy: reviewedBy || null, student },
    logLabel: "account-approval-status"
  });
}

export async function sendMeetingNotifications({ meeting, recipients }) {
  const start = new Date(meeting.starts_at);
  const startLabel = Number.isNaN(start.getTime()) ? meeting.starts_at : start.toLocaleString();
  const message = [
    `Crab Learn meeting scheduled: ${meeting.title}.`,
    `When: ${startLabel}.`,
    `Duration: ${meeting.duration_min} minutes.`,
    `Join: ${meeting.join_url}`
  ].join("\n");

  return sendNotifications({
    recipients,
    workflowId: process.env.NOVU_MEETING_WORKFLOW || "meeting-scheduled",
    payload: { subject: `Crab Learn meeting scheduled: ${meeting.title}`, message, meeting },
    logLabel: "meeting-scheduled"
  });
}

function notConfiguredDelivery() {
  return { novu: "not_configured", email: "not_configured", sms: "not_configured", whatsapp: "not_configured" };
}

async function sendNotifications({ recipients, workflowId, payload, logLabel }) {
  const uniqueRecipients = Array.from(new Map(
    recipients
      .filter(Boolean)
      .map((recipient) => [
        String(recipient.id || recipient.email || recipient.phone || recipient.full_name),
        recipient
      ])
  ).values());

  return Promise.all(uniqueRecipients.map(async (recipient) => {
  const deliveries = notConfiguredDelivery();
  const apiKey = String(process.env.NOVU_API_KEY || "").trim();
  const workflow = String(workflowId || "").trim();
  const email = normalizedEmail(recipient);
  const phone = normalizedPhone(recipient);

  if (apiKey && workflow && (email || phone)) {
    try {
      const response = await fetch(`${process.env.NOVU_API_URL || "https://api.novu.co"}/v1/events/trigger`, {
        method: "POST",
        headers: { Authorization: `ApiKey ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflow,
          to: {
            subscriberId: String(recipient.id || recipient.phone || recipient.email || recipient.full_name),
            ...(email ? { email } : {}),
            ...(phone ? { phone } : {}),
            firstName: String(recipient.full_name || "").trim()
          },
          payload
        })
      });
      const status = response.ok ? "queued" : "failed";
      if (!response.ok) {
        const responseBody = await response.text();
        console.error(`[${logLabel}] Novu rejected ${workflow} for ${recipient.full_name}: HTTP ${response.status} ${responseBody.slice(0, 500)}`);
      }
      deliveries.novu = status;
      deliveries.email = email ? status : "not_configured";
      deliveries.sms = phone ? status : "not_configured";
      deliveries.whatsapp = phone ? status : "not_configured";
    } catch (error) {
      console.error(`[${logLabel}] Novu request failed for ${recipient.full_name}: ${error.message}`);
      deliveries.novu = "failed";
      deliveries.email = email ? "failed" : "not_configured";
      deliveries.sms = phone ? "failed" : "not_configured";
      deliveries.whatsapp = phone ? "failed" : "not_configured";
    }
  }

  if (deliveries.novu === "not_configured") {
    console.log(`[${logLabel}] ${recipient.full_name} (${recipient.phone}) -> Novu is not configured`);
  }

  return deliveries;
  }));
}
