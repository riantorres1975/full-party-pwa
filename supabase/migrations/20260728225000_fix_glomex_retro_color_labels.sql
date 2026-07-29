begin;

with corrected_labels (slug, exact_name) as (
  values
    ('azul-indigo', 'Azul índigo'),
    ('cafe', 'Café'),
    ('curcuma', 'Cúrcuma'),
    ('marron-latte', 'Marrón latte'),
    ('morado-orquidea', 'Morado orquídea')
)
update public.catalog_colors color
set exact_name = corrected.exact_name,
    updated_at = now()
from corrected_labels corrected
where color.slug = corrected.slug;

update public.catalog_line_colors line_color
set commercial_name = color.exact_name,
    updated_at = now()
from public.catalog_colors color,
     public.catalog_product_lines line
where line_color.color_id = color.id
  and line_color.line_id = line.id
  and line.slug = 'glomex-retro';

commit;
