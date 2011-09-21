$tc = (function($) {
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
      margin = 23.898347102873828;
      one_mile = 24.125188535458204;
      this.viewport = $('#profile');
      this.center = center = $('#profile').width() / 2;
      this.paper = Raphael('overlay', $('#overlay').width(), $('#overlay').height());
      stuff.waypoints = this.paper.set();
      
      $.when(
        $.get('/path_info/Shaded_Profile').success(function(data) { 
          stuff.profile = $t.paper.path(data[0]).translate(0,-1).attr({ 'fill' : '#e1a51b' });
          $t.drawMiles();
        }),

        $.get('/waypoints').success(function(data) {
          $t.drawWaypoints(data);
        }),

        $.get('/path_info/Simplified_Path').success(function(data) { 
          stuff.contour = $tc.paper.set();
          $.each(data,function(i) { stuff.contour.push($tc.paper.path(data[i]).attr({ 'stroke' : 'none' }).translate(0,20)) });
          // .translate(0,20);
          stuff.marker = marker = new Marker($t, one_mile, margin);
          var loc = getHashAsNumber();
          if (loc == null) {
            loc = $.cookie('trail-location') || 0;
          }
          stuff.marker.initialize(loc);
          $(profile).scrollLeft($t.milesToPixels(stuff.marker.position) - center);
          $t.updateDistances();
        })
      ).then(function() {
        $('#preloader').animate({'opacity':0},2000);
        $('#everything').animate({'opacity':1},2500);
      });
            
      $(window).hashchange(function() {
        $t.position(getHashAsNumber());
      });
    },
    
    background: function() {
      var result = this.paper.set();
      result.push(stuff.profile);
      result.push(stuff.contour);
      result.push(stuff.waypoints);
      result.push(stuff.grid);
      return result;
    },
    
    drawMiles: function() {
      var p = this.paper;
      var g = stuff.grid = p.set();
      g.push(p.rect(0,20,$('#overlay').width(),290).toFront());
      for (var i = 0; i < 2200; i += 1) { 
        var xPos = (i*one_mile)+margin;
        if (i % 5 == 0) {
          g.push(p.text(xPos,320,i).attr({ 'font-size': '12pt', stroke: 'none', fill: 'black' }).toFront());
          g.push(p.path('M'+xPos+' 20L'+xPos+' 25').attr({ stroke: 'black' }).toFront())
          g.push(p.path('M'+xPos+' 305L'+xPos+' 310').attr({ stroke: 'black' }).toFront())
        } else {
          g.push(p.path('M'+xPos+' 20L'+xPos+' 22').attr({ stroke: 'black' }).toFront())
          g.push(p.path('M'+xPos+' 308L'+xPos+' 310').attr({ stroke: 'black' }).toFront())
        }
      }
    },
    
    drawWaypoint: function(data) {
//      console.debug(data.text);
      if (data.x == null) {
        var p = this.contourAtMile(data.mi);
        data.x = p.x; data.y = p.y
        $.ajax({
          type: 'POST',
          url: '/waypoint',
          data: data,
          async: false
        });
      }
      if (data.color == null) { data.color = 'black' }
      var m = this.paper.set();
      m.push(this.paper.path("M"+data.x+" "+data.y+"L"+data.x+" "+(data.y-15)).attr({ stroke: 'black', 'stroke-weight': '1pt' }));
      m.push(this.paper.text(data.x, data.y-20, data.text).attr({'text-anchor':'start',fill: data.color,stroke: 'none'}).rotate(270,data.x,data.y-20));
      stuff.waypoints.push(m);
      return m
    },
    
    drawWaypoints: function(data) {
      $.each(data, function(i) {
          try {
            $t.drawWaypoint(data[i]);
          } catch(e) {
            console.warn("Swallowing exception: "+e)
          }
      });
    },
    
    milesToPixels: function(mi) {
      return (one_mile * mi) + margin;
    },
    
    getPathLength: function(path) {
      var max = path.getPointAtLength(20000).x;
      var pos = 4000;
      var current = path.getPointAtLength(pos).x;
      while (current < max) {
        pos += 1;
        current = path.getPointAtLength(pos).x;
      }
      while (current > max) {
        pos -= 1;
        current = path.getPointAtLength(pos).x;
      }
      return pos
    },
    
    contourAt: function(pos) {
      var tries = 0;
      var report = function(iter,x,p,d) {
        //console.debug(iter + ': Test value '+x+' found point at '+p+' when looking for '+d+'. ('+(p/d*100)+'%)')
      }
      var px = pos + margin;
      
      var pathIndex = 0;
      var path = null;
      for (pathIndex; pathIndex < stuff.contour.items.length; pathIndex++) {
//        console.debug("Checking path "+pathIndex)
        var tp = stuff.contour.items[pathIndex].attr('path');
        if (tp[0][1] <= px && tp[tp.length-1][1] >= px) {
          path = stuff.contour.items[pathIndex];
          break;
        }
      }
      if (path == null) {
        return;
      }
      
      var testX = Math.max((px * 1.3) - margin,margin);
      var result = path.getPointAtLength(testX);
      var nextResult = result;
      var delta = Math.abs(testX * (result.x / px))
      report(delta,testX,result.x,px);
      while (delta >= 2) {
        if (px > result.x) {
          while (px > result.x) { 
            report('+'+delta,testX,result.x,px); 
            testX = testX+delta;
            try {
              nextResult = path.getPointAtLength(testX)
              if (nextResult.hasOwnProperty('x') && nextResult.hasOwnProperty('x') &! (isNaN(nextResult.x) || isNaN(nextResult.y))) {
                result = nextResult;
              }
            } catch(e) {
              console.warn("Iterating again: "+e)
            }
          }
          delta /= 2
        } else if (px < result.x) {
          while (px < result.x && (testX > 1)) { 
            report('-'+delta,testX,result.x,px); 
            testX = Math.max(testX-delta,1); 
            try {
              nextResult = path.getPointAtLength(testX) 
              if (nextResult.hasOwnProperty('x') && nextResult.hasOwnProperty('x') &! (isNaN(nextResult.x) || isNaN(nextResult.y))) {
                result = nextResult;
              }
            } catch(e) {
              console.warn("Iterating again: "+e)
            }
          }
          delta /= 2
        } else {
          break;
        }
      }
      report('FINAL',testX,result.x,px);
      
      result.x = px
      result.at = testX;
      result.path = path;
      result.pathIndex = pathIndex;
      return result;
    },

    contourAtMile: function(mi) {
      var result = this.contourAt(one_mile * Math.max(mi,0.1));
      if (result == null) { console.warn("Warning: null contour at "+mi) }
      return result;
    },
    
    getSubpath: function(p,x1,x2) {
      // Dumber than Raphaël's path.getSubpath(), but faster. Assumes all paths are left to right,
      // which in our case is true.
      var path = p.attr('path');
      var points = $.map($.grep(path, function(e,i) { 
        return e[1] >= x1 && e[1] <= x2 
      }), function(a) { return [a.slice(0)] });
//      console.debug('Found '+points.length+' points')
      points[0][0] = 'M';
      points[1][0] = 'L';
      while (points[0].length > 3) { points[0].pop(); }
      while (points[1].length > 3) { points[1].pop(); }
      return $.map(points, function(pi) { return pi.join(',') }).join('');
    },
    
    getSubContour: function(x1,x2) {
      var lcp = this.contourAtMile(Math.min(x1,x2));
      var rcp = this.contourAtMile(Math.max(x1,x2));
      var result;
      if (lcp.pathIndex == rcp.pathIndex) {
//        console.debug('Getting subPath for '+lcp.pathIndex)
        result = $t.getSubpath(lcp.path,lcp.x,rcp.x);
      } else {
//        console.debug('Adding initial subPath for '+lcp.pathIndex)
        var bb = lcp.path.getBBox();
        var result = $t.getSubpath(lcp.path, lcp.x, bb.x + bb.width);
        var i = lcp.pathIndex + 1;
        while (i < rcp.pathIndex) {
          var mp = this.contour.items[i];
//          console.debug('Adding medial subPath for '+i)
          $.each(mp.attr('path'), function(pi) { 
            if (pi[0] != 'M') {
              result += pi.join(',');
            } 
          })
        }
//        console.debug('Adding final subPath for '+rcp.pathIndex)
        result += $t.getSubpath(rcp.path,0,rcp.x).replace(/^M\s*[0-9.,]+/,'')
      }
      return this.paper.path(result).attr({stroke:'none'});
    },
    
    position: function(mi) { 
      if (mi == null) {
        return Number(stuff.marker.position);
      } else {
        if (mi.toString().match(/^[+-]/)) {
          mi = this.position() + Number(mi);
        }
        stuff.marker.moveTo(mi);
        $.cookie('trail-location', mi, { expires: 365 });
        $t.updateDistances();
        return mi;
      }
    },
    
    scrollPos: function(mi) {
      var absPos = ((mi * one_mile) + margin) - center;
      return absPos;
//      return Math.max(Math.min(absPos,center),$('#profile').width()-center);
    },
    
    scrollTo: function(mi, callback) {
      var newPos = this.scrollPos(mi);
      var currentPos = $('#profile').scrollLeft();
      var distance = Math.abs(newPos - currentPos);
      var time = Math.min((distance / one_mile) * 100, 5000);
      currentMileage = mi;
      
      var cbCalled = false;
      var cb = callback ? function() { if (!cbCalled) { cbCalled = true; callback(); }} : null;
      $('#profile').animate( { scrollLeft: newPos }, time, $t.easing, cb );
      return time;
    },
    
    scrollBy: function(delta, callback) {
      var currentPos = $('#profile').scrollLeft() / one_mile;
      var mi = (currentPos + delta);
      return $t.scrollTo(mi, callback);
    },
    
    rectify: function(shape, callback) {
      shape.scale(6.262,6.262,24.1375,145.013)
      if (typeof callback == 'function') {
        callback(shape);
      }
      // console.debug(shape.attr('path').map(function(n) { return n.join(' ') }).join(''))
    },
    
    updateDistances: function() {
      $('#from-springer').html(Math.round(this.position()*1000)/1000);
      $('#to-katahdin').html(Math.round((2178.5 - this.position())*1000)/1000);
    },
    
    debugMode: function() {
      $('#profile').css('overflow-x', 'visible')
      $('#container').css('overflow-x', 'auto')
    }
  };
  return $t;
}(jQuery));

$(window).load(function() {
  $tc.initialize();
});
