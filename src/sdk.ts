import { createBot, BotSDK } from '@nikovonlas/bot-sdk';

// Initialize SDK once
let sdkInstance: BotSDK | null = null;
let sdkPromise: Promise<BotSDK> | null = null;

export async function getSDK(): Promise<BotSDK> {
  if (sdkInstance) return sdkInstance;

  if (!sdkPromise) {
    sdkPromise = createBot({ enableDatabase: false }).then(sdk => {
      sdkInstance = sdk;
      return sdk;
    }).catch(err => {
      console.error('Failed to initialize bot SDK:', err);
      throw err;
    });
  }

  return sdkPromise;
}

// Export for synchronous access (use with caution, may be null initially)
export { sdkInstance };
