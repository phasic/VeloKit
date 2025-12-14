import { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import { recommendClothing } from '../logic/clothingEngine';
import { WeatherSummary, RideConfig, ClothingItem, WardrobeConfig } from '../types';
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showWardrobeSwitcher, setShowWardrobeSwitcher] = useState(false);
  const [switcherPosition, setSwitcherPosition] = useState<{ top: number; right: number } | null>(null);
  const [newWardrobeName, setNewWardrobeName] = useState('');
  const [createFromScratch, setCreateFromScratch] = useState(false);
  const [baseWardrobeId, setBaseWardrobeId] = useState<string>('default');
  const menuRef = useRef<HTMLDivElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);
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

  const isDefaultWardrobe = selectedWardrobeId === null || selectedWardrobeId === 'default';

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

  // Check if wardrobe is empty
  const isWardrobeEmpty = useMemo(() => {
    if (isDefaultWardrobe) return false; // Default wardrobe is never empty
    return currentWardrobe.temperatureRanges.length === 0 &&
           currentWardrobe.windModifiers.length === 0 &&
           currentWardrobe.rainModifiers.length === 0;
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

  // Calculate dropdown position when switcher opens
  useEffect(() => {
    if (showWardrobeSwitcher && switcherRef.current) {
      const rect = switcherRef.current.getBoundingClientRect();
      setSwitcherPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    } else {
      setSwitcherPosition(null);
    }
  }, [showWardrobeSwitcher]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
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
    setSelectedWardrobeId(wardrobeId);
    storage.setSelectedWardrobeId(wardrobeId);
    setShowWardrobeSwitcher(false);
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

  // Generate scenarios for temperature variations
  const generateTemperatureScenarios = () => {
    const temps = [25, 20, 16, 12, 8, 5, 2, -1, -3, -6];
    const scenarios: Array<{
      temp: number;
      wind: number;
      rain: number;
      weather: WeatherSummary;
      config: RideConfig;
    }> = [];

    temps.forEach(temp => {
      const weather: WeatherSummary = {
        minTemp: temp,
        maxTemp: temp + 2,
        minFeelsLike: temp,
        maxFeelsLike: temp + 2,
        maxWindSpeed: 10, // Low wind
        maxRainProbability: 0, // No rain
        maxPrecipitationIntensity: 0,
      };

      const config: RideConfig = {
        startTime: new Date(),
        durationHours: 2,
        units,
      };

      scenarios.push({ temp, wind: 10, rain: 0, weather, config });
    });

    return scenarios;
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
      const baseRecommendation = recommendClothing(baseWeather, config);
      const windRecommendation = recommendClothing(weather, config);
      
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
      const baseRecommendation = recommendClothing(baseWeather, config);
      const rainRecommendation = recommendClothing(weather, config);
      
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

  const tempScenarios = useMemo(() => generateTemperatureScenarios(), [units]);
  const windScenarios = useMemo(() => generateWindScenarios(), [units]);
  const rainScenarios = useMemo(() => generateRainScenarios(), [units]);
  const tempUnit = units === 'metric' ? '°C' : '°F';
  const windUnit = units === 'metric' ? 'km/h' : 'mph';

  // Helper function to get item type and temperature order
  const getItemOrder = (item: string): { type: 'temp' | 'wind' | 'rain', order: number } => {
    const itemLower = item.toLowerCase();
    
    // Wind-related items
    if (itemLower.includes('wind') || itemLower.includes('vest')) {
      return { type: 'wind', order: 1000 };
    }

    // Rain-related items
    if (itemLower.includes('rain') || itemLower.includes('waterproof')) {
      return { type: 'rain', order: 2000 };
    }

    // Temperature-related items - order by when they first appear (hot to cold)
    // Order based on temperature thresholds: >21, >15, >10, >7, >4, >1, >-1, >-4, <=-4
    const tempOrderMap: { [key: string]: number } = {
      // Hot (>21C)
      'short-sleeve jersey': 1,
      'shorts': 2,
      // Warm (>15C)
      'long-sleeve jersey': 10,
      // Cool (>10C)
      'heavy long-sleeve jersey': 20,
      'lightweight long-sleeve jersey': 21,
      'tights or leg warmers': 22,
      'sleeveless or short-sleeve wicking undershirt': 23,
      'long-sleeve undershirt': 24,
      // Cold (>7C)
      'headband covering ears': 30,
      'long-sleeve wicking undershirt': 31,
      'lined cycling jacket': 32,
      'thin full-fingered gloves': 33,
      'wool socks': 34,
      'shoe covers': 35,
      // Very cold (>4C)
      'long-sleeve heavy mock turtleneck undershirt': 40,
      'medium-weight gloves': 41,
      'winter cycling shoes': 42,
      // Freezing (>1C)
      'long-sleeve heavy wicking turtleneck undershirt': 50,
      'heavy cycling jacket': 51,
      'heavyweight tights': 52,
      'heavy-weight gloves': 53,
      'wool socks with charcoal toe warmers': 54,
      // Below freezing (>-1C)
      'lined skullcap': 60,
      // Extreme cold (>-4C)
      'balaclava': 70,
      'long-sleeve heavy wicking full turtleneck undershirt': 71,
      'winter bib tights': 72,
      'mittens or lobster claw gloves': 73,
      'plastic bag': 74,
      'charcoal toe warmers': 75,
    };

    // Find matching order
    for (const [key, order] of Object.entries(tempOrderMap)) {
      if (itemLower.includes(key.toLowerCase())) {
        return { type: 'temp', order };
      }
    }

    // Default temperature item (fallback)
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
    tempScenarios.forEach(scenario => {
      const rec = recommendClothing(scenario.weather, scenario.config);
      rec.head.forEach(item => addItem(items.head, item));
      rec.neckFace.forEach(item => addItem(items.neckFace, item));
      rec.chest.forEach(item => addItem(items.chest, item));
      rec.legs.forEach(item => addItem(items.legs, item));
      rec.hands.forEach(item => addItem(items.hands, item));
      rec.feet.forEach(item => addItem(items.feet, item));
    });

    // Collect from wind scenarios
    windScenarios.forEach(scenario => {
      const rec = recommendClothing(scenario.weather, scenario.config);
      rec.head.forEach(item => addItem(items.head, item));
      rec.neckFace.forEach(item => addItem(items.neckFace, item));
      rec.chest.forEach(item => addItem(items.chest, item));
      rec.legs.forEach(item => addItem(items.legs, item));
      rec.hands.forEach(item => addItem(items.hands, item));
      rec.feet.forEach(item => addItem(items.feet, item));
    });

    // Collect from rain scenarios
    rainScenarios.forEach(scenario => {
      const rec = recommendClothing(scenario.weather, scenario.config);
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
      const rec = recommendClothing(scenario.weather, scenario.config);
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
      const baseRecommendation = recommendClothing(baseWeather, scenario.config);
      const windRecommendation = recommendClothing(scenario.weather, scenario.config);
      
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
      const baseRecommendation = recommendClothing(baseWeather, scenario.config);
      const rainRecommendation = recommendClothing(scenario.weather, scenario.config);
      
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
        <div className="current-wardrobe-card">
          <div className="current-wardrobe-info">
            <h3 className="current-wardrobe-name">{currentWardrobe.name}</h3>
            {isDefaultWardrobe && (
              <span className="wardrobe-badge">Default</span>
            )}
          </div>
          <div className="wardrobe-actions">
            {hasMultipleWardrobes && (
              <div className="wardrobe-switcher-container" ref={switcherRef}>
                <button
                  type="button"
                  className="wardrobe-switcher-button"
                  onClick={() => setShowWardrobeSwitcher(!showWardrobeSwitcher)}
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
                onClick={() => setShowMenu(!showMenu)}
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
                    setShowAddClothingModal(true);
                    setShowMenu(false);
                  }}
                  disabled={isDefaultWardrobe}
                >
                  Add clothing piece
                </button>
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
                <button
                  type="button"
                  className="menu-item menu-item-danger"
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowMenu(false);
                  }}
                  disabled={isDefaultWardrobe}
                >
                  Delete wardrobe
                </button>
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
            Start adding clothes by clicking the menu button (⋮) next to your wardrobe name above, then select "Add clothing piece".
          </p>
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
                      {group.items.map((item, idx) => {
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
                                    <li key={`${optionIdx}-${itemIdx}`} className={optionIdx > 0 ? "option-item" : ""}>
                                      {optionItem}
                                    </li>
                                  ))}
                                </Fragment>
                              ))}
                            </Fragment>
                          );
                        }
                        return <li key={idx}>{item}</li>;
                      })}
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
                      {group.items.map((item, idx) => {
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
                                    <li key={`${optionIdx}-${itemIdx}`} className={optionIdx > 0 ? "option-item" : ""}>
                                      {optionItem}
                                    </li>
                                  ))}
                                </Fragment>
                              ))}
                            </Fragment>
                          );
                        }
                        return <li key={idx}>{item}</li>;
                      })}
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
                      {group.items.map((item, idx) => {
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
                                    <li key={`${optionIdx}-${itemIdx}`} className={optionIdx > 0 ? "option-item" : ""}>
                                      {optionItem}
                                    </li>
                                  ))}
                                </Fragment>
                              ))}
                            </Fragment>
                          );
                        }
                        return <li key={idx}>{item}</li>;
                      })}
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
                      {group.items.map((item, idx) => {
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
                                    <li key={`${optionIdx}-${itemIdx}`} className={optionIdx > 0 ? "option-item" : ""}>
                                      {optionItem}
                                    </li>
                                  ))}
                                </Fragment>
                              ))}
                            </Fragment>
                          );
                        }
                        return <li key={idx}>{item}</li>;
                      })}
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
                      {group.items.map((item, idx) => {
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
                                    <li key={`${optionIdx}-${itemIdx}`} className={optionIdx > 0 ? "option-item" : ""}>
                                      {optionItem}
                                    </li>
                                  ))}
                                </Fragment>
                              ))}
                            </Fragment>
                          );
                        }
                        return <li key={idx}>{item}</li>;
                      })}
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
                      {group.items.map((item, idx) => {
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
                                    <li key={`${optionIdx}-${itemIdx}`} className={optionIdx > 0 ? "option-item" : ""}>
                                      {optionItem}
                                    </li>
                                  ))}
                                </Fragment>
                              ))}
                            </Fragment>
                          );
                        }
                        return <li key={idx}>{item}</li>;
                      })}
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
          {tempScenarios.map((scenario, idx) => {
            const recommendation = recommendClothing(scenario.weather, scenario.config);
            
            return (
              <div key={idx} className="guide-scenario">
                <div className="scenario-header">
                  <div className="scenario-conditions">
                    <span className="condition-badge temp">
                      {formatTemp(scenario.temp)}
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
          {rainScenarios.map((scenario, idx) => {
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
            
            // Determine the range for this recommendation
            const getRainRange = () => {
              if (scenario.rain === 0) return '0%';
              if (scenario.rain <= 0.4) return `${Math.round(scenario.rain * 100)}%`;
              if (scenario.rain <= 0.7) return '40-70%';
              return '70%+';
            };
            
            return (
              <div key={idx} className="guide-scenario">
                <div className="scenario-header">
                  <div className="scenario-conditions">
                    <span className="condition-badge rain">
                      {getRainRange()}
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
            );
          })}
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
    </div>
  );
}

