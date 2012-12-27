$(document).ready(function(){
	if (jQuery('form.k-login').hasClass('collapsible')) {
		jQuery('form.k-login.collapsible').css("display", "none");
		jQuery('#loginLink').children("a").attr("href", "#");
		jQuery('#loginLink').click(function() {
			jQuery('form.k-login.collapsible').animate({
			    height: 'toggle'
			  }, {
			    duration: 500,
			    specialEasing: {
			      height: 'linear'
			    }
			  });
		});
	}
});
