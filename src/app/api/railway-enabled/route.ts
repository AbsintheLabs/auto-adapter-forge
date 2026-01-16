import { NextResponse } from 'next/server';
import { isRailwayDeploymentEnabled } from '@/lib/server/config';

export async function GET() {
  try {
    const enabled = isRailwayDeploymentEnabled();
    return NextResponse.json({ 
      enabled,
      message: enabled 
        ? 'Railway deployment is enabled' 
        : 'Railway deployment is disabled. Set ENABLE_RAILWAY_DEPLOYMENT=true to enable.'
    });
  } catch (error) {
    return NextResponse.json({ 
      enabled: false,
      message: 'Unable to check Railway deployment status'
    });
  }
}
