import { useState, useMemo } from 'react';
import { recommendClothing } from '../logic/clothingEngine';
import { WeatherSummary, RideConfig } from '../types';
import './ClothingGuide.css';

interface GuideProps {
  onBack?: () => void;
}

export function ClothingGuide({}: GuideProps) {
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
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
      const getWindOnlyItems = (base: string[], withWind: string[]) => {
        return withWind.filter(item => !base.includes(item));
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
      const getRainOnlyItems = (base: string[], withRain: string[]) => {
        return withRain.filter(item => !base.includes(item));
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

    // Collect from temperature scenarios
    tempScenarios.forEach(scenario => {
      const rec = recommendClothing(scenario.weather, scenario.config);
      rec.head.forEach(item => items.head.add(item));
      rec.neckFace.forEach(item => items.neckFace.add(item));
      rec.chest.forEach(item => items.chest.add(item));
      rec.legs.forEach(item => items.legs.add(item));
      rec.hands.forEach(item => items.hands.add(item));
      rec.feet.forEach(item => items.feet.add(item));
    });

    // Collect from wind scenarios
    windScenarios.forEach(scenario => {
      const rec = recommendClothing(scenario.weather, scenario.config);
      rec.head.forEach(item => items.head.add(item));
      rec.neckFace.forEach(item => items.neckFace.add(item));
      rec.chest.forEach(item => items.chest.add(item));
      rec.legs.forEach(item => items.legs.add(item));
      rec.hands.forEach(item => items.hands.add(item));
      rec.feet.forEach(item => items.feet.add(item));
    });

    // Collect from rain scenarios
    rainScenarios.forEach(scenario => {
      const rec = recommendClothing(scenario.weather, scenario.config);
      rec.head.forEach(item => items.head.add(item));
      rec.neckFace.forEach(item => items.neckFace.add(item));
      rec.chest.forEach(item => items.chest.add(item));
      rec.legs.forEach(item => items.legs.add(item));
      rec.hands.forEach(item => items.hands.add(item));
      rec.feet.forEach(item => items.feet.add(item));
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
  }, [tempScenarios, windScenarios, rainScenarios]);

  // Helper function to determine emoji for clothing items
  const getItemEmoji = (item: string): string => {
    const itemLower = item.toLowerCase();
    
    // Wind-related items
    if (itemLower.includes('wind') || itemLower.includes('vest')) {
      return '💨'; // Wind emoji
    }

    // Rain-related items
    if (itemLower.includes('rain') || itemLower.includes('waterproof')) {
      return '🌧️'; // Rain emoji
    }

    // Everything else is temperature-related
    return '🌡️'; // Temperature gauge emoji
  };

  const formatTemp = (temp: number) => {
    const displayTemp = units === 'metric' ? temp : (temp * 9/5) + 32;
    return Math.round(displayTemp) + tempUnit;
  };

  const formatWind = (wind: number) => {
    const displayWind = units === 'metric' ? wind : wind * 0.621371;
    return Math.round(displayWind) + ' ' + windUnit;
  };

  const renderCategory = (items: string[], title: string) => {
    if (items.length === 0) return null;
    return (
      <div className="guide-category">
        <strong>{title}:</strong> {items.join(', ')}
      </div>
    );
  };

  return (
    <div className="page clothing-guide">
      <div className="guide-header">
        <h2>Wardrobe</h2>
        <div className="guide-controls">
          <label>
            Units:
            <select value={units} onChange={(e) => setUnits(e.target.value as 'metric' | 'imperial')}>
              <option value="metric">°C / km/h</option>
              <option value="imperial">°F / mph</option>
            </select>
          </label>
        </div>
      </div>

      <p className="guide-intro">
        Complete overview of clothing recommendations organized by temperature, wind, and rain conditions.
      </p>

      {/* All Clothing Items Section */}
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
                <ul>
                  {allUniqueItems.head.map((item, idx) => (
                    <li key={idx}>
                      <span className="item-emoji">{getItemEmoji(item)}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {allUniqueItems.neckFace.length > 0 && (
              <div className="quick-kit">
                <h3>Neck / Face</h3>
                <ul>
                  {allUniqueItems.neckFace.map((item, idx) => (
                    <li key={idx}>
                      <span className="item-emoji">{getItemEmoji(item)}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {allUniqueItems.chest.length > 0 && (
              <div className="quick-kit">
                <h3>Chest</h3>
                <ul>
                  {allUniqueItems.chest.map((item, idx) => (
                    <li key={idx}>
                      <span className="item-emoji">{getItemEmoji(item)}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {allUniqueItems.legs.length > 0 && (
              <div className="quick-kit">
                <h3>Legs</h3>
                <ul>
                  {allUniqueItems.legs.map((item, idx) => (
                    <li key={idx}>
                      <span className="item-emoji">{getItemEmoji(item)}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {allUniqueItems.hands.length > 0 && (
              <div className="quick-kit">
                <h3>Hands</h3>
                <ul>
                  {allUniqueItems.hands.map((item, idx) => (
                    <li key={idx}>
                      <span className="item-emoji">{getItemEmoji(item)}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {allUniqueItems.feet.length > 0 && (
              <div className="quick-kit">
                <h3>Feet</h3>
                <ul>
                  {allUniqueItems.feet.map((item, idx) => (
                    <li key={idx}>
                      <span className="item-emoji">{getItemEmoji(item)}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Temperature Section */}
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

      {/* Wind Section */}
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
            const getWindOnlyItems = (base: string[], withWind: string[]) => {
              return withWind.filter(item => !base.includes(item));
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

      {/* Rain Section */}
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
            
            // Find differences - only items added by rain
            const getRainOnlyItems = (base: string[], withRain: string[]) => {
              return withRain.filter(item => !base.includes(item));
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

    </div>
  );
}

