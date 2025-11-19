import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 });
    }

    const orgId = session.user.orgId ?? session.user.email;
    const db = await getDb();

    console.log('[Download CSV] Looking for file:', { fileId, orgId, userEmail: session.user.email });

    // Try to find file with orgId first (security check)
    let tempFile = await db.collection('temp_files').findOne({ 
      fileId,
      orgId,
    });

    // Fallback: try fileId only (for backward compatibility)
    if (!tempFile) {
      console.log('[Download CSV] Not found with orgId, trying fileId only...');
      tempFile = await db.collection('temp_files').findOne({ fileId });
      
      if (tempFile) {
        console.log('[Download CSV] Found with different orgId:', {
          fileOrgId: tempFile.orgId,
          requestedOrgId: orgId,
        });
      }
    }

    console.log('[Download CSV] File found:', tempFile ? 'YES' : 'NO');
    
    if (tempFile) {
      console.log('[Download CSV] File details:', {
        fileId: tempFile.fileId,
        filename: tempFile.filename,
        createdAt: tempFile.createdAt,
        expiresAt: tempFile.expiresAt,
        hasContent: !!tempFile.content
      });
    }

    if (!tempFile) {
      return NextResponse.json({ 
        error: 'File not found or expired',
        message: 'The file may have expired or the fileId is incorrect.'
      }, { status: 404 });
    }

    // Check if file is expired
    if (tempFile.expiresAt && new Date(tempFile.expiresAt) < new Date()) {
      // Delete expired file
      await db.collection('temp_files').deleteOne({ fileId });
      return NextResponse.json({ error: 'File has expired' }, { status: 410 });
    }

    // Return CSV file
    return new NextResponse(tempFile.content, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${tempFile.filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error downloading CSV:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
