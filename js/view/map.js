/* localized $ name for jQuery, map view */
var meetupapp = meetupapp || {};

(function ($) {
  'use strict';
  console.log("map.js");

  meetupapp.initMap = function () {
    // Create a styles array to use with the map.
    meetupapp.styles = [{
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

    // Constructor creates a new map - only center and zoom are required.
    meetupapp.map = new google.maps.Map(document.getElementById('map'), {
      center: {
        lat: meetupapp.lat,
        lng: meetupapp.lng
      },
      zoom: meetupapp.zoom,
      styles: meetupapp.styles,
      mapTypeControl: false
    });

    // Use a query signed with both my Meetup API key and Meetup's key.
    // This prevents distribution of my Meetup API key which could give
    // someone the ability to access my Meetup groups and act on my behalf.
    var signedEventQueryDay = "https://api.meetup.com/2/open_events?callback=?&and_text=False&offset=0&format=json&lon=-122.44&limited_events=False&photo-host=public&page=100&time=%2C1d&radius=4&lat=37.77&desc=False&status=upcoming&sig_id=14614002&sig=56f368151098322312fa21b9c2739df4c18e334c";

    var signedEventQueryWeek = "https://api.meetup.com/2/open_events?callback=?&and_text=False&offset=0&format=json&lon=-122.44&limited_events=False&photo-host=public&page=100&time=%2C1w&radius=4&lat=37.77&desc=False&status=upcoming&sig_id=14614002&sig=b556f214d1b8579cdadbe215c70fd5e2d03441b6";

    $.getJSON(signedEventQueryWeek, function (json) {

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
      }

      // This function will loop through the markers array and display them all.
      function showListings() {
        var bounds = new google.maps.LatLngBounds();
        // Extend the boundaries of the map for each marker and display the marker
        for (var i = 0; i < meetupapp.markers.length; i++) {
          meetupapp.markers[i].setMap(meetupapp.map);
          // bounds.extend(meetupapp.markers[i].position);
        }
        // meetupapp.map.fitBounds(bounds);
      }

      console.log(json);
      console.log("first event: ", json.results[0]);

      meetupapp.markers = [];

      // Style the markers a bit. This will be our listing marker icon.
      var defaultIcon = makeMarkerIcon('0091ff');
      // Create a "highlighted location" marker color for when the user
      // mouses over the marker.
      var highlightedIcon = makeMarkerIcon('FFFF24');
      // The following group uses the location array to create an array of markers on initialize.
      for (var i = 0; i < json.results.length; i++) {
        // Get the position from the location array.
        if (json.results[i].venue) {
          var position = {
            lat: json.results[i].venue.lat,
            lng: json.results[i].venue.lon
          };
          var title = json.results[i].name;
          // Create a marker per location, and put into markers array.
          var marker = new google.maps.Marker({
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            icon: defaultIcon,
            id: i
          });
          // Push the marker to our array of markers.
          meetupapp.markers.push(marker);
          console.log(marker);
          // // Create an onclick event to open the large infowindow at each marker.
          // marker.addListener('click', function () {
          //   populateInfoWindow(this, largeInfowindow);
          // });
          // Two event listeners - one for mouseover, one for mouseout,
          // to change the colors back and forth.
          marker.addListener('mouseover', function () {
            this.setIcon(highlightedIcon);
          });
          marker.addListener('mouseout', function () {
            this.setIcon(defaultIcon);
          });
        };
      };
      showListings();
    });

  }

})(jQuery);
