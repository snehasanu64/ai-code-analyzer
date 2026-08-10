import { useEffect, useState } from "react";
import { Search, RotateCw, Trash2 } from "lucide-react";
import api from "../../api/axios";
import { langBadge, langInitials, ACTION_LABELS } from "../../utils/languageMeta";

export default function LeftPanel({ onLoadSnippet, refreshTrigger }) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/history", { params: { search: search || undefined } });
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchHistory();
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const removeItem = async (id) => {
    await api.delete(`/history/${id}`);
    refresh();
  };

  return (
    <aside className="w-full lg:w-[300px] shrink-0 border-r border-gray-200 flex flex-col bg-white">
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-gray-900">Analysis Ledger</h2>
          <button onClick={refresh} className="text-gray-400 hover:text-primary transition-colors" title="Refresh">
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchHistory()}
            placeholder="Search reports..."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-xs outline-none focus:border-primary/40 focus:bg-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
        {loading && <p className="text-xs text-gray-400 px-2 py-6 text-center">Loading...</p>}

        {!loading &&
          (items.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-8 text-center leading-relaxed">
              No history yet.<br />Run an analysis to see it here.
            </p>
          ) : (
            items.map((item) => (
              <div key={item._id} className="group rounded-xl px-2.5 py-2.5 hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${langBadge(item.language)} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                    {langInitials(item.language)}
                  </div>
                  <button onClick={() => onLoadSnippet?.(item.analysis)} className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{ACTION_LABELS[item.action] || "Analysis Report"}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </button>
                  <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                    <button onClick={() => removeItem(item._id)} title="Delete">
                      <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ))}
      </div>
    </aside>
  );
}
