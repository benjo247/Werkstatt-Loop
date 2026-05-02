import Anthropic from '@anthropic-ai/sdk';
import { put } from '@vercel/blob';
import { sql } from '@/lib/db';
import { PUBLIC_CORS, corsResponse } from '@/lib/cors';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: PUBLIC_CORS });
}

export async function POST(request) {
  // DEBUG: zeigt welchen Token der Code zur Runtime sieht
  console.log('[blob-debug] token-start:', process.env.BLOB_READ_WRITE_TOKEN?.slice(0, 30));
  console.log('[blob-debug] token-length:', process.env.BLOB_READ_WRITE_TOKEN?.length);
  console.log('[blob-debug] store-id-from-token:', process.env.BLOB_READ_WRITE_TOKEN?.split('_')[3]);

  try {
    const formData = await request.formData();
    const image = formData.get('image');
    const workshopSlug = formData.get('workshop_slug');
    c
