-- Actualizar constraint de estados en la tabla pedidos
ALTER TABLE public.pedidos
  DROP CONSTRAINT IF EXISTS pedidos_estado_check;

ALTER TABLE public.pedidos
  ADD CONSTRAINT pedidos_estado_check
  CHECK (estado IN ('Por Surtir', 'Armando Pedido', 'Listo para Entrega'));

-- Nuevo estado inicial al crear pedidos
ALTER TABLE public.pedidos
  ALTER COLUMN estado SET DEFAULT 'Por Surtir';

-- Migrar pedidos existentes al nuevo esquema (si tienes datos previos)
UPDATE public.pedidos SET estado = 'Por Surtir'        WHERE estado = 'Realizado';
UPDATE public.pedidos SET estado = 'Armando Pedido'    WHERE estado = 'Procesando';
UPDATE public.pedidos SET estado = 'Listo para Entrega' WHERE estado = 'Listo';
