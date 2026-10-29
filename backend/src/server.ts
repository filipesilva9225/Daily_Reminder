import './instrument';
import { app } from './app';
import { unifiedConfig } from './config/unifiedConfig';
import { Sentry } from './instrument';
import { ScheduleReconciliationWorker } from './workers/cronWorker';

const reconciliationWorker = new ScheduleReconciliationWorker();
reconciliationWorker.start();

const server = app.listen(unifiedConfig.server.port, '0.0.0.0');

process.on('unhandledRejection', (reason) => {
  Sentry.captureException(reason);
});

process.on('uncaughtException', (error) => {
  Sentry.captureException(error);
  reconciliationWorker.stop();
  server.close(() => process.exit(1));
});
