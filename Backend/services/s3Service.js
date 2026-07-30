const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const config = require('config');
const path = require('path');
const crypto = require('crypto');

let client = null;

const getS3Config = () => {
  if (!config.has('s3')) return null;
  const s3 = config.get('s3');
  if (!s3) return null;
  const enabled = s3.enabled === true || s3.enabled === 'true' || s3.enabled === 1 || s3.enabled === '1';
  if (!enabled) return null;
  if (!s3.bucket || !s3.region) return null;
  return s3;
};

const isS3Enabled = () => Boolean(getS3Config());

const getClient = () => {
  const s3 = getS3Config();
  if (!s3) return null;
  if (client) return client;

  const credentials =
    s3.accessKeyId && s3.secretAccessKey
      ? {
          accessKeyId: s3.accessKeyId,
          secretAccessKey: s3.secretAccessKey,
        }
      : undefined;

  client = new S3Client({
    region: s3.region,
    credentials,
  });
  return client;
};

const extFromFile = (file) => {
  const fromName = path.extname(file.originalname || '').toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(fromName)) return fromName;
  const mime = String(file.mimetype || '');
  if (mime.includes('png')) return '.png';
  if (mime.includes('webp')) return '.webp';
  return '.jpg';
};

const buildPublicUrl = (key, s3) => {
  const base = String(s3.publicBaseUrl || '').replace(/\/$/, '');
  if (base) return `${base}/${key}`;
  return `https://${s3.bucket}.s3.${s3.region}.amazonaws.com/${key}`;
};

/**
 * Upload a multer memory file to S3 and return a publicly reachable URL.
 */
const uploadBattleScreenshot = async (file, battleId) => {
  const s3 = getS3Config();
  if (!s3) {
    throw new Error('S3 is not configured');
  }
  if (!file?.buffer) {
    throw new Error('No file buffer to upload');
  }

  const prefix = String(s3.keyPrefix || 'battles/').replace(/^\/+/, '');
  const safePrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
  const ext = extFromFile(file);
  const rand = crypto.randomBytes(6).toString('hex');
  const key = `${safePrefix}${battleId}-${Date.now()}-${rand}${ext}`;

  const s3Client = getClient();
  await s3Client.send(
    new PutObjectCommand({
      Bucket: s3.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || 'image/jpeg',
      CacheControl: 'public, max-age=31536000',
    })
  );

  return buildPublicUrl(key, s3);
};

module.exports = {
  isS3Enabled,
  uploadBattleScreenshot,
  getS3Config,
};
