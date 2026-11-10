
export interface LocationData {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          
          // Use reverse geocoding to get actual location data
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (!response.ok) {
            throw new Error('Failed to fetch location data');
          }
          
          const data = await response.json();
          
          const locationData: LocationData = {
            city: data.city || data.locality || data.principalSubdivision || 'Unknown City',
            state: data.principalSubdivision || data.countryName || 'Unknown State',
            country: data.countryName || 'Unknown Country',
            latitude,
            longitude
          };
          
          console.log('Location data fetched:', locationData);
          resolve(locationData);
        } catch (error) {
          console.error('Error fetching location data:', error);
          // Fallback to coordinates only if reverse geocoding fails
          const fallbackLocationData: LocationData = {
            city: 'Current Location',
            state: 'Your Area',
            country: 'Your Country',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          resolve(fallbackLocationData);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000, // 10 minutes
      }
    );
  });
};
