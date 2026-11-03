import { Check, ChevronDown, Globe, MapPin } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

/**
 * Location picker for the hero search bar. A styled listbox instead of a
 * native <select>, whose opened list can't be styled consistently.
 * value '' means "All Locations".
 */
export default function LocationSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const buttonRef = useRef(null);
  const listId = useId();

  const items = [{ value: '', label: 'All Locations' }, ...options.map((name) => ({ value: name, label: name }))];
  const selectedIndex = Math.max(0, items.findIndex((item) => item.value === value));

  const openList = () => {
    setActiveIndex(selectedIndex);
    setOpen(true);
  };

  const choose = (index) => {
    onChange(items[index].value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  // Close on outside click.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Move focus into the list when it opens, and keep the active option in view.
  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const onButtonKeyDown = (event) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      openList();
    }
  };

  const onListKeyDown = (event) => {
    const last = items.length - 1;
    const moves = { ArrowDown: Math.min(activeIndex + 1, last), ArrowUp: Math.max(activeIndex - 1, 0), Home: 0, End: last };
    if (event.key in moves) {
      event.preventDefault();
      setActiveIndex(moves[event.key]);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choose(activeIndex);
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      setOpen(false);
      if (event.key === 'Escape') buttonRef.current?.focus();
    }
  };

  return (
    <div className={`search-location ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        ref={buttonRef}
        className="location-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Location: ${items[selectedIndex].label}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onButtonKeyDown}
      >
        <MapPin className="location-trigger-icon" aria-hidden="true" />
        <span className="location-value">{items[selectedIndex].label}</span>
        <ChevronDown className="location-caret" aria-hidden="true" />
      </button>

      {open && (
        <div className="location-panel">
          <p className="location-panel-title">Choose a division</p>
          <ul
            id={listId}
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            aria-label="Locations"
            aria-activedescendant={`${listId}-${activeIndex}`}
            onKeyDown={onListKeyDown}
          >
            {items.map((item, index) => {
              const selected = index === selectedIndex;
              const Icon = item.value ? MapPin : Globe;
              return (
                <li
                  key={item.label}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={selected}
                  className={`location-option ${index === activeIndex ? 'is-active' : ''} ${selected ? 'is-selected' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(index)}
                >
                  <span className="location-option-icon"><Icon aria-hidden="true" /></span>
                  <span className="location-option-text">
                    {item.label}
                    {!item.value && <small>Search the whole country</small>}
                  </span>
                  {selected && <Check className="location-check" aria-hidden="true" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
