-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('profile-photos', 'profile-photos', true),
  ('product-images', 'product-images', true),
  ('equipment-images', 'equipment-images', true),
  ('portfolio-images', 'portfolio-images', true),
  ('ad-images', 'ad-images', true),
  ('rfp-attachments', 'rfp-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Public read policy for all buckets
CREATE POLICY "public_read_profile_photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');
CREATE POLICY "public_read_product_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "public_read_equipment_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'equipment-images');
CREATE POLICY "public_read_portfolio_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolio-images');
CREATE POLICY "public_read_ad_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'ad-images');
CREATE POLICY "authenticated_read_rfp_attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'rfp-attachments' AND auth.role() = 'authenticated');

-- Owner write policy for all buckets
CREATE POLICY "owner_write_profile_photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owner_write_product_images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owner_write_equipment_images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'equipment-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owner_write_portfolio_images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owner_write_ad_images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ad-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owner_write_rfp_attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'rfp-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Owner delete policy
CREATE POLICY "owner_delete_profile_photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owner_delete_product_images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owner_delete_equipment_images" ON storage.objects
  FOR DELETE USING (bucket_id = 'equipment-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owner_delete_portfolio_images" ON storage.objects
  FOR DELETE USING (bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owner_delete_ad_images" ON storage.objects
  FOR DELETE USING (bucket_id = 'ad-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "owner_delete_rfp_attachments" ON storage.objects
  FOR DELETE USING (bucket_id = 'rfp-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
