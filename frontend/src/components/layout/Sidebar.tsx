import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '◉' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
  { to: '/test-labels', label: 'Test Labels', icon: '▤' },
  { to: '/print', label: 'Print Label', icon: '↑' },
]

export function Sidebar() {
  return (
    <aside className="w-56 h-screen bg-surface border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="font-mono text-lg font-bold tracking-tight">THERMALDECK</h1>
        <p className="font-mono text-xs text-text-muted mt-1">Label Printer Control</p>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 font-mono text-sm rounded transition-colors ${
                isActive
                  ? 'bg-accent text-bg'
                  : 'text-text-secondary hover:text-text-primary hover:bg-border-subtle'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <p className="font-mono text-xs text-text-muted">Intermec PC43d</p>
      </div>
    </aside>
  )
}
