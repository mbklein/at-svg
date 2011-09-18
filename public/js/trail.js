TrailController = (function($) {
  var margin, one_mile, center;
  var stuff = {};
  
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
    stuff: stuff,
    
    initialize: function() {
      margin = 24.1375;
      one_mile = 24.1375;
      center = $('#profile').width() / 4;
      this.paper = Raphael('overlay', $('#overlay').width(), $('#overlay').height());
      stuff.waypoints = this.paper.set();
      
      this.drawMiles();
      
      $.get('/path_info/Shaded_Profile').success(function(data) { 
        stuff.profile = TrailController.paper.path(data[0]).translate(0,-1).attr({ 'fill' : '#e1a51b' });
      });

      $.get('/path_info/Simplified_Path').success(function(data) { 
        stuff.contour = TrailController.paper.set();
        $.each(data,function(i) { stuff.contour.push(TrailController.paper.path(data[i]).attr({ 'stroke' : 'none' })) });
        // .translate(0,20);
        stuff.marker = marker = new Marker($t, one_mile, margin);
        var loc = getHashAsNumber();
        if (loc == null) {
          loc = $.cookie('trail-location') || 0;
        }
        stuff.marker.initialize(loc);
        $(profile).scrollLeft(stuff.marker.position - center);
      });
      
      $(window).hashchange(function() {
        $t.position(getHashAsNumber());
      });

      setTimeout(function() {
        $('#container').animate({'opacity':1},2000);
        $('#overlay').animate({opacity:1},2500);
      },2000);
    },
    
    drawMiles: function() {
      var p = this.paper;
      p.rect(0,20,$('#overlay').width(),290)
      for (var i = 0; i < 2200; i += 1) { 
        var xPos = (i*one_mile)+margin;
        if (i % 5 == 0) {
          p.text(xPos,320,i).attr({ 'font-size': '12pt', stroke: 'none', fill: 'black' }) 
          p.path('M'+xPos+' 20L'+xPos+' 25').attr({ stroke: 'black' })
        } else {
          p.path('M'+xPos+' 20L'+xPos+' 22').attr({ stroke: 'black' })
        }
      }
    },
    
    drawWaypoint: function(mi, text, color) {
      if (color == null) { color = 'black' }
      var p = this.contourAtMile(mi);
      var m = this.paper.set();
      m.push(this.paper.path("M"+p.at+" "+p.y+"L"+p.at+" "+(p.y-15)).attr({ stroke: color, 'stroke-weight': '1pt' }));
      m.push(this.paper.text(p.at, p.y-20, text).attr({'text-anchor':'start',fill: color,stroke: 'none'}).rotate(270,p.at,p.y-20));
      stuff.waypoints.push(m);
      return m
    },
    
    contourAt: function(pos) {
      var tries = 0;
      var report = function(iter,x,p,d) {
        console.debug(iter + ': Test value '+x+' found point at '+p+' when looking for '+d+'. ('+(p/d*100)+'%)')
      }
      var px = pos + margin;
      
      var pathIndex = 0;
      var path = null;
      var zero;
      for (pathIndex; pathIndex < stuff.contour.items.length; pathIndex++) {
        console.debug("Checking path "+pathIndex)
        var tp = stuff.contour.items[pathIndex].attrs.path;
        if (tp[0][1] <= px && tp[tp.length-1][1] >= px) {
          path = stuff.contour.items[pathIndex];
          zero = (tp[0][1]);
          break;
        }
      }
      if (path == null) {
        return;
      }
      
      var testX = px - zero - margin;
      var result = path.getPointAtLength(testX);
      var delta = testX * (result.x / px)
      report('0',testX,result.x,px);
      while ( px > result.x ) { report('1',testX,result.x,px); testX += delta;    result = path.getPointAtLength(testX) }
      while ( px < result.x ) { report('2',testX,result.x,px); testX -= delta/2;  result = path.getPointAtLength(testX) }
      while ( px > result.x ) { report('3',testX,result.x,px); testX += delta/4;  result = path.getPointAtLength(testX) }
      while ( px < result.x ) { report('4',testX,result.x,px); testX -= delta/8;  result = path.getPointAtLength(testX) }
      while ( px > result.x ) { report('5',testX,result.x,px); testX += delta/16; result = path.getPointAtLength(testX) }
      while ( px < result.x ) { report('6',testX,result.x,px); testX -= delta/32; result = path.getPointAtLength(testX) }

      result.at = testX;
      result.path = path;
      result.pathIndex = pathIndex;
      console.debug(result.x/px)
      return result;
    },

    contourAtMile: function(mi) {
      var result = this.contourAt((one_mile * mi) + margin);
      console.debug(mi + ' : ' + result.x);
      return result;
    },
    
    position: function(mi) { 
      if (mi == null) {
        return (stuff.marker.position - margin) / one_mile;
      } else {
        if (mi.toString().match(/^[+-]/)) {
          mi = this.position() + Number(mi);
        }
        stuff.marker.moveTo(mi);
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
    },
    
    rectify: function(shape, callback) {
      shape.scale(6.262,6.262,24.1375,145.013)
      if (typeof callback == 'function') {
        callback(shape);
      }
      // console.debug(shape.attr('path').map(function(n) { return n.join(' ') }).join(''))
    }
  };
  return $t;
}(jQuery));

$(window).load(function() {
  TrailController.initialize();
});
