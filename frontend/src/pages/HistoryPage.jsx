import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import RiskBadge from '../components/RiskBadge'
import LoadingSpinner from '../components/LoadingSpinner'

const ICONS = {
  None: '✅', Insomnia: '😴', 'Sleep Apnea': '😮‍💨',
  Narcolepsy: '💤', 'Restless Legs Syndrome': '🦵',
}

export default function HistoryPage() {
  const [data, setData]         = useState({ predictions: [], pagination: {} })
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [deleting, setDeleting] = useState(null)
  const [fetchErr, setFetchErr] = useState('')

  const load = async (p = 1) => {
    setLoading(true)
    setFetchErr('')
    try {
      const { data: res } = await api.get(`/history?page=${p}&limit=10`)
      setData(res)
    } catch (e) {
      setFetchErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(page) }, [page])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assessment record?')) return
    setDeleting(id)
    try {
      await api.delete(`/history/${id}`)
      load(page)
    } catch (e) {
      alert(e.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">

      {/* header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Assessment History</h1>
          <p className="page-subtitle">
            {data.pagination.total ?? 0} record{data.pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link to="/assessment" className="btn-primary text-sm py-2 px-5">+ New</Link>
      </div>

      {/* error */}
      {fetchErr && (
        <div className="mb-6 rounded-xl p-4 text-red-400 text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {fetchErr} — <button className="underline" onClick={() => load(page)}>Retry</button>
        </div>
      )}

      {/* loading */}
      {loading ? (
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" text="Loading history…" />
        </div>

      /* empty */
      ) : data.predictions.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <span className="text-5xl block mb-4">📋</span>
          <h2 className="text-xl font-bold text-white mb-2">No records yet</h2>
          <p className="text-slate-400 text-sm mb-6">
            Complete your first assessment to see results here.
          </p>
          <Link to="/assessment" className="btn-primary">Start Assessment</Link>
        </div>

      /* list */
      ) : (
        <>
          <div className="space-y-3">
            {data.predictions.map((pred) => (
              <div key={pred._id}
                className="glass-card p-5 flex flex-col sm:flex-row sm:items-center gap-4
                           transition-colors duration-200 hover:border-white/20">

                {/* icon + disorder */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl select-none flex-shrink-0">
                    {ICONS[pred.result?.disorder] || '🧠'}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">
                      {pred.result?.disorder || 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(pred.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {/* badges */}
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  <RiskBadge risk={pred.result?.risk} />
                  <span className="font-mono text-xs px-2.5 py-1 rounded-full"
                    style={{ background:'rgba(14,165,233,0.1)', color:'#38bdf8', border:'1px solid rgba(14,165,233,0.2)' }}>
                    {((pred.result?.confidence || 0) * 100).toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-500">
                    {pred.inputData?.sleepDuration ?? '?'}h sleep
                  </span>
                </div>

                {/* actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <Link to={`/result/${pred._id}`} className="btn-secondary text-xs py-1.5 px-3">
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(pred._id)}
                    disabled={deleting === pred._id}
                    className="btn-danger text-xs py-1.5 px-3"
                  >
                    {deleting === pred._id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* pagination */}
          {data.pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm py-2 px-4"
              >← Prev</button>
              <span className="text-sm text-slate-400">
                Page {page} of {data.pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                disabled={page === data.pagination.pages}
                className="btn-secondary text-sm py-2 px-4"
              >Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
