/* localized $ name for jQuery, map view */
var meetupapp = meetupapp || {};

(function ($) {
  'use strict';
  console.log("map.js");

  // Create a styles array to use with the map.
  var styles = [{
    featureType: 'water',
    stylers: [{
      color: '#19a0d8'
    }]
  }, {
    featureType: 'administrative',
    elementType: 'labels.text.stroke',
    stylers: [{
      color: '#ffffff'
    }, {
      weight: 6
    }]
  }, {
    featureType: 'administrative',
    elementType: 'labels.text.fill',
    stylers: [{
      color: '#e85113'
    }]
  }, {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{
      color: '#efe9e4'
    }, {
      lightness: -40
    }]
  }, {
    featureType: 'transit.station',
    stylers: [{
      weight: 9
    }, {
      hue: '#e85113'
    }]
  }, {
    featureType: 'road.highway',
    elementType: 'labels.icon',
    stylers: [{
      visibility: 'off'
    }]
  }, {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{
      lightness: 100
    }]
  }, {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{
      lightness: -100
    }]
  }, {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{
      visibility: 'on'
    }, {
      color: '#f0e4d3'
    }]
  }, {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{
      color: '#efe9e4'
    }, {
      lightness: -25
    }]
  }];

  // This function takes in a COLOR, and then creates a new marker
  // icon of that color. The icon will be 21 px wide by 34 high, have an origin
  // of 0, 0 and be anchored at 10, 34).
  function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
      'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
      '|40|_|%E2%80%A2',
      new google.maps.Size(21, 34),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(21, 34));
    return markerImage;
  };

  meetupapp.setLocationFilterMarker = function (location) {
    var position = new google.maps.LatLng(location);
    if (meetupapp.locationFilterMarker) {
      meetupapp.locationFilterMarker.setMap(null);
      meetupapp.locationFilterMarker.position = position;
    } else {
      var locationFilterIcon = makeMarkerIcon('f00');
      console.log("Setting location filter marker", location);
      meetupapp.locationFilterMarker = new google.maps.Marker({
        position,
        title: "Your Search Location",
        animation: google.maps.Animation.DROP,
        icon: locationFilterIcon
      });
    };
    console.log("Setting map for search location marker");
    meetupapp.locationFilterMarker.setMap(meetupapp.map);
  };

  meetupapp.showMarker = function (id, show) {
    meetupapp.markers[id].setMap(
      show ? meetupapp.map : null);
  };

  // This function populates the infowindow when the marker is clicked. We'll only allow
  // one infowindow which will open at the marker that is clicked, and populate based
  // on that markers position.
  meetupapp.populateInfoWindow = function (marker, event, infowindow) {

    function toggleBounce(marker) {
      if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
      } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
      }
    }

    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
      infowindow.close();
      infowindow.marker = marker;
      // Make sure the marker property is cleared if the infowindow is closed.
      infowindow.addListener('closeclick', function () {
        infowindow.marker = null;
      });
      toggleBounce(marker);
      // Open the infowindow on the correct marker.
      setTimeout(function () {
        toggleBounce(marker);
        var date = new Date(event.time);
        infowindow.setContent(
          '<img class="logo-image" src="' + event.group_photo + '">' +
          '<div>Group: ' + event.groupName + '</div>' +
          '<div>Event: ' + event.name + '</div>' +
          '<div>Date: ' + date.toLocaleDateString() + '</div>' +
          '<div>Time: ' + date.toLocaleTimeString() + '</div>' +
          '<div>RSVP Yes: ' + event.yes_rsvp_count + '</div>' +
          '<div>Venue: ' + event.venueName + '</div>' +
          '<div>Address: ' + event.venueAddress + '</div>' +
          '<div>Category: ' + event.groupCategory + '</div>' +
          '<a target="_blank" href="' + event.event_url + '">Event page on Meetup.com</a>'
        );
        infowindow.open(map, marker);
      }, 750);
    }
  };

  meetupapp.initMap = function () {
    meetupapp.largeInfowindow = new google.maps.InfoWindow();
    // Constructor creates a new map - only center and zoom are required.
    var position = new google.maps.LatLng(meetupapp.sfCoords);
    meetupapp.map = new google.maps.Map($('#map').get(0), {
      center: position,
      zoom: meetupapp.zoom,
      styles: styles,
      mapTypeControl: false
    });
    var autocomplete = new google.maps.places.Autocomplete(
      $('#locationFilter').get(0));
    // Bias the boundaries within the map for the zoom to area text.
    // autocomplete.bindTo('bounds', meetupapp.map);
  };

  meetupapp.initMarkers = function () {

    function createMarker(event, id) {

      // Style the markers a bit. This will be our listing marker icon.
      var defaultIcon = makeMarkerIcon('0091ff');
      // Create a "highlighted location" marker color for when the user
      // mouses over the marker.
      var highlightedIcon = makeMarkerIcon('FFFF24');
      var position = new google.maps.LatLng(event.venueCoords);
      var marker = new google.maps.Marker({
        position,
        title: event.name,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon,
        id: id
      });

      // Create an onclick event to open the large infowindow at each marker.
      marker.addListener('click', function () {
        var self = this;
        meetupapp.populateInfoWindow(self, meetupapp.events[self.id], meetupapp.largeInfowindow);
      });

      // Two event listeners - one for mouseover, one for mouseout,
      // to change the colors back and forth.
      marker.addListener('mouseover', function () {
        this.setIcon(highlightedIcon);
      });
      marker.addListener('mouseout', function () {
        this.setIcon(defaultIcon);
      });

      return marker;
    };

    meetupapp.markers = [];
    for (var i = 0; i < meetupapp.events.length; i++) {
      // Create a marker for the event.
      var marker = createMarker(meetupapp.events[i], i);
      meetupapp.markers.push(marker);
    };
  };

})(jQuery);
