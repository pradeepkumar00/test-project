const config = require('config');
const twilio = require('twilio');

let twilioClient = null;

const getProvider = () => config.get('sms.provider');

const getTwilioConfig = () => config.get('sms.twilio');

const getTwilioClient = () => {
  if (!twilioClient) {
    const { accountSid, authToken } = getTwilioConfig();
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
};

const formatMobile = (mobile) => {
  const { countryCode } = getTwilioConfig();
  const code = countryCode || '+91';

  if (mobile.startsWith('+')) {
    return mobile;
  }

  return `${code}${mobile}`;
};

const getPurposeLabel = (purpose) => {
  const labels = {
    login: 'login',
    register: 'registration',
    reset_password: 'password reset',
  };

  return labels[purpose] || 'verification';
};

const buildOtpMessage = (otp, purpose) => {
  const template = config.get('sms.otpMessageTemplate');
  const appName = config.get('appName');
  const expiryMinutes = config.get('otp.expiryMinutes');
  const purposeLabel = getPurposeLabel(purpose);

  return template
    .replace('{appName}', appName)
    .replace('{otp}', otp)
    .replace('{purpose}', purposeLabel)
    .replace('{expiryMinutes}', String(expiryMinutes));
};

const sendViaConsole = (mobile, message) => {
  console.log(`[SMS:console] ${mobile} -> ${message}`);
  return { success: true, provider: 'console' };
};

const sendViaTwilio = async (mobile, message) => {
  const twilioConfig = getTwilioConfig();
  const { accountSid, authToken, from } = twilioConfig;

  if (!accountSid || !authToken || !from) {
    const error = new Error(
      'Twilio is not configured. Set sms.twilio.accountSid, authToken, and from in config/local.json'
    );
    error.status = 503;
    throw error;
  }

  const client = getTwilioClient();
  const result = await client.messages.create({
    body: message,
    from,
    to: formatMobile(mobile),
  });

  return { success: true, provider: 'twilio', sid: result.sid };
};

const sendSms = async (mobile, message) => {
  const provider = getProvider();

  if (provider === 'twilio') {
    try {
      return await sendViaTwilio(mobile, message);
    } catch (error) {
      console.error('[SMS:twilio] Failed to send SMS:', error.message);
      const smsError = new Error('Failed to send SMS. Please try again later.');
      smsError.status = 502;
      throw smsError;
    }
  }

  return sendViaConsole(mobile, message);
};

const sendOtpSms = async (mobile, otp, purpose = 'login') => {
  const message = buildOtpMessage(otp, purpose);
  return sendSms(mobile, message);
};

module.exports = {
  sendSms,
  sendOtpSms,
  buildOtpMessage,
  formatMobile,
};
