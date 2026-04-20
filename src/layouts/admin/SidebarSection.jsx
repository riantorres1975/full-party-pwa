export default function SidebarSection({ label, children, collapsed }) {
  return (
    <div className="space-y-1">
      {!collapsed && (
        <p className="text-[10px] font-body font-bold text-admin-muted uppercase tracking-wider px-3 py-2">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}
