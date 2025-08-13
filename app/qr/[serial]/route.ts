import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(
  _req: NextRequest,
  { params }: { params: { serial: string } }
) {
  const { serial } = params;
  if (!serial) {
    return new NextResponse('serial is required', { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const url = `${base}/certificate/${encodeURIComponent(serial)}`;

  // Generate PNG as a Node Buffer
  const pngBuffer = await QRCode.toBuffer(url, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 6,
  });

  // Fresh Uint8Array (valid BodyInit, avoids SharedArrayBuffer typing)
  const bytes = Uint8Array.from(pngBuffer);

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
