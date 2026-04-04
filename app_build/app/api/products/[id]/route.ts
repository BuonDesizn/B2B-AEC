// @witness [PS-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { productsService } from '@/lib/services/products';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await productsService.getProductById(id);

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : '';

    if (message === 'RESOURCE_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch product' } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    const body = await request.json();

    const product = await productsService.updateProduct(id, body, user.id);

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : '';

    if (message === 'RESOURCE_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    if (message === 'PRODUCT_UPDATE_NOT_OWNER') {
      return NextResponse.json(
        { success: false, error: { code: 'PRODUCT_UPDATE_NOT_OWNER', message: 'You do not own this product' } },
        { status: 403 }
      );
    }

    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update product' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    const result = await productsService.deleteProduct(id, user.id);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : '';

    if (message === 'RESOURCE_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    if (message === 'PRODUCT_DELETE_NOT_OWNER') {
      return NextResponse.json(
        { success: false, error: { code: 'PRODUCT_DELETE_NOT_OWNER', message: 'You do not own this product' } },
        { status: 403 }
      );
    }

    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete product' } },
      { status: 500 }
    );
  }
}
