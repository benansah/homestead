import nodemailer from 'nodemailer';

const createTransport = () =>
  nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const FROM = () => process.env.EMAIL_FROM || 'hostelGH <noreply@hostelgh.com>';
const FRONTEND = () => process.env.FRONTEND_URL || 'http://localhost:3000';

// ── shared brand wrapper ─────────────────────────────────────────────────────
const wrap = (title, body) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB">

        <!-- header -->
        <tr>
          <td style="background:#006AFF;padding:24px 32px">
            <p style="margin:0;font-size:22px;font-weight:900;color:#fff;font-family:Georgia,serif">
              hostelGH
            </p>
            <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.75)">
              Ghana's student hostel finder
            </p>
          </td>
        </tr>

        <!-- body -->
        <tr>
          <td style="padding:32px">
            <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827">${title}</h1>
            ${body}
          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #F3F4F6">
            <p style="margin:0;font-size:11px;color:#9CA3AF">
              © 2025 hostelGH · Ghana &nbsp;·&nbsp;
              Questions? <a href="mailto:support@hostelgh.com" style="color:#006AFF">support@hostelgh.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

const btn = (url, label) =>
  `<a href="${url}" style="display:inline-block;background:#006AFF;color:#fff;font-weight:700;
   font-size:14px;padding:13px 28px;border-radius:10px;text-decoration:none;margin:20px 0 4px">
   ${label}
  </a>`;

const info = (rows) =>
  `<table style="width:100%;border-collapse:collapse;margin:16px 0">
    ${rows.map(([label, value]) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#6B7280;width:40%">${label}</td>
        <td style="padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#111827;font-weight:600">${value}</td>
      </tr>`).join('')}
  </table>`;

// ── send helper ──────────────────────────────────────────────────────────────
const send = async (to, subject, html) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`\n📧 [DEV] Email to ${to}\nSubject: ${subject}\n(Set EMAIL_USER + EMAIL_PASS to send real emails)\n`);
    return;
  }
  await createTransport().sendMail({ from: FROM(), to, subject, html });
};

// ── 1. Welcome ───────────────────────────────────────────────────────────────
export const sendWelcomeEmail = async (email, name) => {
  const html = wrap('Welcome to hostelGH!', `
    <p style="color:#374151;font-size:14px;margin:0 0 4px">Hi ${name},</p>
    <p style="color:#374151;font-size:14px;margin:0 0 16px">
      You're now part of Ghana's easiest way to find student hostels.
      Browse verified listings near your university and book a viewing in minutes.
    </p>
    ${btn(`${FRONTEND()}/`, 'Browse hostels')}
    <p style="font-size:12px;color:#9CA3AF;margin-top:16px">
      Viewing fee is only GHS 50 — refunded if the room is unavailable.
    </p>
  `);
  await send(email, 'Welcome to hostelGH 🏠', html);
};

// ── 2. Payment confirmed (student) ───────────────────────────────────────────
export const sendBookingConfirmedEmail = async (email, name, { hostelName, roomType, bookingId }) => {
  const html = wrap('Booking confirmed — we got your payment!', `
    <p style="color:#374151;font-size:14px;margin:0 0 16px">
      Hi ${name}, your GHS 50 viewing fee has been received.
      Admin is now confirming availability with the landlord and will release their contact shortly.
    </p>
    ${info([
      ['Hostel', hostelName],
      ['Room type', roomType],
      ['Booking ID', `#${bookingId}`],
      ['Viewing fee', 'GHS 50'],
    ])}
    ${btn(`${FRONTEND()}/bookings`, 'Track your booking')}
    <p style="font-size:12px;color:#9CA3AF;margin-top:16px">
      You'll receive another email as soon as the landlord's contact is released.
    </p>
  `);
  await send(email, 'Booking confirmed — GHS 50 received', html);
};

// ── 3. Contact released (student) ────────────────────────────────────────────
export const sendContactReleasedEmail = async (email, name, { landlordName, landlordPhone, hostelName, roomType }) => {
  const html = wrap("You've got the landlord's contact!", `
    <p style="color:#374151;font-size:14px;margin:0 0 16px">
      Hi ${name}, the landlord has confirmed availability. Call them to schedule your viewing.
    </p>

    <div style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:12px;padding:20px;margin:16px 0">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#065F46;text-transform:uppercase;letter-spacing:0.05em">
        Landlord contact
      </p>
      <p style="margin:0 0 2px;font-size:18px;font-weight:800;color:#111827">${landlordName}</p>
      <p style="margin:0;font-size:22px;font-weight:900;color:#006AFF">${landlordPhone}</p>
    </div>

    ${info([
      ['Hostel', hostelName],
      ['Room type', roomType],
    ])}

    <a href="tel:${landlordPhone}"
      style="display:inline-block;background:#065F46;color:#fff;font-weight:700;
             font-size:14px;padding:13px 28px;border-radius:10px;text-decoration:none;margin:8px 0">
      📞 Call ${landlordName}
    </a>

    <p style="font-size:12px;color:#9CA3AF;margin-top:16px">
      Please be respectful of the landlord's time. Visit during business hours.
    </p>
  `);
  await send(email, `Landlord contact released — ${hostelName}`, html);
};

// ── 4. Refund processed (student) ────────────────────────────────────────────
export const sendRefundEmail = async (email, name, { amount, hostelName }) => {
  const html = wrap('Your refund is on the way', `
    <p style="color:#374151;font-size:14px;margin:0 0 16px">
      Hi ${name}, a refund of <strong>GHS ${amount}</strong> has been processed for your booking at ${hostelName}.
    </p>
    ${info([
      ['Refund amount', `GHS ${amount}`],
      ['Hostel', hostelName],
      ['Expected', '3–5 business days'],
    ])}
    ${btn(`${FRONTEND()}/bookings`, 'View your bookings')}
    <p style="font-size:12px;color:#9CA3AF;margin-top:16px">
      If you don't see the refund after 5 days, contact your bank or email us.
    </p>
  `);
  await send(email, `Refund of GHS ${amount} processed`, html);
};

// ── 5. New booking alert (landlord) ──────────────────────────────────────────
export const sendNewBookingAlertEmail = async (email, landlordName, { studentName, hostelName, roomType }) => {
  const html = wrap('A student booked a viewing at your hostel', `
    <p style="color:#374151;font-size:14px;margin:0 0 16px">
      Hi ${landlordName}, a student has paid a viewing fee and wants to see your hostel.
      Admin will contact you on WhatsApp to confirm availability before releasing your number.
    </p>
    ${info([
      ['Student', studentName],
      ['Hostel', hostelName],
      ['Room type', roomType],
      ['Viewing fee paid', 'GHS 50'],
    ])}
    <div style="background:#FFF9EB;border:1px solid #FDE68A;border-radius:10px;padding:14px;margin-top:8px">
      <p style="margin:0;font-size:13px;color:#B45309">
        <strong>What to expect:</strong> Admin will WhatsApp you shortly to confirm the room is still available.
        Once confirmed, the student gets your contact.
      </p>
    </div>
  `);
  await send(email, `New viewing request — ${hostelName}`, html);
};

// ── 6. Listing approved (landlord) ───────────────────────────────────────────
export const sendListingApprovedEmail = async (email, landlordName, { hostelName, hostelId }) => {
  const html = wrap('Your hostel listing is live! 🎉', `
    <p style="color:#374151;font-size:14px;margin:0 0 16px">
      Hi ${landlordName}, great news — <strong>${hostelName}</strong> has been approved
      and is now visible to students searching for accommodation.
    </p>
    <div style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:10px;padding:14px;margin-bottom:8px">
      <p style="margin:0;font-size:13px;color:#065F46">
        ✅ Students can now find and book viewings at your hostel.
      </p>
    </div>
    ${btn(`${FRONTEND()}/hostels/${hostelId}`, 'View your listing')}
    <p style="font-size:12px;color:#9CA3AF;margin-top:16px">
      Make sure your phone is on — students' viewing requests come through WhatsApp from our admin.
    </p>
  `);
  await send(email, `Listing approved — ${hostelName} is now live`, html);
};

// ── 7. Listing rejected (landlord) ───────────────────────────────────────────
export const sendListingRejectedEmail = async (email, landlordName, { hostelName, reason }) => {
  const html = wrap('Your listing needs some changes', `
    <p style="color:#374151;font-size:14px;margin:0 0 16px">
      Hi ${landlordName}, unfortunately we couldn't approve <strong>${hostelName}</strong> at this time.
    </p>
    ${reason ? `
      <div style="background:#FFF1F2;border:1px solid #FECDD3;border-radius:10px;padding:14px;margin-bottom:16px">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#9F1239">Reason</p>
        <p style="margin:0;font-size:13px;color:#374151">${reason}</p>
      </div>` : ''}
    <p style="color:#374151;font-size:14px;margin:0 0 16px">
      Please log in to your dashboard and update your listing, then resubmit for review.
    </p>
    ${btn(`${FRONTEND()}/landlord`, 'Go to my dashboard')}
    <p style="font-size:12px;color:#9CA3AF;margin-top:16px">
      Need help? Reply to this email or contact support@hostelgh.com
    </p>
  `);
  await send(email, `Action needed — ${hostelName} listing update required`, html);
};

// ── 8. Password reset ─────────────────────────────────────────────────────────
export const sendPasswordResetEmail = async (email, name, resetUrl) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`\n📧 Password reset link for ${email}:\n${resetUrl}\n`);
    return;
  }
  const html = wrap('Reset your password', `
    <p style="color:#374151;font-size:14px;margin:0 0 16px">
      Hi ${name}, we received a request to reset your hostelGH password.
      This link expires in <strong>1 hour</strong>.
    </p>
    ${btn(resetUrl, 'Reset my password')}
    <p style="font-size:12px;color:#9CA3AF;margin-top:16px">
      If you didn't request this, you can safely ignore this email. Your password won't change.
    </p>
  `);
  await send(email, 'Reset your hostelGH password', html);
};

// ── 9. Wishlist availability alert (student) ─────────────────────────────────
export const sendWishlistAlertEmail = async (email, name, { hostelName, hostelId, university }) => {
  const html = wrap(`Rooms available at ${hostelName}`, `
    <p style="color:#374151;font-size:14px;margin:0 0 16px">
      Hi ${name}, a hostel on your wishlist just became available!
    </p>
    <div style="background:var(--blue-light, #EBF2FF);border:1px solid #BFDBFE;border-radius:12px;padding:20px;margin:16px 0">
      <p style="margin:0 0 4px;font-size:18px;font-weight:800;color:#111827">${hostelName}</p>
      <p style="margin:0;font-size:13px;color:#374151">🎓 ${university}</p>
    </div>
    ${btn(`${FRONTEND()}/hostels/${hostelId}`, 'View & book now')}
    <p style="font-size:12px;color:#9CA3AF;margin-top:16px">
      Rooms fill up fast — book a viewing for just GHS 50 to secure your spot.
    </p>
  `);
  await send(email, `Rooms now available — ${hostelName}`, html);
};
