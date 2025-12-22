import React, { useState } from "react";
import { History, Folder, Layers } from "lucide-react";
import HistoryPanel from "./HistoryPanel";
import CollectionsPanel from "./CollectionsPanel";
import BulkRunner from "./BulkRunner";

const Sidebar = ({
  history,
  onHistorySelect,
  onHistoryClear,
  requestDraft,
  onLoadRequestFromCollection,
  bulkQueue,
  bulkResults,
  onBulkAddCurrent,
  onBulkRun,
  onBulkClear,
  onBulkRemove,
  isBulkRunning,
}) => {
  const [tab, setTab] = useState("history");

  return (
    <aside className="sidebar">
      <div className="sidebar-tabs">
        <button
          className={`ghost ${tab === "history" ? "active" : ""}`}
          type="button"
          onClick={() => setTab("history")}
          title="History"
          style={{ display: "flex", gap: "6px", alignItems: "center" }}
        >
          <History size={16} />
          <span>History</span>
        </button>
        <button
          className={`ghost ${tab === "collections" ? "active" : ""}`}
          type="button"
          onClick={() => setTab("collections")}
          title="Collections"
          style={{ display: "flex", gap: "6px", alignItems: "center" }}
        >
          <Folder size={16} />
          <span>Collections</span>
        </button>
        <button
          className={`ghost ${tab === "bulk" ? "active" : ""}`}
          type="button"
          onClick={() => setTab("bulk")}
          title="Bulk Runner"
          style={{ display: "flex", gap: "6px", alignItems: "center" }}
        >
          <Layers size={16} />
          <span>Bulk</span>
        </button>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {tab === "history" ? (
          <HistoryPanel
            history={history}
            onSelect={onHistorySelect}
            onClear={onHistoryClear}
          />
        ) : tab === "collections" ? (
          <CollectionsPanel
            requestDraft={requestDraft}
            onLoadRequest={onLoadRequestFromCollection}
          />
        ) : (
          <BulkRunner
            queue={bulkQueue}
            results={bulkResults}
            onAddCurrent={onBulkAddCurrent}
            onRun={onBulkRun}
            onClear={onBulkClear}
            onRemove={onBulkRemove}
            isRunning={isBulkRunning}
          />
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
