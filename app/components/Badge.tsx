export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const styles: Record<string, string> = {
    default: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    danger: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  };

  return (
    <span className={'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ' + styles[variant]}>
      {children}
    </span>
  );
}
