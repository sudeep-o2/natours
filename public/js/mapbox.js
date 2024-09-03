/* eslint-disable */
const locations = JSON.parse(document.getElementById('map').dataset.locations);
// console.log(locations);

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoibG9yZC1vMiIsImEiOiJjbTBkczFicHgwZWtuMmxxdjA3MDVrbWNhIn0.nZYdnHOwvSUfatFUmQkB_Q';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/lord-o2/cm0dz85x8002g01pe3zfz4kg3',
    //   center: [-118.458534, 33.984221],
    //   zoom: 15,
    //   interactive: false,
    //   scrollZoom: false,
  });

  // area to be displayed on map
  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({ offset: 30 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p> Day ${loc.day}:${loc.description}</p>`)
      .addTo(map);

    // Extend map bound to include current location
    bounds.extend(loc.coordinates);
  });

  //and we can also fit the map according to markers using padding
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });

  // to disable scroll on map
  map.scrollZoom.disable();
};
