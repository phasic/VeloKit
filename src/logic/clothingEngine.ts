import { WeatherSummary, ClothingRecommendation, RideConfig, WardrobeConfig } from '../types';
import { storage } from '../utils/storage';
import { getActiveWardrobe } from '../utils/wardrobeUtils';

type ClothingItem = string | { options: string[][] };

interface ClothingItems {
  head?: ClothingItem[];
  neckFace?: ClothingItem[];
  chest?: ClothingItem[];
  legs?: ClothingItem[];
  hands?: ClothingItem[];
  feet?: ClothingItem[];
}

interface TemperatureRange {
  minTemp: number | null;
  maxTemp?: number | null;
  items: ClothingItems;
  explanation: string;
}

interface WindModifier {
  minWindSpeed: number;
  items: ClothingItems;
  explanation: string;
}

interface RainModifier {
  minRainProbability: number;
  maxRainProbability?: number;
  maxTemp?: number;
  items: ClothingItems;
  explanation: string;
}

interface ClothingConfig {
  temperatureRanges: TemperatureRange[];
  windModifiers: WindModifier[];
  rainModifiers: RainModifier[];
  removableLayers: {
    maxStartTemp: number;
    explanation: string;
  };
}

// Get the active wardrobe configuration
function getClothingConfig(wardrobeOverride?: WardrobeConfig): ClothingConfig {
  // If a wardrobe is provided, use it directly (for React state updates)
  // Otherwise, read from storage (for backward compatibility)
  const activeWardrobe = wardrobeOverride || (() => {
    const wardrobes = storage.getWardrobes();
    const selectedId = storage.getSelectedWardrobeId();
    return getActiveWardrobe(wardrobes, selectedId);
  })();
  
  return {
    temperatureRanges: activeWardrobe.temperatureRanges,
    windModifiers: activeWardrobe.windModifiers,
    rainModifiers: activeWardrobe.rainModifiers,
    removableLayers: activeWardrobe.removableLayers,
  };
}

function matchesTemperatureRange(range: TemperatureRange, temp: number): boolean {
  const minMatch = range.minTemp === null || temp > range.minTemp;
  const maxMatch = range.maxTemp === null || range.maxTemp === undefined || temp <= range.maxTemp;
  return minMatch && maxMatch;
}

function matchesWindModifier(modifier: WindModifier, wind: number): boolean {
  return wind > modifier.minWindSpeed;
}

function matchesRainModifier(modifier: RainModifier, rainProb: number, temp: number): boolean {
  const probMatch = rainProb * 100 >= modifier.minRainProbability &&
    (modifier.maxRainProbability === undefined || rainProb * 100 < modifier.maxRainProbability);
  const tempMatch = modifier.maxTemp === undefined || temp < modifier.maxTemp;
  return probMatch && tempMatch;
}

function addItemsToCategory(
  target: ClothingItem[],
  items: ClothingItem[] | undefined
): void {
  if (items) {
    target.push(...items);
  }
}

export function recommendClothing(
  weather: WeatherSummary,
  config: RideConfig,
  wardrobeOverride?: WardrobeConfig
): ClothingRecommendation {
  const { minFeelsLike, maxWindSpeed, maxRainProbability, minTemp } = weather;
  const isMetric = config.units === 'metric';
  
  // Convert to metric if needed for calculations
  const temp = isMetric ? minFeelsLike : (minFeelsLike - 32) * 5/9;
  const wind = isMetric ? maxWindSpeed : maxWindSpeed * 1.60934; // mph to km/h
  const startTemp = isMetric ? minTemp : (minTemp - 32) * 5/9;

  const head: ClothingItem[] = [];
  const neckFace: ClothingItem[] = [];
  const chest: ClothingItem[] = [];
  const legs: ClothingItem[] = [];
  const hands: ClothingItem[] = [];
  const feet: ClothingItem[] = [];
  const explanation: string[] = [];

  // Get the active wardrobe configuration
  // Use wardrobeOverride if provided (for React state), otherwise read from storage
  const clothingConfig = getClothingConfig(wardrobeOverride);

  // Find matching temperature range
  const tempRange = clothingConfig.temperatureRanges.find(range =>
    matchesTemperatureRange(range, temp)
  );

  if (tempRange) {
    addItemsToCategory(head, tempRange.items.head);
    addItemsToCategory(neckFace, tempRange.items.neckFace);
    addItemsToCategory(chest, tempRange.items.chest);
    addItemsToCategory(legs, tempRange.items.legs);
    addItemsToCategory(hands, tempRange.items.hands);
    addItemsToCategory(feet, tempRange.items.feet);
    if (tempRange.explanation) {
      explanation.push(tempRange.explanation);
    }
  }

  // Apply wind modifiers
  for (const modifier of clothingConfig.windModifiers) {
    if (matchesWindModifier(modifier, wind)) {
      addItemsToCategory(head, modifier.items.head);
      addItemsToCategory(neckFace, modifier.items.neckFace);
      addItemsToCategory(chest, modifier.items.chest);
      addItemsToCategory(legs, modifier.items.legs);
      addItemsToCategory(hands, modifier.items.hands);
      addItemsToCategory(feet, modifier.items.feet);
      if (modifier.explanation) {
        explanation.push(modifier.explanation);
      }
    }
  }

  // Apply rain modifiers
  for (const modifier of clothingConfig.rainModifiers) {
    if (matchesRainModifier(modifier, maxRainProbability, temp)) {
      addItemsToCategory(head, modifier.items.head);
      addItemsToCategory(neckFace, modifier.items.neckFace);
      addItemsToCategory(chest, modifier.items.chest);
      addItemsToCategory(legs, modifier.items.legs);
      addItemsToCategory(hands, modifier.items.hands);
      addItemsToCategory(feet, modifier.items.feet);
      if (modifier.explanation) {
        explanation.push(modifier.explanation);
      }
    }
  }

  // Removable layers suggestion
  if (startTemp < clothingConfig.removableLayers.maxStartTemp) {
    explanation.push(clothingConfig.removableLayers.explanation);
  }

  return {
    head,
    neckFace,
    chest,
    legs,
    hands,
    feet,
    explanation,
  };
}

