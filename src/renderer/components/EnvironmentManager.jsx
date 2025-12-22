import React, { useState } from 'react';

const EnvironmentManager = ({
  environments,
  activeId,
  onAdd,
  onUpdate,
  onDelete,
  onSetActive,
  globalVariables,
  onGlobalChange
}) => {
  const [newName, setNewName] = useState('');
  const [globalNewKey, setGlobalNewKey] = useState('');
  const [globalNewVal, setGlobalNewVal] = useState('');

  const addVariableRow = (env) => {
    const nextVars = [...(env.variables || []), { id: crypto.randomUUID?.() || Date.now(), key: '', value: '' }];
    onUpdate(env.id, { variables: nextVars });
  };

  const updateVariableRow = (env, rowId, field, value) => {
    const nextVars = env.variables.map((row) => (row.id === rowId ? { ...row, [field]: value } : row));
    onUpdate(env.id, { variables: nextVars });
  };

  const removeVariableRow = (env, rowId) => {
    const nextVars = env.variables.length === 1 ? env.variables : env.variables.filter((row) => row.id !== rowId);
    onUpdate(env.id, { variables: nextVars });
  };

  const updateName = (env, name) => onUpdate(env.id, { name });

  const addGlobalRow = () => {
    onGlobalChange([...(globalVariables || []), { id: crypto.randomUUID?.() || Date.now(), key: globalNewKey, value: globalNewVal }]);
    setGlobalNewKey('');
    setGlobalNewVal('');
  };

  const updateGlobalRow = (rowId, field, value) => {
    onGlobalChange((globalVariables || []).map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  };

  const removeGlobalRow = (rowId) => {
    const next = (globalVariables || []).length === 1 ? globalVariables : (globalVariables || []).filter((row) => row.id !== rowId);
    onGlobalChange(next);
  };

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">Global Variables</div>
          <div className="muted small">Available in all requests; overridden by environment values.</div>
        </div>
        <div className="row compact">
          <input
            type="text"
            placeholder="KEY"
            value={globalNewKey}
            onChange={(e) => setGlobalNewKey(e.target.value)}
          />
          <input
            type="text"
            placeholder="value"
            value={globalNewVal}
            onChange={(e) => setGlobalNewVal(e.target.value)}
          />
          <button className="ghost" type="button" onClick={addGlobalRow}>
            Add
          </button>
        </div>
      </div>

      <div className="headers-grid">
        {(globalVariables || []).map((row) => (
          <div key={row.id} className="header-row">
            <input
              type="text"
              placeholder="KEY"
              value={row.key}
              onChange={(e) => updateGlobalRow(row.id, 'key', e.target.value)}
            />
            <input
              type="text"
              placeholder="value"
              value={row.value}
              onChange={(e) => updateGlobalRow(row.id, 'value', e.target.value)}
            />
            <button className="icon-btn" type="button" onClick={() => removeGlobalRow(row.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </div>

    <div className="section">
      <div className="section-header">
        <div>
          <div className="section-title">Environments</div>
          <div className="muted small">Use <code>{'{{VAR}}'}</code> placeholders in URLs, headers, and bodies.</div>
        </div>
        <div className="row">
          <input
            type="text"
            placeholder="New environment name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button className="ghost" type="button" onClick={() => onAdd(newName) || setNewName('')}>
            Add
          </button>
        </div>
      </div>

      <div className="collections-list">
        {environments.map((env) => (
          <div key={env.id} className="collection-block">
            <div className="collection-header">
              <label className="muted">
                <input
                  type="radio"
                  name="active-environment"
                  checked={activeId === env.id}
                  onChange={() => onSetActive(env.id)}
                />{' '}
                Active
              </label>
              <button className="ghost" type="button" onClick={() => onDelete(env.id)}>
                Delete
              </button>
            </div>

            <input
              type="text"
              value={env.name}
              onChange={(e) => updateName(env, e.target.value)}
              placeholder="Environment name"
            />

            <div className="headers-grid">
              {env.variables.map((row) => (
                <div key={row.id} className="header-row">
                  <input
                    type="text"
                    placeholder="KEY"
                    value={row.key}
                    onChange={(e) => updateVariableRow(env, row.id, 'key', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="value"
                    value={row.value}
                    onChange={(e) => updateVariableRow(env, row.id, 'value', e.target.value)}
                  />
                  <button className="icon-btn" type="button" onClick={() => removeVariableRow(env, row.id)}>
                    ×
                  </button>
                </div>
              ))}
              <button className="ghost" type="button" onClick={() => addVariableRow(env)}>
                Add variable
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnvironmentManager;
