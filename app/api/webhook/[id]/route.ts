import { NextRequest, NextResponse } from 'next/server';
import { sql } from '../../../../lib/neon';

export const runtime = 'edge';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validation
  if (!id) {
    return NextResponse.json(
      { error: 'Missing ID parameter' },
      { status: 400 }
    );
  }

  try {
    // Supprimer de la DB
    const result = await sql`
      DELETE FROM wh_log 
      WHERE id = ${id}
      RETURNING id
    `;

    // Vérifier si trouvé et supprimé
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Log not found' },
        { status: 404 }
      );
    }

    // Retourner succès
    return NextResponse.json({
      success: true,
      id: result[0].id
    });

  } catch (error) {
    console.error('Error deleting log:', error);
    return NextResponse.json(
      { error: 'Failed to delete log' },
      { status: 500 }
    );
  }
}