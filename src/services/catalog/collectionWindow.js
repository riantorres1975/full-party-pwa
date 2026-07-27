function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Las fechas de coleccion son inclusivas durante todo el dia local. */
export function isCollectionCurrent(collection, now = new Date()) {
  const today = localDateKey(now);
  const starts = collection?.start_date?.slice(0, 10) ?? null;
  const ends = collection?.end_date?.slice(0, 10) ?? null;
  if (starts && today < starts) return false;
  if (ends && today > ends) return false;
  return true;
}
