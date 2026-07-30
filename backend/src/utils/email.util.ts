import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
  // Skip email sending in test environment
  if (process.env.NODE_ENV === 'test') {
    console.log(`[EMAIL_UTIL] Test mode: Skipping email send to ${email}, OTP: ${otp}`);
    return;
  }

  console.log('[EMAIL_UTIL] sendOTPEmail() called');
  console.log('[EMAIL_UTIL] Recipient email:', email);
  console.log('[EMAIL_UTIL] OTP to send:', otp);
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@restaurant.com',
    to: email,
    subject: 'Your OTP for Restaurant Login',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your One-Time Password</h2>
        <p>Your OTP for login is:</p>
        <h1 style="background-color: #f0f0f0; padding: 20px; text-align: center; letter-spacing: 5px;">
          ${otp}
        </h1>
        <p>This OTP will expire in 5 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    console.log('[EMAIL_UTIL] Attempting to send email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL_UTIL] ✅ Email sent successfully!');
    console.log(`[EMAIL_UTIL] OTP email sent to ${email}`);
  } catch (error) {
    console.error('[EMAIL_UTIL] ❌ Error sending OTP email:', error);
    // Don't throw in production, just log the error
    console.error('Failed to send OTP email, but continuing...');
  }
};

export const sendReservationConfirmation = async (
  email: string,
  name: string,
  reservationDetails: {
    date: string;
    time: string;
    partySize: number;
    tableNumber?: number;
  }
): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@restaurant.com',
    to: email,
    subject: 'Reservation Confirmed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reservation Confirmed!</h2>
        <p>Your reservation has been confirmed with the following details:</p>
        <ul>
          <li><strong>Date:</strong> ${reservationDetails.date}</li>
          <li><strong>Time:</strong> ${reservationDetails.time}</li>
          <li><strong>Party Size:</strong> ${reservationDetails.partySize}</li>
          ${reservationDetails.tableNumber ? `<li><strong>Table:</strong> ${reservationDetails.tableNumber}</li>` : ''}
        </ul>
        <p>We look forward to serving you!</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reservation confirmation sent to ${email}`);
  } catch (error) {
    console.error('Error sending reservation confirmation:', error);
  }
};
