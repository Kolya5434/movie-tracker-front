import classes from './Header.module.scss'

type View = 'home' | 'add' | 'all'

interface HeaderProps {
  currentView: View
  onNavigate: (view: View) => void
}

export function Header({ currentView, onNavigate }: HeaderProps) {
  return (
    <header className={classes.header}>
      <h1 className={classes.logo} onClick={() => onNavigate('home')}>
        <svg className={classes.logoIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2" />
          <path d="M7 2v20" />
          <path d="M2 7h5" />
          <path d="M2 12h5" />
          <path d="M2 17h5" />
          <circle cx="14.5" cy="12" r="3.5" />
          <path d="M14.5 8.5v-2" />
          <path d="M14.5 17.5v-2" />
          <path d="M11 12h-1" />
          <path d="M19 12h-1" />
        </svg>
        Watchlist
      </h1>
      <nav className={classes.nav}>
        <button
          className={`${classes.navItem} ${currentView === 'home' ? classes.active : ''}`}
          onClick={() => onNavigate('home')}
        >
          Головна
        </button>
        <button
          className={`${classes.navItem} ${currentView === 'all' ? classes.active : ''}`}
          onClick={() => onNavigate('all')}
        >
          Усі записи
        </button>
        <button
          className={`${classes.navItem} ${classes.addButton}`}
          onClick={() => onNavigate('add')}
        >
          + Додати
        </button>
      </nav>
    </header>
  )
}
