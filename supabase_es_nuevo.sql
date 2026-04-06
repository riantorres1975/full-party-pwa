-- Agrega etiqueta de "Nuevo" a productos
ALTER TABLE public.productos
ADD COLUMN IF NOT EXISTS es_nuevo BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_productos_es_nuevo ON public.productos (es_nuevo);
