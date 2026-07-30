import { checkPermission } from '../permissions/permissionEngine';
import { checkHealth } from '../health/healthEngine';
import { getIntegrationProvider } from '../registry';
import { adminDb } from '@/lib/firebase/admin';

export interface TestResult {
  name: string;
  pass: boolean;
  message: string;
  durationMs?: number;
}

export interface DiagnosticReport {
  provider: string;
  workspaceId: string;
  ranAt: string;
  results: TestResult[];
  overallPass: boolean;
}

async function runConnectionTest(provider: string, workspaceId: string): Promise<TestResult> {
  if (!adminDb) return { name: 'Connection Test', pass: false, message: 'Server database is not configured.' };
  const snap = await adminDb.collection('connections').doc(`${workspaceId}_${provider}`).get();
  if (!snap.exists) return { name: 'Connection Test', pass: false, message: 'No connection record found.' };
  return { name: 'Connection Test', pass: true, message: 'Connection record exists.' };
}

async function runPermissionTest(provider: string, workspaceId: string): Promise<TestResult> {
  const result = await checkPermission({ provider, workspaceId });
  return {
    name: 'Permission Test',
    pass: result.allowed,
    message: result.allowed ? 'Workspace has permission to use this provider.' : `Denied: ${result.reason}`,
  };
}

async function runHealthTest(provider: string, workspaceId: string): Promise<TestResult> {
  const health = await checkHealth(provider, workspaceId);
  return {
    name: 'Health Test',
    pass: health.status === 'online',
    message: `Status: ${health.status} (score ${health.score}/100)`,
    durationMs: health.latencyMs ?? undefined,
  };
}

async function runLatencyTest(provider: string, workspaceId: string): Promise<TestResult> {
  const health = await checkHealth(provider, workspaceId);
  const latency = health.latencyMs;
  if (latency === null) return { name: 'Latency Test', pass: false, message: 'Could not measure latency.' };
  const pass = latency < 5000;
  return { name: 'Latency Test', pass, message: `${latency}ms`, durationMs: latency };
}

function runOperationValidation(provider: string): TestResult {
  const entry = getIntegrationProvider(provider);
  if (!entry) return { name: 'Operation Validation', pass: false, message: 'Provider is not registered in the Integration Registry.' };
  if (entry.operations.length === 0) return { name: 'Operation Validation', pass: false, message: 'No operations defined for this provider.' };
  return { name: 'Operation Validation', pass: true, message: `${entry.operations.length} standard operations available.` };
}

/** Runs the full diagnostic suite for one provider/workspace pair. */
export async function runFullDiagnostic(provider: string, workspaceId: string): Promise<DiagnosticReport> {
  const results: TestResult[] = [
    await runConnectionTest(provider, workspaceId),
    await runPermissionTest(provider, workspaceId),
    runOperationValidation(provider),
  ];

  // Only attempt live health/latency checks if a connection actually exists —
  // otherwise every provider would just report "offline" noise.
  if (results[0].pass) {
    results.push(await runHealthTest(provider, workspaceId));
    results.push(await runLatencyTest(provider, workspaceId));
  }

  return {
    provider,
    workspaceId,
    ranAt: new Date().toISOString(),
    results,
    overallPass: results.every((r) => r.pass),
  };
}
