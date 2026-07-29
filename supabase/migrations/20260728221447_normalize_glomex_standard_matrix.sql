begin;

create temp table glomex_standard_sizes (
  inches integer primary key,
  bag_pieces integer not null,
  regular_price numeric(10, 2) not null,
  wholesale_price numeric(10, 2) not null,
  box_bags integer not null,
  box_unit_price numeric(10, 2) not null
) on commit drop;

insert into glomex_standard_sizes (
  inches,
  bag_pieces,
  regular_price,
  wholesale_price,
  box_bags,
  box_unit_price
)
values
  (5, 100, 50, 42, 100, 37.60),
  (10, 50, 37, 34, 120, 29),
  (12, 100, 85, 78, 100, 72),
  (18, 25, 100, 85, 60, 80);

create temp table glomex_standard_colors (
  slug text primary key,
  sort_order integer not null
) on commit drop;

insert into glomex_standard_colors (slug, sort_order)
values
  ('amarillo', 1),
  ('rojo', 2),
  ('naranja', 3),
  ('rosa-bebe', 4),
  ('rosa-pink', 5),
  ('fucsia', 6),
  ('blanco', 7),
  ('negro', 8),
  ('azul', 9),
  ('azul-bebe', 10),
  ('azul-turquesa', 11),
  ('verde-lima', 12),
  ('verde', 13),
  ('amarillo-limon', 14),
  ('verde-oscuro', 15),
  ('morado', 16),
  ('surtido-estandar', 17);

do $$
begin
  if (
    select count(*)
    from public.catalog_products
    where slug = 'globo-latex-glomex'
  ) <> 1 then
    raise exception 'Expected exactly one globo-latex-glomex product';
  end if;

  if (
    select count(*)
    from public.catalog_product_lines
    where slug = 'glomex-estandar'
  ) <> 1 then
    raise exception 'Expected exactly one glomex-estandar line';
  end if;

  if (
    select count(*)
    from public.catalog_sizes
    where unit = 'pulgada'
      and numeric_value in (5, 10, 12, 18)
  ) <> 4 then
    raise exception 'Expected sizes 5, 10, 12 and 18 inches';
  end if;

  if (
    select count(*)
    from public.catalog_locations
    where slug = 'sol-naciente'
  ) <> 1 then
    raise exception 'Expected exactly one sol-naciente location';
  end if;

  if (
    select count(*)
    from public.catalog_colors
    where slug in (
      'amarillo',
      'rojo',
      'naranja',
      'rosa-bebe',
      'rosa-pink',
      'fucsia',
      'blanco',
      'negro',
      'azul',
      'azul-bebe',
      'azul-turquesa',
      'verde-lima',
      'verde',
      'amarillo-limon',
      'verde-oscuro',
      'morado',
      'surtido'
    )
  ) <> 17 then
    raise exception 'Expected all source colors for Glomex Standard';
  end if;
end
$$;

-- Keep the generic Surtido color available for other catalog families.
insert into public.catalog_colors (
  color_family_id,
  exact_name,
  slug,
  hex_value,
  swatch_image_url,
  internal_code,
  active
)
select
  source.color_family_id,
  'Surtido Estándar',
  'surtido-estandar',
  source.hex_value,
  source.swatch_image_url,
  source.internal_code,
  true
from public.catalog_colors source
where source.slug = 'surtido'
on conflict (slug) do update
set exact_name = excluded.exact_name,
    active = true,
    updated_at = now();

update public.catalog_colors target
set hex_value = coalesce(target.hex_value, source.hex_value),
    active = true,
    updated_at = now()
from public.catalog_colors source
where target.slug = 'azul'
  and source.slug = 'azul-rey';

-- Only Standard changes from Azul rey to Azul; Chrome keeps Azul rey.
update public.catalog_variants variant
set color_id = target.id,
    sku = replace(variant.sku, 'AZUL_REY', 'AZUL'),
    updated_at = now()
from public.catalog_product_lines line,
     public.catalog_colors source,
     public.catalog_colors target
where variant.line_id = line.id
  and line.slug = 'glomex-estandar'
  and variant.color_id = source.id
  and source.slug = 'azul-rey'
  and target.slug = 'azul';

update public.catalog_line_colors line_color
set color_id = target.id,
    commercial_name = target.exact_name,
    updated_at = now()
from public.catalog_product_lines line,
     public.catalog_colors source,
     public.catalog_colors target
where line_color.line_id = line.id
  and line.slug = 'glomex-estandar'
  and line_color.color_id = source.id
  and source.slug = 'azul-rey'
  and target.slug = 'azul';

update public.catalog_variants variant
set color_id = target.id,
    sku = replace(variant.sku, 'SURTIDO-', 'SURTIDO_ESTANDAR-'),
    updated_at = now()
from public.catalog_product_lines line,
     public.catalog_colors source,
     public.catalog_colors target
where variant.line_id = line.id
  and line.slug = 'glomex-estandar'
  and variant.color_id = source.id
  and source.slug = 'surtido'
  and target.slug = 'surtido-estandar';

update public.catalog_line_colors line_color
set color_id = target.id,
    commercial_name = target.exact_name,
    updated_at = now()
from public.catalog_product_lines line,
     public.catalog_colors source,
     public.catalog_colors target
where line_color.line_id = line.id
  and line.slug = 'glomex-estandar'
  and line_color.color_id = source.id
  and source.slug = 'surtido'
  and target.slug = 'surtido-estandar';

insert into public.catalog_variants (
  product_id,
  line_id,
  color_id,
  size_id,
  sku,
  image_url,
  inventory_policy,
  active
)
select
  product.id,
  line.id,
  color.id,
  size.id,
  format(
    'GLOMEX-ESTANDAR-%s-%s',
    upper(replace(color.slug, '-', '_')),
    config.inches
  ),
  coalesce(
    (
      select image_variant.image_url
      from public.catalog_variants image_variant
      join public.catalog_sizes image_size on image_size.id = image_variant.size_id
      where image_variant.line_id = line.id
        and image_variant.color_id = color.id
        and image_variant.image_url is not null
      order by
        case when image_size.numeric_value = 12 then 0 else 1 end,
        image_size.numeric_value
      limit 1
    ),
    line.image_url,
    product.main_image_url
  ),
  'shared_base_units',
  true
from public.catalog_products product
cross join public.catalog_product_lines line
cross join glomex_standard_sizes config
join public.catalog_sizes size
  on size.numeric_value = config.inches
 and size.unit = 'pulgada'
cross join glomex_standard_colors target_color
join public.catalog_colors color on color.slug = target_color.slug
where product.slug = 'globo-latex-glomex'
  and line.slug = 'glomex-estandar'
on conflict on constraint catalog_variants_unique_combination do update
set sku = excluded.sku,
    image_url = coalesce(catalog_variants.image_url, excluded.image_url),
    inventory_policy = 'shared_base_units',
    active = true,
    updated_at = now();

insert into public.catalog_line_colors (
  line_id,
  color_id,
  commercial_name,
  image_url,
  sort_order,
  active
)
select
  line.id,
  color.id,
  color.exact_name,
  (
    select variant.image_url
    from public.catalog_variants variant
    join public.catalog_sizes size on size.id = variant.size_id
    where variant.line_id = line.id
      and variant.color_id = color.id
      and variant.image_url is not null
    order by
      case when size.numeric_value = 12 then 0 else 1 end,
      size.numeric_value
    limit 1
  ),
  target_color.sort_order,
  true
from public.catalog_product_lines line
cross join glomex_standard_colors target_color
join public.catalog_colors color on color.slug = target_color.slug
where line.slug = 'glomex-estandar'
on conflict (line_id, color_id) do update
set commercial_name = excluded.commercial_name,
    image_url = coalesce(catalog_line_colors.image_url, excluded.image_url),
    sort_order = excluded.sort_order,
    active = true,
    updated_at = now();

update public.catalog_sale_presentations presentation
set name = format('Bolsa de %s piezas', config.bag_pieces),
    updated_at = now()
from public.catalog_variants variant
join public.catalog_product_lines line on line.id = variant.line_id
join public.catalog_sizes size on size.id = variant.size_id
join glomex_standard_sizes config on config.inches = size.numeric_value
where presentation.variant_id = variant.id
  and line.slug = 'glomex-estandar'
  and presentation.presentation_type = 'bolsa';

insert into public.catalog_sale_presentations (
  variant_id,
  name,
  presentation_type,
  base_unit,
  contained_quantity,
  contained_unit,
  contains_presentation_id,
  contains_quantity,
  base_units_total,
  base_price,
  compare_at_price,
  minimum_order_quantity,
  quantity_step,
  maximum_order_quantity,
  inventory_policy,
  sort_order,
  active
)
select
  variant.id,
  format('Bolsa de %s piezas', config.bag_pieces),
  'bolsa',
  'pieza',
  config.bag_pieces,
  'pieza',
  null,
  null,
  config.bag_pieces,
  config.regular_price,
  null,
  1,
  1,
  null,
  null,
  1,
  true
from public.catalog_variants variant
join public.catalog_product_lines line on line.id = variant.line_id
join public.catalog_sizes size on size.id = variant.size_id
join glomex_standard_sizes config on config.inches = size.numeric_value
join public.catalog_colors color on color.id = variant.color_id
join glomex_standard_colors target_color on target_color.slug = color.slug
where line.slug = 'glomex-estandar'
on conflict (variant_id, name) do update
set presentation_type = excluded.presentation_type,
    base_unit = excluded.base_unit,
    contained_quantity = excluded.contained_quantity,
    contained_unit = excluded.contained_unit,
    contains_presentation_id = null,
    contains_quantity = null,
    base_units_total = excluded.base_units_total,
    base_price = excluded.base_price,
    compare_at_price = null,
    minimum_order_quantity = 1,
    quantity_step = 1,
    maximum_order_quantity = null,
    inventory_policy = null,
    sort_order = 1,
    active = true,
    updated_at = now();

update public.catalog_sale_presentations presentation
set name = format('Caja de %s bolsas', config.box_bags),
    updated_at = now()
from public.catalog_variants variant
join public.catalog_product_lines line on line.id = variant.line_id
join public.catalog_sizes size on size.id = variant.size_id
join glomex_standard_sizes config on config.inches = size.numeric_value
where presentation.variant_id = variant.id
  and line.slug = 'glomex-estandar'
  and presentation.presentation_type = 'caja';

insert into public.catalog_sale_presentations (
  variant_id,
  name,
  presentation_type,
  base_unit,
  contained_quantity,
  contained_unit,
  contains_presentation_id,
  contains_quantity,
  base_units_total,
  base_price,
  compare_at_price,
  minimum_order_quantity,
  quantity_step,
  maximum_order_quantity,
  inventory_policy,
  sort_order,
  active
)
select
  variant.id,
  format('Caja de %s bolsas', config.box_bags),
  'caja',
  'pieza',
  null,
  null,
  bag.id,
  config.box_bags,
  config.bag_pieces * config.box_bags,
  config.box_unit_price * config.box_bags,
  null,
  1,
  1,
  null,
  null,
  2,
  true
from public.catalog_variants variant
join public.catalog_product_lines line on line.id = variant.line_id
join public.catalog_sizes size on size.id = variant.size_id
join glomex_standard_sizes config on config.inches = size.numeric_value
join public.catalog_colors color on color.id = variant.color_id
join glomex_standard_colors target_color on target_color.slug = color.slug
join public.catalog_sale_presentations bag
  on bag.variant_id = variant.id
 and bag.presentation_type = 'bolsa'
where line.slug = 'glomex-estandar'
on conflict (variant_id, name) do update
set presentation_type = excluded.presentation_type,
    base_unit = excluded.base_unit,
    contained_quantity = null,
    contained_unit = null,
    contains_presentation_id = excluded.contains_presentation_id,
    contains_quantity = excluded.contains_quantity,
    base_units_total = excluded.base_units_total,
    base_price = excluded.base_price,
    compare_at_price = null,
    minimum_order_quantity = 1,
    quantity_step = 1,
    maximum_order_quantity = null,
    inventory_policy = null,
    sort_order = 2,
    active = true,
    updated_at = now();

delete from public.catalog_price_tiers tier
using public.catalog_sale_presentations presentation,
      public.catalog_variants variant,
      public.catalog_product_lines line
where tier.sale_presentation_id = presentation.id
  and presentation.variant_id = variant.id
  and variant.line_id = line.id
  and line.slug = 'glomex-estandar'
  and presentation.presentation_type = 'bolsa';

insert into public.catalog_price_tiers (
  sale_presentation_id,
  minimum_quantity,
  maximum_quantity,
  price_per_presentation,
  label,
  active
)
select
  bag.id,
  12,
  null,
  config.wholesale_price,
  'Mayoreo',
  true
from public.catalog_variants variant
join public.catalog_product_lines line on line.id = variant.line_id
join public.catalog_sizes size on size.id = variant.size_id
join glomex_standard_sizes config on config.inches = size.numeric_value
join public.catalog_colors color on color.id = variant.color_id
join glomex_standard_colors target_color on target_color.slug = color.slug
join public.catalog_sale_presentations bag
  on bag.variant_id = variant.id
 and bag.presentation_type = 'bolsa'
where line.slug = 'glomex-estandar';

insert into public.catalog_inventory (
  variant_id,
  sale_presentation_id,
  location_id,
  quantity,
  reserved_quantity,
  low_stock_threshold
)
select
  variant.id,
  null,
  location.id,
  config.bag_pieces * 500,
  0,
  config.bag_pieces * 5
from public.catalog_variants variant
join public.catalog_product_lines line on line.id = variant.line_id
join public.catalog_sizes size on size.id = variant.size_id
join glomex_standard_sizes config on config.inches = size.numeric_value
join public.catalog_colors color on color.id = variant.color_id
join glomex_standard_colors target_color on target_color.slug = color.slug
join public.catalog_locations location on location.slug = 'sol-naciente'
where line.slug = 'glomex-estandar'
on conflict (variant_id, sale_presentation_id, location_id) do update
set quantity = excluded.quantity,
    reserved_quantity = 0,
    low_stock_threshold = excluded.low_stock_threshold,
    updated_at = now();

do $$
declare
  variant_count integer;
  presentation_count integer;
  tier_count integer;
  inventory_count integer;
begin
  select count(*)
  into variant_count
  from public.catalog_variants variant
  join public.catalog_product_lines line on line.id = variant.line_id
  join public.catalog_colors color on color.id = variant.color_id
  join public.catalog_sizes size on size.id = variant.size_id
  join glomex_standard_colors target_color on target_color.slug = color.slug
  join glomex_standard_sizes config on config.inches = size.numeric_value
  where line.slug = 'glomex-estandar'
    and variant.active;

  if variant_count <> 68 then
    raise exception 'Expected 68 active Standard variants, found %', variant_count;
  end if;

  select count(*)
  into presentation_count
  from public.catalog_sale_presentations presentation
  join public.catalog_variants variant on variant.id = presentation.variant_id
  join public.catalog_product_lines line on line.id = variant.line_id
  join public.catalog_colors color on color.id = variant.color_id
  join public.catalog_sizes size on size.id = variant.size_id
  join glomex_standard_colors target_color on target_color.slug = color.slug
  join glomex_standard_sizes config on config.inches = size.numeric_value
  where line.slug = 'glomex-estandar'
    and presentation.active
    and (
      (
        presentation.presentation_type = 'bolsa'
        and presentation.base_units_total = config.bag_pieces
        and presentation.base_price = config.regular_price
      )
      or (
        presentation.presentation_type = 'caja'
        and presentation.contains_quantity = config.box_bags
        and presentation.base_units_total = config.bag_pieces * config.box_bags
        and presentation.base_price = config.box_unit_price * config.box_bags
      )
    );

  if presentation_count <> 136 then
    raise exception 'Expected 136 valid Standard presentations, found %',
      presentation_count;
  end if;

  select count(*)
  into tier_count
  from public.catalog_price_tiers tier
  join public.catalog_sale_presentations presentation
    on presentation.id = tier.sale_presentation_id
  join public.catalog_variants variant on variant.id = presentation.variant_id
  join public.catalog_product_lines line on line.id = variant.line_id
  join public.catalog_colors color on color.id = variant.color_id
  join public.catalog_sizes size on size.id = variant.size_id
  join glomex_standard_colors target_color on target_color.slug = color.slug
  join glomex_standard_sizes config on config.inches = size.numeric_value
  where line.slug = 'glomex-estandar'
    and presentation.presentation_type = 'bolsa'
    and tier.minimum_quantity = 12
    and tier.maximum_quantity is null
    and tier.price_per_presentation = config.wholesale_price
    and tier.active;

  if tier_count <> 68 then
    raise exception 'Expected 68 valid Standard wholesale tiers, found %',
      tier_count;
  end if;

  select count(*)
  into inventory_count
  from public.catalog_inventory inventory
  join public.catalog_variants variant on variant.id = inventory.variant_id
  join public.catalog_product_lines line on line.id = variant.line_id
  join public.catalog_colors color on color.id = variant.color_id
  join public.catalog_sizes size on size.id = variant.size_id
  join glomex_standard_colors target_color on target_color.slug = color.slug
  join glomex_standard_sizes config on config.inches = size.numeric_value
  join public.catalog_locations location on location.id = inventory.location_id
  where line.slug = 'glomex-estandar'
    and location.slug = 'sol-naciente'
    and inventory.sale_presentation_id is null
    and inventory.quantity = config.bag_pieces * 500
    and inventory.reserved_quantity = 0;

  if inventory_count <> 68 then
    raise exception 'Expected inventory for 68 Standard variants, found %',
      inventory_count;
  end if;
end
$$;

commit;
