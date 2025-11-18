const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface ClassificationResult {
  adapter: string;
}

export interface GenerateConfigResult {
  config: any;
  base64: string;
}

/**
 * Classify user input to determine which adapter is needed
 */
export async function classifyAdapter(prompt: string): Promise<ClassificationResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to classify adapter');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Classification error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to classify adapter");
  }
}

/**
 * Generate Absinthe adapter config from validated form data
 */
export async function generateConfig(
  adapter: string,
  fields: any
): Promise<GenerateConfigResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ adapter, fields }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate config');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Config generation error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to generate config");
  }
}

/**
 * Deploy to Railway using the API
 */
export async function deployToRailway(
  configBase64: string,
  rpcUrl: string,
  redisUrl: string,
  templateId?: string
): Promise<{ success: boolean; message: string; deploymentUrl?: string; deploymentId?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/deploy-railway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ configBase64, rpcUrl, redisUrl, templateId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to deploy to Railway');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Railway deployment error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to deploy to Railway");
  }
}

/**
 * Encode JSON to Base64 (client-side utility)
 */
export function encodeToBase64(obj: any): string {
  return btoa(JSON.stringify(obj));
}

