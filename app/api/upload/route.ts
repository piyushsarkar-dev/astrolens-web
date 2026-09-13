import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

const IMGBB_URL = 'https://api.imgbb.com/1/upload';
const MAX_SIZE = 32 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createServiceClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authData.user.id;

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 32 MB limit' }, { status: 400 });
    }

    const accepted = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/avif'];
    if (!accepted.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Image hosting not configured' }, { status: 500 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    const imgbbForm = new FormData();
    imgbbForm.append('key', apiKey);
    imgbbForm.append('image', base64);
    imgbbForm.append('name', file.name.replace(/\.[^.]+$/, ''));

    const imgbbRes = await fetch(IMGBB_URL, {
      method: 'POST',
      body: imgbbForm,
    });

    if (!imgbbRes.ok) {
      const errText = await imgbbRes.text().catch(() => 'Upload failed');
      console.error('ImgBB error:', imgbbRes.status, errText);
      return NextResponse.json({ error: 'Image hosting failed' }, { status: 502 });
    }

    const imgbbData = await imgbbRes.json();
    const img = imgbbData?.data;
    if (!img || !img?.url) {
      return NextResponse.json({ error: 'Invalid response from image host' }, { status: 502 });
    }

    const photoRow = {
      user_id: userId,
      imgbb_id: img.id || '',
      filename: file.name,
      image_url: img.url,
      display_url: img.display_url || img.medium?.url || img.url,
      thumbnail_url: img.thumb?.url || img.display_url || img.url,
      delete_url: img.delete_url || null,
      width: img.width ? parseInt(img.width, 10) : null,
      height: img.height ? parseInt(img.height, 10) : null,
      mime_type: file.type,
      file_size: file.size,
      title: '',
      description: '',
      is_favorite: false,
      is_deleted: false,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('photos')
      .insert(photoRow)
      .select('*')
      .maybeSingle();

    if (insertError) {
      console.error('DB insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save photo metadata' }, { status: 500 });
    }

    return NextResponse.json({ photo: inserted });
  } catch (err) {
    console.error('Upload route error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during upload' },
      { status: 500 }
    );
  }
}
