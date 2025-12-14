import { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import { recommendClothing } from '../logic/clothingEngine';
import { WeatherSummary, RideConfig, ClothingItem, WardrobeConfig, TemperatureRange, WindModifier, RainModifier, ClothingItems } from '../types';
import { storage } from '../utils/storage';
import { getDefaultWardrobe, getActiveWardrobe } from '../utils/wardrobeUtils';
import './ClothingGuide.css';

interface GuideProps {
  onBack?: () => void;
}

export function ClothingGuide({}: GuideProps) {
  const [units, setUnits] = useState<'metric' | 'imperial'>(storage.getUnits());
  const [wardrobes, setWardrobes] = useState<WardrobeConfig[]>(() => storage.getWardrobes());
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<string | null>(() => storage.getSelectedWardrobeId());
  const [showMenu, setShowMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddClothingModal, setShowAddClothingModal] = useState(false);
  const [showAddFirstClothingModal, setShowAddFirstClothingModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteItemConfirm, setShowDeleteItemConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ name: string; bodyPart: 'head' | 'neckFace' | 'chest' | 'legs' | 'hands' | 'feet' } | null>(null);
  const [addClothingError, setAddClothingError] = useState<string>('');
  const [editItemError, setEditItemError] = useState<string>('');
  const [newClothingName, setNewClothingName] = useState('');
  const [newClothingBodyPart, setNewClothingBodyPart] = useState<'head' | 'neckFace' | 'chest' | 'legs' | 'hands' | 'feet'>('chest');
  const [newClothingType, setNewClothingType] = useState<'temp' | 'wind' | 'rain'>('temp');
  const [newClothingMinTemp, setNewClothingMinTemp] = useState<string>('');
  const [newClothingMaxTemp, setNewClothingMaxTemp] = useState<string>('');
  const [newClothingMinWind, setNewClothingMinWind] = useState<string>('');
  const [newClothingMinRain, setNewClothingMinRain] = useState<string>('');
  const [newClothingMaxRain, setNewClothingMaxRain] = useState<string>('');
  const [newClothingMaxTempRain, setNewClothingMaxTempRain] = useState<string>('');
  const [showWardrobeSwitcher, setShowWardrobeSwitcher] = useState(false);
  const [switcherPosition, setSwitcherPosition] = useState<{ top: number; right: number } | null>(null);
  const [newWardrobeName, setNewWardrobeName] = useState('');
  const [createFromScratch, setCreateFromScratch] = useState(false);
  const [baseWardrobeId, setBaseWardrobeId] = useState<string>('default');
  const [isEditMode, setIsEditMode] = useState(false);
  const [wardrobeSnapshot, setWardrobeSnapshot] = useState<WardrobeConfig[] | null>(null);
  const [editingItem, setEditingItem] = useState<{
    item: string;
    bodyPart: 'head' | 'neckFace' | 'chest' | 'legs' | 'hands' | 'feet';
    type: 'temp' | 'wind' | 'rain';
    rangeIndex?: number;
    modifierIndex?: number;
  } | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemBodyPart, setEditItemBodyPart] = useState<'head' | 'neckFace' | 'chest' | 'legs' | 'hands' | 'feet'>('chest');
  const [editItemType, setEditItemType] = useState<'temp' | 'wind' | 'rain'>('temp');
  const [editItemMinTemp, setEditItemMinTemp] = useState<string>('');
  const [editItemMaxTemp, setEditItemMaxTemp] = useState<string>('');
  const [editItemMinWind, setEditItemMinWind] = useState<string>('');
  const [editItemMinRain, setEditItemMinRain] = useState<string>('');
  const [editItemMaxRain, setEditItemMaxRain] = useState<string>('');
  const [editItemMaxTempRain, setEditItemMaxTempRain] = useState<string>('');
  const menuRef = useRef<HTMLDivElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);
  const wardrobeCardRef = useRef<HTMLDivElement>(null);
  const [openSections, setOpenSections] = useState<{
    uniqueItems: boolean;
    temperature: boolean;
    wind: boolean;
    rain: boolean;
  }>({
    uniqueItems: false,
    temperature: false,
    wind: false,
    rain: false,
  });

  // Get current wardrobe
  const currentWardrobe = useMemo(() => {
    return getActiveWardrobe(wardrobes, selectedWardrobeId);
  }, [wardrobes, selectedWardrobeId]);

  // Check if default wardrobe is selected - use the wardrobe object's isDefault property
  // This is the most reliable way since the default wardrobe from clothingConfig.json has isDefault: true
  const isDefaultWardrobe = currentWardrobe.isDefault || !selectedWardrobeId || selectedWardrobeId === 'default' || selectedWardrobeId === '';

  // Check if there are multiple wardrobes
  const hasMultipleWardrobes = wardrobes.length > 0;

  // Function to count unique clothing items in a wardrobe
  const countWardrobeItems = (wardrobe: WardrobeConfig): number => {
    const items = new Set<string>();
    
    const addItems = (clothingItems?: ClothingItem[]) => {
      if (!clothingItems) return;
      clothingItems.forEach(item => {
        if (typeof item === 'string') {
          items.add(item);
        } else if (typeof item === 'object' && item !== null && 'options' in item) {
          item.options.forEach(option => {
            option.forEach(optItem => items.add(optItem));
          });
        }
      });
    };

    // Count from temperature ranges
    wardrobe.temperatureRanges.forEach(range => {
      addItems(range.items.head);
      addItems(range.items.neckFace);
      addItems(range.items.chest);
      addItems(range.items.legs);
      addItems(range.items.hands);
      addItems(range.items.feet);
    });

    // Count from wind modifiers
    wardrobe.windModifiers.forEach(modifier => {
      addItems(modifier.items.head);
      addItems(modifier.items.neckFace);
      addItems(modifier.items.chest);
      addItems(modifier.items.legs);
      addItems(modifier.items.hands);
      addItems(modifier.items.feet);
    });

    // Count from rain modifiers
    wardrobe.rainModifiers.forEach(modifier => {
      addItems(modifier.items.head);
      addItems(modifier.items.neckFace);
      addItems(modifier.items.chest);
      addItems(modifier.items.legs);
      addItems(modifier.items.hands);
      addItems(modifier.items.feet);
    });

    return items.size;
  };

  // Get all wardrobes with item counts
  const allWardrobesWithCounts = useMemo(() => {
    const defaultWardrobe = getDefaultWardrobe();
    const defaultCount = countWardrobeItems(defaultWardrobe);
    
    const result = [
      {
        id: 'default',
        name: defaultWardrobe.name,
        isDefault: true,
        itemCount: defaultCount,
      },
      ...wardrobes.map(w => ({
        id: w.id,
        name: w.name,
        isDefault: false,
        itemCount: countWardrobeItems(w),
      })),
    ];
    
    return result;
  }, [wardrobes]);

  // Helper to check if a range/modifier has any items
  const hasAnyItems = (items: ClothingItems): boolean => {
    const bodyParts: Array<'head' | 'neckFace' | 'chest' | 'legs' | 'hands' | 'feet'> = 
      ['head', 'neckFace', 'chest', 'legs', 'hands', 'feet'];
    for (const part of bodyParts) {
      const partItems = items[part] || [];
      if (partItems.length > 0) {
        // Check if any item has actual content
        for (const item of partItems) {
          if (typeof item === 'string' && item.trim()) {
            return true;
          } else if (typeof item === 'object' && item !== null && 'options' in item) {
            for (const option of item.options) {
              if (option.length > 0 && option.some((opt: string) => opt.trim())) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  };

  // Check if wardrobe is empty
  const isWardrobeEmpty = useMemo(() => {
    if (isDefaultWardrobe) return false; // Default wardrobe is never empty
    
    // Check if any temperature range has items
    const hasTempItems = currentWardrobe.temperatureRanges.some(range => hasAnyItems(range.items));
    
    // Check if any wind modifier has items
    const hasWindItems = currentWardrobe.windModifiers.some(modifier => hasAnyItems(modifier.items));
    
    // Check if any rain modifier has items
    const hasRainItems = currentWardrobe.rainModifiers.some(modifier => hasAnyItems(modifier.items));
    
    return !hasTempItems && !hasWindItems && !hasRainItems;
  }, [currentWardrobe, isDefaultWardrobe]);

  // Update units when global settings change
  useEffect(() => {
    setUnits(storage.getUnits());
  }, []);

  // Refresh wardrobes when component mounts
  useEffect(() => {
    setWardrobes(storage.getWardrobes());
    setSelectedWardrobeId(storage.getSelectedWardrobeId());
  }, []);

  // Listen for edit mode toggle
  useEffect(() => {
    const handleToggleEdit = () => {
      if (!isDefaultWardrobe) {
        setIsEditMode(prev => {
          const newMode = !prev;
          // Dispatch edit mode change to App component
          window.dispatchEvent(new CustomEvent('wardrobeEditModeChanged', { detail: newMode }));
          if (newMode) {
            // Entering edit mode - save snapshot of current wardrobe state
            // Deep clone to ensure we have an independent copy
            const snapshot = JSON.parse(JSON.stringify(wardrobes));
            setWardrobeSnapshot(snapshot);
          } else {
            // Exiting edit mode via toggle (shouldn't normally happen - use save/discard buttons instead)
            // But if it does, don't clear snapshot here - let save/discard handlers do it
            setEditingItem(null);
            setEditItemError('');
          }
          return newMode;
        });
      }
    };

    window.addEventListener('toggleWardrobeEdit', handleToggleEdit);
    return () => window.removeEventListener('toggleWardrobeEdit', handleToggleEdit);
  }, [isDefaultWardrobe, wardrobes]);

  // Listen for save/discard events from App component
  useEffect(() => {
    const handleSaveChanges = () => {
      // Save all current changes to storage and exit edit mode
      // The wardrobe state already has all the changes made during edit mode
      if (wardrobes) {
        storage.setWardrobes(wardrobes);
      }
      // Clear snapshot and exit edit mode
      setIsEditMode(false);
      setWardrobeSnapshot(null);
      setEditingItem(null);
      setEditItemError('');
      window.dispatchEvent(new CustomEvent('wardrobeEditModeChanged', { detail: false }));
    };

    const handleDiscardChanges = () => {
      // Restore wardrobe from snapshot to discard all changes made during edit mode
      if (wardrobeSnapshot) {
        // Deep clone the snapshot to ensure we get a fresh reference
        setWardrobes(JSON.parse(JSON.stringify(wardrobeSnapshot)));
      } else {
        // Fallback: reload from storage if no snapshot (shouldn't happen)
        setWardrobes(storage.getWardrobes());
      }
      // Clear snapshot and exit edit mode
      setIsEditMode(false);
      setWardrobeSnapshot(null);
      setEditingItem(null);
      setEditItemError('');
      window.dispatchEvent(new CustomEvent('wardrobeEditModeChanged', { detail: false }));
    };

    window.addEventListener('saveWardrobeChanges', handleSaveChanges);
    window.addEventListener('discardWardrobeChanges', handleDiscardChanges);
    
    return () => {
      window.removeEventListener('saveWardrobeChanges', handleSaveChanges);
      window.removeEventListener('discardWardrobeChanges', handleDiscardChanges);
    };
  }, [wardrobes, wardrobeSnapshot]);

  // Listen for add clothing button click
  useEffect(() => {
    const handleOpenAddClothing = () => {
      if (!isDefaultWardrobe) {
        setShowAddFirstClothingModal(true);
      }
    };

    window.addEventListener('openAddClothing', handleOpenAddClothing);
    return () => window.removeEventListener('openAddClothing', handleOpenAddClothing);
  }, [isDefaultWardrobe]);

  // Calculate dropdown position when switcher opens
  useEffect(() => {
    if (showWardrobeSwitcher && wardrobeCardRef.current) {
      const rect = wardrobeCardRef.current.getBoundingClientRect();
      setSwitcherPosition({
        top: rect.top,
        right: window.innerWidth - rect.right,
      });
    } else {
      setSwitcherPosition(null);
    }
  }, [showWardrobeSwitcher]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setShowMenu(false);
      }
      // Check if click is outside both the card and the dropdown
      const dropdown = document.querySelector('.wardrobe-switcher-dropdown');
      const isOutsideCard = wardrobeCardRef.current && !wardrobeCardRef.current.contains(target);
      const isOutsideDropdown = !dropdown || !dropdown.contains(target);
      if (isOutsideCard && isOutsideDropdown) {
        setShowWardrobeSwitcher(false);
      }
    };

    if (showMenu || showWardrobeSwitcher) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu, showWardrobeSwitcher]);

  const handleSelectWardrobe = (id: string | null) => {
    const wardrobeId = id === 'default' ? null : id;
    
    // If switching wardrobes while in edit mode, save changes first, then exit edit mode
    if (isEditMode && selectedWardrobeId !== wardrobeId) {
      // Save current changes before switching
      if (wardrobes) {
        storage.setWardrobes(wardrobes);
      }
      setIsEditMode(false);
      setWardrobeSnapshot(null);
      setEditingItem(null);
      setEditItemError('');
      window.dispatchEvent(new CustomEvent('wardrobeEditModeChanged', { detail: false }));
    }
    
    setSelectedWardrobeId(wardrobeId);
    storage.setSelectedWardrobeId(wardrobeId);
    setShowWardrobeSwitcher(false);
    // Dispatch event to notify App component
    window.dispatchEvent(new CustomEvent('wardrobeChanged'));
  };

  const handleAddFirstClothing = () => {
    setAddClothingError('');
    
    if (!newClothingName.trim()) {
      setAddClothingError('Please enter a clothing item name');
      return;
    }

    if (!selectedWardrobeId || isDefaultWardrobe) return;

    const wardrobeIndex = wardrobes.findIndex(w => w.id === selectedWardrobeId);
    if (wardrobeIndex === -1) return;

    const wardrobe = wardrobes[wardrobeIndex];
    const newWardrobe: WardrobeConfig = { ...wardrobe };
    const clothingItem: ClothingItem = newClothingName.trim();

    if (newClothingType === 'temp') {
      // Validate that at least one temperature field is provided
      if (!newClothingMinTemp.trim() && !newClothingMaxTemp.trim()) {
        setAddClothingError('Please enter at least one temperature (minimum or maximum)');
        return;
      }
      
      const minTemp = newClothingMinTemp ? parseFloat(newClothingMinTemp) : null;
      const maxTemp = newClothingMaxTemp ? parseFloat(newClothingMaxTemp) : undefined;

      // Find existing temperature range or create new one
      const existingRange = newWardrobe.temperatureRanges.find(
        range => range.minTemp === minTemp && range.maxTemp === maxTemp
      );

      if (existingRange) {
        // Add to existing range
        if (!existingRange.items[newClothingBodyPart]) {
          existingRange.items[newClothingBodyPart] = [];
        }
        existingRange.items[newClothingBodyPart]!.push(clothingItem);
      } else {
        // Create new range
        const newRange: TemperatureRange = {
          minTemp,
          maxTemp,
          items: {
            [newClothingBodyPart]: [clothingItem],
          },
          explanation: `Custom temperature range`,
        };
        newWardrobe.temperatureRanges.push(newRange);
      }
    } else if (newClothingType === 'wind') {
      const minWindSpeed = parseFloat(newClothingMinWind);
      if (isNaN(minWindSpeed)) {
        setAddClothingError('Please enter a valid wind speed');
        return;
      }

      // Find existing wind modifier or create new one
      const existingModifier = newWardrobe.windModifiers.find(
        mod => mod.minWindSpeed === minWindSpeed
      );

      if (existingModifier) {
        // Add to existing modifier
        if (!existingModifier.items[newClothingBodyPart]) {
          existingModifier.items[newClothingBodyPart] = [];
        }
        existingModifier.items[newClothingBodyPart]!.push(clothingItem);
      } else {
        // Create new modifier
        const newModifier: WindModifier = {
          minWindSpeed,
          items: {
            [newClothingBodyPart]: [clothingItem],
          },
          explanation: `Wind protection for ${minWindSpeed}+ km/h`,
        };
        newWardrobe.windModifiers.push(newModifier);
      }
    } else if (newClothingType === 'rain') {
      const minRainProbability = parseFloat(newClothingMinRain);
      if (isNaN(minRainProbability)) {
        setAddClothingError('Please enter a valid rain probability');
        return;
      }
      const maxRainProbability = newClothingMaxRain ? parseFloat(newClothingMaxRain) : undefined;
      const maxTemp = newClothingMaxTempRain ? parseFloat(newClothingMaxTempRain) : undefined;

      // Find existing rain modifier or create new one
      const existingModifier = newWardrobe.rainModifiers.find(
        mod => mod.minRainProbability === minRainProbability &&
               mod.maxRainProbability === maxRainProbability &&
               mod.maxTemp === maxTemp
      );

      if (existingModifier) {
        // Add to existing modifier
        if (!existingModifier.items[newClothingBodyPart]) {
          existingModifier.items[newClothingBodyPart] = [];
        }
        existingModifier.items[newClothingBodyPart]!.push(clothingItem);
      } else {
        // Create new modifier
        const newModifier: RainModifier = {
          minRainProbability,
          maxRainProbability,
          maxTemp,
          items: {
            [newClothingBodyPart]: [clothingItem],
          },
          explanation: `Rain protection`,
        };
        newWardrobe.rainModifiers.push(newModifier);
      }
    }

    const updatedWardrobes = [...wardrobes];
    updatedWardrobes[wardrobeIndex] = newWardrobe;
    setWardrobes(updatedWardrobes);
    // Only save to storage if not in edit mode (changes are saved when exiting edit mode)
    if (!isEditMode) {
      storage.setWardrobes(updatedWardrobes);
    }
    
    // Reset form
    setNewClothingName('');
    setNewClothingBodyPart('chest');
    setNewClothingType('temp');
    setNewClothingMinTemp('');
    setNewClothingMaxTemp('');
    setNewClothingMinWind('');
    setNewClothingMinRain('');
    setNewClothingMaxRain('');
    setNewClothingMaxTempRain('');
    setAddClothingError('');
    setShowAddFirstClothingModal(false);
  };

  const handleCreateWardrobe = () => {
    if (!newWardrobeName.trim()) {
      alert('Please enter a wardrobe name');
      return;
    }

    let baseWardrobe: WardrobeConfig;
    if (createFromScratch) {
      baseWardrobe = {
        id: '',
        name: '',
        isDefault: false,
        temperatureRanges: [],
        windModifiers: [],
        rainModifiers: [],
        removableLayers: {
          maxStartTemp: 10,
          explanation: 'Start temperature is cold - consider removable layers for warming up',
        },
      };
    } else {
      baseWardrobe = baseWardrobeId === 'default' 
        ? getDefaultWardrobe()
        : wardrobes.find(w => w.id === baseWardrobeId) || getDefaultWardrobe();
    }

    const newWardrobe: WardrobeConfig = {
      ...baseWardrobe,
      id: `wardrobe-${Date.now()}`,
      name: newWardrobeName.trim(),
      isDefault: false,
    };

    const updatedWardrobes = [...wardrobes, newWardrobe];
    setWardrobes(updatedWardrobes);
    storage.setWardrobes(updatedWardrobes);
    setSelectedWardrobeId(newWardrobe.id);
    storage.setSelectedWardrobeId(newWardrobe.id);
    setNewWardrobeName('');
    setShowCreateModal(false);
    setCreateFromScratch(false);
    setBaseWardrobeId('default');
  };

  const handleDeleteWardrobe = () => {
    if (!selectedWardrobeId || isDefaultWardrobe) return;
    
    const updatedWardrobes = wardrobes.filter(w => w.id !== selectedWardrobeId);
    setWardrobes(updatedWardrobes);
    storage.setWardrobes(updatedWardrobes);
    setSelectedWardrobeId(null);
    storage.setSelectedWardrobeId(null);
    setShowDeleteConfirm(false);
    setShowMenu(false);
  };

  const toggleSection = (section: 'uniqueItems' | 'temperature' | 'wind' | 'rain') => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Generate scenarios for temperature variations based on wardrobe ranges
  const generateTemperatureScenarios = () => {
    const scenarios: Array<{
      minTemp: number;
      maxTemp: number;
      temp: number; // For backward compatibility
      wind: number;
      rain: number;
      weather: WeatherSummary;
      config: RideConfig;
      applicableRanges?: TemperatureRange[]; // Track which ranges apply to this scenario
    }> = [];

    // If no ranges exist, return empty array - always base ranges on wardrobe items
    if (currentWardrobe.temperatureRanges.length === 0) {
      return scenarios;
    }

    // Collect all unique temperature breakpoints ONLY from ranges that have items
    const tempBreakpoints = new Set<number>();
    
    // First, filter ranges to only those that have items
    const rangesWithItems = currentWardrobe.temperatureRanges.filter(range => {
      const bodyParts: Array<'head' | 'neckFace' | 'chest' | 'legs' | 'hands' | 'feet'> = 
        ['head', 'neckFace', 'chest', 'legs', 'hands', 'feet'];
      for (const part of bodyParts) {
        const partItems = range.items[part] || [];
        if (partItems.length > 0) {
          for (const item of partItems) {
            if (typeof item === 'string' && item.trim()) {
              return true;
            } else if (typeof item === 'object' && item !== null && 'options' in item) {
              for (const option of item.options) {
                if (option.length > 0 && option.some((opt: string) => opt.trim())) {
                  return true;
                }
              }
            }
          }
        }
      }
      return false;
    });
    
    // Early return if no ranges have items
    if (rangesWithItems.length === 0) {
      return scenarios;
    }
    
    // Only collect breakpoints from ranges that have items
    rangesWithItems.forEach(range => {
      // Add minTemp if it exists (null means no lower bound)
      if (range.minTemp !== null && range.minTemp !== undefined) {
        tempBreakpoints.add(range.minTemp);
      }
      // Add maxTemp if it exists (null/undefined means no upper bound)
      if (range.maxTemp !== null && range.maxTemp !== undefined) {
        tempBreakpoints.add(range.maxTemp);
      }
    });

    // Sort breakpoints descending (hot to cold)
    const sortedBreakpoints = Array.from(tempBreakpoints).sort((a, b) => b - a);

    // Check if there are ranges with only minTemp (no maxTemp)
    // A range has only minTemp if minTemp exists and maxTemp is null or undefined
    const rangesWithOnlyMinTemp = rangesWithItems.filter(range => {
      const hasMinTemp = range.minTemp !== null && range.minTemp !== undefined;
      const hasNoMaxTemp = range.maxTemp === null || range.maxTemp === undefined;
      return hasMinTemp && hasNoMaxTemp;
    });
    
    // Check if there are ranges with only maxTemp (no minTemp)
    const rangesWithOnlyMaxTemp = rangesWithItems.filter(range => 
      (range.minTemp === null || range.minTemp === undefined) && 
      range.maxTemp !== null && 
      range.maxTemp !== undefined
    );

    // Create segments between consecutive breakpoints
    // Each segment represents a temperature range where a specific set of clothing ranges apply
    for (let i = 0; i < sortedBreakpoints.length; i++) {
      const segmentMaxTemp = sortedBreakpoints[i];
      // The minTemp of a segment is the next breakpoint (or extend below if it's the last one)
      const segmentMinTemp = i < sortedBreakpoints.length - 1 
        ? sortedBreakpoints[i + 1] // Use the next breakpoint as the lower bound
        : sortedBreakpoints[sortedBreakpoints.length - 1] - 10; // Extend 10°C below the coldest breakpoint if last segment
      
      // Only create segment if it has a meaningful range
      if (segmentMaxTemp > segmentMinTemp) {
        // Use a representative temperature in the middle of the segment
        // Add small offset to ensure it's above any minTemp boundary (matching uses temp > minTemp)
        const representativeTemp = Math.max(segmentMinTemp + 0.1, (segmentMinTemp + segmentMaxTemp) / 2);
        
        // Check which ranges apply to this segment by testing if the representative temp matches
        // Only check ranges that have items
        const applicableRanges = rangesWithItems.filter(range => {
          // Use the same matching logic as clothingEngine
          const minMatch = range.minTemp === null || representativeTemp > range.minTemp;
          const maxMatch = range.maxTemp === null || range.maxTemp === undefined || representativeTemp <= range.maxTemp;
          return minMatch && maxMatch;
        });
        
        // Only create scenario if at least one range applies (they all have items by definition)
        if (applicableRanges.length > 0) {
          const weather: WeatherSummary = {
            minTemp: representativeTemp,
            maxTemp: representativeTemp + 1,
            minFeelsLike: representativeTemp,
            maxFeelsLike: representativeTemp + 1,
            maxWindSpeed: 10, // Low wind
            maxRainProbability: 0, // No rain
            maxPrecipitationIntensity: 0,
          };

          const config: RideConfig = {
            startTime: new Date(),
            durationHours: 2,
            units,
          };

          scenarios.push({ 
            minTemp: segmentMinTemp, // Use exact breakpoint value from wardrobe (already in metric)
            maxTemp: segmentMaxTemp, // Use exact breakpoint value from wardrobe (already in metric)
            temp: Math.round(representativeTemp), 
            wind: 10, 
            rain: 0, 
            weather, 
            config,
            applicableRanges // Store which ranges apply to this scenario
          });
        }
      }
      
      // Special handling: if this is the highest breakpoint and there are ranges with only minTemp
      // that match temperatures above this breakpoint, we need to create a scenario above it
      if (i === 0) { // This is the highest (first) breakpoint
        const rangesAboveBreakpoint = rangesWithOnlyMinTemp.filter(range => 
          range.minTemp !== null && 
          range.minTemp !== undefined && 
          range.minTemp <= segmentMaxTemp // Range starts at or below this breakpoint
        );
        
        if (rangesAboveBreakpoint.length > 0) {
          // Create a scenario above the highest breakpoint
          const representativeTemp = segmentMaxTemp + 5; // 5°C above the breakpoint
          
          // Check if we already have a scenario that would show these ranges
          const rangesAlreadyShown = scenarios.some(scenario => {
            const scenarioTemp = scenario.weather.minFeelsLike;
            return rangesAboveBreakpoint.some(range => {
              const minMatch = range.minTemp === null || scenarioTemp > range.minTemp;
              const maxMatch = range.maxTemp === null || range.maxTemp === undefined || scenarioTemp <= range.maxTemp;
              return minMatch && maxMatch;
            });
          });
          
          if (!rangesAlreadyShown) {
            const weather: WeatherSummary = {
              minTemp: representativeTemp,
              maxTemp: representativeTemp + 1,
              minFeelsLike: representativeTemp,
              maxFeelsLike: representativeTemp + 1,
              maxWindSpeed: 10,
              maxRainProbability: 0,
              maxPrecipitationIntensity: 0,
            };

            const config: RideConfig = {
              startTime: new Date(),
              durationHours: 2,
              units,
            };

            scenarios.push({ 
              minTemp: segmentMaxTemp, 
              maxTemp: segmentMaxTemp + 20, // Extend 20°C above for display
              temp: Math.round(representativeTemp), 
              wind: 10, 
              rain: 0, 
              weather, 
              config,
              applicableRanges: rangesAboveBreakpoint
            });
          }
        }
      }
    }

    // Handle ranges with only minTemp (no maxTemp) - create scenarios above their minTemp
    // These ranges match any temperature > minTemp, so we need to ensure scenarios are created
    rangesWithOnlyMinTemp.forEach(range => {
      if (range.minTemp === null || range.minTemp === undefined) return;
      
      // Create a scenario at a temperature above the minTemp
      // Use minTemp + 5°C as representative to ensure it's clearly above the boundary
      const representativeTemp = range.minTemp + 5;
      
      // Check if we already have a scenario that would show this range's items
      // We need to check if any existing scenario's applicableRanges includes this range,
      // OR if the scenario temp matches the range
      const rangeAlreadyShown = scenarios.some(scenario => {
        // First check if this range is already in the scenario's applicableRanges
        if (scenario.applicableRanges && scenario.applicableRanges.some(r => 
          r.minTemp === range.minTemp && 
          (r.maxTemp === range.maxTemp || (r.maxTemp === null && range.maxTemp === null) || (r.maxTemp === undefined && range.maxTemp === undefined))
        )) {
          return true;
        }
        // Also check if the scenario temp would match this range
        const scenarioTemp = scenario.weather.minFeelsLike;
        const minMatch = range.minTemp === null || scenarioTemp > range.minTemp;
        const maxMatch = range.maxTemp === null || range.maxTemp === undefined || scenarioTemp <= range.maxTemp;
        return minMatch && maxMatch;
      });
      
      if (!rangeAlreadyShown) {
        const weather: WeatherSummary = {
          minTemp: representativeTemp,
          maxTemp: representativeTemp + 1,
          minFeelsLike: representativeTemp,
          maxFeelsLike: representativeTemp + 1,
          maxWindSpeed: 10, // Low wind
          maxRainProbability: 0, // No rain
          maxPrecipitationIntensity: 0,
        };

        const config: RideConfig = {
          startTime: new Date(),
          durationHours: 2,
          units,
        };

        scenarios.push({ 
          minTemp: range.minTemp, 
          maxTemp: range.minTemp + 20, // Extend 20°C above for display purposes
          temp: Math.round(representativeTemp), 
          wind: 10, 
          rain: 0, 
          weather, 
          config,
          applicableRanges: [range] // Store the range that applies
        });
      }
    });

    // Handle ranges with only maxTemp (no minTemp) - create scenarios below their maxTemp
    rangesWithOnlyMaxTemp.forEach(range => {
      if (range.maxTemp === null || range.maxTemp === undefined) return;
      
      // Create a scenario at a temperature below the maxTemp
      // Use maxTemp - 5°C as representative to ensure it's clearly below the boundary
      const representativeTemp = range.maxTemp - 5;
      
      // Check if we already have a scenario that would show this range's items
      const rangeAlreadyShown = scenarios.some(scenario => {
        const scenarioTemp = scenario.weather.minFeelsLike;
        const minMatch = range.minTemp === null || range.minTemp === undefined || scenarioTemp > range.minTemp;
        const maxMatch = range.maxTemp === null || range.maxTemp === undefined || scenarioTemp <= range.maxTemp;
        return minMatch && maxMatch;
      });
      
      if (!rangeAlreadyShown && representativeTemp > -50) { // Don't create scenarios below -50°C
        const weather: WeatherSummary = {
          minTemp: representativeTemp,
          maxTemp: representativeTemp + 1,
          minFeelsLike: representativeTemp,
          maxFeelsLike: representativeTemp + 1,
          maxWindSpeed: 10, // Low wind
          maxRainProbability: 0, // No rain
          maxPrecipitationIntensity: 0,
        };

        const config: RideConfig = {
          startTime: new Date(),
          durationHours: 2,
          units,
        };

        scenarios.push({ 
          minTemp: range.maxTemp - 20, // Extend 20°C below for display purposes
          maxTemp: range.maxTemp, 
          temp: Math.round(representativeTemp), 
          wind: 10, 
          rain: 0, 
          weather, 
          config,
          applicableRanges: [range] // Store the range that applies
        });
      }
    });

    // If no scenarios were created but we have ranges with items, create at least one scenario
    // This handles edge cases like ranges with only minTemp where segment logic might fail
    if (scenarios.length === 0 && rangesWithItems.length > 0) {
      // Prioritize ranges with only minTemp - these are the most likely to be missed
      const rangesWithOnlyMin = rangesWithItems.filter(r => {
        const hasMinTemp = r.minTemp !== null && r.minTemp !== undefined;
        const hasNoMaxTemp = r.maxTemp === null || r.maxTemp === undefined;
        return hasMinTemp && hasNoMaxTemp;
      });
      
      if (rangesWithOnlyMin.length > 0) {
        // Use the highest minTemp from ranges with only minTemp
        const highestMinTemp = Math.max(...rangesWithOnlyMin.map(r => r.minTemp!));
        const representativeTemp = highestMinTemp + 5;
        
        const weather: WeatherSummary = {
          minTemp: representativeTemp,
          maxTemp: representativeTemp + 1,
          minFeelsLike: representativeTemp,
          maxFeelsLike: representativeTemp + 1,
          maxWindSpeed: 10,
          maxRainProbability: 0,
          maxPrecipitationIntensity: 0,
        };

        const config: RideConfig = {
          startTime: new Date(),
          durationHours: 2,
          units,
        };

        scenarios.push({ 
          minTemp: highestMinTemp, 
          maxTemp: highestMinTemp + 20,
          temp: Math.round(representativeTemp), 
          wind: 10, 
          rain: 0, 
          weather, 
          config,
          applicableRanges: rangesWithOnlyMin
        });
      } else {
        // Fallback for other cases
        const highestMinTemp = rangesWithItems
          .map(r => r.minTemp)
          .filter(t => t !== null && t !== undefined)
          .sort((a, b) => (b || 0) - (a || 0))[0] || 20;
        
        const representativeTemp = highestMinTemp + 5;
        
        const weather: WeatherSummary = {
          minTemp: representativeTemp,
          maxTemp: representativeTemp + 1,
          minFeelsLike: representativeTemp,
          maxFeelsLike: representativeTemp + 1,
          maxWindSpeed: 10,
          maxRainProbability: 0,
          maxPrecipitationIntensity: 0,
        };

        const config: RideConfig = {
          startTime: new Date(),
          durationHours: 2,
          units,
        };

        // Find which ranges apply to this scenario
        const applicableRangesForFallback = rangesWithItems.filter(range => {
          const minMatch = range.minTemp === null || representativeTemp > range.minTemp;
          const maxMatch = range.maxTemp === null || range.maxTemp === undefined || representativeTemp <= range.maxTemp;
          return minMatch && maxMatch;
        });
        
        scenarios.push({ 
          minTemp: highestMinTemp, 
          maxTemp: highestMinTemp + 20,
          temp: Math.round(representativeTemp), 
          wind: 10, 
          rain: 0, 
          weather, 
          config,
          applicableRanges: applicableRangesForFallback
        });
      }
    }

    // Sort scenarios by maxTemp descending (hot to cold)
    return scenarios.sort((a, b) => b.maxTemp - a.maxTemp);
  };

  // Helper to flatten ClothingItem[] to string[] for comparison (shared across functions)
  const flattenItems = (items: ClothingItem[]): string[] => {
    const result: string[] = [];
    items.forEach(item => {
      if (typeof item === 'string') {
        result.push(item);
      } else if (typeof item === 'object' && item !== null && 'options' in item) {
        // Flatten all options
        item.options.forEach(option => {
          option.forEach(optItem => result.push(optItem));
        });
      }
    });
    return result;
  };

  // Helper to find where an item is stored in the wardrobe
  const findItemLocation = (
    itemName: string,
    bodyPart: 'head' | 'neckFace' | 'chest' | 'legs' | 'hands' | 'feet'
  ): { type: 'temp' | 'wind' | 'rain'; rangeIndex?: number; modifierIndex?: number } | null => {
    // Check temperature ranges
    for (let i = 0; i < currentWardrobe.temperatureRanges.length; i++) {
      const range = currentWardrobe.temperatureRanges[i];
      const items = range.items[bodyPart] || [];
      for (const item of items) {
        if (typeof item === 'string' && item === itemName) {
          return { type: 'temp', rangeIndex: i };
        } else if (typeof item === 'object' && item !== null && 'options' in item) {
          for (const option of item.options) {
            if (option.includes(itemName)) {
              return { type: 'temp', rangeIndex: i };
            }
          }
        }
      }
    }

    // Check wind modifiers
    for (let i = 0; i < currentWardrobe.windModifiers.length; i++) {
      const modifier = currentWardrobe.windModifiers[i];
      const items = modifier.items[bodyPart] || [];
      for (const item of items) {
        if (typeof item === 'string' && item === itemName) {
          return { type: 'wind', modifierIndex: i };
        } else if (typeof item === 'object' && item !== null && 'options' in item) {
          for (const option of item.options) {
            if (option.includes(itemName)) {
              return { type: 'wind', modifierIndex: i };
            }
          }
        }
      }
    }

    // Check rain modifiers
    for (let i = 0; i < currentWardrobe.rainModifiers.length; i++) {
      const modifier = currentWardrobe.rainModifiers[i];
      const items = modifier.items[bodyPart] || [];
      for (const item of items) {
        if (typeof item === 'string' && item === itemName) {
          return { type: 'rain', modifierIndex: i };
        } else if (typeof item === 'object' && item !== null && 'options' in item) {
          for (const option of item.options) {
            if (option.includes(itemName)) {
              return { type: 'rain', modifierIndex: i };
            }
          }
        }
      }
    }

    return null;
  };

  // Handle edit item
  const handleEditItem = (itemName: string, bodyPart: 'head' | 'neckFace' | 'chest' | 'legs' | 'hands' | 'feet') => {
    const location = findItemLocation(itemName, bodyPart);
    if (location) {
      setEditItemName(itemName);
      setEditItemBodyPart(bodyPart);
      setEditItemType(location.type);
      
      // Load current values based on location
      if (location.type === 'temp' && location.rangeIndex !== undefined) {
        const range = currentWardrobe.temperatureRanges[location.rangeIndex];
        setEditItemMinTemp(range.minTemp?.toString() || '');
        setEditItemMaxTemp(range.maxTemp?.toString() || '');
        setEditItemMinWind('');
        setEditItemMinRain('');
        setEditItemMaxRain('');
        setEditItemMaxTempRain('');
      } else if (location.type === 'wind' && location.modifierIndex !== undefined) {
        const modifier = currentWardrobe.windModifiers[location.modifierIndex];
        setEditItemMinWind(modifier.minWindSpeed?.toString() || '');
        setEditItemMinTemp('');
        setEditItemMaxTemp('');
        setEditItemMinRain('');
        setEditItemMaxRain('');
        setEditItemMaxTempRain('');
      } else if (location.type === 'rain' && location.modifierIndex !== undefined) {
        const modifier = currentWardrobe.rainModifiers[location.modifierIndex];
        setEditItemMinRain(modifier.minRainProbability?.toString() || '');
        setEditItemMaxRain(modifier.maxRainProbability?.toString() || '');
        setEditItemMaxTempRain(modifier.maxTemp?.toString() || '');
        setEditItemMinTemp('');
        setEditItemMaxTemp('');
        setEditItemMinWind('');
      }
      
      setEditingItem({
        item: itemName,
        bodyPart,
        type: location.type,
        rangeIndex: location.rangeIndex,
        modifierIndex: location.modifierIndex,
      });
      setEditItemError('');
    }
  };

  // Handle save edited item
  const handleSaveEditItem = () => {
    setEditItemError('');
    
    if (!editingItem || !editItemName.trim()) {
      setEditItemError('Please enter a clothing item name');
      return;
    }

    // Validate temperature fields if editing a temperature item
    if (editItemType === 'temp') {
      if (!editItemMinTemp.trim() && !editItemMaxTemp.trim()) {
        setEditItemError('Please enter at least one temperature (minimum or maximum)');
        return;
      }
    }

    const updatedWardrobes = wardrobes.map(wardrobe => {
      if (wardrobe.id !== currentWardrobe.id) return wardrobe;

      const updated = { ...wardrobe };
      const bodyPartChanged = editingItem.bodyPart !== editItemBodyPart;
      const oldBodyPart = editingItem.bodyPart;
      const newBodyPart = editItemBodyPart;

      if (editingItem.type === 'temp' && editingItem.rangeIndex !== undefined) {
        // Update temperature range if changed
        const minTemp = editItemMinTemp ? parseFloat(editItemMinTemp) : null;
        const maxTemp = editItemMaxTemp ? parseFloat(editItemMaxTemp) : null;
        
        updated.temperatureRanges = updated.temperatureRanges.map((r, idx) => {
          if (idx !== editingItem.rangeIndex) return r;
          
          const newItems = { ...r.items };
          
          // Remove item from old body part
          const oldBodyPartItems = r.items[oldBodyPart] || [];
          newItems[oldBodyPart] = oldBodyPartItems.map(item => {
            if (typeof item === 'string') {
              // Keep string items that don't match the item being edited
              return item !== editingItem.item ? item : null;
            } else if (typeof item === 'object' && item !== null && 'options' in item) {
              // Filter out the item from options
              const filteredOptions = item.options.map(option => 
                option.filter(opt => opt !== editingItem.item)
              ).filter(option => option.length > 0);
              // Return the option group only if it still has options after filtering
              if (filteredOptions.length > 0) {
                return {
                  options: filteredOptions
                };
              }
              return null; // Mark for removal if empty
            }
            return item;
          }).filter((item): item is ClothingItem => item !== null);
          
          // If body part changed, add to new body part
          if (bodyPartChanged) {
            // Use items from newItems if already set, otherwise from original range
            const existingNewBodyPartItems = newItems[newBodyPart] || r.items[newBodyPart] || [];
            // Check if item already exists in new body part
            const itemExists = existingNewBodyPartItems.some(item => {
              if (typeof item === 'string') return item === editItemName;
              if (typeof item === 'object' && item !== null && 'options' in item) {
                return item.options.some(option => option.includes(editItemName));
              }
              return false;
            });
            if (!itemExists) {
              newItems[newBodyPart] = [...existingNewBodyPartItems, editItemName];
            } else {
              // Item already exists, ensure newItems[newBodyPart] is set
              if (!newItems[newBodyPart]) {
                newItems[newBodyPart] = existingNewBodyPartItems;
              }
            }
          } else {
            // Same body part - update name if changed
            if (editItemName !== editingItem.item) {
              newItems[oldBodyPart] = (newItems[oldBodyPart] || []).map(item => {
                if (typeof item === 'string' && item === editingItem.item) {
                  return editItemName;
                } else if (typeof item === 'object' && item !== null && 'options' in item) {
                  return {
                    options: item.options.map(option => 
                      option.map(opt => opt === editingItem.item ? editItemName : opt)
                    )
                  };
                }
                return item;
              });
              // If item was completely removed, add it back with new name
              const stillExists = newItems[oldBodyPart].some(item => {
                if (typeof item === 'string') return item === editItemName;
                if (typeof item === 'object' && item !== null && 'options' in item) {
                  return item.options.some(option => option.includes(editItemName));
                }
                return false;
              });
              if (!stillExists) {
                newItems[oldBodyPart] = [...(newItems[oldBodyPart] || []), editItemName];
              }
            } else {
              // Name unchanged, just ensure item is still there
              const stillExists = newItems[oldBodyPart].some(item => {
                if (typeof item === 'string') return item === editingItem.item;
                if (typeof item === 'object' && item !== null && 'options' in item) {
                  return item.options.some(option => option.includes(editingItem.item));
                }
                return false;
              });
              if (!stillExists) {
                newItems[oldBodyPart] = [...(newItems[oldBodyPart] || []), editingItem.item];
              }
            }
          }
          
          return {
            ...r,
            minTemp: minTemp ?? r.minTemp,
            maxTemp: maxTemp ?? r.maxTemp,
            items: newItems
          };
        });
      } else if (editingItem.type === 'wind' && editingItem.modifierIndex !== undefined) {
        updated.windModifiers = updated.windModifiers.map((m, idx) => {
          if (idx !== editingItem.modifierIndex) return m;
          
          const newItems = { ...m.items };
          
          // Remove item from old body part
          const oldBodyPartItems = m.items[oldBodyPart] || [];
          newItems[oldBodyPart] = oldBodyPartItems.map(item => {
            if (typeof item === 'string') {
              return item !== editingItem.item ? item : null;
            } else if (typeof item === 'object' && item !== null && 'options' in item) {
              const filteredOptions = item.options.map(option => 
                option.filter(opt => opt !== editingItem.item)
              ).filter(option => option.length > 0);
              if (filteredOptions.length > 0) {
                return {
                  options: filteredOptions
                };
              }
              return null;
            }
            return item;
          }).filter((item): item is ClothingItem => item !== null);
          
          // If body part changed, add to new body part
          if (bodyPartChanged) {
            // Use items from newItems if already set, otherwise from original modifier
            const existingNewBodyPartItems = newItems[newBodyPart] || m.items[newBodyPart] || [];
            const itemExists = existingNewBodyPartItems.some(item => {
              if (typeof item === 'string') return item === editItemName;
              if (typeof item === 'object' && item !== null && 'options' in item) {
                return item.options.some(option => option.includes(editItemName));
              }
              return false;
            });
            if (!itemExists) {
              newItems[newBodyPart] = [...existingNewBodyPartItems, editItemName];
            } else {
              // Item already exists, ensure newItems[newBodyPart] is set
              if (!newItems[newBodyPart]) {
                newItems[newBodyPart] = existingNewBodyPartItems;
              }
            }
          } else {
            // Same body part - update name if changed
            if (editItemName !== editingItem.item) {
              newItems[oldBodyPart] = (newItems[oldBodyPart] || []).map(item => {
                if (typeof item === 'string' && item === editingItem.item) {
                  return editItemName;
                } else if (typeof item === 'object' && item !== null && 'options' in item) {
                  return {
                    options: item.options.map(option => 
                      option.map(opt => opt === editingItem.item ? editItemName : opt)
                    )
                  };
                }
                return item;
              });
              const stillExists = newItems[oldBodyPart].some(item => {
                if (typeof item === 'string') return item === editItemName;
                if (typeof item === 'object' && item !== null && 'options' in item) {
                  return item.options.some(option => option.includes(editItemName));
                }
                return false;
              });
              if (!stillExists) {
                newItems[oldBodyPart] = [...(newItems[oldBodyPart] || []), editItemName];
              }
            } else {
              const stillExists = newItems[oldBodyPart].some(item => {
                if (typeof item === 'string') return item === editingItem.item;
                if (typeof item === 'object' && item !== null && 'options' in item) {
                  return item.options.some(option => option.includes(editingItem.item));
                }
                return false;
              });
              if (!stillExists) {
                newItems[oldBodyPart] = [...(newItems[oldBodyPart] || []), editingItem.item];
              }
            }
          }
          
          return {
            ...m,
            minWindSpeed: editItemMinWind ? parseFloat(editItemMinWind) : m.minWindSpeed,
            items: newItems
          };
        });
      } else if (editingItem.type === 'rain' && editingItem.modifierIndex !== undefined) {
        updated.rainModifiers = updated.rainModifiers.map((m, idx) => {
          if (idx !== editingItem.modifierIndex) return m;
          
          const newItems = { ...m.items };
          
          // Remove item from old body part
          const oldBodyPartItems = m.items[oldBodyPart] || [];
          newItems[oldBodyPart] = oldBodyPartItems.map(item => {
            if (typeof item === 'string') {
              return item !== editingItem.item ? item : null;
            } else if (typeof item === 'object' && item !== null && 'options' in item) {
              const filteredOptions = item.options.map(option => 
                option.filter(opt => opt !== editingItem.item)
              ).filter(option => option.length > 0);
              if (filteredOptions.length > 0) {
                return {
                  options: filteredOptions
                };
              }
              return null;
            }
            return item;
          }).filter((item): item is ClothingItem => item !== null);
          
          // If body part changed, add to new body part
          if (bodyPartChanged) {
            // Use items from newItems if already set, otherwise from original modifier
            const existingNewBodyPartItems = newItems[newBodyPart] || m.items[newBodyPart] || [];
            const itemExists = existingNewBodyPartItems.some(item => {
              if (typeof item === 'string') return item === editItemName;
              if (typeof item === 'object' && item !== null && 'options' in item) {
                return item.options.some(option => option.includes(editItemName));
              }
              return false;
            });
            if (!itemExists) {
              newItems[newBodyPart] = [...existingNewBodyPartItems, editItemName];
            } else {
              // Item already exists, ensure newItems[newBodyPart] is set
              if (!newItems[newBodyPart]) {
                newItems[newBodyPart] = existingNewBodyPartItems;
              }
            }
          } else {
            // Same body part - update name if changed
            if (editItemName !== editingItem.item) {
              newItems[oldBodyPart] = (newItems[oldBodyPart] || []).map(item => {
                if (typeof item === 'string' && item === editingItem.item) {
                  return editItemName;
                } else if (typeof item === 'object' && item !== null && 'options' in item) {
                  return {
                    options: item.options.map(option => 
                      option.map(opt => opt === editingItem.item ? editItemName : opt)
                    )
                  };
                }
                return item;
              });
              const stillExists = newItems[oldBodyPart].some(item => {
                if (typeof item === 'string') return item === editItemName;
                if (typeof item === 'object' && item !== null && 'options' in item) {
                  return item.options.some(option => option.includes(editItemName));
                }
                return false;
              });
              if (!stillExists) {
                newItems[oldBodyPart] = [...(newItems[oldBodyPart] || []), editItemName];
              }
            } else {
              const stillExists = newItems[oldBodyPart].some(item => {
                if (typeof item === 'string') return item === editingItem.item;
                if (typeof item === 'object' && item !== null && 'options' in item) {
                  return item.options.some(option => option.includes(editingItem.item));
                }
                return false;
              });
              if (!stillExists) {
                newItems[oldBodyPart] = [...(newItems[oldBodyPart] || []), editingItem.item];
              }
            }
          }
          
          return {
            ...m,
            minRainProbability: editItemMinRain ? parseFloat(editItemMinRain) / 100 : m.minRainProbability,
            maxRainProbability: editItemMaxRain ? parseFloat(editItemMaxRain) / 100 : m.maxRainProbability,
            maxTemp: editItemMaxTempRain ? parseFloat(editItemMaxTempRain) : m.maxTemp,
            items: newItems
          };
        });
      }

      return updated;
    });

    // Update wardrobe state - this will trigger currentWardrobe to update, which triggers scenarios to regenerate
    setWardrobes(updatedWardrobes);
    // Only save to storage if not in edit mode (changes are saved when exiting edit mode)
    if (!isEditMode) {
      storage.setWardrobes(updatedWardrobes);
    }
    // Clear editing state - important to reset so next edit works correctly
    setEditingItem(null);
    setEditItemName('');
    setEditItemBodyPart('chest');
    setEditItemType('temp');
    setEditItemMinTemp('');
    setEditItemMaxTemp('');
    setEditItemMinWind('');
    setEditItemMinRain('');
    setEditItemMaxRain('');
    setEditItemMaxTempRain('');
    setEditItemError('');
  };

  // Render item with edit controls
  const renderItemWithControls = (
    item: ClothingItem,
    idx: number,
    bodyPart: 'head' | 'neckFace' | 'chest' | 'legs' | 'hands' | 'feet'
  ) => {
    // Check if this is an options group
    if (typeof item === 'object' && item !== null && 'options' in item) {
      const options = (item as { options: string[][] }).options;
      return (
        <Fragment key={idx}>
          {options.map((optionItems, optionIdx) => (
            <Fragment key={optionIdx}>
              {optionIdx > 0 && (
                <li key={`or-${optionIdx}`} className="option-divider">
                  <span className="option-or">OR</span>
                </li>
              )}
              {optionItems.map((optionItem, itemIdx) => (
                <li key={`${optionIdx}-${itemIdx}`} className={`${optionIdx > 0 ? "option-item" : ""} ${isEditMode ? "edit-mode-item" : ""}`}>
                  {isEditMode ? (
                    <>
                      <span>{optionItem}</span>
                      <div className="item-actions">
                        <button
                          className="btn-edit-item"
                          onClick={() => handleEditItem(optionItem, bodyPart)}
                          aria-label="Edit item"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.84 2.4L13.6 7.16L5.6 15.16H0.8V10.4L8.84 2.4ZM9.84 1.4L11.28 0L16 4.72L14.6 6.16L9.84 1.4Z" fill="currentColor"/>
                          </svg>
                        </button>
                        <button
                          className="btn-delete-item"
                          onClick={() => handleDeleteItem(optionItem, bodyPart)}
                          aria-label="Delete item"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 4H14M6 4V2C6 1.44772 6.44772 1 7 1H9C9.55228 1 10 1.44772 10 2V4M12 4V14C12 14.5523 11.5523 15 11 15H5C4.44772 15 4 14.5523 4 14V4H12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <span>{optionItem}</span>
                  )}
                </li>
              ))}
            </Fragment>
          ))}
        </Fragment>
      );
    }
    return (
      <li key={idx} className={isEditMode ? "edit-mode-item" : ""}>
        {isEditMode ? (
          <>
            <span>{item}</span>
            <div className="item-actions">
              <button
                className="btn-edit-item"
                onClick={() => handleEditItem(item, bodyPart)}
                aria-label="Edit item"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.84 2.4L13.6 7.16L5.6 15.16H0.8V10.4L8.84 2.4ZM9.84 1.4L11.28 0L16 4.72L14.6 6.16L9.84 1.4Z" fill="currentColor"/>
                </svg>
              </button>
              <button
                className="btn-delete-item"
                onClick={() => handleDeleteItem(item, bodyPart)}
                aria-label="Delete item"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 4H14M6 4V2C6 1.44772 6.44772 1 7 1H9C9.55228 1 10 1.44772 10 2V4M12 4V14C12 14.5523 11.5523 15 11 15H5C4.44772 15 4 14.5523 4 14V4H12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </>
        ) : (
          <span>{item}</span>
        )}
      </li>
    );
  };

  // Handle delete item - show confirmation first
  const handleDeleteItem = (itemName: string, bodyPart: 'head' | 'neckFace' | 'chest' | 'legs' | 'hands' | 'feet') => {
    setItemToDelete({ name: itemName, bodyPart });
    setShowDeleteItemConfirm(true);
  };

  // Confirm and execute item deletion
  const confirmDeleteItem = () => {
    if (!itemToDelete) return;
    
    const { name: itemName, bodyPart } = itemToDelete;
    const location = findItemLocation(itemName, bodyPart);
    if (!location) {
      setShowDeleteItemConfirm(false);
      setItemToDelete(null);
      return;
    }

    const updatedWardrobes = wardrobes.map(wardrobe => {
      if (wardrobe.id !== currentWardrobe.id) return wardrobe;

      const updated = { ...wardrobe };

      if (location.type === 'temp' && location.rangeIndex !== undefined) {
        const range = updated.temperatureRanges[location.rangeIndex];
        const items = range.items[bodyPart] || [];
        const updatedItems = items.filter(item => {
          if (typeof item === 'string') {
            return item !== itemName;
          } else if (typeof item === 'object' && item !== null && 'options' in item) {
            // Remove item from options, or remove entire option group if empty
            const filteredOptions = item.options.map(option => option.filter(opt => opt !== itemName)).filter(option => option.length > 0);
            if (filteredOptions.length === 0) {
              return false; // Remove this option group
            }
            return { options: filteredOptions };
          }
          return true;
        });
        updated.temperatureRanges = updated.temperatureRanges.map((r, idx) =>
          idx === location.rangeIndex ? { ...r, items: { ...r.items, [bodyPart]: updatedItems } } : r
        );
      } else if (location.type === 'wind' && location.modifierIndex !== undefined) {
        const modifier = updated.windModifiers[location.modifierIndex];
        const items = modifier.items[bodyPart] || [];
        const updatedItems = items.filter(item => {
          if (typeof item === 'string') {
            return item !== itemName;
          } else if (typeof item === 'object' && item !== null && 'options' in item) {
            const filteredOptions = item.options.map(option => option.filter(opt => opt !== itemName)).filter(option => option.length > 0);
            if (filteredOptions.length === 0) {
              return false;
            }
            return { options: filteredOptions };
          }
          return true;
        });
        updated.windModifiers = updated.windModifiers.map((m, idx) =>
          idx === location.modifierIndex ? { ...m, items: { ...m.items, [bodyPart]: updatedItems } } : m
        );
      } else if (location.type === 'rain' && location.modifierIndex !== undefined) {
        const modifier = updated.rainModifiers[location.modifierIndex];
        const items = modifier.items[bodyPart] || [];
        const updatedItems = items.filter(item => {
          if (typeof item === 'string') {
            return item !== itemName;
          } else if (typeof item === 'object' && item !== null && 'options' in item) {
            const filteredOptions = item.options.map(option => option.filter(opt => opt !== itemName)).filter(option => option.length > 0);
            if (filteredOptions.length === 0) {
              return false;
            }
            return { options: filteredOptions };
          }
          return true;
        });
        updated.rainModifiers = updated.rainModifiers.map((m, idx) =>
          idx === location.modifierIndex ? { ...m, items: { ...m.items, [bodyPart]: updatedItems } } : m
        );
      }

      return updated;
    });

    setWardrobes(updatedWardrobes);
    // Only save to storage if not in edit mode (changes are saved when exiting edit mode)
    if (!isEditMode) {
      storage.setWardrobes(updatedWardrobes);
    }
    setShowDeleteItemConfirm(false);
    setItemToDelete(null);
  };

  // Generate scenarios for wind variations - only show unique recommendations
  const generateWindScenarios = () => {
    const winds = [5, 10, 15, 20, 25, 30, 35, 40];
    const scenarios: Array<{
      temp: number;
      wind: number;
      rain: number;
      weather: WeatherSummary;
      config: RideConfig;
    }> = [];

    const seenRecommendations = new Set<string>();

    winds.forEach(wind => {
      const weather: WeatherSummary = {
        minTemp: 10,
        maxTemp: 12,
        minFeelsLike: 10,
        maxFeelsLike: 12,
        maxWindSpeed: wind,
        maxRainProbability: 0, // No rain
        maxPrecipitationIntensity: 0,
      };

      const config: RideConfig = {
        startTime: new Date(),
        durationHours: 2,
        units,
      };

      // Get base recommendation without wind
      const baseWeather: WeatherSummary = {
        ...weather,
        maxWindSpeed: 5, // Very low wind
      };
      const baseRecommendation = recommendClothing(baseWeather, config, currentWardrobe);
      const windRecommendation = recommendClothing(weather, config, currentWardrobe);
      
      // Find differences - only items added by wind
      const getWindOnlyItems = (base: ClothingItem[], withWind: ClothingItem[]): ClothingItem[] => {
        const baseFlat = flattenItems(base);
        return withWind.filter(item => {
          if (typeof item === 'string') {
            return !baseFlat.includes(item);
          } else if (typeof item === 'object' && item !== null && 'options' in item) {
            // Check if any option items are new
            return item.options.some(option => 
              option.some(optItem => !baseFlat.includes(optItem))
            );
          }
          return false;
        });
      };
      
      const windOnly = {
        head: getWindOnlyItems(baseRecommendation.head, windRecommendation.head),
        neckFace: getWindOnlyItems(baseRecommendation.neckFace, windRecommendation.neckFace),
        chest: getWindOnlyItems(baseRecommendation.chest, windRecommendation.chest),
        legs: getWindOnlyItems(baseRecommendation.legs, windRecommendation.legs),
        hands: getWindOnlyItems(baseRecommendation.hands, windRecommendation.hands),
        feet: getWindOnlyItems(baseRecommendation.feet, windRecommendation.feet),
      };
      
      const hasWindItems = Object.values(windOnly).some(items => items.length > 0);
      
      if (hasWindItems) {
        // Create a unique key for this recommendation
        const recKey = JSON.stringify(windOnly);
        
        // Only add if we haven't seen this recommendation before
        if (!seenRecommendations.has(recKey)) {
          seenRecommendations.add(recKey);
          scenarios.push({ temp: 10, wind, rain: 0, weather, config });
        }
      }
    });

    return scenarios;
  };

  // Generate scenarios for rain variations - only show unique recommendations
  const generateRainScenarios = () => {
    const rains = [0, 0.2, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    const scenarios: Array<{
      temp: number;
      wind: number;
      rain: number;
      weather: WeatherSummary;
      config: RideConfig;
    }> = [];

    const seenRecommendations = new Set<string>();

    rains.forEach(rain => {
      const weather: WeatherSummary = {
        minTemp: 10,
        maxTemp: 12,
        minFeelsLike: 10,
        maxFeelsLike: 12,
        maxWindSpeed: 10, // Low wind
        maxRainProbability: rain,
        maxPrecipitationIntensity: rain > 0.5 ? 2 : 0,
      };

      const config: RideConfig = {
        startTime: new Date(),
        durationHours: 2,
        units,
      };

      // Get base recommendation without rain
      const baseWeather: WeatherSummary = {
        ...weather,
        maxRainProbability: 0,
        maxPrecipitationIntensity: 0,
      };
      const baseRecommendation = recommendClothing(baseWeather, config, currentWardrobe);
      const rainRecommendation = recommendClothing(weather, config, currentWardrobe);
      
      // Find differences - only items added by rain
      const getRainOnlyItems = (base: ClothingItem[], withRain: ClothingItem[]): ClothingItem[] => {
        const baseFlat = flattenItems(base);
        return withRain.filter(item => {
          if (typeof item === 'string') {
            return !baseFlat.includes(item);
          } else if (typeof item === 'object' && item !== null && 'options' in item) {
            // Check if any option items are new
            return item.options.some(option => 
              option.some(optItem => !baseFlat.includes(optItem))
            );
          }
          return false;
        });
      };
      
      const rainOnly = {
        head: getRainOnlyItems(baseRecommendation.head, rainRecommendation.head),
        neckFace: getRainOnlyItems(baseRecommendation.neckFace, rainRecommendation.neckFace),
        chest: getRainOnlyItems(baseRecommendation.chest, rainRecommendation.chest),
        legs: getRainOnlyItems(baseRecommendation.legs, rainRecommendation.legs),
        hands: getRainOnlyItems(baseRecommendation.hands, rainRecommendation.hands),
        feet: getRainOnlyItems(baseRecommendation.feet, rainRecommendation.feet),
      };
      
      const hasRainItems = Object.values(rainOnly).some(items => items.length > 0);
      
      if (hasRainItems) {
        // Create a unique key for this recommendation
        const recKey = JSON.stringify(rainOnly);
        
        // Only add if we haven't seen this recommendation before
        if (!seenRecommendations.has(recKey)) {
          seenRecommendations.add(recKey);
          scenarios.push({ temp: 10, wind: 10, rain, weather, config });
        }
      }
    });

    return scenarios;
  };

  const tempScenarios = useMemo(() => generateTemperatureScenarios(), [units, currentWardrobe]);
  const windScenarios = useMemo(() => generateWindScenarios(), [units, currentWardrobe]);
  const rainScenarios = useMemo(() => generateRainScenarios(), [units, currentWardrobe]);
  const tempUnit = units === 'metric' ? '°C' : '°F';
  const windUnit = units === 'metric' ? 'km/h' : 'mph';

  // Helper function to check if an item appears in a ClothingItem array
  const itemInClothingItems = (itemName: string, clothingItems?: ClothingItem[]): boolean => {
    if (!clothingItems) return false;
    const itemLower = itemName.toLowerCase();
    return clothingItems.some(item => {
      if (typeof item === 'string') {
        return item.toLowerCase() === itemLower;
      } else if (typeof item === 'object' && item !== null && 'options' in item) {
        return item.options.some(option => 
          option.some(optItem => optItem.toLowerCase() === itemLower)
        );
      }
      return false;
    });
  };

  // Helper function to get item type and order from wardrobe structure
  const getItemOrder = (item: string): { type: 'temp' | 'wind' | 'rain', order: number } => {
    // Check wind modifiers first (ordered by wind speed, ascending)
    for (let i = 0; i < currentWardrobe.windModifiers.length; i++) {
      const modifier = currentWardrobe.windModifiers[i];
      const allWindItems = [
        ...(modifier.items.head || []),
        ...(modifier.items.neckFace || []),
        ...(modifier.items.chest || []),
        ...(modifier.items.legs || []),
        ...(modifier.items.hands || []),
        ...(modifier.items.feet || []),
      ];
      if (itemInClothingItems(item, allWindItems)) {
        // Order by wind speed threshold (lower wind speed = lower order number)
        return { type: 'wind', order: 1000 + modifier.minWindSpeed };
      }
    }

    // Check rain modifiers (ordered by rain probability, ascending)
    for (let i = 0; i < currentWardrobe.rainModifiers.length; i++) {
      const modifier = currentWardrobe.rainModifiers[i];
      const allRainItems = [
        ...(modifier.items.head || []),
        ...(modifier.items.neckFace || []),
        ...(modifier.items.chest || []),
        ...(modifier.items.legs || []),
        ...(modifier.items.hands || []),
        ...(modifier.items.feet || []),
      ];
      if (itemInClothingItems(item, allRainItems)) {
        // Order by rain probability threshold (lower probability = lower order number)
        return { type: 'rain', order: 2000 + modifier.minRainProbability * 10 };
      }
    }

    // Check temperature ranges (ordered from hot to cold)
    // Items that appear in earlier (hotter) ranges get lower order numbers
    // Use the first (hottest) range where the item appears
    for (let i = 0; i < currentWardrobe.temperatureRanges.length; i++) {
      const range = currentWardrobe.temperatureRanges[i];
      const allTempItems = [
        ...(range.items.head || []),
        ...(range.items.neckFace || []),
        ...(range.items.chest || []),
        ...(range.items.legs || []),
        ...(range.items.hands || []),
        ...(range.items.feet || []),
      ];
      if (itemInClothingItems(item, allTempItems)) {
        // Use range index as order (earlier ranges = lower order = hotter)
        // Temperature ranges are ordered from hot to cold, so index represents order
        return { type: 'temp', order: i };
      }
    }

    // Default fallback (shouldn't happen if item is from wardrobe)
    return { type: 'temp', order: 500 };
  };

  // Sort items: temperature (hot to cold), then wind, then rain
  const sortItems = (items: string[]): string[] => {
    return items.sort((a, b) => {
      const aOrder = getItemOrder(a);
      const bOrder = getItemOrder(b);
      
      // First sort by type: temp < wind < rain
      if (aOrder.type !== bOrder.type) {
        const typeOrder = { temp: 0, wind: 1, rain: 2 };
        return typeOrder[aOrder.type] - typeOrder[bOrder.type];
      }
      
      // Then sort by order within same type
      return aOrder.order - bOrder.order;
    });
  };

  // Collect all unique clothing items from all scenarios
  const allUniqueItems = useMemo(() => {
    const items = {
      head: new Set<string>(),
      neckFace: new Set<string>(),
      chest: new Set<string>(),
      legs: new Set<string>(),
      hands: new Set<string>(),
      feet: new Set<string>(),
    };

    // Helper to add ClothingItem to Set (flattening options)
    const addItem = (set: Set<string>, item: ClothingItem) => {
      if (typeof item === 'string') {
        set.add(item);
      } else if (typeof item === 'object' && item !== null && 'options' in item) {
        item.options.forEach(option => {
          option.forEach(optItem => set.add(optItem));
        });
      }
    };

    // Collect from temperature scenarios
    // Pass currentWardrobe to ensure we use the latest React state, not localStorage
    tempScenarios.forEach(scenario => {
      const rec = recommendClothing(scenario.weather, scenario.config, currentWardrobe);
      rec.head.forEach(item => addItem(items.head, item));
      rec.neckFace.forEach(item => addItem(items.neckFace, item));
      rec.chest.forEach(item => addItem(items.chest, item));
      rec.legs.forEach(item => addItem(items.legs, item));
      rec.hands.forEach(item => addItem(items.hands, item));
      rec.feet.forEach(item => addItem(items.feet, item));
    });

    // Collect from wind scenarios
    windScenarios.forEach(scenario => {
      const rec = recommendClothing(scenario.weather, scenario.config, currentWardrobe);
      rec.head.forEach(item => addItem(items.head, item));
      rec.neckFace.forEach(item => addItem(items.neckFace, item));
      rec.chest.forEach(item => addItem(items.chest, item));
      rec.legs.forEach(item => addItem(items.legs, item));
      rec.hands.forEach(item => addItem(items.hands, item));
      rec.feet.forEach(item => addItem(items.feet, item));
    });

    // Collect from rain scenarios
    rainScenarios.forEach(scenario => {
      const rec = recommendClothing(scenario.weather, scenario.config, currentWardrobe);
      rec.head.forEach(item => addItem(items.head, item));
      rec.neckFace.forEach(item => addItem(items.neckFace, item));
      rec.chest.forEach(item => addItem(items.chest, item));
      rec.legs.forEach(item => addItem(items.legs, item));
      rec.hands.forEach(item => addItem(items.hands, item));
      rec.feet.forEach(item => addItem(items.feet, item));
    });

    const sortedItems = {
      head: sortItems(Array.from(items.head)),
      neckFace: sortItems(Array.from(items.neckFace)),
      chest: sortItems(Array.from(items.chest)),
      legs: sortItems(Array.from(items.legs)),
      hands: sortItems(Array.from(items.hands)),
      feet: sortItems(Array.from(items.feet)),
    };

    return sortedItems;
  }, [tempScenarios, windScenarios, rainScenarios, currentWardrobe]);

  // Helper function to determine item type (same as Home.tsx)
  const getItemType = (item: string | { options: string[][] }, weather: WeatherSummary, config: RideConfig): 'temp' | 'wind' | 'rain' => {
    // If it's an options object, check the first option's first item
    if (typeof item === 'object' && item !== null && 'options' in item) {
      const firstOptionFirstItem = item.options[0]?.[0];
      if (firstOptionFirstItem) {
        return getItemType(firstOptionFirstItem, weather, config);
      }
      return 'temp'; // Default if no items
    }
    
    const itemLower = typeof item === 'string' ? item.toLowerCase() : '';
    const isMetric = config.units === 'metric';
    const wind = isMetric ? weather.maxWindSpeed : weather.maxWindSpeed * 1.60934;

    // Wind-related items
    if (itemLower.includes('wind') || (itemLower.includes('vest') && wind > 20)) {
      return 'wind';
    }

    // Rain-related items
    if (itemLower.includes('rain') || itemLower.includes('waterproof')) {
      return 'rain';
    }

    // Everything else is temperature-related
    return 'temp';
  };

  // Helper function to get icon path for item type
  const getTypeIcon = (type: 'temp' | 'wind' | 'rain'): string => {
    switch (type) {
      case 'wind':
        return 'windy.png';
      case 'rain':
        return 'rainy.png';
      default:
        return 'temperature.png';
    }
  };

  // Helper function to group items by type
  const groupItemsByType = (items: (string | { options: string[][] })[], weather: WeatherSummary, config: RideConfig) => {
    const grouped: { type: 'temp' | 'wind' | 'rain'; items: (string | { options: string[][] })[] }[] = [];
    const tempItems: (string | { options: string[][] })[] = [];
    const windItems: (string | { options: string[][] })[] = [];
    const rainItems: (string | { options: string[][] })[] = [];

    items.forEach(item => {
      const type = getItemType(item, weather, config);
      if (type === 'wind') {
        windItems.push(item);
      } else if (type === 'rain') {
        rainItems.push(item);
      } else {
        tempItems.push(item);
      }
    });

    if (tempItems.length > 0) {
      grouped.push({ type: 'temp', items: tempItems });
    }
    if (windItems.length > 0) {
      grouped.push({ type: 'wind', items: windItems });
    }
    if (rainItems.length > 0) {
      grouped.push({ type: 'rain', items: rainItems });
    }

    return grouped;
  };

  // Default weather for type determination (moderate conditions)
  const defaultWeatherForType: WeatherSummary = {
    minTemp: 10,
    maxTemp: 12,
    minFeelsLike: 10,
    maxFeelsLike: 12,
    maxWindSpeed: 15,
    maxRainProbability: 50,
    maxPrecipitationIntensity: 2,
  };

  const defaultConfigForType: RideConfig = {
    startTime: new Date(),
    durationHours: 2,
    units,
  };

  const formatTemp = (temp: number) => {
    const displayTemp = units === 'metric' ? temp : (temp * 9/5) + 32;
    return Math.round(displayTemp) + tempUnit;
  };

  const formatWind = (wind: number) => {
    const displayWind = units === 'metric' ? wind : wind * 0.621371;
    return Math.round(displayWind) + ' ' + windUnit;
  };

  // Check if temperature section has any content
  const hasTemperatureContent = useMemo(() => {
    return tempScenarios.some(scenario => {
      const rec = recommendClothing(scenario.weather, scenario.config, currentWardrobe);
      return rec.head.length > 0 || rec.neckFace.length > 0 || rec.chest.length > 0 ||
             rec.legs.length > 0 || rec.hands.length > 0 || rec.feet.length > 0;
    });
  }, [tempScenarios, currentWardrobe]);

  // Check if wind section has any content
  const hasWindContent = useMemo(() => {
    return windScenarios.some(scenario => {
      const baseWeather: WeatherSummary = {
        ...scenario.weather,
        maxWindSpeed: 5,
      };
            const baseRecommendation = recommendClothing(baseWeather, scenario.config, currentWardrobe);
            const windRecommendation = recommendClothing(scenario.weather, scenario.config, currentWardrobe);
      
      const getWindOnlyItems = (base: ClothingItem[], withWind: ClothingItem[]): ClothingItem[] => {
        const baseFlat = flattenItems(base);
        return withWind.filter(item => {
          if (typeof item === 'string') {
            return !baseFlat.includes(item);
          } else if (typeof item === 'object' && item !== null && 'options' in item) {
            return item.options.some(option => 
              option.some(optItem => !baseFlat.includes(optItem))
            );
          }
          return false;
        });
      };
      
      const windOnly = {
        head: getWindOnlyItems(baseRecommendation.head, windRecommendation.head),
        neckFace: getWindOnlyItems(baseRecommendation.neckFace, windRecommendation.neckFace),
        chest: getWindOnlyItems(baseRecommendation.chest, windRecommendation.chest),
        legs: getWindOnlyItems(baseRecommendation.legs, windRecommendation.legs),
        hands: getWindOnlyItems(baseRecommendation.hands, windRecommendation.hands),
        feet: getWindOnlyItems(baseRecommendation.feet, windRecommendation.feet),
      };
      
      return windOnly.head.length > 0 || windOnly.neckFace.length > 0 || windOnly.chest.length > 0 ||
             windOnly.legs.length > 0 || windOnly.hands.length > 0 || windOnly.feet.length > 0;
    });
  }, [windScenarios, currentWardrobe]);

  // Check if rain section has any content
  const hasRainContent = useMemo(() => {
    return rainScenarios.some(scenario => {
      const baseWeather: WeatherSummary = {
        ...scenario.weather,
        maxRainProbability: 0,
        maxPrecipitationIntensity: 0,
      };
            const baseRecommendation = recommendClothing(baseWeather, scenario.config, currentWardrobe);
            const rainRecommendation = recommendClothing(scenario.weather, scenario.config, currentWardrobe);
      
      const getRainOnlyItems = (base: ClothingItem[], withRain: ClothingItem[]): ClothingItem[] => {
        const baseFlat = flattenItems(base);
        return withRain.filter(item => {
          if (typeof item === 'string') {
            return !baseFlat.includes(item);
          } else if (typeof item === 'object' && item !== null && 'options' in item) {
            return item.options.some(option => 
              option.some(optItem => !baseFlat.includes(optItem))
            );
          }
          return false;
        });
      };
      
      const rainOnly = {
        head: getRainOnlyItems(baseRecommendation.head, rainRecommendation.head),
        neckFace: getRainOnlyItems(baseRecommendation.neckFace, rainRecommendation.neckFace),
        chest: getRainOnlyItems(baseRecommendation.chest, rainRecommendation.chest),
        legs: getRainOnlyItems(baseRecommendation.legs, rainRecommendation.legs),
        hands: getRainOnlyItems(baseRecommendation.hands, rainRecommendation.hands),
        feet: getRainOnlyItems(baseRecommendation.feet, rainRecommendation.feet),
      };
      
      return rainOnly.head.length > 0 || rainOnly.neckFace.length > 0 || rainOnly.chest.length > 0 ||
             rainOnly.legs.length > 0 || rainOnly.hands.length > 0 || rainOnly.feet.length > 0;
    });
  }, [rainScenarios, currentWardrobe]);

  // Helper to convert ClothingItem[] to display string
  const itemsToString = (items: ClothingItem[]): string => {
    const parts: string[] = [];
    items.forEach(item => {
      if (typeof item === 'string') {
        parts.push(item);
      } else if (typeof item === 'object' && item !== null && 'options' in item) {
        // Format options as "item1 OR item2"
        const optionStrings = item.options.map(option => option.join(' + '));
        parts.push(optionStrings.join(' OR '));
      }
    });
    return parts.join(', ');
  };

  const renderCategory = (items: ClothingItem[], title: string) => {
    if (items.length === 0) return null;
    return (
      <div className="guide-category">
        <strong>{title}:</strong> {itemsToString(items)}
      </div>
    );
  };

  return (
    <div className="page clothing-guide">
      <div className="guide-header">
        <h2>Wardrobe</h2>
      </div>

      {/* Current Wardrobe Display */}
      <div className="current-wardrobe-section">
        <div 
          className={`current-wardrobe-card ${hasMultipleWardrobes ? 'clickable' : ''}`}
          ref={wardrobeCardRef}
          onClick={(e) => {
            // Only open switcher if clicking on the card itself, not on buttons
            const target = e.target as HTMLElement;
            const isMenuButton = menuRef.current?.contains(target);
            const isSwitcherButton = switcherRef.current?.contains(target);
            
            if (!isMenuButton && !isSwitcherButton && hasMultipleWardrobes) {
              setShowWardrobeSwitcher(!showWardrobeSwitcher);
            }
          }}
        >
          <div className="current-wardrobe-info">
            <h3 className="current-wardrobe-name">{currentWardrobe.name}</h3>
            {(isDefaultWardrobe || currentWardrobe.isDefault) && (
              <span className="wardrobe-badge">Default</span>
            )}
          </div>
          <div className="wardrobe-actions">
            {hasMultipleWardrobes && (
              <div className="wardrobe-switcher-container" ref={switcherRef}>
                <button
                  type="button"
                  className="wardrobe-switcher-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowWardrobeSwitcher(!showWardrobeSwitcher);
                  }}
                  aria-label="Switch wardrobe"
                >
                  <span className="switcher-icon">⇄</span>
                </button>
                {showWardrobeSwitcher && switcherPosition && (
                  <div 
                    className="wardrobe-switcher-dropdown"
                    style={{
                      top: `${switcherPosition.top}px`,
                      right: `${switcherPosition.right}px`,
                    }}
                  >
                    <div className="switcher-header">Select Wardrobe</div>
                    {allWardrobesWithCounts.map(wardrobe => (
                      <button
                        key={wardrobe.id}
                        type="button"
                        className={`switcher-item ${selectedWardrobeId === (wardrobe.id === 'default' ? null : wardrobe.id) ? 'active' : ''}`}
                        onClick={() => handleSelectWardrobe(wardrobe.id === 'default' ? null : wardrobe.id)}
                      >
                        <div className="switcher-item-info">
                          <span className="switcher-item-name">{wardrobe.name}</span>
                          {wardrobe.isDefault && (
                            <span className="switcher-badge">Default</span>
                          )}
                        </div>
                        <span className="switcher-item-count">{wardrobe.itemCount} items</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="wardrobe-menu-container" ref={menuRef}>
              <button
                type="button"
                className="wardrobe-menu-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                aria-label="Wardrobe options"
              >
                <span className="menu-dots">⋮</span>
              </button>
            {showMenu && (
              <div className="wardrobe-menu-dropdown">
                <button
                  type="button"
                  className="menu-item"
                  onClick={() => {
                    setShowCreateModal(true);
                    setShowMenu(false);
                  }}
                >
                  Create new wardrobe
                </button>
                {!isDefaultWardrobe && (
                  <button
                    type="button"
                    className="menu-item menu-item-danger"
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setShowMenu(false);
                    }}
                  >
                    Delete wardrobe
                  </button>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      <p className="guide-intro">
        Complete overview of clothing recommendations organized by temperature, wind, and rain conditions.
      </p>

      {/* Empty Wardrobe Message */}
      {isWardrobeEmpty && (
        <div className="empty-wardrobe-message">
          <div className="empty-wardrobe-icon">👕</div>
          <h3 className="empty-wardrobe-title">Your wardrobe is empty</h3>
          <p className="empty-wardrobe-text">
            Start adding clothes by clicking the + button at the bottom of your screen.
          </p>
          <button
            className="btn btn-primary empty-wardrobe-button"
            onClick={() => setShowAddFirstClothingModal(true)}
          >
            Add your first piece of clothing
          </button>
        </div>
      )}

      {/* All Clothing Items Section */}
      {(allUniqueItems.head.length > 0 || allUniqueItems.neckFace.length > 0 || 
        allUniqueItems.chest.length > 0 || allUniqueItems.legs.length > 0 || 
        allUniqueItems.hands.length > 0 || allUniqueItems.feet.length > 0) && (
        <div className="guide-section">
          <div 
            className="section-header clickable"
            onClick={() => toggleSection('uniqueItems')}
          >
            <h3 className="section-title">All Clothing Items</h3>
            <span className="section-toggle">
              {openSections.uniqueItems ? '▼' : '▶'}
            </span>
          </div>
        {openSections.uniqueItems && (
          <div className="quick-clothing">
            {allUniqueItems.head.length > 0 && (
              <div className="quick-kit">
                <h3>Head</h3>
                {groupItemsByType(allUniqueItems.head, defaultWeatherForType, defaultConfigForType).map((group, groupIdx) => (
                  <div key={groupIdx} className="item-group">
                    <div className="item-group-icon-wrapper">
                      <img 
                        src={`${import.meta.env.BASE_URL}${getTypeIcon(group.type)}`}
                        alt=""
                        className="item-group-icon"
                      />
                    </div>
                    <ul className="item-group-list">
                      {group.items.map((item, idx) => renderItemWithControls(item, idx, 'head'))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {allUniqueItems.neckFace.length > 0 && (
              <div className="quick-kit">
                <h3>Neck / Face</h3>
                {groupItemsByType(allUniqueItems.neckFace, defaultWeatherForType, defaultConfigForType).map((group, groupIdx) => (
                  <div key={groupIdx} className="item-group">
                    <div className="item-group-icon-wrapper">
                      <img 
                        src={`${import.meta.env.BASE_URL}${getTypeIcon(group.type)}`}
                        alt=""
                        className="item-group-icon"
                      />
                    </div>
                    <ul className="item-group-list">
                      {group.items.map((item, idx) => renderItemWithControls(item, idx, 'chest'))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {allUniqueItems.chest.length > 0 && (
              <div className="quick-kit">
                <h3>Chest</h3>
                {groupItemsByType(allUniqueItems.chest, defaultWeatherForType, defaultConfigForType).map((group, groupIdx) => (
                  <div key={groupIdx} className="item-group">
                    <div className="item-group-icon-wrapper">
                      <img 
                        src={`${import.meta.env.BASE_URL}${getTypeIcon(group.type)}`}
                        alt=""
                        className="item-group-icon"
                      />
                    </div>
                    <ul className="item-group-list">
                      {group.items.map((item, idx) => renderItemWithControls(item, idx, 'chest'))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {allUniqueItems.legs.length > 0 && (
              <div className="quick-kit">
                <h3>Legs</h3>
                {groupItemsByType(allUniqueItems.legs, defaultWeatherForType, defaultConfigForType).map((group, groupIdx) => (
                  <div key={groupIdx} className="item-group">
                    <div className="item-group-icon-wrapper">
                      <img 
                        src={`${import.meta.env.BASE_URL}${getTypeIcon(group.type)}`}
                        alt=""
                        className="item-group-icon"
                      />
                    </div>
                    <ul className="item-group-list">
                      {group.items.map((item, idx) => renderItemWithControls(item, idx, 'legs'))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {allUniqueItems.hands.length > 0 && (
              <div className="quick-kit">
                <h3>Hands</h3>
                {groupItemsByType(allUniqueItems.hands, defaultWeatherForType, defaultConfigForType).map((group, groupIdx) => (
                  <div key={groupIdx} className="item-group">
                    <div className="item-group-icon-wrapper">
                      <img 
                        src={`${import.meta.env.BASE_URL}${getTypeIcon(group.type)}`}
                        alt=""
                        className="item-group-icon"
                      />
                    </div>
                    <ul className="item-group-list">
                      {group.items.map((item, idx) => renderItemWithControls(item, idx, 'hands'))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {allUniqueItems.feet.length > 0 && (
              <div className="quick-kit">
                <h3>Feet</h3>
                {groupItemsByType(allUniqueItems.feet, defaultWeatherForType, defaultConfigForType).map((group, groupIdx) => (
                  <div key={groupIdx} className="item-group">
                    <div className="item-group-icon-wrapper">
                      <img 
                        src={`${import.meta.env.BASE_URL}${getTypeIcon(group.type)}`}
                        alt=""
                        className="item-group-icon"
                      />
                    </div>
                    <ul className="item-group-list">
                      {group.items.map((item, idx) => renderItemWithControls(item, idx, 'feet'))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      )}

      {/* Temperature Section */}
      {hasTemperatureContent && (
        <div className="guide-section">
          <div 
            className="section-header clickable"
            onClick={() => toggleSection('temperature')}
          >
            <h3 className="section-title">Temperature Variations</h3>
            <span className="section-toggle">
              {openSections.temperature ? '▼' : '▶'}
            </span>
          </div>
        {openSections.temperature && (
          <>
            <p className="section-description">Low wind (10 {windUnit}), no rain</p>
            <div className="guide-scenarios guide-scenarios-temperature">
          {tempScenarios
            .map((scenario) => {
              // Use the representative temperature from the scenario's weather
              // This is already calculated to be slightly above segmentMinTemp to match ranges
              const recommendation = recommendClothing(scenario.weather, scenario.config, currentWardrobe);
              return { scenario, recommendation };
            })
            .map(({ scenario, recommendation }, idx) => {
              // Format temperature range based on actual wardrobe ranges
              const formatTempRange = () => {
                // If we have applicable ranges info, use it to format correctly
                if (scenario.applicableRanges && scenario.applicableRanges.length > 0) {
                  // Check if all ranges have the same pattern
                  const hasOnlyMinTemp = scenario.applicableRanges.every(r => 
                    r.minTemp !== null && r.minTemp !== undefined && 
                    (r.maxTemp === null || r.maxTemp === undefined)
                  );
                  const hasOnlyMaxTemp = scenario.applicableRanges.every(r => 
                    (r.minTemp === null || r.minTemp === undefined) && 
                    r.maxTemp !== null && r.maxTemp !== undefined
                  );
                  
                  if (hasOnlyMinTemp && scenario.applicableRanges.length === 1) {
                    // Only minTemp, show as "> minTemp"
                    const range = scenario.applicableRanges[0];
                    const minValue = units === 'metric' ? range.minTemp! : (range.minTemp! * 9/5) + 32;
                    const minRounded = Math.round(minValue);
                    return `> ${minRounded}${tempUnit}`;
                  } else if (hasOnlyMaxTemp && scenario.applicableRanges.length === 1) {
                    // Only maxTemp, show as "< maxTemp"
                    const range = scenario.applicableRanges[0];
                    const maxValue = units === 'metric' ? range.maxTemp! : (range.maxTemp! * 9/5) + 32;
                    const maxRounded = Math.round(maxValue);
                    return `< ${maxRounded}${tempUnit}`;
                  }
                }
                
                // Fallback to range display if both min and max are defined
                if (scenario.minTemp !== undefined && scenario.maxTemp !== undefined) {
                  const minValue = units === 'metric' ? scenario.minTemp : (scenario.minTemp * 9/5) + 32;
                  const maxValue = units === 'metric' ? scenario.maxTemp : (scenario.maxTemp * 9/5) + 32;
                  const minRounded = Math.round(minValue);
                  const maxRounded = Math.round(maxValue);
                  return `${minRounded}-${maxRounded}${tempUnit}`;
                }
                return formatTemp(scenario.temp);
              };
              
              return (
                <div key={idx} className="guide-scenario">
                  <div className="scenario-header">
                    <div className="scenario-conditions">
                      <span className="condition-badge temp">
                        {formatTempRange()}
                      </span>
                    </div>
                  </div>

                  <div className="scenario-clothing">
                    {renderCategory(recommendation.head, 'Head')}
                    {renderCategory(recommendation.neckFace, 'Neck/Face')}
                    {renderCategory(recommendation.chest, 'Chest')}
                    {renderCategory(recommendation.legs, 'Legs')}
                    {renderCategory(recommendation.hands, 'Hands')}
                    {renderCategory(recommendation.feet, 'Feet')}
                  </div>
                </div>
              );
            })}
            </div>
          </>
        )}
        </div>
      )}

      {/* Wind Section */}
      {hasWindContent && (
        <div className="guide-section">
          <div 
            className="section-header clickable"
            onClick={() => toggleSection('wind')}
          >
            <h3 className="section-title">Wind Variations</h3>
            <span className="section-toggle">
              {openSections.wind ? '▼' : '▶'}
            </span>
          </div>
        {openSections.wind && (
          <>
            <p className="section-description">Temperature: 10{tempUnit}, no rain - Showing only wind-specific items</p>
            <div className="guide-scenarios guide-scenarios-wind">
          {windScenarios.map((scenario, idx) => {
            // Get base recommendation without wind
            const baseWeather: WeatherSummary = {
              ...scenario.weather,
              maxWindSpeed: 5, // Very low wind
            };
            const baseRecommendation = recommendClothing(baseWeather, scenario.config);
            
            // Get recommendation with wind
            const windRecommendation = recommendClothing(scenario.weather, scenario.config);
            
            // Find differences - only items added by wind
            const getWindOnlyItems = (base: ClothingItem[], withWind: ClothingItem[]): ClothingItem[] => {
              const baseFlat = flattenItems(base);
              return withWind.filter(item => {
                if (typeof item === 'string') {
                  return !baseFlat.includes(item);
                } else if (typeof item === 'object' && item !== null && 'options' in item) {
                  return item.options.some(option => 
                    option.some(optItem => !baseFlat.includes(optItem))
                  );
                }
                return false;
              });
            };
            
            const windOnly = {
              head: getWindOnlyItems(baseRecommendation.head, windRecommendation.head),
              neckFace: getWindOnlyItems(baseRecommendation.neckFace, windRecommendation.neckFace),
              chest: getWindOnlyItems(baseRecommendation.chest, windRecommendation.chest),
              legs: getWindOnlyItems(baseRecommendation.legs, windRecommendation.legs),
              hands: getWindOnlyItems(baseRecommendation.hands, windRecommendation.hands),
              feet: getWindOnlyItems(baseRecommendation.feet, windRecommendation.feet),
            };
            
            return (
              <div key={idx} className="guide-scenario">
                <div className="scenario-header">
                  <div className="scenario-conditions">
                    <span className="condition-badge wind">
                      {formatWind(scenario.wind)}+
                    </span>
                  </div>
                </div>

                <div className="scenario-clothing">
                  {renderCategory(windOnly.head, 'Head')}
                  {renderCategory(windOnly.neckFace, 'Neck/Face')}
                  {renderCategory(windOnly.chest, 'Chest')}
                  {renderCategory(windOnly.legs, 'Legs')}
                  {renderCategory(windOnly.hands, 'Hands')}
                  {renderCategory(windOnly.feet, 'Feet')}
                </div>
              </div>
            );
          })}
            </div>
          </>
        )}
        </div>
      )}

      {/* Rain Section */}
      {hasRainContent && (
        <div className="guide-section">
          <div 
            className="section-header clickable"
            onClick={() => toggleSection('rain')}
          >
            <h3 className="section-title">Rain Variations</h3>
            <span className="section-toggle">
              {openSections.rain ? '▼' : '▶'}
            </span>
          </div>
        {openSections.rain && (
          <>
            <p className="section-description">Temperature: 10{tempUnit}, low wind (10 {windUnit}) - Showing only rain-specific items</p>
            <div className="guide-scenarios guide-scenarios-rain">
          {rainScenarios
            .map((scenario) => {
              // Get base recommendation without rain
              const baseWeather: WeatherSummary = {
                ...scenario.weather,
                maxRainProbability: 0,
                maxPrecipitationIntensity: 0,
              };
              const baseRecommendation = recommendClothing(baseWeather, scenario.config);
              
              // Get recommendation with rain
              const rainRecommendation = recommendClothing(scenario.weather, scenario.config);
              
              // Helper to flatten ClothingItem[] to string[] for comparison
              const flattenItemsLocal = (items: ClothingItem[]): string[] => {
                const result: string[] = [];
                items.forEach(item => {
                  if (typeof item === 'string') {
                    result.push(item);
                  } else if (typeof item === 'object' && item !== null && 'options' in item) {
                    item.options.forEach(option => {
                      option.forEach(optItem => result.push(optItem));
                    });
                  }
                });
                return result;
              };
              
              // Find differences - only items added by rain
              const getRainOnlyItems = (base: ClothingItem[], withRain: ClothingItem[]): ClothingItem[] => {
                const baseFlat = flattenItemsLocal(base);
                return withRain.filter(item => {
                  if (typeof item === 'string') {
                    return !baseFlat.includes(item);
                  } else if (typeof item === 'object' && item !== null && 'options' in item) {
                    return item.options.some(option => 
                      option.some(optItem => !baseFlat.includes(optItem))
                    );
                  }
                  return false;
                });
              };
              
              const rainOnly = {
                head: getRainOnlyItems(baseRecommendation.head, rainRecommendation.head),
                neckFace: getRainOnlyItems(baseRecommendation.neckFace, rainRecommendation.neckFace),
                chest: getRainOnlyItems(baseRecommendation.chest, rainRecommendation.chest),
                legs: getRainOnlyItems(baseRecommendation.legs, rainRecommendation.legs),
                hands: getRainOnlyItems(baseRecommendation.hands, rainRecommendation.hands),
                feet: getRainOnlyItems(baseRecommendation.feet, rainRecommendation.feet),
              };

              const hasItems = rainOnly.head.length > 0 ||
                               rainOnly.neckFace.length > 0 ||
                               rainOnly.chest.length > 0 ||
                               rainOnly.legs.length > 0 ||
                               rainOnly.hands.length > 0 ||
                               rainOnly.feet.length > 0;

              // Determine the range for this recommendation
              const getRainRange = () => {
                if (scenario.rain === 0) return '0%';
                if (scenario.rain <= 0.4) return `${Math.round(scenario.rain * 100)}%`;
                if (scenario.rain <= 0.7) return '40-70%';
                return '70%+';
              };

              return { scenario, rainOnly, hasItems, rainRange: getRainRange() };
            })
            .filter(({ hasItems }) => hasItems)
            .map(({ rainOnly, rainRange }, idx) => (
              <div key={idx} className="guide-scenario">
                <div className="scenario-header">
                  <div className="scenario-conditions">
                    <span className="condition-badge rain">
                      {rainRange}
                    </span>
                  </div>
                </div>

                <div className="scenario-clothing">
                  {renderCategory(rainOnly.head, 'Head')}
                  {renderCategory(rainOnly.neckFace, 'Neck/Face')}
                  {renderCategory(rainOnly.chest, 'Chest')}
                  {renderCategory(rainOnly.legs, 'Legs')}
                  {renderCategory(rainOnly.hands, 'Hands')}
                  {renderCategory(rainOnly.feet, 'Feet')}
                </div>
              </div>
            ))}
            </div>
          </>
        )}
        </div>
      )}

      {/* Create Wardrobe Modal */}
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px' }}>
                <input
                  type="radio"
                  checked={createFromScratch}
                  onChange={() => setCreateFromScratch(true)}
                />
                <span>Start from scratch</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={!createFromScratch}
                  onChange={() => setCreateFromScratch(false)}
                />
                <span>Base on existing wardrobe</span>
              </label>
            </div>
            {!createFromScratch && (
              <div className="form-group">
                <label htmlFor="baseWardrobe">Base Wardrobe</label>
                <select
                  id="baseWardrobe"
                  value={baseWardrobeId}
                  onChange={(e) => setBaseWardrobeId(e.target.value)}
                >
                  <option value="default">Default Wardrobe</option>
                  {wardrobes.map(wardrobe => (
                    <option key={wardrobe.id} value={wardrobe.id}>{wardrobe.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewWardrobeName('');
                  setCreateFromScratch(false);
                  setBaseWardrobeId('default');
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Wardrobe?</h3>
            <p>Are you sure you want to delete "{currentWardrobe.name}"? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDeleteWardrobe}
                style={{ backgroundColor: '#FF3B30' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      {showDeleteItemConfirm && itemToDelete && (
        <div className="modal-overlay" onClick={() => {
          setShowDeleteItemConfirm(false);
          setItemToDelete(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Item?</h3>
            <p>Are you sure you want to delete "{itemToDelete.name}"? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteItemConfirm(false);
                  setItemToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmDeleteItem}
                style={{ backgroundColor: '#FF3B30' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Edit Item Modal */}
      {editingItem && (
        <div className="modal-overlay" onClick={() => {
          setEditingItem(null);
          setEditItemError('');
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h3>Edit Clothing Item</h3>
            
            <div className="form-group">
              <label htmlFor="editItemName">Clothing Item Name</label>
              <input
                id="editItemName"
                type="text"
                value={editItemName}
                onChange={(e) => setEditItemName(e.target.value)}
                placeholder="e.g., Long-sleeve jersey"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="editBodyPart">Body Part</label>
              <select
                id="editBodyPart"
                value={editItemBodyPart}
                onChange={(e) => setEditItemBodyPart(e.target.value as typeof editItemBodyPart)}
              >
                <option value="head">Head</option>
                <option value="neckFace">Neck / Face</option>
                <option value="chest">Chest</option>
                <option value="legs">Legs</option>
                <option value="hands">Hands</option>
                <option value="feet">Feet</option>
              </select>
            </div>

            {editItemType === 'temp' && (
              <>
                <div className="form-group">
                  <label htmlFor="editMinTemp">Minimum Temperature (°C)</label>
                  <input
                    id="editMinTemp"
                    type="number"
                    value={editItemMinTemp}
                    onChange={(e) => setEditItemMinTemp(e.target.value)}
                    placeholder="e.g., 10"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editMaxTemp">Maximum Temperature (°C) - Optional</label>
                  <input
                    id="editMaxTemp"
                    type="number"
                    value={editItemMaxTemp}
                    onChange={(e) => setEditItemMaxTemp(e.target.value)}
                    placeholder="e.g., 15 (leave empty for no upper limit)"
                  />
                </div>
              </>
            )}

            {editItemType === 'wind' && (
              <div className="form-group">
                <label htmlFor="editMinWind">Minimum Wind Speed (km/h)</label>
                <input
                  id="editMinWind"
                  type="number"
                  value={editItemMinWind}
                  onChange={(e) => setEditItemMinWind(e.target.value)}
                  placeholder="e.g., 20"
                />
              </div>
            )}

            {editItemType === 'rain' && (
              <>
                <div className="form-group">
                  <label htmlFor="editMinRain">Minimum Rain Probability (%)</label>
                  <input
                    id="editMinRain"
                    type="number"
                    min="0"
                    max="100"
                    value={editItemMinRain}
                    onChange={(e) => setEditItemMinRain(e.target.value)}
                    placeholder="e.g., 40"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editMaxRain">Maximum Rain Probability (%) - Optional</label>
                  <input
                    id="editMaxRain"
                    type="number"
                    min="0"
                    max="100"
                    value={editItemMaxRain}
                    onChange={(e) => setEditItemMaxRain(e.target.value)}
                    placeholder="e.g., 70 (leave empty for no upper limit)"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editMaxTempRain">Maximum Temperature (°C) - Optional</label>
                  <input
                    id="editMaxTempRain"
                    type="number"
                    value={editItemMaxTempRain}
                    onChange={(e) => setEditItemMaxTempRain(e.target.value)}
                    placeholder="e.g., 15 (leave empty for all temperatures)"
                  />
                </div>
              </>
            )}

            {editItemError && (
              <div style={{ 
                color: '#FF3B30', 
                fontSize: '14px', 
                marginBottom: '16px',
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 59, 48, 0.2)'
              }}>
                {editItemError}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingItem(null);
                  setEditItemError('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveEditItem}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Clothing Piece Modal - Placeholder for now */}
      {showAddClothingModal && (
        <div className="modal-overlay" onClick={() => setShowAddClothingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Clothing Piece</h3>
            <p>This feature will be implemented next.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowAddClothingModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add First Clothing Modal */}
      {showAddFirstClothingModal && (
        <div className="modal-overlay" onClick={() => setShowAddFirstClothingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h3>Add Your First Piece of Clothing</h3>
            
            <div className="form-group">
              <label htmlFor="clothingName">Clothing Item Name</label>
              <input
                id="clothingName"
                type="text"
                value={newClothingName}
                onChange={(e) => setNewClothingName(e.target.value)}
                placeholder="e.g., Long-sleeve jersey"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="bodyPart">Body Part</label>
              <select
                id="bodyPart"
                value={newClothingBodyPart}
                onChange={(e) => setNewClothingBodyPart(e.target.value as typeof newClothingBodyPart)}
              >
                <option value="head">Head</option>
                <option value="neckFace">Neck / Face</option>
                <option value="chest">Chest</option>
                <option value="legs">Legs</option>
                <option value="hands">Hands</option>
                <option value="feet">Feet</option>
              </select>
            </div>

            <div className="form-group">
              <label>Type</label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={newClothingType === 'temp'}
                    onChange={() => setNewClothingType('temp')}
                  />
                  <span>Temperature</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={newClothingType === 'wind'}
                    onChange={() => setNewClothingType('wind')}
                  />
                  <span>Wind</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={newClothingType === 'rain'}
                    onChange={() => setNewClothingType('rain')}
                  />
                  <span>Rain</span>
                </label>
              </div>
            </div>

            {newClothingType === 'temp' && (
              <>
                <div className="form-group">
                  <label htmlFor="minTemp">Minimum Temperature (°C)</label>
                  <input
                    id="minTemp"
                    type="number"
                    value={newClothingMinTemp}
                    onChange={(e) => setNewClothingMinTemp(e.target.value)}
                    placeholder="e.g., 10"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="maxTemp">Maximum Temperature (°C) - Optional</label>
                  <input
                    id="maxTemp"
                    type="number"
                    value={newClothingMaxTemp}
                    onChange={(e) => setNewClothingMaxTemp(e.target.value)}
                    placeholder="e.g., 15 (leave empty for no upper limit)"
                  />
                </div>
              </>
            )}

            {newClothingType === 'wind' && (
              <div className="form-group">
                <label htmlFor="minWind">Minimum Wind Speed (km/h)</label>
                <input
                  id="minWind"
                  type="number"
                  value={newClothingMinWind}
                  onChange={(e) => setNewClothingMinWind(e.target.value)}
                  placeholder="e.g., 20"
                />
              </div>
            )}

            {newClothingType === 'rain' && (
              <>
                <div className="form-group">
                  <label htmlFor="minRain">Minimum Rain Probability (%)</label>
                  <input
                    id="minRain"
                    type="number"
                    min="0"
                    max="100"
                    value={newClothingMinRain}
                    onChange={(e) => setNewClothingMinRain(e.target.value)}
                    placeholder="e.g., 40"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="maxRain">Maximum Rain Probability (%) - Optional</label>
                  <input
                    id="maxRain"
                    type="number"
                    min="0"
                    max="100"
                    value={newClothingMaxRain}
                    onChange={(e) => setNewClothingMaxRain(e.target.value)}
                    placeholder="e.g., 70 (leave empty for no upper limit)"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="maxTempRain">Maximum Temperature (°C) - Optional</label>
                  <input
                    id="maxTempRain"
                    type="number"
                    value={newClothingMaxTempRain}
                    onChange={(e) => setNewClothingMaxTempRain(e.target.value)}
                    placeholder="e.g., 15 (only applies below this temp)"
                  />
                </div>
              </>
            )}

            {addClothingError && (
              <div style={{ 
                color: '#FF3B30', 
                fontSize: '14px', 
                marginBottom: '16px',
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 59, 48, 0.2)'
              }}>
                {addClothingError}
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddFirstClothingModal(false);
                  setNewClothingName('');
                  setNewClothingBodyPart('chest');
                  setNewClothingType('temp');
                  setNewClothingMinTemp('');
                  setNewClothingMaxTemp('');
                  setNewClothingMinWind('');
                  setNewClothingMinRain('');
                  setNewClothingMaxRain('');
                  setNewClothingMaxTempRain('');
                  setAddClothingError('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddFirstClothing}
              >
                Add Clothing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

