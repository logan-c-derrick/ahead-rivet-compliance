"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/profile";

export interface Product {
  id: string;
  organization_id?: string;
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
  lifecycle_status: string;
  created_at: string;
  updated_at: string;
}

export interface ProductBomComponent {
  component_id: string;
  component_name: string;
  part_number: string | null;
  manufacturer: string | null;
  manufacturer_sku: string | null;
  category: string | null;
  quantity: number | null;
  description: string | null;
  unit_price: number | null;
  unit_msrp: number | null;
}

export async function getProducts(): Promise<Product[]> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return (data as Product[]) ?? [];
}

export async function getProduct(id: string): Promise<Product | null> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Product;
}

export async function getProductBomComponents(productId: string): Promise<ProductBomComponent[]> {
  const profile = await requireProfile();
  const supabase = await createClient();

  // Ensure product belongs to caller organization.
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("organization_id", profile.organization_id)
    .single();

  if (!product) return [];

  const { data, error } = await supabase
    .from("product_components")
    .select(`
      quantity,
      component_id,
      components (
        name,
        part_number,
        manufacturer,
        manufacturer_sku,
        category,
        description,
        unit_price,
        unit_msrp
      )
    `)
    .eq("product_id", productId);

  if (error) {
    console.error("Error fetching product BOM:", error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    component_id: row.component_id,
    component_name: row.components?.name ?? "—",
    part_number: row.components?.part_number ?? null,
    manufacturer: row.components?.manufacturer ?? null,
    manufacturer_sku: row.components?.manufacturer_sku ?? null,
    category: row.components?.category ?? null,
    quantity: row.quantity ?? null,
    description: row.components?.description ?? null,
    unit_price: row.components?.unit_price ?? null,
    unit_msrp: row.components?.unit_msrp ?? null,
  }));
}

export type CreateProductState = { error?: string };

async function createProductImpl(
  formData: FormData
): Promise<CreateProductState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const sku = (formData.get("sku") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const category = (formData.get("category") as string)?.trim() || null;
  const lifecycle_status = (formData.get("lifecycle_status") as string) || "active";

  if (!name) {
    return { error: "Product name is required" };
  }

  const { error } = await supabase
    .from("products")
    .insert({
      organization_id: profile.organization_id,
      name,
      sku,
      description,
      category,
      lifecycle_status,
    });

  if (error) {
    console.error("Error creating product:", error);
    return { error: error.message };
  }

  revalidatePath("/products");
  redirect("/products");
}

/** Plain `<form action={…}>` — React types expect `Promise<void>`. */
export async function createProduct(formData: FormData): Promise<void> {
  const result = await createProductImpl(formData);
  if (result?.error) {
    throw new Error(result.error);
  }
}

/** `useFormState` — returns validation errors for inline UI. */
export async function createProductFormState(
  _prev: CreateProductState | null,
  formData: FormData
): Promise<CreateProductState> {
  return createProductImpl(formData);
}

/**
 * Create a product and return it (no redirect). Used from BOM upload flow.
 */
export async function createProductInline(
  name: string,
  sku?: string | null
): Promise<{ success: true; product: Product } | { success: false; error: string }> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const trimmed = name?.trim();
  if (!trimmed) {
    return { success: false, error: "Product name is required" };
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      organization_id: profile.organization_id,
      name: trimmed,
      sku: sku?.trim() || null,
      description: null,
      category: null,
      lifecycle_status: "active",
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating product:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/products");
  revalidatePath("/products/bom/map");
  return { success: true, product: data as Product };
}

type UpdateProductState = { error?: string };
export async function updateProduct(
  _prevState: UpdateProductState | null,
  formData: FormData
): Promise<UpdateProductState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = formData.get("id") as string;
  if (!id) return { error: "Product ID is required" };

  const name = (formData.get("name") as string)?.trim();
  const sku = (formData.get("sku") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const category = (formData.get("category") as string)?.trim() || null;
  const lifecycle_status = (formData.get("lifecycle_status") as string) || "active";

  if (!name) {
    return { error: "Product name is required" };
  }

  const { error } = await supabase
    .from("products")
    .update({
      name,
      sku,
      description,
      category,
      lifecycle_status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    console.error("Error updating product:", error);
    return { error: error.message };
  }

  revalidatePath("/products");
  redirect("/products");
}

type DeleteProductState = { error?: string };
export async function deleteProduct(
  _prevState: DeleteProductState | null,
  formData: FormData
): Promise<DeleteProductState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const id = formData.get("id") as string;
  if (!id) return { error: "Product ID is required" };

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    console.error("Error deleting product:", error);
    return { error: error.message };
  }

  revalidatePath("/products");
  redirect("/products");
}
