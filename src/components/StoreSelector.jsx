import { useState, useRef, useEffect } from 'react'
import { useData } from '../store/DataContext'

export default function StoreSelector() {
  const { stores, selectedStore, selectStore } = useData()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!selectedStore) return null

  return (
    <div className="store-selector" ref={ref}>
      <button className={`store-selector-btn ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
        <span className="store-emoji">{selectedStore.emoji}</span>
        <span>{selectedStore.name}</span>
        <span className="chevron">▼</span>
      </button>
      {open && (
        <div className="store-dropdown">
          {stores.map(store => (
            <button
              key={store.id}
              className={`store-dropdown-item ${store.id === selectedStore.id ? 'active' : ''}`}
              onClick={() => { selectStore(store.id); setOpen(false); }}
            >
              <span className="store-emoji">{store.emoji}</span>
              <span>{store.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
