const config = require('config');
const twilio = require('twilio');

let twilioClient = null;

const getWhatsAppConfig = () => {
  if (config.has('whatsapp')) return config.get('whatsapp');
  return {
    provider: 'console',
    otpMessageTemplate:
      'Your {appName} OTP for {purpose} is {otp}. Valid for {expiryMinutes} minutes. Do not share this code.',
    twilio: {
      accountSid: '',
      authToken: '',
      from: '',
      countryCode: '+91',
      contentSid: '',
    },
  };
};

const getTwilioConfig = () => {
  const wa = getWhatsAppConfig().twilio || {};
  // Fall back to SMS Twilio credentials when WhatsApp-specific ones are empty
  const smsTwilio = config.has('sms.twilio') ? config.get('sms.twilio') : {};
  return {
    accountSid: wa.accountSid || smsTwilio.accountSid || '',
    authToken: wa.authToken || smsTwilio.authToken || '',
    from: wa.from || '',
    countryCode: wa.countryCode || smsTwilio.countryCode || '+91',
    contentSid: wa.contentSid || '',
  };
};

const getTwilioClient = () => {
  if (!twilioClient) {
    const { accountSid, authToken } = getTwilioConfig();
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
};

const formatWhatsAppAddress = (mobile) => {
  const { countryCode } = getTwilioConfig();
  const code = countryCode || '+91';
  let digits = String(mobile || '').trim();

  if (digits.startsWith('whatsapp:')) return digits;
  if (digits.startsWith('+')) return `whatsapp:${digits}`;
  digits = digits.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) {
    return `whatsapp:+${digits}`;
  }
  return `whatsapp:${code}${digits}`;
};

const normalizeFromAddress = (from) => {
  const value = String(from || '').trim();
  if (!value) return '';
  if (value.startsWith('whatsapp:')) return value;
  if (value.startsWith('+')) return `whatsapp:${value}`;
  return `whatsapp:+${value.replace(/\D/g, '')}`;
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
  const wa = getWhatsAppConfig();
  const template =
    wa.otpMessageTemplate ||
    (config.has('sms.otpMessageTemplate')
      ? config.get('sms.otpMessageTemplate')
      : 'Your {appName} OTP for {purpose} is {otp}. Valid for {expiryMinutes} minutes. Do not share this code.');
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
  console.log(`[WhatsApp:console] ${formatWhatsAppAddress(mobile)} -> ${message}`);
  return { success: true, provider: 'console', channel: 'whatsapp' };
};

const sendViaTwilio = async (mobile, otp, purpose) => {
  const twilioConfig = getTwilioConfig();
  const { accountSid, authToken, from, contentSid } = twilioConfig;

  if (!accountSid || !authToken || !from) {
    const error = new Error(
      'WhatsApp Twilio is not configured. Set whatsapp.twilio.from (and accountSid/authToken) in config/local.json'
    );
    error.status = 503;
    throw error;
  }

  const client = getTwilioClient();
  const payload = {
    from: normalizeFromAddress(from),
    to: formatWhatsAppAddress(mobile),
  };

  // Preferred for production: approved WhatsApp Content Template (OTP)
  if (contentSid) {
    payload.contentSid = contentSid;
    payload.contentVariables = JSON.stringify({
      1: String(otp),
      2: String(config.get('otp.expiryMinutes') || 10),
    });
  } else {
    // Works with Twilio WhatsApp sandbox / open session window
    payload.body = buildOtpMessage(otp, purpose);
  }

  const result = await client.messages.create(payload);
  return { success: true, provider: 'twilio', channel: 'whatsapp', sid: result.sid };
};

const sendWhatsApp = async (mobile, message) => {
  const provider = getWhatsAppConfig().provider || 'console';
  if (provider === 'twilio') {
    // Generic text send (non-OTP helpers)
    const twilioConfig = getTwilioConfig();
    const { accountSid, authToken, from } = twilioConfig;
    if (!accountSid || !authToken || !from) {
      const error = new Error('WhatsApp Twilio is not configured');
      error.status = 503;
      throw error;
    }
    const client = getTwilioClient();
    const result = await client.messages.create({
      from: normalizeFromAddress(from),
      to: formatWhatsAppAddress(mobile),
      body: message,
    });
    return { success: true, provider: 'twilio', channel: 'whatsapp', sid: result.sid };
  }
  return sendViaConsole(mobile, message);
};

const sendOtpWhatsApp = async (mobile, otp, purpose = 'login') => {
  const provider = getWhatsAppConfig().provider || 'console';

  if (provider === 'twilio') {
    try {
      return await sendViaTwilio(mobile, otp, purpose);
    } catch (error) {
      console.error('[WhatsApp:twilio] Failed to send OTP:', error.message);
      const waError = new Error(
        error.status === 503 ? error.message : 'Failed to send WhatsApp OTP. Please try again later.'
      );
      waError.status = error.status || 502;
      throw waError;
    }
  }

  return sendViaConsole(mobile, buildOtpMessage(otp, purpose));
};

module.exports = {
  sendWhatsApp,
  sendOtpWhatsApp,
  buildOtpMessage,
  formatWhatsAppAddress,
};
