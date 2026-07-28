export function adaptFulfillmentItems(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    variant_id: item?.variant_id ?? item?.variantId ?? null,
    sale_presentation_id:
      item?.sale_presentation_id ?? item?.salePresentationId ?? null,
    quantity: Number(item?.quantity ?? item?.cantidad_surtida) || 0,
  }));
}

export function adaptFulfillmentResult(data) {
  return {
    folio: data?.folio ?? null,
    total: Number(data?.total) || 0,
    details: Array.isArray(data?.details) ? data.details : [],
    replay: data?.replay === true,
  };
}

export function adaptCancellationResult(data) {
  return {
    folio: data?.folio ?? null,
    details: Array.isArray(data?.details) ? data.details : [],
    cancelledAt: data?.cancelled_at ?? null,
    replay: data?.replay === true,
  };
}
