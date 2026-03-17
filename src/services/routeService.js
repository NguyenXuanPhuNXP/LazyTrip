const addressCache = new Map();
const pendingRequests = new Map();
let nominatimLock = Promise.resolve();

/**
 * Convert coordinates (lat, lng) to address using OpenStreetMap Nominatim
 */
export async function getAddressFromCoords(lat, lng) {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (addressCache.has(key)) return addressCache.get(key);

  const fetchAddress = async () => {
    await nominatimLock;
    let releaseLock;
    nominatimLock = new Promise(resolve => { releaseLock = resolve; });

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      const address = data.address?.road || data.address?.city || data.display_name || key;
      addressCache.set(key, address);
      return address;
    } catch (error) {
      console.error("Error getting address from coordinates:", error);
      return key;
    } finally {
      setTimeout(releaseLock, 1000); // Enforce 1 second delay between Nominatim calls
    }
  };

  if (!pendingRequests.has(key)) {
    pendingRequests.set(key, fetchAddress().finally(() => pendingRequests.delete(key)));
  }
  return pendingRequests.get(key);
}

/**
 * Convert address to coordinates using OpenStreetMap Nominatim
 */
export async function getCoordsFromAddress(address) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=vn`
    );
    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting coordinates from address:", error);
    return null;
  }
}

/**
 * Calculate route between waypoints using OSRM (Open Source Routing Machine)
 */
export async function calculateRoute(waypoints, transportMode = "driving") {
  try {
    if (!waypoints || waypoints.length < 2) {
      return null;
    }

    const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;
    const response = await fetch(`${API_BASE_URL}/api/navigate/multiple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ waypoints, vehicle: transportMode }),
    });

    if (!response.ok) {
      throw new Error('Failed to calculate route from backend');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error calculating route:", error);
    return null;
  }
}

/**
 * Calculate route between waypoints using local fast OSRM request for instant feedback
 */
export async function calculateOptimisticRoute(waypoints, transportMode = "driving") {
  try {
    if (!waypoints || waypoints.length < 2) return null;
    let profile = "driving";
    if (["motorcycle", "motorbike", "bike", "cycling"].includes(transportMode)) profile = "bike";
    if (["foot", "pedestrian"].includes(transportMode)) profile = "foot";

    // Lọc và chèn tuyến đường đi Nội địa (tránh đi qua Lào)
    let routeWaypoints = [...waypoints];
    const minLat = Math.min(...routeWaypoints.map(p => p.lat));
    const maxLat = Math.max(...routeWaypoints.map(p => p.lat));
    if (minLat < 14.5 && maxLat > 17.5) {
      const hasMid = routeWaypoints.some(p => p.lat >= 14.5 && p.lat <= 17.5);
      if (!hasMid) {
        const isSouthToNorth = routeWaypoints[0].lat < routeWaypoints[routeWaypoints.length - 1].lat;
        const nhaTrang = { lat: 12.2388, lng: 109.1967 };
        const daNang = { lat: 16.0544, lng: 108.2022 };
        const hue = { lat: 16.4637, lng: 107.5905 };
        const vinh = { lat: 18.6734, lng: 105.6813 };

        const chain = isSouthToNorth ? [nhaTrang, daNang, hue, vinh] : [vinh, hue, daNang, nhaTrang];
        routeWaypoints.splice(1, 0, ...chain);
      }
    }

    // Format for OSRM route API: lng,lat;lng,lat...
    const coords = routeWaypoints.map(p => `${p.lng},${p.lat}`).join(';');
    const response = await fetch(`https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`);
    if (!response.ok) return null;
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceKm = route.distance / 1000;

      const speed_car = 35.0;
      const speed_motorbike = 40.0;
      const speed_bike = 15.0;
      const speed_pedestrian = 5.0;

      const formatTime = (hours) => {
        if (hours <= 0) return "0 phút";
        let totalMinutes = Math.round(hours * 60);
        if (totalMinutes === 0 && hours > 0) totalMinutes = 1;
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        if (h > 0) return `${h} giờ ${m} phút`;
        return `${m} phút`;
      };

      const travelTimes = {
        car: formatTime(distanceKm / speed_car),
        motorbike: formatTime(distanceKm / speed_motorbike),
        bike: formatTime(distanceKm / speed_bike),
        pedestrian: formatTime(distanceKm / speed_pedestrian)
      };

      const route_points = route.geometry.coordinates.map(c => [c[1], c[0]]);

      const segments = [];
      if (route.legs) {
        route.legs.forEach((leg) => {
          const legDistKm = leg.distance / 1000;
          let speed = speed_car;
          if (profile === "bike" && ["bike", "cycling"].includes(transportMode)) speed = speed_bike;
          else if (profile === "bike") speed = speed_motorbike;
          if (profile === "foot") speed = speed_pedestrian;

          segments.push({
            distance: `${legDistKm.toFixed(1)} km`,
            time: formatTime(legDistKm / speed),
            weather: null,
            floodRisk: null
          });
        });
      }

      return {
        totalDistance: `${distanceKm.toFixed(1)} km`,
        travelTimes,
        route_points,
        segments
      };
    }
  } catch (error) {
    console.error("Optimistic route error:", error);
  }
  return null;
}
