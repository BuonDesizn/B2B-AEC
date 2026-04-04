import { NextResponse } from 'next/server';
import { moderationService } from '@/lib/services/moderation';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.ad_id || !body.image_url) {
      return NextResponse.json(
        { error: 'ad_id and image_url are required' },
        { status: 400 }
      );
    }

    const result = await moderationService.scanAd({
      ad_id: body.ad_id,
      image_url: body.image_url,
      target_url: body.target_url,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Moderation scan failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}