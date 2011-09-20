Marker = (function($) {
  return function(controller,one_mile,margin) {
    var paper, objects, animatePaths;

    var createObjects = function(x,y) {
      $.each(objects.items, function(i) { objects.items[i].remove() });
      var pathSpec = 'M'+x+' '+(y)+'L'+x+' '+y;
      objects.push(paper.text(x, y-15, '☟')).attr({
        'font-size': '24pt', 
        'font-weight': 'normal',
        'fill': 'red', 
        'stroke-width': 0
      });
      return objects;
    }

    return $m = {
      position: 0,
      objects: objects,

      initialize: function(mi) {
        paper = Raphael('overlay', $('#overlay').width(), $('#overlay').height());
        objects = paper.set();
        animatePaths = paper.set();
        this.position = mi;
        this.reinitialize();
      },
      
      reinitialize: function() {
        this.contourPos = controller.contourAtMile(this.position);
        createObjects(this.contourPos.x,this.contourPos.y);
      },

      moveTo: function(mi) {
        var x1 = Math.min(this.position,mi),
            x2 = Math.max(this.position,mi),
            px1 = controller.milesToPixels(x1),
            px2 = controller.milesToPixels(x2);
            
        var pos = this.position;
        if (px2 - px1 < controller.viewport.width()) {
          // Less than one screen? Just center it and go.
          var path = controller.getSubContour(x1,x2);
          animatePaths.push(path);
          console.dir(path);
          controller.scrollTo((x1+x2)/2, function() {
            if (pos < mi) {
              objects.animateAlong(path,5000,false);
            } else {
              objects.animateAlongBack(path,5000,false);
            }
          });
        } else {
          // Otherwise, use one path to get us off the screen, and another to reenter
          var path1 = controller.getSubContour(x1, x1+40);
          var path2 = controller.getSubContour(x2-40, x2);
          animatePaths.push(path1);
          animatePaths.push(path2);
          if (pos < mi) {
            objects.animateAlong(path1,5000,false,function() { 
              controller.scrollTo(x2, function() {
                var ps = path2.attr('path');
                var n = ps[0];
                createObjects(n[1],n[2]);
                objects.animateAlong(path2,5000,false);
              });
            });
          } else {
            objects.animateAlongBack(path2,5000,false,function() { 
              controller.scrollTo(x1, function() {
                var ps = path1.attr('path');
                var n = ps[ps.length-1];
                createObjects(n[1],n[2]);
                objects.animateAlongBack(path1,5000,false);
              });
            });
          }
        }
        this.position = mi
      }
    }
  }
}(jQuery));