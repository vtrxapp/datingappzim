export interface AppConfig {
  nodeEnv: string;
  corsOrigin: string;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtlSeconds: number;
    refreshTtlSeconds: number;
  };
  otp: {
    length: number;
    ttlSeconds: number;
    maxAttempts: number;
    resendCooldownSeconds: number;
    hashSecret: string;
  };
  sms: {
    provider: 'mock' | 'africastalking';
    africastalking: {
      sandbox: boolean;
      username: string;
      apiKey: string;
      senderId: string;
    };
  };
  storage: {
    provider: 'local' | 'r2' | 'supabase';
    r2: {
      accountId: string;
      accessKeyId: string;
      secretAccessKey: string;
      bucket: string;
      publicBaseUrl: string;
    };
    supabase: {
      url: string;
      serviceRoleKey: string;
      bucket: string;
    };
  };
  payment: {
    provider: 'mock' | 'paynow';
    paynow: {
      integrationId: string;
      integrationKey: string;
      returnUrl: string;
      resultUrl: string;
    };
  };
  adminBootstrapPhone: string | null;
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me',
    accessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900),
    refreshTtlSeconds: Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 2592000),
  },
  otp: {
    length: Number(process.env.OTP_LENGTH ?? 6),
    ttlSeconds: Number(process.env.OTP_TTL_SECONDS ?? 300),
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS ?? 5),
    resendCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS ?? 60),
    hashSecret:
      process.env.OTP_HASH_SECRET ?? process.env.JWT_ACCESS_SECRET ?? 'dev-otp-secret-change-me',
  },
  sms: {
    provider: (process.env.SMS_PROVIDER as 'mock' | 'africastalking') ?? 'mock',
    africastalking: {
      sandbox: (process.env.AT_SANDBOX ?? 'true') !== 'false',
      username: process.env.AT_USERNAME ?? '',
      apiKey: process.env.AT_API_KEY ?? '',
      senderId: process.env.AT_SENDER_ID ?? '',
    },
  },
  storage: {
    provider: (process.env.STORAGE_PROVIDER as 'local' | 'r2' | 'supabase') ?? 'local',
    r2: {
      accountId: process.env.R2_ACCOUNT_ID ?? '',
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
      bucket: process.env.R2_BUCKET ?? 'tariro-media',
      publicBaseUrl: process.env.R2_PUBLIC_BASE_URL ?? '',
    },
    supabase: {
      url: process.env.SUPABASE_URL ?? '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
      bucket: process.env.SUPABASE_STORAGE_BUCKET ?? 'tariro-media',
    },
  },
  payment: {
    provider: (process.env.PAYMENT_PROVIDER as 'mock' | 'paynow') ?? 'mock',
    paynow: {
      integrationId: process.env.PAYNOW_INTEGRATION_ID ?? '',
      integrationKey: process.env.PAYNOW_INTEGRATION_KEY ?? '',
      returnUrl: process.env.PAYNOW_RETURN_URL ?? '',
      resultUrl: process.env.PAYNOW_RESULT_URL ?? '',
    },
  },
  adminBootstrapPhone: process.env.ADMIN_BOOTSTRAP_PHONE || null,
});
