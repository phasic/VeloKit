import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { WardrobeConfig } from '../types';
import { getDefaultWardrobe } from '../utils/wardrobeUtils';

interface WardrobeManagementProps {
  onBack: () => void;
}

export function WardrobeManagement({ onBack }: WardrobeManagementProps) {
  const [wardrobes, setWardrobes] = useState<WardrobeConfig[]>(() => storage.getWardrobes());
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<string | null>(() => storage.getSelectedWardrobeId());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWardrobeName, setNewWardrobeName] = useState('');
  const [createFromDefault, setCreateFromDefault] = useState(true);

  useEffect(() => {
    // Refresh wardrobes when component mounts
    setWardrobes(storage.getWardrobes());
    setSelectedWardrobeId(storage.getSelectedWardrobeId());
  }, []);

  const handleSelectWardrobe = (id: string | null) => {
    const wardrobeId = id === 'default' ? null : id;
    setSelectedWardrobeId(wardrobeId);
    storage.setSelectedWardrobeId(wardrobeId);
  };

  const handleCreateWardrobe = () => {
    if (!newWardrobeName.trim()) {
      alert('Please enter a wardrobe name');
      return;
    }

    const defaultWardrobe = getDefaultWardrobe();
    const newWardrobe: WardrobeConfig = createFromDefault
      ? {
          ...defaultWardrobe,
          id: `wardrobe-${Date.now()}`,
          name: newWardrobeName.trim(),
          isDefault: false,
        }
      : {
          id: `wardrobe-${Date.now()}`,
          name: newWardrobeName.trim(),
          isDefault: false,
          temperatureRanges: [],
          windModifiers: [],
          rainModifiers: [],
          removableLayers: {
            maxStartTemp: 10,
            explanation: 'Start temperature is cold - consider removable layers for warming up',
          },
        };

    const updatedWardrobes = [...wardrobes, newWardrobe];
    setWardrobes(updatedWardrobes);
    storage.setWardrobes(updatedWardrobes);
    setNewWardrobeName('');
    setShowCreateModal(false);
    setCreateFromDefault(true);
  };

  const handleDeleteWardrobe = (id: string) => {
    if (!confirm('Are you sure you want to delete this wardrobe?')) {
      return;
    }

    const updatedWardrobes = wardrobes.filter(w => w.id !== id);
    setWardrobes(updatedWardrobes);
    storage.setWardrobes(updatedWardrobes);

    // If deleted wardrobe was selected, switch to default
    if (selectedWardrobeId === id) {
      handleSelectWardrobe('default');
    }
  };

  return (
    <div className="page settings" style={{ paddingBottom: '100px' }}>
      <div className="settings-header">
        <h2>Wardrobe Management</h2>
      </div>

      <div className="form-group">
        <label>Select Active Wardrobe</label>
        <select
          value={selectedWardrobeId || 'default'}
          onChange={(e) => handleSelectWardrobe(e.target.value)}
          style={{ width: '100%', padding: '12px', marginBottom: '16px' }}
        >
          <option value="default">Default Wardrobe</option>
          {wardrobes.map(wardrobe => (
            <option key={wardrobe.id} value={wardrobe.id}>{wardrobe.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{ width: '100%' }}
        >
          Create New Wardrobe
        </button>
      </div>

      {wardrobes.length > 0 && (
        <div className="form-group">
          <label>Custom Wardrobes</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {wardrobes.map(wardrobe => (
              <div
                key={wardrobe.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  border: '1px solid var(--separator-color)',
                  borderRadius: '8px',
                  backgroundColor: selectedWardrobeId === wardrobe.id ? 'var(--primary-color)' : 'transparent',
                  color: selectedWardrobeId === wardrobe.id ? 'white' : 'var(--text-color)',
                }}
              >
                <span>{wardrobe.name}</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleDeleteWardrobe(wardrobe.id)}
                  style={{ padding: '4px 12px', fontSize: '12px' }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Wardrobe</h3>
            <div className="form-group">
              <label htmlFor="wardrobeName">Wardrobe Name</label>
              <input
                id="wardrobeName"
                type="text"
                value={newWardrobeName}
                onChange={(e) => setNewWardrobeName(e.target.value)}
                placeholder="Enter wardrobe name"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={createFromDefault}
                  onChange={(e) => setCreateFromDefault(e.target.checked)}
                />
                <span>Start from default wardrobe</span>
              </label>
              <small>If unchecked, start with an empty wardrobe</small>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewWardrobeName('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateWardrobe}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="settings-sticky-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}

