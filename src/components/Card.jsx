export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
