const config = require('config');

const DEFAULT_TIMEOUT_MS = 15000;

const getKycConfig = () => config.get('kyc.aadhaarOtp');

const requireEnabledConfig = () => {
  const cfg = getKycConfig();
  if (!cfg.enabled) {
    const err = new Error('Aadhaar OTP verification is not configured');
    err.status = 503;
    throw err;
  }
  if (!cfg.baseUrl || !cfg.sendOtpPath || !cfg.verifyOtpPath) {
    const err = new Error('Aadhaar OTP provider config is incomplete');
    err.status = 503;
    throw err;
  }
  return cfg;
};

const withLeadingSlash = (value) => (value.startsWith('/') ? value : `/${value}`);

const buildHeaders = (cfg) => {
  const headers = {
    'content-type': 'application/json',
    accept: 'application/json',
    ...(cfg.extraHeaders || {}),
  };

  if (cfg.authType === 'bearer' && cfg.token) {
    headers.authorization = `Bearer ${cfg.token}`;
  } else if (cfg.authType === 'api-key' && cfg.apiKey) {
    headers[cfg.apiKeyHeader || 'x-api-key'] = cfg.apiKey;
  } else if (cfg.authType === 'basic' && cfg.username && cfg.password) {
    headers.authorization = `Basic ${Buffer.from(`${cfg.username}:${cfg.password}`).toString('base64')}`;
  }

  return headers;
};

const pickFirst = (obj, candidates = []) => {
  for (const key of candidates) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key];
    }
  }
  return undefined;
};

const requestProvider = async (path, payload) => {
  const cfg = requireEnabledConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cfg.requestTimeoutMs || DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${cfg.baseUrl}${withLeadingSlash(path)}`, {
      method: 'POST',
      headers: buildHeaders(cfg),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    let body;
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = { raw: text };
    }

    if (!response.ok) {
      const err = new Error(
        pickFirst(body, ['message', 'error', 'detail']) || `Aadhaar provider request failed (${response.status})`
      );
      err.status = response.status >= 400 && response.status < 500 ? 400 : 502;
      err.providerResponse = body;
      throw err;
    }

    return body;
  } catch (error) {
    if (error.name === 'AbortError') {
      const err = new Error('Aadhaar provider request timed out');
      err.status = 504;
      throw err;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const sendAadhaarOtp = async ({ aadhaarNumber, userId, mobile }) => {
  const cfg = requireEnabledConfig();
  const payload = {
    aadhaarNumber,
    aadhaar_number: aadhaarNumber,
    id_number: aadhaarNumber,
    consent: 'Y',
    purpose: 'kyc_verification',
    userId,
    mobile,
    ...(cfg.extraSendBody || {}),
  };

  const body = await requestProvider(cfg.sendOtpPath, payload);

  return {
    requestId: pickFirst(body, ['requestId', 'request_id', 'client_id', 'txnId', 'transactionId']),
    maskedMobile: pickFirst(body, ['maskedMobile', 'masked_mobile', 'mobile', 'registered_mobile']),
    raw: body,
  };
};

const verifyAadhaarOtp = async ({ requestId, aadhaarNumber, otp, userId, mobile }) => {
  const cfg = requireEnabledConfig();
  const payload = {
    requestId,
    request_id: requestId,
    client_id: requestId,
    txnId: requestId,
    transactionId: requestId,
    aadhaarNumber,
    aadhaar_number: aadhaarNumber,
    id_number: aadhaarNumber,
    otp,
    userId,
    mobile,
    consent: 'Y',
    ...(cfg.extraVerifyBody || {}),
  };

  const body = await requestProvider(cfg.verifyOtpPath, payload);
  const statusValue = String(pickFirst(body, ['status', 'verificationStatus', 'kycStatus']) || '').toLowerCase();
  const successValue = pickFirst(body, ['success', 'verified']);
  const isVerified =
    successValue === true ||
    ['success', 'verified', 'completed', 'ok'].includes(statusValue) ||
    pickFirst(body, ['otp_verified', 'aadhaar_verified']) === true;

  if (!isVerified) {
    const err = new Error(pickFirst(body, ['message', 'error']) || 'Aadhaar OTP verification failed');
    err.status = 400;
    err.providerResponse = body;
    throw err;
  }

  return {
    verified: true,
    verifiedName: pickFirst(body, ['name', 'full_name', 'fullName', 'user_name']),
    raw: body,
  };
};

module.exports = {
  sendAadhaarOtp,
  verifyAadhaarOtp,
};
