$(document).ready(function() {
  $.kinetic.callMethods.stop = function(settings, options) {
    settings.velocity = 0;
    settings.velocityY = 0;
    settings.decelerate = true;
  }
  
	$('#miles').addClass('ui-state-default ui-corner-all').focus(function() { $(this).addClass('ui-state-active') }).blur(function() { $(this).removeClass('ui-state-active') })
	$('#add_miles').button().click(function() {
		var v = $('#miles').val();
		v.match(/^[+-]/) || (v = "+" + v)
		$tc.position(v);
	});

	var kineticVelocity = 0;
  $('.scroll-panel').mouseenter(function(e) {
    if (kineticVelocity == 0) {
      kineticVelocity = $(this).data('v');
      $('#profile').kinetic('start',{velocity: kineticVelocity});
    }
  }).mouseout(function(e) {
    var nextTarget = e.relatedTarget || e.toElement;
    if (! $(nextTarget).hasClass('scroll-panel')) {
      kineticVelocity = 0;
      $('#profile').kinetic('end');
    } else {
      kineticVelocity = $(nextTarget).data('v');
      $('#profile').kinetic('stop');
    }
  });

  $('#reset-position').button().click(function() { $tc.scrollTo($tc.position()) } )

	$('#profile').kinetic({stopped: function() {
	  if (kineticVelocity != 0) {
      $('#profile').kinetic('start',{velocity: kineticVelocity});
	  }
	}});
});
