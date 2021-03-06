/* KAWWA - May, 2013
 * 
 * A dropdown list of actions
 */


(function($) {
	$.fn.actionsDd = function(options) {
		
		var $this = $(this);
		var $zControl = $this.children('button');
		
		var zListId = 'list' + Math.floor(Math.random()*11); 
		var zList = '#' + zListId;

		// ARIA
		$this.find('div.content').attr('id', zListId);
		$zControl.attr('aria-owns', zListId);
		$zControl.attr('aria-expanded', false);
		
		// Prepares list
		$(zList).css('display', 'none');
		
		// Activates control
		$zControl.click(function(event){
			event.preventDefault();
			$(zList).slideToggle('fast');
			$(this).toggleClass('active');
			
			if($(this).hasClass('active')) {
				$(this).attr('aria-expanded', true);
			} else {
				$(this).attr('aria-expanded', false);
			}
			
			$(zList).find('a').click(function(){
				$(zList).slideToggle('fast');
			});
		});

	};

})(jQuery);
