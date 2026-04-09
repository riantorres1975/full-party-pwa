import { useState, useCallback } from 'react';

export function useConfirm() {
  const [state, setState] = useState({ open: false, config: {}, resolve: null });

  const confirm = useCallback((config = {}) => {
    return new Promise((resolve) => {
      setState({ open: true, config, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState({ open: false, config: {}, resolve: null });
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState({ open: false, config: {}, resolve: null });
  }, [state.resolve]);

  return {
    isOpen: state.open,
    config: state.config,
    confirm,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  };
}
