import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

const safeClone = (obj) => JSON.parse(JSON.stringify(obj));

const convertPostmanItems = (items = [], accumulator = []) => {
  items.forEach((item) => {
    if (item.item) {
      convertPostmanItems(item.item, accumulator);
    } else if (item.request) {
      const req = item.request;
      const headers =
        req.header?.map((h, idx) => ({ id: `hdr-${idx}`, key: h.key, value: h.value })) || [];
      const params =
        req.url?.query?.map((p, idx) => ({ id: `param-${idx}`, key: p.key, value: p.value })) || [];
      accumulator.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        label: item.name || req.url?.raw || 'Imported request',
        request: {
          method: req.method || 'GET',
          url: req.url?.raw || '',
          headers,
          params,
          body: req.body?.raw || '',
          bodyMode: req.body?.mode || 'raw',
          formData:
            req.body?.formdata?.map((f, idx) => ({
              id: `form-${idx}`,
              key: f.key,
              value: f.value
            })) || [],
          auth: { type: 'none' },
          preRequestScript: '',
          testScript: ''
        },
        createdAt: Date.now()
      });
    }
  });
  return accumulator;
};

const CollectionsPanel = ({ requestDraft, onLoadRequest }) => {
  const fileInputRef = useRef(null);
  const {
    collections,
    addCollection,
    addFolder,
    saveRequestToCollection,
    replaceCollections
  } = useAppStore();

  const [newCollectionName, setNewCollectionName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedCollection, setSelectedCollection] = useState(collections?.[0]?.id || '');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [label, setLabel] = useState(requestDraft?.url || 'Saved request');

  useEffect(() => {
    if (!selectedCollection && collections[0]) {
      setSelectedCollection(collections[0].id);
    }
  }, [collections, selectedCollection]);

  useEffect(() => {
    setLabel(requestDraft?.url || 'Saved request');
  }, [requestDraft]);

  const activeCollection = useMemo(
    () => collections.find((c) => c.id === selectedCollection),
    [collections, selectedCollection]
  );

  const handleCreateCollection = () => {
    if (!newCollectionName) return;
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    addCollection(newCollectionName, id);
    setSelectedCollection(id);
    setNewCollectionName('');
  };

  const handleCreateFolder = () => {
    if (!selectedCollection || !newFolderName) return;
    addFolder(selectedCollection, newFolderName);
    setNewFolderName('');
  };

  const handleSave = () => {
    if (!selectedCollection || !requestDraft) return;
    const payload = safeClone(requestDraft);
    saveRequestToCollection({
      collectionId: selectedCollection,
      folderId: selectedFolder || null,
      request: payload,
      label
    });
  };

  const handleExport = () => {
    const data = {
      version: 1,
      exportedAt: Date.now(),
      collections
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quick-api-collections-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImport = (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed?.collections && Array.isArray(parsed.collections)) {
          replaceCollections(parsed.collections);
          setSelectedCollection(parsed.collections[0]?.id || '');
          setSelectedFolder('');
        } else if (parsed?.item) {
          // Postman Collection v2.x
          const converted = convertPostmanItems(parsed.item, []);
          const colId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
          replaceCollections([
            {
              id: colId,
              name: parsed.info?.name || 'Imported Postman',
              folders: [],
              requests: converted
            }
          ]);
          setSelectedCollection(colId);
          setSelectedFolder('');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Import failed', error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="section-title">Collections</div>
          <div className="muted">
            Save requests for reuse, organized by folders. Import/Export for sharing.
          </div>
        </div>
        <div className="pill">{collections.length} collections</div>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">New Collection</div>
        </div>
        <div className="row">
          <input
            type="text"
            placeholder="Collection name"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
          />
          <button className="primary" type="button" onClick={handleCreateCollection}>
            Create
          </button>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">Save Current Request</div>
        </div>
        <label className="stacked">
          <span className="label">Collection</span>
          <select
            value={selectedCollection}
            onChange={(e) => {
              setSelectedCollection(e.target.value);
              setSelectedFolder('');
            }}
          >
            {collections.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        </label>

        <label className="stacked">
          <span className="label">Folder (optional)</span>
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            disabled={!activeCollection?.folders.length}
          >
            <option value="">— None —</option>
            {activeCollection?.folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </label>

        <div className="row">
          <input
            type="text"
            placeholder="Saved label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <button className="ghost" type="button" onClick={handleSave} disabled={!selectedCollection}>
            Save
          </button>
        </div>

        <div className="row">
          <input
            type="text"
            placeholder="New folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
          <button
            className="ghost"
            type="button"
            onClick={handleCreateFolder}
            disabled={!selectedCollection}
          >
            Add folder
          </button>
        </div>
      </div>

      <div className="collections-list">
        {collections.map((collection) => (
          <div key={collection.id} className="collection-block">
            <div className="collection-header">
              <div className="section-title">{collection.name}</div>
              <div className="muted">
                {collection.requests.length} requests · {collection.folders.length} folders
              </div>
            </div>
            {collection.requests.map((req) => (
              <button
                key={req.id}
                className="collection-item"
                type="button"
                onClick={() => onLoadRequest(req)}
              >
                <div className="pill">{req.request.method}</div>
                <div className="history-meta">
                  <div className="history-url">{req.label}</div>
                  <div className="muted">{req.request.url}</div>
                </div>
              </button>
            ))}

            {collection.folders.map((folder) => (
              <div key={folder.id} className="folder-block">
                <div className="muted">{folder.name}</div>
                {folder.requests.map((req) => (
                  <button
                    key={req.id}
                    className="collection-item"
                    type="button"
                    onClick={() => onLoadRequest(req)}
                  >
                    <div className="pill">{req.request.method}</div>
                    <div className="history-meta">
                      <div className="history-url">{req.label}</div>
                      <div className="muted">{req.request.url}</div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-title">Import / Export</div>
        </div>
        <div className="row">
          <button className="ghost" type="button" onClick={handleImportClick}>
            Import JSON
          </button>
          <button className="ghost" type="button" onClick={handleExport} disabled={!collections.length}>
            Export JSON
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
      </div>
    </div>
  );
};

export default CollectionsPanel;
