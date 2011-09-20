$(document).ready(function() {
  $.kinetic.callMethods.stop = function(settings, options) {
    settings.velocity = 0;
    settings.velocityY = 0;
    settings.decelerate = true;
  }
  
	$('#miles').addClass('ui-state-default ui-corner-all').focus(function() { $(this).addClass('ui-state-active') }).blur(function() { $(this).removeClass('ui-state-active') })
	$('#add_miles').button().click(function() {
		var v = $('#miles').val();
		if (v.match(/^[+-]/) == null) { v = "+" + v }
		$tc.position(v);
	});

	var kineticVelocity = 0;
  $('.scroll-panel').mouseenter(function(e) {
    if (kineticVelocity == 0) {
      kineticVelocity = $(this).data('v');
      $('#profile').kinetic('start',{velocity: kineticVelocity});
    }
  }).mouseout(function(e) {
    if (! $(e.toElement).hasClass('scroll-panel')) {
      kineticVelocity = 0;
      $('#profile').kinetic('end');
    } else {
      kineticVelocity = $(e.toElement).data('v');
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
