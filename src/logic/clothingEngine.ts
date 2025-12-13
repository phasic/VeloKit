import { WeatherSummary, ClothingRecommendation, RideConfig } from '../types';

export function recommendClothing(
  weather: WeatherSummary,
  config: RideConfig
): ClothingRecommendation {
  const { minFeelsLike, maxWindSpeed, maxRainProbability, minTemp } = weather;
  const isMetric = config.units === 'metric';
  
  // Convert to metric if needed for calculations
  const temp = isMetric ? minFeelsLike : (minFeelsLike - 32) * 5/9;
  const wind = isMetric ? maxWindSpeed : maxWindSpeed * 1.60934; // mph to km/h
  const startTemp = isMetric ? minTemp : (minTemp - 32) * 5/9;

  const head: string[] = [];
  const neckFace: string[] = [];
  const chest: string[] = [];
  const legs: string[] = [];
  const hands: string[] = [];
  const feet: string[] = [];
  const explanation: string[] = [];

  // Base logic based on minimum "feels like" temperature
  if (temp > 21) {
    chest.push('Short-sleeve jersey');
    legs.push('Shorts');
    explanation.push('Warm conditions - lightweight kit');
  } else if (temp > 15) {
    chest.push('Long-sleeve jersey');
    legs.push('Shorts');
    explanation.push('Moderate conditions - long sleeves for comfort');
  } else if (temp > 10) {
    chest.push('Heavy long-sleeve jersey with sleeveless or short-sleeve wicking undershirt');
    chest.push('OR lightweight long-sleeve jersey with long-sleeve undershirt');
    legs.push('Tights or leg warmers');
    explanation.push('Cool conditions - base layers and leg coverage needed');
  } else if (temp > 7) {
    head.push('Headband covering ears');
    chest.push('Long-sleeve wicking undershirt');
    chest.push('Lined cycling jacket');
    legs.push('Tights or leg warmers');
    hands.push('Thin full-fingered gloves');
    feet.push('Wool socks');
    feet.push('Shoe covers');
    explanation.push('Cold conditions - full coverage with gloves and head protection');
  } else if (temp > 4) {
    head.push('Headband covering ears');
    chest.push('Long-sleeve heavy mock turtleneck undershirt');
    chest.push('Lined cycling jacket');
    legs.push('Tights or leg warmers');
    hands.push('Medium-weight gloves');
    feet.push('Winter cycling shoes');
    feet.push('Shoe covers');
    feet.push('Wool socks');
    explanation.push('Very cold conditions - heavy base layers and winter gear');
  } else if (temp > 1) {
    head.push('Headband covering ears');
    chest.push('Long-sleeve heavy wicking turtleneck undershirt');
    chest.push('Heavy cycling jacket');
    legs.push('Heavyweight tights');
    hands.push('Heavy-weight gloves');
    feet.push('Winter cycling shoes');
    feet.push('Shoe covers');
    feet.push('Wool socks with charcoal toe warmers');
    explanation.push('Very cold conditions - near freezing, maximum protection needed');
  } else if (temp > -1) {
    head.push('Lined skullcap');
    chest.push('Long-sleeve heavy wicking turtleneck undershirt');
    chest.push('Heavy cycling jacket');
    legs.push('Heavyweight tights');
    hands.push('Heavy-weight gloves');
    feet.push('Winter cycling shoes');
    feet.push('Shoe covers');
    feet.push('Wool socks with charcoal toe warmers');
    explanation.push('Below freezing - skullcap for head protection');
  } else if (temp > -4) {
    neckFace.push('Balaclava');
    chest.push('Long-sleeve heavy wicking full turtleneck undershirt');
    chest.push('Long-sleeve jersey');
    chest.push('Lined cycling jacket');
    legs.push('Winter bib tights');
    hands.push('Mittens or lobster claw gloves');
    feet.push('Winter cycling shoes');
    feet.push('Wool socks');
    feet.push('Plastic bag');
    feet.push('Charcoal toe warmers');
    explanation.push('Extreme cold - maximum protection with balaclava and mittens');
  } else {
    // -4°C and below
    neckFace.push('Balaclava');
    chest.push('Long-sleeve heavy wicking full turtleneck undershirt');
    chest.push('Long-sleeve jersey');
    chest.push('Lined cycling jacket');
    legs.push('Winter bib tights');
    hands.push('Mittens or lobster claw gloves');
    feet.push('Winter cycling shoes');
    feet.push('Wool socks');
    feet.push('Plastic bag');
    feet.push('Charcoal toe warmers');
    explanation.push('Severe cold - full winter protection essential');
  }

  // Wind modifier
  if (wind > 20) {
    chest.push('Wind vest');
    explanation.push('High wind conditions - wind protection needed');
  }

  // Rain modifiers
  const rainProbPercent = maxRainProbability * 100;
  if (rainProbPercent > 70 && temp < 15) {
    chest.push('Waterproof jacket');
    explanation.push('Heavy rain expected - waterproof protection essential');
  } else if (rainProbPercent > 40) {
    chest.push('Rain jacket');
    explanation.push('Rain likely - rain protection recommended');
  }

  // Removable layers suggestion
  if (startTemp < 10) {
    explanation.push('Start temperature is cold - consider removable layers for warming up');
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

