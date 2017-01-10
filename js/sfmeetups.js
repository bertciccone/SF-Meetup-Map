/* global variables and knockout ViewModel */
var meetupapp = meetupapp || {};

/* initialize the ViewModel */
(function () {
  'use strict';

  var EventListItem = function (name, id, visible) {
    this.name = ko.observable(name);
    this.id = ko.observable(id);
    this.visible = ko.observable(visible);
  };

  var CategoryListItem = function (data) {
    this.name = ko.observable(data);
  };

  meetupapp.setSearchLocation = function (position) {
    console.log("Setting location to: ", position.lng, position.lat);
    // Need to be careful about passing LatLng objects when needed
    // myLatLng = new google.maps.LatLng({lat: -34, lng: 151});
    meetupapp.locationLng = position.lng;
    meetupapp.locationLat = position.lat;
    meetupapp.setSearchLocationMarker(position);
  }

  var ViewModel = function () {

    var self = this;

    // Setup the filter options.
    self.dateFilterOptions = [{
      name: "1 day",
      days: 1
    }, {
      name: "2 days",
      days: 2
    }, {
      name: "3 days",
      days: 3
    }];

    self.rangeFilterOptions = [{
      name: "1 mile",
      miles: 1
    }, {
      name: "2 miles",
      miles: 2
    }, {
      name: "3 miles",
      miles: 3
    }, {
      name: "4 miles",
      miles: 4
    }, {
      name: "5 miles",
      miles: 5
    }, {
      name: "6 miles",
      miles: 6
    }, {
      name: "7 miles",
      miles: 7
    }];

    self.eventFilters = {
      dateFilter: ko.observable(meetupapp.dateFilter),
      rangeFilter: ko.observable(meetupapp.rangeFilter),
      locationFilter: ko.observable(meetupapp.locationFilter),
    };

    self.applyDateFilter = function (event) {
      return event.time <= meetupapp.queryTime +
        (self.eventFilters.dateFilter() * 24 * 60 * 60 * 1000);
    };

    self.applyRangeFilter = function (event) {
      // Avoid using Google Maps to calculate driving distance to each event destination. Instead, use an approximation for distance "as the bird flies" from http://www.movable-type.co.uk/scripts/latlong.html.
      var R = 6371e3; // meters
      var r = Math.PI / 180;
      var λ1 = meetupapp.locationLng * r;
      var λ2 = event.venueLng * r;
      var φ1 = meetupapp.locationLat * r;
      var φ2 = event.venueLat * r;
      var x = (λ2 - λ1) * Math.cos((φ1 + φ2) / 2);
      var y = (φ2 - φ1);
      var d = Math.sqrt(x * x + y * y) * R; // meters
      console.log("Calculated range: ", d * 0.000621371);
      return (d * 0.000621371) < self.eventFilters.rangeFilter();
    };

    self.applyEventFilters = function () {
      console.log("Date filter: ", self.eventFilters.dateFilter(), "Range filter: ", self.eventFilters.rangeFilter(), "Location filter: ", self.eventFilters.locationFilter());
      meetupapp.events.forEach(function (event, index) {
        var dateFilterPass = self.applyDateFilter(event);
        var rangeFilterPass = self.applyRangeFilter(event);
        var show = dateFilterPass && rangeFilterPass;
        self.eventList()[index].visible(show);
        meetupapp.showMarker(event.id, show);
      });
      console.log("Exit applyEventFilters");
    };

    self.geocodeSearchLocation = function () {
      var geocoder = new google.maps.Geocoder();
      var address = self.eventFilters.locationFilter();
      // Make sure the address isn't blank.
      if (address) {
        // Geocode the address/area entered to get the center. Then, center the map
        // on it and zoom in
        geocoder.geocode({
          address: address,
          componentRestrictions: {
            locality: 'San Francisco'
          }
        }, function (results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            console.log("Location: ", results[0].geometry.location.lat(), results[0].geometry.location.lng());
            meetupapp.setSearchLocation(results[0].geometry.location);
            self.applyEventFilters();
          } else {
            window.alert('We could not find that location - try entering a more' +
              ' specific place.');
          }
        });
        // } else {
        //   console.log("Address: ", address);
        //   meetupapp.setSearchLocation({
        //     lng: meetupapp.sfLng,
        //     lat: meetupapp.sfLat
        //   });
        //   self.applyEventFilters();
        //   alert("Exit geocoding");
      };
    };

    // Setup the category filter list.
    self.categoryList = ko.observableArray([]);
    meetupapp.categories.forEach(function (element) {
      self.categoryList.push(new CategoryListItem(element));
    });
    self.selectCategoryListItem = function (data, event) {
      console.log("selectCategoryListItem: ", data, event);
    };

    // Setup the sidebar event selection list.
    self.eventList = ko.observableArray([]);

    meetupapp.events.forEach(function (event) {
      var name = event.name.length <= 35 ?
        event.name :
        event.name.substr(0, 32) + "...";
      self.eventList.push(new EventListItem(name, event.id, false));
    });

    self.selectEventListItem = function (data, event) {
      console.log("selectEventListItem: ", data.name(), data.id());
      meetupapp.populateInfoWindow(meetupapp.markers[data.id()], meetupapp.events[data.id()], meetupapp.largeInfowindow);
    };

    self.applyEventFilters();
  };

  console.log("sfmeetups.js");

  var jqxhr = meetupapp.initEvents()
    .done(function () {
      console.log("Event initialization success.");
      console.log(meetupapp.categories);
      meetupapp.setSearchLocation({
        lng: meetupapp.sfLng,
        lat: meetupapp.sfLat
      });
      meetupapp.initMarkers();
      ko.applyBindings(new ViewModel());
    })
    .fail(function () {
      alert("Problem encountered while downloading Meetup events.");
    })
    .always(function () {
      console.log("Event initialization complete.");
    });
  // OK to do other stuff here...
  jqxhr.always(function () {
    console.log("Event initialization final message.");
  });

})();
