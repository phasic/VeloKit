import { WardrobeConfig } from '../types';
import clothingConfigData from '../logic/clothingConfig.json';

// Get the default wardrobe from the JSON config
export function getDefaultWardrobe(): WardrobeConfig {
  return {
    id: 'default',
    name: 'Default Wardrobe',
    isDefault: true,
    temperatureRanges: clothingConfigData.temperatureRanges,
    windModifiers: clothingConfigData.windModifiers,
    rainModifiers: clothingConfigData.rainModifiers,
    removableLayers: clothingConfigData.removableLayers,
  };
}

// Get the active wardrobe (selected custom or default)
export function getActiveWardrobe(wardrobes: WardrobeConfig[], selectedId: string | null): WardrobeConfig {
  if (!selectedId || selectedId === 'default') {
    return getDefaultWardrobe();
  }
  const custom = wardrobes.find(w => w.id === selectedId);
  return custom || getDefaultWardrobe();
}

