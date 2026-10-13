import { useState, useEffect } from 'react';

export function useAutosaveDraft(storageKey, initialValues) {
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return initialValues;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    } catch (e) {
      console.warn('Draft save error:', e);
    }
  }, [storageKey, formData]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
  };

  return [formData, setFormData, clearDraft];
}
