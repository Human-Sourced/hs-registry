import { NextRequest, NextResponse } from 'next/server';

// Ensure Node.js runtime (not Edge), since we use a Node package
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ serial: string }> }
) {
  const { serial } = await ctx.params;
  const origin = new URL(req.url).origin;
  const target = `${origin}/certificate/${encodeURIComponent(serial.replace(/\.png$/i, ''))}`;

  // Dynamic import avoids TS type resolution issues
  const QRCode: any = await import('qrcode');

  // toBuffer() gives a Node Buffer; convert to Uint8Array for Response body
  const buf: Buffer = await QRCode.toBuffer(target, { margin: 1, width: 300 });
  const bytes = new Uint8Array(buf); // <-- BodyInit-friendly

  return new NextResponse(bytes, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'max-age=86400, s-maxage=86400'
    }
  });
}
