begin;

do $$
begin
  if (
    select count(*)
    from public.catalog_product_lines
    where slug = 'glomex-macarron'
  ) <> 1 then
    raise exception 'Expected exactly one glomex-macarron catalog line';
  end if;
end
$$;

delete from public.catalog_search_aliases
where target_type = 'line'
  and target_id = (
    select id
    from public.catalog_product_lines
    where slug = 'glomex-macarron'
  );

delete from public.catalog_product_images
where line_id = (
    select id
    from public.catalog_product_lines
    where slug = 'glomex-macarron'
  )
  or variant_id in (
    select id
    from public.catalog_variants
    where line_id = (
      select id
      from public.catalog_product_lines
      where slug = 'glomex-macarron'
    )
  );

-- Remove composed presentations first because the self-reference is restrictive.
delete from public.catalog_sale_presentations
where variant_id in (
    select id
    from public.catalog_variants
    where line_id = (
      select id
      from public.catalog_product_lines
      where slug = 'glomex-macarron'
    )
  )
  and contains_presentation_id is not null;

delete from public.catalog_sale_presentations
where variant_id in (
  select id
  from public.catalog_variants
  where line_id = (
    select id
    from public.catalog_product_lines
    where slug = 'glomex-macarron'
  )
);

delete from public.catalog_variants
where line_id = (
  select id
  from public.catalog_product_lines
  where slug = 'glomex-macarron'
);

delete from public.catalog_product_lines
where slug = 'glomex-macarron';

commit;
