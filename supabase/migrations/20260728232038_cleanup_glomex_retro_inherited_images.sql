-- Remove the Retro line cover copied into colors that have no real color photo.
update public.catalog_variants variant
set image_url = null,
    updated_at = now()
from public.catalog_product_lines line
where variant.line_id = line.id
  and line.slug = 'glomex-retro'
  and variant.image_url = line.image_url
  and not exists (
    select 1
    from public.catalog_product_images image
    where image.line_id = line.id
      and image.color_id = variant.color_id
      and image.image_url = variant.image_url
      and image.active = true
  );

update public.catalog_line_colors line_color
set image_url = null,
    updated_at = now()
from public.catalog_product_lines line
where line_color.line_id = line.id
  and line.slug = 'glomex-retro'
  and line_color.image_url = line.image_url
  and not exists (
    select 1
    from public.catalog_product_images image
    where image.line_id = line.id
      and image.color_id = line_color.color_id
      and image.image_url = line_color.image_url
      and image.active = true
  );
