// @witness [PS-001]
import { NextResponse } from 'next/server';

import { requireAuth, AuthError } from '@/lib/auth';
import { productsService } from '@/lib/services/products';

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    if (!body.name || !body.category || body.price_per_unit == null || !body.unit || body.min_order_quantity == null) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Missing required fields: name, category, price_per_unit, unit, min_order_quantity' } },
        { status: 400 }
      );
    }

    const product = await productsService.createProduct(user.id, {
      name: body.name,
      description: body.description,
      category: body.category,
      subcategory: body.subcategory,
      price_per_unit: body.price_per_unit,
      unit: body.unit,
      min_order_quantity: body.min_order_quantity,
      images: body.images,
      specifications: body.specifications,
      available: body.available,
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : '';

    if (message === 'PRODUCT_CREATE_NOT_PS') {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_INSUFFICIENT_ROLE', message: 'Only PS (Product Supplier) accounts can create products' } },
        { status: 403 }
      );
    }

    if (message === 'PRODUCT_CREATE_SUBSCRIPTION_LOCKED') {
      return NextResponse.json(
        { success: false, error: { code: 'PRODUCT_CREATE_SUBSCRIPTION_LOCKED', message: 'Your subscription is locked. Cannot create products.' } },
        { status: 403 }
      );
    }

    if (message === 'Profile not found') {
      return NextResponse.json(
        { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Profile not found' } },
        { status: 404 }
      );
    }

    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create product' } },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const sellerId = searchParams.get('seller_id') || undefined;
    const category = searchParams.get('category') || undefined;
    const page = searchParams.has('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    const pageSize = searchParams.has('page_size') ? parseInt(searchParams.get('page_size')!, 10) : 20;

    const result = await productsService.listProducts({
      seller_id: sellerId,
      category,
      page,
      page_size: pageSize,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error listing products:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list products' } },
      { status: 500 }
    );
  }
}
