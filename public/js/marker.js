Marker = (function($) {
  return function(controller,one_mile,margin) {
    var paper, objects;
        
    var createObjects = function(pos,contourPos) {
      var y = contourPos.y;
      var pathSpec = 'M'+pos+' '+(y)+'L'+pos+' '+y;
      objects.push(paper.text(pos, y-15, '☟')).attr({
        'font-size': '24pt', 
        'font-weight': 'normal',
        'fill': 'red', 
        'stroke-width': 0
      });
      return objects;
    }

    return {
      position: 0,
      objects: objects,

      initialize: function(mi) {
        paper = Raphael('overlay', $('#overlay').width(), $('#overlay').height());
        objects = paper.set();
        var pos = (one_mile * mi) + margin;
        this.contourPos = controller.contourAt(pos);
        console.debug(mi + ' : ' + this.contourPos.x);
        this.objects = createObjects(pos,this.contourPos);
        this.position = pos;
      },

      moveTo: function(mi) {
        var pos = (one_mile * mi) + margin;
        var ocp = this.contourPos;
        var ncp = controller.contourAt(pos);
        var paper = controller.paper;
        var startPoint = ocp.at;
        var endPoint = ncp.at;
        var removablePaths = [];
        
        var subPath = function(p, s, e) {
          if (s == null && e == null) { return p }
          if (s == null) { s = 0 }
          if (e == null) { e = p.getTotalLength() }
          var result = paper.path(p.getSubpath(s,e)).attr({stroke:'none'});
          removablePaths.push(result);
          return result;
        }
        var paths = [];
        if (ocp.pathIndex < ncp.pathIndex || startPoint < endPoint) {
          if (ocp.pathIndex == ncp.pathIndex) {
            paths.push(subPath(ocp.path,startPoint,endPoint));
          } else {
            paths.push(subPath(ocp.path,startPoint));
            var i = ocp.pathIndex + 1;
            while (i < ncp.pathIndex) {
              var somePath = controller.stuff.contour.items[i];
              paths.push(subPath(somePath));
              i += 1;
            }
            paths.push(subPath(ncp.path,0,endPoint));
          }
        } else {
          if (ocp.pathIndex == ncp.pathIndex) {
            paths.push(subPath(ocp.path,startPoint,endPoint));
          } else {
            paths.push(subPath(ocp.path,0,startPoint));
            var i = ocp.pathIndex - 1;
            while (i > ncp.pathIndex) {
              var somePath = controller.stuff.contour.items[i];
              paths.push(subPath(somePath));
              i -= 1;
            }
            paths.push(subPath(ncp.path,endPoint));
          }
        }
        
        console.debug("Animating along " + paths.length + " paths")
        var ms = 15000 / paths.length;
        setTimeout(function() { controller.scrollTo(mi); }, 3000);
        console.debug('Starting animation...')        
        if (startPoint < endPoint) {
          var animateProc = function(paths,i) {
            if (i >= 0) {
              objects.animateAlong(paths[i], ms, function() { animateProc(paths,i-1) })
            } else {
              $.each(removablePaths,function(p) { removablePaths[p].remove() })
            }
          }
          animateProc(paths, paths.length - 1);
        } else {
          var animateProc = function(paths,i) {
            if (i < paths.length) {
              objects.animateAlongBack(paths[i], ms, function() { animateProc(paths,i+1) })
            } else {
              $.each(removablePaths,function(p) { removablePaths[p].remove() })
            }
          }
          animateProc(paths, 0);
        }
        this.contourPos = ncp;
        this.position = pos;
      }
    }
  }
}(jQuery));