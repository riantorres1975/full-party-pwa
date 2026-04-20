export default function DataTableSkeleton({ columnCount = 4, rowCount = 5 }) {
  return (
    <div className="hidden lg:block">
      <table className="w-full">
        <thead>
          <tr className="border-b border-admin-border-soft">
            {Array.from({ length: columnCount }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <div className="h-4 bg-admin-muted rounded w-3/4 animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b border-admin-border-soft">
              {Array.from({ length: columnCount }).map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-4">
                  <div className="h-4 bg-admin-muted rounded w-full animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
