export default function EmptyState({ icon = '📄', title, description, children }) {
  return (
    <div className="text-center py-14 px-4">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-gray-800 font-semibold">{title}</h3>
      {description && (
        <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
