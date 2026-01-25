import classes from './MobileNav.module.scss'

type View = 'home' | 'add' | 'all' | 'calendar'

interface MobileNavProps {
  currentView: View
  onNavigate: (view: View) => void
}

export function MobileNav({ currentView, onNavigate }: MobileNavProps) {
  return (
    <nav className={classes.nav}>
      <button
        className={`${classes.item} ${currentView === 'home' ? classes.active : ''}`}
        onClick={() => onNavigate('home')}
      >
        <span className={classes.icon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9,22 9,12 15,12 15,22" />
          </svg>
        </span>
        <span className={classes.label}>Головна</span>
      </button>

      <button
        className={`${classes.item} ${currentView === 'calendar' ? classes.active : ''}`}
        onClick={() => onNavigate('calendar')}
      >
        <span className={classes.icon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
        <span className={classes.label}>Календар</span>
      </button>

      <button
        className={`${classes.item} ${classes.addItem} ${currentView === 'add' ? classes.active : ''}`}
        onClick={() => onNavigate('add')}
      >
        <span className={classes.addIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      </button>

      <button
        className={`${classes.item} ${currentView === 'all' ? classes.active : ''}`}
        onClick={() => onNavigate('all')}
      >
        <span className={classes.icon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </span>
        <span className={classes.label}>Усі</span>
      </button>
    </nav>
  )
}
