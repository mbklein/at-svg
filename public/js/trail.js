TrailController = (function($) {
  var margin, one_mile, center, marker;
  
  var getHashAsNumber = function() {
    var hash = document.location.hash;
    if (hash != "") {
      var loc = Number(hash.substring(1,hash.length));
      if (loc != NaN) {
        return loc;
      } else {
        return null;
      }
    } else {
      return null;
    }
  };
    
  var $t = {
    easing: 'easeOutExpo',
    marker: marker,
    
    initialize: function() {
      margin = 24.1375;
      one_mile = 24.1375;
      center = $('#profile').width() / 4;
      this.marker = marker = new Marker(this, one_mile, margin);

      $(window).hashchange(function() {
        $t.position(getHashAsNumber());
      });

      var loc = getHashAsNumber();
      if (loc == null) {
        loc = $.cookie('trail-location') || 0;
      }
      marker.initialize(loc);
      $(profile).scrollLeft(marker.position - center);
      $('#container').animate({'opacity':1},2000);
      $('#overlay').animate({opacity:1},2500);
    },
    
    position: function(mi) { 
      if (mi == null) {
        return (marker.position - margin) / one_mile;
      } else {
        if (mi.toString().match(/^[+-]/)) {
          mi = this.position() + Number(mi);
        }
        marker.moveTo(mi);
        $.cookie('trail-location', mi, { expires: 365 });
        return mi;
      }
    },
    
    scrollTo: function(mi) {
      var newPos = ((mi * one_mile) + margin) - center;
      var currentPos = $('#profile').scrollLeft();
      var distance = Math.abs(newPos - currentPos);
      var time = Math.min((distance / one_mile) * 100, 5000);
      currentMileage = mi;
      
      $('#profile').animate( { scrollLeft: newPos }, time, $t.easing );
      return time;
    },
    
    scrollBy: function(delta) {
      var currentPos = $('#profile').scrollLeft() / one_mile;
      var mi = (currentPos + delta);
      return $t.scrollTo(mi);
    }
  };
  return $t;
}(jQuery));

$(window).load(function() {
  TrailController.initialize();
});
