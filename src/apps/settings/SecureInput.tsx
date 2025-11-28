import { useEffect, useMemo, useState } from 'react';

function maskApiKey(key: string): string {
  if (key.length <= 8) {
    return '***';
  }
  const first = key.slice(0, 4);
  const last = key.slice(-4);
  return `${first}***${last}`;
}

type Props = {
  id?: string;
  className?: string;
  value: string;
  onChange: (value: string) => void;
  saved: boolean;
  placeholder?: string;
};

/**
 * A secure input that masks API keys until they're edited or saved.
 *
 * Masking lifecycle:
 * - Load settings, show masked
 * - User edits, clear field and show unmasked
 * - User switches providers, the API key for the new provider is masked
 * - User switches back to 1st provider, show API key unmasked (if edited)
 * - User saves settings, mask all API keys again
 */
export function SecureInput({
  id,
  className,
  value,
  onChange,
  saved,
  placeholder,
}: Props) {
  const [edited, setEdited] = useState(false);
  const [previousValue, setPreviousValue] = useState(value);

  // Reset edited state when saved becomes true
  useEffect(() => {
    if (saved) {
      setTimeout(() => setEdited(false), 0);
    }
  }, [saved, value]);

  function handleFocus() {
    if (!edited) {
      setPreviousValue(value);
      onChange('');
    }
  }

  function handleBlur() {
    if (!edited) {
      onChange(previousValue);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEdited(true);
    onChange(e.target.value);
  }

  const displayValue = useMemo(
    () => (edited || value === '' ? value : maskApiKey(value)),
    [edited, value],
  );

  return (
    <input
      className={className}
      id={id}
      placeholder={placeholder}
      type="text"
      value={displayValue}
      onBlur={handleBlur}
      onChange={handleChange}
      onFocus={handleFocus}
    />
  );
}
