import { Agent } from 'undici';
import { systemCertsAsync } from 'system-ca';

let dispatcherPromise;

async function createSystemCaDispatcher() {
  const ca = await systemCertsAsync({ includeNodeCertificates: true });

  return new Agent({
    connect: { ca },
  });
}

export function getSystemCaDispatcher() {
  if (!dispatcherPromise) {
    dispatcherPromise = createSystemCaDispatcher().catch((error) => {
      dispatcherPromise = undefined;
      throw error;
    });
  }

  return dispatcherPromise;
}
