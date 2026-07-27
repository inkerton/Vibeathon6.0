import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
  console.log('[EMAIL_UTIL] sendOTPEmail() called');
  console.log('[EMAIL_UTIL] Recipient email:', email);
  console.log('[EMAIL_UTIL] OTP to send:', otp);
  console.log('[EMAIL_UTIL] OTP length:', otp.length);
  console.log('[EMAIL_UTIL] Email configuration:', {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    from: process.env.EMAIL_FROM || 'noreply@restaurant.com',
    hasPassword: !!process.env.EMAIL_PASSWORD
  });
  
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

  console.log('[EMAIL_UTIL] Mail options prepared:', {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject,
    htmlLength: mailOptions.html.length
  });

  try {
    console.log('[EMAIL_UTIL] Attempting to send email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL_UTIL] ✅ Email sent successfully!');
    console.log('[EMAIL_UTIL] Message ID:', info.messageId);
    console.log('[EMAIL_UTIL] Response:', info.response);
    console.log(`[EMAIL_UTIL] OTP email sent to ${email}`);
  } catch (error) {
    console.error('[EMAIL_UTIL] ❌ Error sending OTP email:', error);
    console.error('[EMAIL_UTIL] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error('Failed to send OTP email');
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
