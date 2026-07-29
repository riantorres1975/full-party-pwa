begin;

create temp table glomex_retro_sizes (
  inches integer primary key,
  bag_pieces integer not null,
  regular_price numeric(10, 2) not null,
  wholesale_price numeric(10, 2) not null,
  box_bags integer not null,
  box_unit_price numeric(10, 2) not null
) on commit drop;

insert into glomex_retro_sizes (
  inches, bag_pieces, regular_price, wholesale_price, box_bags, box_unit_price
)
values
  (5, 100, 50, 42, 100, 37.60),
  (10, 50, 37, 34, 120, 29),
  (12, 100, 85, 78, 100, 72),
  (18, 25, 100, 85, 60, 80);

create temp table glomex_retro_colors (
  slug text primary key,
  exact_name text not null,
  family_slug text not null,
  hex_value text,
  sort_order integer not null
) on commit drop;

-- Keep the five legacy slugs so existing images and references retain their IDs.
insert into glomex_retro_colors (
  slug, exact_name, family_slug, hex_value, sort_order
)
values
  ('arena', 'Arena', 'amarillo', '#C9B18A', 1),
  ('gris-audaz', 'Gris audaz', 'plata', '#6E7478', 2),
  ('verde-oliva', 'Verde oliva', 'verde', '#7A7B3F', 3),
  ('verde-manzana-retro', 'Verde manzana', 'verde', '#86A84A', 4),
  ('piel', 'Piel', 'naranja', '#D5A384', 5),
  ('rosa-hot', 'Rosa hot', 'rosa', '#D85D84', 6),
  ('rosa-retro', 'Rosa retro', 'rosa', '#B87986', 7),
  ('azul-royal', 'Azul royal', 'azul', '#3157A4', 8),
  ('durazno', 'Durazno', 'naranja', '#D98E72', 9),
  ('cafe', 'Café', 'naranja', '#6F4E37', 10),
  ('caqui', 'Caqui', 'amarillo', '#A89F68', 11),
  ('malva', 'Malva', 'morado', '#9C758D', 12),
  ('fucsia-retro', 'Retro fucsia', 'rosa', '#B94B78', 13),
  ('azul-noche', 'Noche azul', 'azul', '#26364A', 14),
  ('gris-neblina', 'Gris neblina', 'plata', '#A5AAAD', 15),
  ('rojo-coral', 'Rojo coral', 'rojo', '#E76F51', 16),
  ('vino-retro', 'Vino tinto', 'vino', '#6F2C3E', 17),
  ('rojo-oscuro', 'Rojo oscuro', 'rojo', '#7A2633', 18),
  ('naranja-hermes', 'Naranja Hermes', 'naranja', '#C96B32', 19),
  ('azul-hielo', 'Azul hielo', 'azul', '#B5D5E5', 20),
  ('marfil-retro', 'Marfil', 'blanco', '#E9DFC5', 21),
  ('azul-indigo', 'Azul índigo', 'azul', '#3F4C9A', 22),
  ('azul-mate', 'Azul mate', 'azul', '#56738C', 23),
  ('beige-oscuro', 'Beige oscuro', 'amarillo', '#A88C68', 24),
  ('crema', 'Crema', 'blanco', '#F3E5C8', 25),
  ('curcuma', 'Cúrcuma', 'amarillo', '#C58A18', 26),
  ('marron-latte', 'Marrón latte', 'naranja', '#A47C65', 27),
  ('morado-orquidea', 'Morado orquídea', 'morado', '#A66BBE', 28),
  ('rosa-palo', 'Rosa palo', 'rosa', '#B98486', 29),
  ('verde-humo', 'Verde humo', 'verde', '#7D9184', 30),
  ('verde-selva', 'Verde selva', 'verde', '#2F5D50', 31);

do $$
begin
  if (
    select count(*) from public.catalog_products
    where slug = 'globo-latex-glomex'
  ) <> 1 then
    raise exception 'Expected exactly one globo-latex-glomex product';
  end if;

  if (
    select count(*) from public.catalog_product_lines
    where slug = 'glomex-retro'
  ) <> 1 then
    raise exception 'Expected exactly one glomex-retro line';
  end if;

  if (
    select count(*) from public.catalog_sizes
    where unit = 'pulgada' and numeric_value in (5, 10, 12, 18)
  ) <> 4 then
    raise exception 'Expected sizes 5, 10, 12 and 18 inches';
  end if;

  if (
    select count(*) from public.catalog_locations
    where slug = 'sol-naciente'
  ) <> 1 then
    raise exception 'Expected exactly one sol-naciente location';
  end if;
end
$$;

insert into public.catalog_colors (
  color_family_id,
  exact_name,
  slug,
  hex_value,
  active
)
select
  family.id,
  target.exact_name,
  target.slug,
  target.hex_value,
  true
from glomex_retro_colors target
join public.catalog_color_families family on family.slug = target.family_slug
on conflict (slug) do update
set color_family_id = excluded.color_family_id,
    exact_name = excluded.exact_name,
    hex_value = coalesce(catalog_colors.hex_value, excluded.hex_value),
    active = true,
    updated_at = now();

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
    'GLOMEX-RETRO-%s-%s',
    upper(replace(color.slug, '-', '_')),
    config.inches
  ),
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
  'shared_base_units',
  true
from public.catalog_products product
cross join public.catalog_product_lines line
cross join glomex_retro_sizes config
join public.catalog_sizes size
  on size.numeric_value = config.inches
 and size.unit = 'pulgada'
cross join glomex_retro_colors target_color
join public.catalog_colors color on color.slug = target_color.slug
where product.slug = 'globo-latex-glomex'
  and line.slug = 'glomex-retro'
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
  target.exact_name,
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
  target.sort_order,
  true
from public.catalog_product_lines line
cross join glomex_retro_colors target
join public.catalog_colors color on color.slug = target.slug
where line.slug = 'glomex-retro'
on conflict (line_id, color_id) do update
set commercial_name = excluded.commercial_name,
    image_url = coalesce(catalog_line_colors.image_url, excluded.image_url),
    sort_order = excluded.sort_order,
    active = true,
    updated_at = now();

update public.catalog_sale_presentations presentation
set name = format('Bolsa de %s piezas', config.bag_pieces),
    sort_order = case when config.inches = 18 then 2 else 1 end,
    updated_at = now()
from public.catalog_variants variant
join public.catalog_product_lines line on line.id = variant.line_id
join public.catalog_sizes size on size.id = variant.size_id
join glomex_retro_sizes config on config.inches = size.numeric_value
where presentation.variant_id = variant.id
  and line.slug = 'glomex-retro'
  and presentation.presentation_type = 'bolsa'
  and presentation.name <> 'Bolsa de 5 piezas';

insert into public.catalog_sale_presentations (
  variant_id, name, presentation_type, base_unit,
  contained_quantity, contained_unit,
  contains_presentation_id, contains_quantity,
  base_units_total, base_price, compare_at_price,
  minimum_order_quantity, quantity_step, maximum_order_quantity,
  inventory_policy, sort_order, active
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
  case when config.inches = 18 then 2 else 1 end,
  true
from public.catalog_variants variant
join public.catalog_product_lines line on line.id = variant.line_id
join public.catalog_sizes size on size.id = variant.size_id
join glomex_retro_sizes config on config.inches = size.numeric_value
join public.catalog_colors color on color.id = variant.color_id
join glomex_retro_colors target on target.slug = color.slug
where line.slug = 'glomex-retro'
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
    sort_order = excluded.sort_order,
    active = true,
    updated_at = now();

update public.catalog_sale_presentations presentation
set name = format('Caja de %s bolsas', config.box_bags),
    sort_order = case when config.inches = 18 then 3 else 2 end,
    updated_at = now()
from public.catalog_variants variant
join public.catalog_product_lines line on line.id = variant.line_id
join public.catalog_sizes size on size.id = variant.size_id
join glomex_retro_sizes config on config.inches = size.numeric_value
where presentation.variant_id = variant.id
  and line.slug = 'glomex-retro'
  and presentation.presentation_type = 'caja';

insert into public.catalog_sale_presentations (
  variant_id, name, presentation_type, base_unit,
  contained_quantity, contained_unit,
  contains_presentation_id, contains_quantity,
  base_units_total, base_price, compare_at_price,
  minimum_order_quantity, quantity_step, maximum_order_quantity,
  inventory_policy, sort_order, active
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
  case when config.inches = 18 then 3 else 2 end,
  true
from public.catalog_variants variant
join public.catalog_product_lines line on line.id = variant.line_id
join public.catalog_sizes size on size.id = variant.size_id
join glomex_retro_sizes config on config.inches = size.numeric_value
join public.catalog_colors color on color.id = variant.color_id
join glomex_retro_colors target on target.slug = color.slug
join public.catalog_sale_presentations bag
  on bag.variant_id = variant.id
 and bag.name = format('Bolsa de %s piezas', config.bag_pieces)
where line.slug = 'glomex-retro'
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
    sort_order = excluded.sort_order,
    active = true,
    updated_at = now();

insert into public.catalog_sale_presentations (
  variant_id, name, presentation_type, base_unit,
  contained_quantity, contained_unit,
  contains_presentation_id, contains_quantity,
  base_units_total, base_price, compare_at_price,
  minimum_order_quantity, quantity_step, maximum_order_quantity,
  inventory_policy, sort_order, active
)
select
  variant.id,
  'Bolsa de 5 piezas',
  'bolsa',
  'pieza',
  5,
  'pieza',
  null,
  null,
  5,
  35,
  null,
  1,
  1,
  null,
  'separate_by_presentation',
  1,
  true
from public.catalog_variants variant
join public.catalog_product_lines line on line.id = variant.line_id
join public.catalog_sizes size on size.id = variant.size_id
join public.catalog_colors color on color.id = variant.color_id
join glomex_retro_colors target on target.slug = color.slug
where line.slug = 'glomex-retro'
  and size.numeric_value = 18
  and size.unit = 'pulgada'
on conflict (variant_id, name) do update
set presentation_type = excluded.presentation_type,
    base_unit = excluded.base_unit,
    contained_quantity = 5,
    contained_unit = 'pieza',
    contains_presentation_id = null,
    contains_quantity = null,
    base_units_total = 5,
    base_price = 35,
    compare_at_price = null,
    minimum_order_quantity = 1,
    quantity_step = 1,
    maximum_order_quantity = null,
    inventory_policy = 'separate_by_presentation',
    sort_order = 1,
    active = true,
    updated_at = now();

delete from public.catalog_price_tiers tier
using public.catalog_sale_presentations presentation,
      public.catalog_variants variant,
      public.catalog_product_lines line
where tier.sale_presentation_id = presentation.id
  and presentation.variant_id = variant.id
  and variant.line_id = line.id
  and line.slug = 'glomex-retro'
  and presentation.presentation_type = 'bolsa';

insert into public.catalog_price_tiers (
  sale_presentation_id, minimum_quantity, maximum_quantity,
  price_per_presentation, label, active
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
join glomex_retro_sizes config on config.inches = size.numeric_value
join public.catalog_colors color on color.id = variant.color_id
join glomex_retro_colors target on target.slug = color.slug
join public.catalog_sale_presentations bag
  on bag.variant_id = variant.id
 and bag.name = format('Bolsa de %s piezas', config.bag_pieces)
where line.slug = 'glomex-retro';

insert into public.catalog_price_tiers (
  sale_presentation_id, minimum_quantity, maximum_quantity,
  price_per_presentation, label, active
)
select
  bag.id,
  5,
  null,
  20,
  'Desde 5 paquetes',
  true
from public.catalog_variants variant
join public.catalog_product_lines line on line.id = variant.line_id
join public.catalog_sizes size on size.id = variant.size_id
join public.catalog_colors color on color.id = variant.color_id
join glomex_retro_colors target on target.slug = color.slug
join public.catalog_sale_presentations bag
  on bag.variant_id = variant.id
 and bag.name = 'Bolsa de 5 piezas'
where line.slug = 'glomex-retro'
  and size.numeric_value = 18
  and size.unit = 'pulgada';

insert into public.catalog_inventory (
  variant_id, sale_presentation_id, location_id,
  quantity, reserved_quantity, low_stock_threshold
)
select
  variant.id,
  null,
  location.id,
  case when config.inches = 10 then 0 else config.bag_pieces * 500 end,
  0,
  config.bag_pieces * 5
from public.catalog_variants variant
join public.catalog_product_lines line on line.id = variant.line_id
join public.catalog_sizes size on size.id = variant.size_id
join glomex_retro_sizes config on config.inches = size.numeric_value
join public.catalog_colors color on color.id = variant.color_id
join glomex_retro_colors target on target.slug = color.slug
join public.catalog_locations location on location.slug = 'sol-naciente'
where line.slug = 'glomex-retro'
on conflict (variant_id, sale_presentation_id, location_id) do update
set quantity = excluded.quantity,
    reserved_quantity = 0,
    low_stock_threshold = excluded.low_stock_threshold,
    updated_at = now();

insert into public.catalog_inventory (
  variant_id, sale_presentation_id, location_id,
  quantity, reserved_quantity, low_stock_threshold
)
select
  variant.id,
  bag.id,
  location.id,
  500,
  0,
  5
from public.catalog_variants variant
join public.catalog_product_lines line on line.id = variant.line_id
join public.catalog_sizes size on size.id = variant.size_id
join public.catalog_colors color on color.id = variant.color_id
join glomex_retro_colors target on target.slug = color.slug
join public.catalog_sale_presentations bag
  on bag.variant_id = variant.id
 and bag.name = 'Bolsa de 5 piezas'
join public.catalog_locations location on location.slug = 'sol-naciente'
where line.slug = 'glomex-retro'
  and size.numeric_value = 18
  and size.unit = 'pulgada'
on conflict (variant_id, sale_presentation_id, location_id) do update
set quantity = excluded.quantity,
    reserved_quantity = 0,
    low_stock_threshold = 5,
    updated_at = now();

do $$
declare
  variant_count integer;
  standard_presentation_count integer;
  small_bag_count integer;
  tier_count integer;
  inventory_count integer;
  invalid_inventory_count integer;
begin
  select count(*)
  into variant_count
  from public.catalog_variants variant
  join public.catalog_product_lines line on line.id = variant.line_id
  join public.catalog_colors color on color.id = variant.color_id
  join public.catalog_sizes size on size.id = variant.size_id
  join glomex_retro_colors target on target.slug = color.slug
  join glomex_retro_sizes config on config.inches = size.numeric_value
  where line.slug = 'glomex-retro' and variant.active;

  if variant_count <> 124 then
    raise exception 'Expected 124 active Retro variants, found %', variant_count;
  end if;

  select count(*)
  into standard_presentation_count
  from public.catalog_sale_presentations presentation
  join public.catalog_variants variant on variant.id = presentation.variant_id
  join public.catalog_product_lines line on line.id = variant.line_id
  join public.catalog_colors color on color.id = variant.color_id
  join public.catalog_sizes size on size.id = variant.size_id
  join glomex_retro_colors target on target.slug = color.slug
  join glomex_retro_sizes config on config.inches = size.numeric_value
  where line.slug = 'glomex-retro'
    and presentation.active
    and (
      (
        presentation.name = format('Bolsa de %s piezas', config.bag_pieces)
        and presentation.base_units_total = config.bag_pieces
        and presentation.base_price = config.regular_price
      )
      or (
        presentation.name = format('Caja de %s bolsas', config.box_bags)
        and presentation.contains_quantity = config.box_bags
        and presentation.base_units_total = config.bag_pieces * config.box_bags
        and presentation.base_price = config.box_unit_price * config.box_bags
      )
    );

  if standard_presentation_count <> 248 then
    raise exception 'Expected 248 valid Retro bag/box presentations, found %',
      standard_presentation_count;
  end if;

  select count(*)
  into small_bag_count
  from public.catalog_sale_presentations presentation
  join public.catalog_variants variant on variant.id = presentation.variant_id
  join public.catalog_product_lines line on line.id = variant.line_id
  join public.catalog_colors color on color.id = variant.color_id
  join public.catalog_sizes size on size.id = variant.size_id
  join glomex_retro_colors target on target.slug = color.slug
  where line.slug = 'glomex-retro'
    and size.numeric_value = 18
    and presentation.name = 'Bolsa de 5 piezas'
    and presentation.base_price = 35
    and presentation.inventory_policy = 'separate_by_presentation'
    and presentation.active;

  if small_bag_count <> 31 then
    raise exception 'Expected 31 valid Retro five-piece bags, found %',
      small_bag_count;
  end if;

  select count(*)
  into tier_count
  from public.catalog_price_tiers tier
  join public.catalog_sale_presentations presentation
    on presentation.id = tier.sale_presentation_id
  join public.catalog_variants variant on variant.id = presentation.variant_id
  join public.catalog_product_lines line on line.id = variant.line_id
  where line.slug = 'glomex-retro' and tier.active;

  if tier_count <> 155 then
    raise exception 'Expected 155 active Retro price tiers, found %', tier_count;
  end if;

  select count(*)
  into inventory_count
  from public.catalog_inventory inventory
  join public.catalog_variants variant on variant.id = inventory.variant_id
  join public.catalog_product_lines line on line.id = variant.line_id
  join public.catalog_locations location on location.id = inventory.location_id
  where line.slug = 'glomex-retro'
    and location.slug = 'sol-naciente'
    and inventory.reserved_quantity = 0;

  if inventory_count <> 155 then
    raise exception 'Expected 155 Retro inventory rows, found %', inventory_count;
  end if;

  select count(*)
  into invalid_inventory_count
  from public.catalog_inventory inventory
  join public.catalog_variants variant on variant.id = inventory.variant_id
  join public.catalog_product_lines line on line.id = variant.line_id
  join public.catalog_colors color on color.id = variant.color_id
  join glomex_retro_colors target on target.slug = color.slug
  join public.catalog_sizes size on size.id = variant.size_id
  join glomex_retro_sizes config on config.inches = size.numeric_value
  join public.catalog_locations location on location.id = inventory.location_id
  where line.slug = 'glomex-retro'
    and location.slug = 'sol-naciente'
    and (
      (
        inventory.sale_presentation_id is null
        and inventory.quantity <>
          case when config.inches = 10 then 0 else config.bag_pieces * 500 end
      )
      or (
        inventory.sale_presentation_id is not null
        and inventory.quantity <> 500
      )
    );

  if invalid_inventory_count <> 0 then
    raise exception 'Found % Retro inventory rows with an invalid quantity',
      invalid_inventory_count;
  end if;
end
$$;

commit;
