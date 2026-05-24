export default function LoadingSpinner({ fullscreen = false, size = 'md', text = '' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizes[size]} border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin`} />
      {text && <p className="text-slate-400 text-sm">{text}</p>}
    </div>
  )

  if (fullscreen) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: '#060d1f' }}
      >
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl animate-pulse">🌙</span>
          {spinner}
        </div>
      </div>
    )
  }

  return spinner
}
