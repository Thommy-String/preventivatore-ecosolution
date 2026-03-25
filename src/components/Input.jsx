export default function Input({ type = 'text', value, onChange, placeholder, className = '' }) {
  const baseClasses = 'block w-full px-3 py-2 text-sm placeholder-gray-400 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500';

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`${baseClasses} ${className}`}
    />
  );
}
