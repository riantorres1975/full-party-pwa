-- Agregar columna para rastrear en qué estado se notificó al cliente
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS notificado_estado TEXT DEFAULT NULL;

-- Política RLS: permitir UPDATE de notificado_estado a usuarios autenticados
-- (ya existe la política general de UPDATE para authenticated, solo verifica)
