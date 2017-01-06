/* localized $ name for jQuery, map view */
var meetupapp = meetupapp || {};

(function ($) {
  'use strict';
  console.log("map.js");

  meetupapp.initMap = function () {

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

    // Use a signed query (signed with both my Meetup API key and Meetup's key)
    // to request event data. This keeps my Meetup API key private, to prevent
    // someone from accessing my personal Meetup groups and act on my behalf.
    var signedEventQueryWeek = "https://api.meetup.com/2/open_events?callback=?&and_text=False&offset=0&format=json&lon=-122.44&limited_events=False&photo-host=public&page=100&time=%2C1w&radius=4&fields=group_photo%2Ccategory&lat=37.77&order=trending&desc=true&status=upcoming&sig_id=14614002&sig=9bd9af758d34841542fe3e8ad86618c963fdfa10";

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
        // Extend the boundaries of the map for each event and display the marker
        for (var i = 0; i < meetupapp.markers.length; i++) {
          meetupapp.markers[i].setMap(meetupapp.map);
          // bounds.extend(meetupapp.markers[i].position);
        }
        // meetupapp.map.fitBounds(bounds);
      }

      // This function populates the infowindow when the marker is clicked. We'll only allow
      // one infowindow which will open at the marker that is clicked, and populate based
      // on that markers position.
      function populateInfoWindow(marker, event, infowindow) {
        // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != marker) {
          // Clear the infowindow content to give the streetview time to load.
          infowindow.setContent('');
          infowindow.marker = marker;
          // Make sure the marker property is cleared if the infowindow is closed.
          infowindow.addListener('closeclick', function () {
            infowindow.marker = null;
          });
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
            '<a target="_blank" href="' + event.event_url + '">Event page on Meetup.com</a>'
          );
          // Open the infowindow on the correct marker.
          infowindow.open(map, marker);
        }
      }

      console.log(json);
      meetupapp.markers = [];
      meetupapp.largeInfowindow = new google.maps.InfoWindow();

      // Style the markers a bit. This will be our listing marker icon.
      var defaultIcon = makeMarkerIcon('0091ff');
      // Create a "highlighted location" marker color for when the user
      // mouses over the marker.
      var highlightedIcon = makeMarkerIcon('FFFF24');
      // Use the json results to create arrays of events and markers on initialize.
      for (var i = 0; i < json.results.length; i++) {
        // Only save events and markers that have a designated venue address.
        if (json.results[i].venue) {
          var position = {
            lat: json.results[i].venue.lat,
            lng: json.results[i].venue.lon
          };
          var groupPhoto =
            (json.results[i].group.group_photo) ? json.results[i].group.group_photo.thumb_link : "https://a248.e.akamai.net/secure.meetupstatic.com/photos/event/8/f/1/d/highres_454596637.jpeg";
          var event = {
            name: json.results[i].name,
            groupName: json.results[i].group.name,
            group_photo: groupPhoto,
            time: json.results[i].time,
            yes_rsvp_count: json.results[i].yes_rsvp_count,
            venueName: json.results[i].venue.name,
            venueAddress: json.results[i].venue.address_1,
            event_url: json.results[i].event_url
          };
          // Create a marker per event, and put into events and markers arrays.
          var marker = new google.maps.Marker({
            position: position,
            title: json.results[i].name,
            animation: google.maps.Animation.DROP,
            icon: defaultIcon,
            id: meetupapp.markers.length // index into both markers and events arrays
          });

          if (json.results[i].group.category.name) {
            console.log(json.results[i].group.category.name);
          };

          // Push the marker and event data to our arrays.
          meetupapp.events.push(event);
          meetupapp.markers.push(marker);

          // Create an onclick event to open the large infowindow at each marker.
          marker.addListener('click', function () {
            // console.log("clicked marker: ", this);
            populateInfoWindow(this, meetupapp.events[this.id], meetupapp.largeInfowindow);
          });

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
