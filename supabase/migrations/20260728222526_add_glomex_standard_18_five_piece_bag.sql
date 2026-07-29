begin;

do $$
begin
  if (
    select count(*)
    from public.catalog_variants variant
    join public.catalog_product_lines line on line.id = variant.line_id
    join public.catalog_sizes size on size.id = variant.size_id
    where line.slug = 'glomex-estandar'
      and size.numeric_value = 18
      and size.unit = 'pulgada'
      and variant.active
  ) <> 17 then
    raise exception 'Expected 17 active Standard variants in 18 inches';
  end if;

  if (
    select count(*)
    from public.catalog_locations
    where slug = 'sol-naciente'
  ) <> 1 then
    raise exception 'Expected exactly one sol-naciente location';
  end if;
end
$$;

update public.catalog_sale_presentations presentation
set sort_order = case
      when presentation.name = 'Bolsa de 25 piezas' then 2
      when presentation.presentation_type = 'caja' then 3
      else presentation.sort_order
    end,
    updated_at = now()
from public.catalog_variants variant
join public.catalog_product_lines line on line.id = variant.line_id
join public.catalog_sizes size on size.id = variant.size_id
where presentation.variant_id = variant.id
  and line.slug = 'glomex-estandar'
  and size.numeric_value = 18
  and size.unit = 'pulgada';

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
where line.slug = 'glomex-estandar'
  and size.numeric_value = 18
  and size.unit = 'pulgada'
  and variant.active
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
    inventory_policy = 'separate_by_presentation',
    sort_order = 1,
    active = true,
    updated_at = now();

delete from public.catalog_price_tiers tier
using public.catalog_sale_presentations presentation,
      public.catalog_variants variant,
      public.catalog_product_lines line,
      public.catalog_sizes size
where tier.sale_presentation_id = presentation.id
  and presentation.variant_id = variant.id
  and variant.line_id = line.id
  and variant.size_id = size.id
  and line.slug = 'glomex-estandar'
  and size.numeric_value = 18
  and size.unit = 'pulgada'
  and presentation.name = 'Bolsa de 5 piezas';

insert into public.catalog_price_tiers (
  sale_presentation_id,
  minimum_quantity,
  maximum_quantity,
  price_per_presentation,
  label,
  active
)
select
  presentation.id,
  5,
  null,
  20,
  'Desde 5 paquetes',
  true
from public.catalog_sale_presentations presentation
join public.catalog_variants variant on variant.id = presentation.variant_id
join public.catalog_product_lines line on line.id = variant.line_id
join public.catalog_sizes size on size.id = variant.size_id
where line.slug = 'glomex-estandar'
  and size.numeric_value = 18
  and size.unit = 'pulgada'
  and presentation.name = 'Bolsa de 5 piezas'
  and presentation.active;

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
  presentation.id,
  location.id,
  500,
  0,
  5
from public.catalog_variants variant
join public.catalog_product_lines line on line.id = variant.line_id
join public.catalog_sizes size on size.id = variant.size_id
join public.catalog_sale_presentations presentation
  on presentation.variant_id = variant.id
 and presentation.name = 'Bolsa de 5 piezas'
 and presentation.active
join public.catalog_locations location on location.slug = 'sol-naciente'
where line.slug = 'glomex-estandar'
  and size.numeric_value = 18
  and size.unit = 'pulgada'
on conflict (variant_id, sale_presentation_id, location_id) do update
set quantity = excluded.quantity,
    reserved_quantity = 0,
    low_stock_threshold = excluded.low_stock_threshold,
    updated_at = now();

do $$
declare
  small_bag_count integer;
  tier_count integer;
  inventory_count integer;
  original_presentation_count integer;
begin
  select count(*)
  into small_bag_count
  from public.catalog_sale_presentations presentation
  join public.catalog_variants variant on variant.id = presentation.variant_id
  join public.catalog_product_lines line on line.id = variant.line_id
  join public.catalog_sizes size on size.id = variant.size_id
  where line.slug = 'glomex-estandar'
    and size.numeric_value = 18
    and size.unit = 'pulgada'
    and presentation.name = 'Bolsa de 5 piezas'
    and presentation.presentation_type = 'bolsa'
    and presentation.base_units_total = 5
    and presentation.base_price = 35
    and presentation.inventory_policy = 'separate_by_presentation'
    and presentation.active;

  if small_bag_count <> 17 then
    raise exception 'Expected 17 valid five-piece bags, found %',
      small_bag_count;
  end if;

  select count(*)
  into tier_count
  from public.catalog_price_tiers tier
  join public.catalog_sale_presentations presentation
    on presentation.id = tier.sale_presentation_id
  join public.catalog_variants variant on variant.id = presentation.variant_id
  join public.catalog_product_lines line on line.id = variant.line_id
  join public.catalog_sizes size on size.id = variant.size_id
  where line.slug = 'glomex-estandar'
    and size.numeric_value = 18
    and size.unit = 'pulgada'
    and presentation.name = 'Bolsa de 5 piezas'
    and tier.minimum_quantity = 5
    and tier.maximum_quantity is null
    and tier.price_per_presentation = 20
    and tier.active;

  if tier_count <> 17 then
    raise exception 'Expected 17 valid five-package tiers, found %',
      tier_count;
  end if;

  select count(*)
  into inventory_count
  from public.catalog_inventory inventory
  join public.catalog_sale_presentations presentation
    on presentation.id = inventory.sale_presentation_id
  join public.catalog_variants variant on variant.id = inventory.variant_id
  join public.catalog_product_lines line on line.id = variant.line_id
  join public.catalog_sizes size on size.id = variant.size_id
  join public.catalog_locations location on location.id = inventory.location_id
  where line.slug = 'glomex-estandar'
    and size.numeric_value = 18
    and size.unit = 'pulgada'
    and presentation.name = 'Bolsa de 5 piezas'
    and location.slug = 'sol-naciente'
    and inventory.quantity = 500
    and inventory.reserved_quantity = 0;

  if inventory_count <> 17 then
    raise exception 'Expected inventory for 17 five-piece bags, found %',
      inventory_count;
  end if;

  select count(*)
  into original_presentation_count
  from public.catalog_sale_presentations presentation
  join public.catalog_variants variant on variant.id = presentation.variant_id
  join public.catalog_product_lines line on line.id = variant.line_id
  join public.catalog_sizes size on size.id = variant.size_id
  where line.slug = 'glomex-estandar'
    and size.numeric_value = 18
    and size.unit = 'pulgada'
    and presentation.active
    and (
      (
        presentation.name = 'Bolsa de 25 piezas'
        and presentation.base_price = 100
      )
      or (
        presentation.name = 'Caja de 60 bolsas'
        and presentation.base_price = 4800
      )
    );

  if original_presentation_count <> 34 then
    raise exception 'Expected 34 preserved original presentations, found %',
      original_presentation_count;
  end if;
end
$$;

commit;
