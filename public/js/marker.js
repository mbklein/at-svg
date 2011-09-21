Marker = (function($) {
  return function(controller,one_mile,margin) {
    var paper, objects;

    var createObjects = function(x,y) {
      $.each(objects.items, function(i) { objects.items[i].remove() });
      var pathSpec = 'M'+x+' '+(y)+'L'+x+' '+y;
/*
      objects.push(paper.text(x, y-15, '☟')).attr({
        'font-size': '24pt', 
        'font-weight': 'normal',
        'fill': 'red', 
        'stroke-width': 0
      });
*/
      objects.push(paper.image('/img/sprite.png', x, y-10, 20, 20));
      return objects;
    }

    return $m = {
      position: 0,
      objects: objects,

      initialize: function(mi) {
        paper = Raphael('overlay', $('#overlay').width(), $('#overlay').height());
        this.objects = objects = paper.set();
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
            px2 = controller.milesToPixels(x2),
            dx = x2-x1;
            
        var pos = this.position;
        if (pos > mi) {
          objects[0].attr({ src: '/img/sprite-b.png' })
        }
        if (px2 - px1 < controller.viewport.width()) {
          // Less than one screen? Just center it and go.
          var path = controller.getSubContour(x1,x2);
          controller.scrollTo((x1+x2)/2, function() {
            if (pos < mi) {
              objects.animateAlong(path,125*dx,false);
            } else {
              objects.animateAlongBack(path,125*dx,false, function() {objects[0].attr({ src: '/img/sprite.png' })});
            }
          });
        } else {
          // Otherwise, use one path to get us off the screen, and another to reenter
          var e1 = x1+40, s2 = x2-40;
          if (s2 < e1) {
            e1 = s2 = ((e1+s2)/2);
          }
          
          var path1 = controller.getSubContour(x1, e1);
          var path2 = controller.getSubContour(s2, x2);
          if (pos < mi) {
            objects.animateAlong(path1,5000,false,function() { 
              controller.scrollTo(x2, function() {
                var ps = path2.attr('path');
                var n = ps[0];
                  objects.attr({ x: n[1], y: n[2]-10});
                objects.animateAlong(path2,5000,false);
              });
            });
          } else {
            objects.animateAlongBack(path2,5000,false,function() { 
              controller.scrollTo(x1, function() {
                var ps = path1.attr('path');
                var n = ps[ps.length-1];
                objects.attr({ x: n[1], y: n[2]-10});
                objects.animateAlongBack(path1,5000,false,function() { objects[0].attr({ src: '/img/sprite.png' }) });
              });
            });
          }
        }
        this.position = mi
      }
    }
  }
}(jQuery));