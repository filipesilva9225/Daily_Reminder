import * as Sentry from '@sentry/node';
import { unifiedConfig } from './config/unifiedConfig';

if (unifiedConfig.sentry.enabled) {
  Sentry.init({
    dsn: unifiedConfig.sentry.dsn,
    environment: unifiedConfig.env,
    tracesSampleRate: unifiedConfig.env === 'production' ? 0.2 : 1.0,
  });
}

export { Sentry };

