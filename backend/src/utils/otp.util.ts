import crypto from 'crypto';

export const generateOTP = (): string => {
  console.log('[OTP_UTIL] generateOTP() called');
  const otp = crypto.randomInt(100000, 999999).toString();
  console.log('[OTP_UTIL] OTP generated:', otp);
  console.log('[OTP_UTIL] OTP length:', otp.length);
  return otp;
};

export const isOTPExpired = (expiresAt: Date): boolean => {
  console.log('[OTP_UTIL] isOTPExpired() called');
  const currentTime = new Date();
  const isExpired = currentTime > expiresAt;
  console.log('[OTP_UTIL] Current time:', currentTime.toISOString());
  console.log('[OTP_UTIL] Expiry time:', expiresAt.toISOString());
  console.log('[OTP_UTIL] Time difference (ms):', expiresAt.getTime() - currentTime.getTime());
  console.log('[OTP_UTIL] Is expired:', isExpired);
  return isExpired;
};

export const getOTPExpiryTime = (): Date => {
  console.log('[OTP_UTIL] getOTPExpiryTime() called');
  const currentTime = new Date();
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + 5); // 5 minutes from now
  console.log('[OTP_UTIL] Current time:', currentTime.toISOString());
  console.log('[OTP_UTIL] Expiry time (5 min from now):', expiryTime.toISOString());
  console.log('[OTP_UTIL] Expiry duration (ms):', expiryTime.getTime() - currentTime.getTime());
  return expiryTime;
};
