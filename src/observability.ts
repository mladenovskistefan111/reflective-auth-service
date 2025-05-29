import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource, resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ATTR_SERVICE_INSTANCE_ID, ATTR_DEPLOYMENT_ENVIRONMENT_NAME } from '@opentelemetry/semantic-conventions/incubating'; 
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { trace, metrics, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';

const OTEL_COLLECTOR_HOST = process.env.OTEL_COLLECTOR_HOST || 'localhost';
const OTEL_COLLECTOR_PORT_HTTP = process.env.OTEL_COLLECTOR_PORT_HTTP || '4318';

const OTEL_COLLECTOR_URL_TRACES = `http://${OTEL_COLLECTOR_HOST}:${OTEL_COLLECTOR_PORT_HTTP}/v1/traces`;
const OTEL_COLLECTOR_URL_METRICS = `http://${OTEL_COLLECTOR_HOST}:${OTEL_COLLECTOR_PORT_HTTP}/v1/metrics`;
const OTEL_COLLECTOR_URL_LOGS = `http://${OTEL_COLLECTOR_HOST}:${OTEL_COLLECTOR_PORT_HTTP}/v1/logs`;

const getServiceVersion = (): string => {
  try {
    return require('../package.json').version;
  } catch {
    return '1.0.0';
  }
};

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'reflective-auth-service',
    [ATTR_SERVICE_VERSION]: getServiceVersion(),
    [ATTR_SERVICE_INSTANCE_ID]: process.env.HOSTNAME || process.env.INSTANCE_ID || `instance-${Date.now()}`,
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.NODE_ENV || 'development',
  }),

  traceExporter: new OTLPTraceExporter({
    url: OTEL_COLLECTOR_URL_TRACES,
    headers: {
    },
  }),

  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: OTEL_COLLECTOR_URL_METRICS,
      headers: {
      },
    }),
    exportIntervalMillis: parseInt(process.env.OTEL_METRIC_EXPORT_INTERVAL || '5000'),
  }),
  logRecordProcessor: new SimpleLogRecordProcessor(
    new OTLPLogExporter({
      url: OTEL_COLLECTOR_URL_LOGS,
      headers: {
      },
    })
  ),


  instrumentations: [
    new ExpressInstrumentation({
      requestHook: (span, requestInfo) => {
        if (requestInfo.request?.body) {
          span.setAttribute('http.request.body_size', JSON.stringify(requestInfo.request.body).length);
          if (requestInfo.request.body.email) {
            span.setAttribute('auth.email_domain', requestInfo.request.body.email.split('@')[1] || 'unknown');
          }
          if (requestInfo.request.body.action) {
            span.setAttribute('auth.action', requestInfo.request.body.action);
          }
        }
        if (requestInfo.route && typeof requestInfo.route === 'object' && 'path' in requestInfo.route) {
          span.setAttribute('http.route', (requestInfo.route as any).path);
        }
      },

    }),
    new HttpInstrumentation({
      requestHook: (span, request) => {

        let headers: any = {};
        if ('headers' in request && request.headers) {
          headers = request.headers;
        } else if ('getHeaders' in request) {

          headers = (request as any).getHeaders();
        }
        span.setAttribute('http.user_agent', headers['user-agent'] || 'unknown');
      },
      responseHook: (span, response) => {

        if (response.statusCode && response.statusCode >= 400) {
          span.recordException(new Error(`HTTP ${response.statusCode}`));
          span.setStatus({ code: SpanStatusCode.ERROR });
        }
      },
    }),
    new PinoInstrumentation({
      logHook: (span, record, level) => {

        record.traceId = span.spanContext().traceId;
        record.spanId = span.spanContext().spanId;
        record.traceFlags = span.spanContext().traceFlags;
      },
    }),
    getNodeAutoInstrumentations({

      '@opentelemetry/instrumentation-fs': {
        enabled: false
      },

      '@opentelemetry/instrumentation-express': {
        enabled: false, 
      },
      '@opentelemetry/instrumentation-http': {
        enabled: false,
      },
    }),
  ],
});

sdk.start();

const tracer = trace.getTracer('reflective-auth-service', getServiceVersion());
const meter = metrics.getMeter('reflective-auth-service', getServiceVersion());

const authAttempts = meter.createCounter('auth_attempts_total', {
  description: 'Total number of authentication attempts',
});

const authSuccesses = meter.createCounter('auth_success_total', {
  description: 'Total number of successful authentications',
});

const authFailures = meter.createCounter('auth_failures_total', {
  description: 'Total number of failed authentications',
});

const databaseOperations = meter.createCounter('database_operations_total', {
  description: 'Total number of database operations',
});

const databaseOperationDuration = meter.createHistogram('database_operation_duration', {
  description: 'Duration of database operations in milliseconds',
  unit: 'ms',
});

export const recordAuthAttempt = (type: string, success: boolean, userId?: string) => {
  const attributes = {
    type,
    success: success.toString(),
    ...(userId && { user_id: userId }),
  };

  authAttempts.add(1, attributes);

  if (success) {
    authSuccesses.add(1, attributes);
  } else {
    authFailures.add(1, attributes);
  }
};

export const recordDatabaseOperation = (operation: string, table: string, duration?: number) => {
  const attributes = { operation, table };

  databaseOperations.add(1, attributes);

  if (duration !== undefined) {
    databaseOperationDuration.record(duration, attributes);
  }
};

export const withDatabaseSpan = async <T>(
  name: string,
  operation: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> => {
  const span = tracer.startSpan(name, {
    kind: SpanKind.CLIENT,
    attributes: {
      'db.system': 'postgresql',
      'db.operation': name,
      ...attributes,
    },
  });

  const startTime = Date.now();

  try {
    const result = await operation();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    span.setAttribute('db.duration', duration);
    span.end();

    recordDatabaseOperation(name, attributes?.['db.table'] as string || 'unknown', duration);
  }
};

const shutdown = async () => {
  try {
    await sdk.shutdown();
    console.log('OpenTelemetry SDK shut down successfully');
  } catch (error) {
    console.error('Error shutting down OpenTelemetry SDK:', error);
  }
};

process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await shutdown();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  const span = tracer.startSpan('unhandled_rejection');
  span.recordException(reason as Error);
  span.setStatus({ code: SpanStatusCode.ERROR });
  span.end();
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  const span = tracer.startSpan('uncaught_exception');
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR });
  span.end();
  console.error('Uncaught Exception:', error);
  shutdown().finally(() => process.exit(1));
});

console.log('OpenTelemetry SDK initialized successfully');

export { tracer, meter, sdk };