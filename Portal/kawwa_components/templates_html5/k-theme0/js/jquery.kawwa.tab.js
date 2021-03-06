/* KAWWA TABS CONTROL
 * Dependencies: jQuery 1.7 or higher
 *
 * November 2013
 *
 * Basic tabbed data controls
 * Arguments:
 *
 * - *Selected tab* defaults to first one.
 * 	 You can define selected tab by directly adding the HTML class "active" to the tab link (prefered)
 * 	 or by passing the zero based value of a tab as argument, like in:
 *
 * 		jQuery('.k-tabbed-data').kTabs({'selected': '2'});
 *
 * - Tabs can be disabled by directly adding the "off" class to a tab (replace the <a> tag in this case
 * 	by a <strong class="off">), or you can pass the zero based value of a tab as argument, like in:
 *
 * 		jQuery('.k-tabbed-data').kTabs({'disabled': '0'});
 *
 * 	In this case, the <a> tag will be replaced by a <strong> tag dynamically.
 *
 */

(function($) {
    $.fn.kTabs = function(options) {
        var settings = $.extend({
            'selected' : '0',
            'disabled' : null
        }, options);

        return this.each(function() {
            var $this = $(this);
            var $tabsList = $this.find('ul.tabs');
            var $tabsPres = $this.find('ul.tabs li');
            var $tabs = $this.find('ul.tabs a');
            var $panels = $this.find('.content');
            var tabHref;
            var tabHeight;
            var tabId;
            var panelId;

            $panels.find("p").attr("tabindex", 0);

            // PREPARING CONTENT...
            $panels.css('display', 'none');

            // If tabs disabled, replaces link
            if(settings.disabled != null) {
                var $father = $tabs.eq(settings.disabled).parent('li');
                var fatherHtml = $father.text();
                fatherHtml = "<strong class=\"off\">" + fatherHtml + "</strong>";
                $father.html(fatherHtml);
            }

            //TODO #1 RESET <li> role
            $tabsPres.attr({
                "role": "presentation"
            });

            //TODO #2 SET <ul> role
            $tabsList.attr({
               "role": "tablist"
            });

            //TODO All panels should be hidden and collapsed
            $panels.attr({
                "aria-hidden" : true,
                "aria-expanded" : false
            })

            //TODO #2 SET <li>s role
            $tabs.attr({
                "role" : "tab",
                "aria-selected" : false,
                "tabindex": -1
            })

            //TODO all li should not be selected by default


            //TODO reset default tabindex


            $panels.attr({
                "role": "tabpanel"
            });

            $tabs.each(function(index) {
                tabId = "tab" + index;
                tabHref = $(this).attr('href');
                $(this).attr({
                    'id' : tabId,
                    'aria-controls' : tabHref.replace('#', '')
                });

                //TODO #2 set role attribute to panel



                //TODO a panel should be labelled by the corresponding header
                $(tabHref).attr({
                    "aria-labelledby" : tabId
                })

            });
            // SETS ACTIVE PANEL
            if($this.find('a.active').length != 0) {
                $theOne = $this.find('a.active');
            } else {
                $theOne = $tabs.eq(settings.selected);
                $theOne.addClass('active');
            }

            $theOne.attr({
                "aria-selected" : true
            });

            //TODO The tab is selected and make it accessible
            panelId = $theOne.attr('aria-controls');
            $('#' + panelId).css('display', 'block').attr({
                "aria-hidden" : false,
                "aria-expanded" : true
            });
            //TODO Set the hidden and expanded attributes


            // CONTROL EVENTS
            $tabs.click(function(event) {
                event.preventDefault();
                $tabs.toggleClass('transformed');

                if(!$(this).hasClass("active")) {
                    // Close all
                    //TODO panels should be hidden
                    $panels.css('display', 'none').attr({
                        "aria-hidden" : true,
                        "aria-expanded" : false
                    });

                    //TODO reset tabindex and aria-selected
                    $tabs.removeClass('active').attr({
                        "aria-selected": false,
                        "tabindex" : -1
                    });

                    // Open clicked
                    //TODO reset tabindex and aria-selected
                    $(this).addClass('active').attr({
                        "aria-selected" : true,
                        "tabindex" : 0
                    });

                    panelId = $(this).attr('aria-controls');

                    //The selected panel should be expanded
                    $('#' + panelId).css('display', 'block').attr({
                        "aria-hidden" : false,
                        "aria-expanded" : true
                    });

                    if($('#' + panelId).parent().hasClass('adaptive')) {
                        tabHeight = $('a.transformed.active').height() + 20;
                        $('#' + panelId).css('padding-top', tabHeight);
                    }

                }
            });
            // KEYBOARD EVENTS
            $this.keyup(function(event) {
                var $zSiblingParent;

                // go left/prev
                if(event.keyCode == 37 || event.keyCode == 38) {
                    $zSiblingParent = $this.find('.active').parent().prev();
                    if($zSiblingParent.children('a').length != 0) {//there's a valid tab prev
                        $zSiblingParent.children('a').focus().click();
                    } else {
                        $zSiblingParent.prev().children('a').focus().click();
                    }

                    // go right/next
                } else if(event.keyCode == 39 || event.keyCode == 40) {
                    $zSiblingParent = $this.find('.active').parent().next();
                    if($zSiblingParent.children('a').length != 0) {//there's a valid tab next
                        $zSiblingParent.children('a').focus().click();
                    } else {
                        $zSiblingParent.next().children('a').focus().click();
                    }
                }
            });

            // RESPONSIVE BEHAVIOUR
            var resizer = function() {
                $this.removeClass('adaptive');
                if($tabsPres.eq(0).offset().top != $tabsPres.eq($tabsPres.length - 1).offset().top) {
                    $this.addClass('adaptive');
                    $tabs.addClass('transformed');
                    tabHeight = $('a.transformed.active').height() + 20;
                    $this.find('> .content').css('padding-top', tabHeight);
                } else {
                    $tabs.removeClass('transformed');
                    $this.find('> .content').css('padding-top', '5px');
                }
            }
            // Call once to set.
            resizer();

            // Call on resize.
            $(window).resize(resizer);
        });
    };
})(jQuery);