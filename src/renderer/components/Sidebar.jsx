import React, { useState } from 'react';
import HistoryPanel from './HistoryPanel';
import CollectionsPanel from './CollectionsPanel';
import BulkRunner from './BulkRunner';

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
  isBulkRunning
}) => {
  const [tab, setTab] = useState('history');

  return (
    <aside className="sidebar">
      <div className="sidebar-tabs">
        <button
          className={`ghost ${tab === 'history' ? 'active' : ''}`}
          type="button"
          onClick={() => setTab('history')}
        >
          History
        </button>
        <button
          className={`ghost ${tab === 'collections' ? 'active' : ''}`}
          type="button"
          onClick={() => setTab('collections')}
        >
          Collections
        </button>
        <button
          className={`ghost ${tab === 'bulk' ? 'active' : ''}`}
          type="button"
          onClick={() => setTab('bulk')}
        >
          Bulk
        </button>
      </div>
      {tab === 'history' ? (
        <HistoryPanel history={history} onSelect={onHistorySelect} onClear={onHistoryClear} />
      ) : tab === 'collections' ? (
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
    </aside>
  );
};

export default Sidebar;
