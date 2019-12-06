/* eslint-disable */

export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiYmFraXNoYSIsImEiOiJjazNvbzQxb3UwYTVyM2hvNHZvY2k1YW9oIn0.rwR8nAPAoDwXDqGg_eAz8Q';

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/bakisha/ck3oodu4b0emq1cnrm65qmcz0',
    scrollZoom: false
    // center: [19.843957, 45.255297],
    // zoom: 5.8
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(location => {
    // create marker
    const element = document.createElement('div');
    element.className = 'marker';

    // add marker
    new mapboxgl.Marker({
      element,
      anchor: 'bottom'
    })
      .setLngLat(location.coordinates)
      .addTo(map);

    // add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(location.coordinates)
      .setHTML(`<p>Day ${location.day}: ${location.description}</p>`)
      .addTo(map);

    // extend map bounds to include current location
    bounds.extend(location.coordinates);
  });

  map.fitBounds(bounds, {
    padding: { top: 200, bottom: 150, left: 100, right: 100 }
  });
};
