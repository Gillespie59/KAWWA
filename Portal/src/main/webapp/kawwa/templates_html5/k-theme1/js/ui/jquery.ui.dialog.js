/*
 * jQuery UI Dialog @VERSION
 *
 * Copyright 2011, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Dialog
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *  jquery.ui.button.js
 *	jquery.ui.draggable.js
 *	jquery.ui.mouse.js
 *	jquery.ui.position.js
 *	jquery.ui.resizable.js
 */
(function( $, undefined ) {

var uiDialogClasses = "ui-dialog ui-widget ui-widget-content ui-corner-all ",
	sizeRelatedOptions = {
		buttons: true,
		height: true,
		maxHeight: true,
		maxWidth: true,
		minHeight: true,
		minWidth: true,
		width: true
	},
	resizableRelatedOptions = {
		maxHeight: true,
		maxWidth: true,
		minHeight: true,
		minWidth: true
	};

$.widget("ui.dialog", {
	options: {
		autoOpen: true,
		buttons: {},
		closeOnEscape: true,
		closeText: "close",
		dialogClass: "",
		draggable: true,
		hide: null,
		height: "auto",
		maxHeight: false,
		maxWidth: false,
		minHeight: 150,
		minWidth: 150,
		modal: false,
		position: {
			my: "center",
			at: "center",
			of: window,
			collision: "fit",
			// ensure that the titlebar is never outside the document
			using: function( pos ) {
				var topOffset = $( this ).css( pos ).offset().top;
				if ( topOffset < 0 ) {
					$( this ).css( "top", pos.top - topOffset );
				}
			}
		},
		resizable: true,
		show: null,
		stack: true,
		title: "",
		width: 300,
		zIndex: 1000
	},

	_create: function() {
		this.originalTitle = this.element.attr( "title" );
		// #5742 - .attr() might return a DOMElement
		if ( typeof this.originalTitle !== "string" ) {
			this.originalTitle = "";
		}

		this.options.title = this.options.title || this.originalTitle;
		var self = this,
			options = self.options,

			title = options.title || "&#160;",
			titleId = $.ui.dialog.getTitleId( self.element ),

			uiDialog = ( self.uiDialog = $( "<div>" ) )
				.appendTo( document.body )
				.hide()
				.addClass( uiDialogClasses + options.dialogClass )
				.css({
					zIndex: options.zIndex
				})
				// setting tabIndex makes the div focusable
				.attr( "tabIndex", -1)
				// TODO: move to stylesheet
				.css( "outline", 0 )
				.keydown(function( event ) {
					if ( options.closeOnEscape && !event.isDefaultPrevented() && event.keyCode &&
							event.keyCode === $.ui.keyCode.ESCAPE ) {
						self.close( event );
						event.preventDefault();
					}
				})
				.attr({
					role: "dialog",
					"aria-labelledby": titleId
				})
				.mousedown(function( event ) {
					self.moveToTop( false, event );
				}),

			uiDialogContent = self.element
				.show()
				.removeAttr( "title" )
				.addClass( "ui-dialog-content ui-widget-content" )
				.appendTo( uiDialog ),

			uiDialogTitlebar = ( self.uiDialogTitlebar = $( "<div>" ) )
				.addClass( "ui-dialog-titlebar  ui-widget-header  " +
					"ui-corner-all  ui-helper-clearfix" )
				.prependTo( uiDialog );
		
		var uiDialogToolbar = $("<div class='ui-dialog-toolbar'></div>")
			.appendTo(uiDialogTitlebar);
		
		var uiDialogTitlebarClose = $( "<a href='#'></a>" )
			.addClass( "ui-dialog-toolbarbutton ui-dialog-titlebar-close  ui-corner-all" )
			.attr( "role", "button" )
			.click(function( event ) {
				event.preventDefault();
				self.close( event );
			})
			.appendTo( uiDialogToolbar );

			uiDialogTitlebarCloseText = ( self.uiDialogTitlebarCloseText = $( "<span>" ) )
				.addClass( "ui-icon ui-icon-closethick" )
				.text( options.closeText )
				.appendTo( uiDialogTitlebarClose ),

			uiDialogTitle = $( "<span>" )
				.addClass( "ui-dialog-title" )
				.attr( "id", titleId )
				.html( title )
				.prependTo( uiDialogTitlebar );

		uiDialogTitlebar.find( "*" ).add( uiDialogTitlebar ).disableSelection();
		this._hoverable( uiDialogTitlebarClose );
		this._focusable( uiDialogTitlebarClose );
		
		self._createButtons( options.buttons );
		
		if ( options.draggable && $.fn.draggable ) {
			self._makeDraggable();
		}
		if ( options.resizable && $.fn.resizable ) {
			self._makeResizable();
		}
		
		
		self._isOpen = false;

		if ( $.fn.bgiframe ) {
			uiDialog.bgiframe();
		}
	},

	_init: function() {
		if ( this.options.autoOpen ) {
			this.open();
		}
	},

	_destroy: function() {
		var self = this;
		
		if ( self.overlay ) {
			self.overlay.destroy();
		}
		self.uiDialog.hide();
		self.element
			.removeClass( "ui-dialog-content ui-widget-content" )
			.hide()
			.appendTo( "body" );
		self.uiDialog.remove();

		if ( self.originalTitle ) {
			self.element.attr( "title", self.originalTitle );
		}
	},

	widget: function() {
		return this.uiDialog;
	},

	close: function( event ) {
		var self = this,
			maxZ, thisZ;
		
		if ( false === self._trigger( "beforeClose", event ) ) {
			return;
		}

		if ( self.overlay ) {
			self.overlay.destroy();
		}
		self.uiDialog.unbind( "keypress.ui-dialog" );

		self._isOpen = false;

		if ( self.options.hide ) {
			self.uiDialog.hide( self.options.hide, function() {
				self._trigger( "close", event );
			});
		} else {
			self.uiDialog.hide();
			self._trigger( "close", event );
		}

		$.ui.dialog.overlay.resize();

		// adjust the maxZ to allow other modal dialogs to continue to work (see #4309)
		if ( self.options.modal ) {
			maxZ = 0;
			$( ".ui-dialog" ).each(function() {
				if ( this !== self.uiDialog[0] ) {
					thisZ = $( this ).css( "z-index" );
					if ( !isNaN( thisZ ) ) {
						maxZ = Math.max( maxZ, thisZ );
					}
				}
			});
			$.ui.dialog.maxZ = maxZ;
		}

		return self;
	},

	isOpen: function() {
		return this._isOpen;
	},

	// the force parameter allows us to move modal dialogs to their correct
	// position on open
	moveToTop: function( force, event ) {
		var self = this,
			options = self.options,
			saveScroll;

		if ( ( options.modal && !force ) ||
				( !options.stack && !options.modal ) ) {
			return self._trigger( "focus", event );
		}

		if ( options.zIndex > $.ui.dialog.maxZ ) {
			$.ui.dialog.maxZ = options.zIndex;
		}
		if ( self.overlay ) {
			$.ui.dialog.maxZ += 1;
			$.ui.dialog.overlay.maxZ = $.ui.dialog.maxZ;
			self.overlay.$el.css( "z-index", $.ui.dialog.overlay.maxZ );
		}

		// Save and then restore scroll
		// Opera 9.5+ resets when parent z-index is changed.
		// http://bugs.jqueryui.com/ticket/3193
		saveScroll = {
			scrollTop: self.element.attr( "scrollTop" ),
			scrollLeft: self.element.attr( "scrollLeft" )
		};
		$.ui.dialog.maxZ += 1;
		self.uiDialog.css( "z-index", $.ui.dialog.maxZ );
		self.element.attr( saveScroll );
		self._trigger( "focus", event );

		return self;
	},

	open: function() {
		if ( this._isOpen ) {
			return;
		}

		var self = this,
			options = self.options,
			uiDialog = self.uiDialog;

		self.overlay = options.modal ? new $.ui.dialog.overlay( self ) : null;
		self._size();
		self._position( options.position );
		uiDialog.show( options.show );
		self.moveToTop( true );

		// prevent tabbing out of modal dialogs
		if ( options.modal ) {
			uiDialog.bind( "keydown.ui-dialog", function( event ) {
				if ( event.keyCode !== $.ui.keyCode.TAB ) {
					return;
				}

				var tabbables = $( ":tabbable", this ),
					first = tabbables.filter( ":first" ),
					last  = tabbables.filter( ":last" );

				if ( event.target === last[0] && !event.shiftKey ) {
					first.focus( 1 );
					return false;
				} else if ( event.target === first[0] && event.shiftKey ) {
					last.focus( 1 );
					return false;
				}
			});
		}

		// set focus to the first tabbable element in the content area or the first button
		// if there are no tabbable elements, set focus on the dialog itself
		$( self.element.find( ":tabbable" ).get().concat(
			uiDialog.find( ".ui-dialog-buttonpane :tabbable" ).get().concat(
				uiDialog.get() ) ) ).eq( 0 ).focus();

		self._isOpen = true;
		self._trigger( "open" );

		return self;
	},

	_createButtons: function( buttons ) {
		var self = this,
			hasButtons = false,
			uiDialogButtonPane = $( "<div>" )
				.addClass( "ui-dialog-buttonpane  ui-widget-content ui-helper-clearfix" ),
			uiButtonSet = $( "<div>" )
				.addClass( "ui-dialog-buttonset" )
				.appendTo( uiDialogButtonPane );

		// if we already have a button pane, remove it
		self.uiDialog.find( ".ui-dialog-buttonpane" ).remove();

		if ( typeof buttons === "object" && buttons !== null ) {
			$.each( buttons, function() {
				return !(hasButtons = true);
			});
		}
		if ( hasButtons ) {
			$.each( buttons, function( name, props ) {
				props = $.isFunction( props ) ?
					{ click: props, text: name } :
					props;
				var button = $( "<button type='button'>" )
					.attr( props, true )
					.unbind( "click" )
					.click(function() {
						props.click.apply( self.element[0], arguments );
					})
					.appendTo( uiButtonSet );
				if ( $.fn.button ) {
					button.button();
				}
			});
			self.uiDialog.addClass( "ui-dialog-buttons" );
			uiDialogButtonPane.appendTo( self.uiDialog );
		} else {
			self.uiDialog.removeClass( "ui-dialog-buttons" );
		}
	},

	_makeDraggable: function() {
		var self = this,
			options = self.options,
			doc = $( document ),
			heightBeforeDrag;

		function filteredUi( ui ) {
			return {
				position: ui.position,
				offset: ui.offset
			};
		}

		self.uiDialog.draggable({
			cancel: ".ui-dialog-content, .ui-dialog-titlebar-close",
			handle: ".ui-dialog-titlebar",
			containment: "document",
			start: function( event, ui ) {
				heightBeforeDrag = options.height === "auto" ? "auto" : $( this ).height();
				$( this )
					.height( $( this ).height() )
					.addClass( "ui-dialog-dragging" );
				self._trigger( "dragStart", event, filteredUi( ui ) );
			},
			drag: function( event, ui ) {
				self._trigger( "drag", event, filteredUi( ui ) );
			},
			stop: function( event, ui ) {
				options.position = [
					ui.position.left - doc.scrollLeft(),
					ui.position.top - doc.scrollTop()
				];
				$( this )
					.removeClass( "ui-dialog-dragging" )
					.height( heightBeforeDrag );
				self._trigger( "dragStop", event, filteredUi( ui ) );
				$.ui.dialog.overlay.resize();
			}
		});
		
		//keyboard support for draggable dialog
		self.uiDialogTitlebar
			.attr("tabindex", "0")
    		.attr("role", "button")
    		.attr("title", "Move dialog")
    		.keydown(function(event) {
    			if (jQuery.inArray(event.keyCode, [37, 38, 39, 40]) == -1)
    				return true;
    			if (this !== event.target) // event could bubble up from close button
    				return;
    			var handle = $(this);
    			var offset = handle.offset();
    			var increment = event.ctrlKey ? 100 : (event.shiftKey ? 1 : 20);
    			// simulate mouse events to trigger drag action
    			var downEvent, moveEvent, upEvent;
    			downEvent = new $.Event("mousedown");
    			moveEvent = new $.Event("mousemove");
    			upEvent = new $.Event("mouseup");
    			downEvent.pageX = moveEvent.pageX = upEvent.pageX = offset.left;
    			downEvent.pageY = moveEvent.pageY = upEvent.pageY = offset.top;
    			downEvent.which = upEvent.which = 1;
    			// prevents drag from being canceled for IE in _mouseMove:
    			moveEvent.button = 1;
    			switch (event.keyCode) {
    				case 37: //left
    					moveEvent.pageX = upEvent.pageX = moveEvent.pageX - increment;
    					break;
    				case 38: //up
    					moveEvent.pageY = upEvent.pageY = moveEvent.pageY - increment;
    					break;
    				case 39: //right
    					moveEvent.pageX = upEvent.pageX = moveEvent.pageX + increment;
    					break;
    				case 40: //down
    					moveEvent.pageY = upEvent.pageY = moveEvent.pageY + increment;
    					break;
    			}
    			handle.trigger(downEvent);
    			handle.trigger(moveEvent);
    			handle.trigger(upEvent);
    			event.stopPropagation();
    			return false;
    		});
	},

	_makeResizable: function( handles ) {
		handles = (handles === undefined ? this.options.resizable : handles);
		var self = this,
			options = self.options,
			// .ui-resizable has position: relative defined in the stylesheet
			// but dialogs have to use absolute or fixed positioning
			position = self.uiDialog.css( "position" ),
			resizeHandles = typeof handles === 'string' ?
				handles	:
				"n,e,s,w,se,sw,ne,nw";

		function filteredUi( ui ) {
			return {
				originalPosition: ui.originalPosition,
				originalSize: ui.originalSize,
				position: ui.position,
				size: ui.size
			};
		}

		self.uiDialog.resizable({
			cancel: ".ui-dialog-content",
			containment: "document",
			alsoResize: self.element,
			maxWidth: options.maxWidth,
			maxHeight: options.maxHeight,
			minWidth: options.minWidth,
			minHeight: self._minHeight(),
			handles: resizeHandles,
			start: function( event, ui ) {
				$( this ).addClass( "ui-dialog-resizing" );
				self._trigger( "resizeStart", event, filteredUi( ui ) );
			},
			resize: function( event, ui ) {
				self._trigger( "resize", event, filteredUi( ui ) );
			},
			stop: function( event, ui ) {
				$( this ).removeClass( "ui-dialog-resizing" );
				options.height = $( this ).height();
				options.width = $( this ).width();
				self._trigger( "resizeStop", event, filteredUi( ui ) );
				$.ui.dialog.overlay.resize();
			}
		})
		.css( "position", position )
		.find( ".ui-resizable-se" )
			.addClass( "ui-icon ui-icon-grip-diagonal-se" )
        	.attr("tabindex", "0") //keyboard support for resizable
        	.attr("role", "button")
    		.attr("title", "Resize dialog")
        	.keydown(function(event) {
        		if (jQuery.inArray(event.keyCode, [37, 38, 39, 40]) == -1)
        			return true; //only interested in arrow keys
        		var handle = $(this);
        		var offset = handle.offset();
        		var increment = event.ctrlKey ? 100 : (event.shiftKey ? 1 : 20);
        		var overEvent, downEvent, moveEvent1, moveEvent2, upEvent;
        		// simulate mouse events to trigger resize action
        		overEvent = new $.Event("mouseover");
        		downEvent = new $.Event("mousedown");
        		moveEvent1 = new $.Event("mousemove");
        		moveEvent2 = new $.Event("mousemove"); //only second move event leads to actual resize 
        		upEvent = new $.Event("mouseup");
        		overEvent.pageX = downEvent.pageX = moveEvent1.pageX = 
        			moveEvent2.pageX = upEvent.pageX = offset.left;
        		overEvent.pageY = downEvent.pageY = moveEvent1.pageY = 
        			moveEvent2.pageY = upEvent.pageY = offset.top;
        		downEvent.which = upEvent.which = 1;
        		// prevents drag from being canceled for IE in _mouseMove:
        		moveEvent1.button = moveEvent2.button = 1; 
        		switch (event.keyCode) {
        			case 37: //left
        				moveEvent1.pageX = moveEvent2.pageX = upEvent.pageX = downEvent.pageX - increment;
        				break;
        			case 38: //up
        				moveEvent1.pageY = moveEvent2.pageY = upEvent.pageY = downEvent.pageY - increment;
        				break;
        			case 39: //right
        				moveEvent1.pageX = moveEvent2.pageX = upEvent.pageX = downEvent.pageX + increment;
        				break;
        			case 40: //down
        				moveEvent1.pageY = moveEvent2.pageY = upEvent.pageY = downEvent.pageY + increment;
        				break;
        		}
        		handle.trigger(overEvent);
        		handle.trigger(downEvent);
        		handle.trigger(moveEvent1);
        		handle.trigger(moveEvent2);
        		handle.trigger(upEvent);
        		event.stopPropagation();
        		return false;
        	});		
	},

	_minHeight: function() {
		var options = this.options;

		if ( options.height === "auto" ) {
			return options.minHeight;
		} else {
			return Math.min( options.minHeight, options.height );
		}
	},

	_position: function( position ) {
		var myAt = [],
			offset = [ 0, 0 ],
			isVisible;

		if ( position ) {
			// deep extending converts arrays to objects in jQuery <= 1.3.2 :-(
	//		if (typeof position == 'string' || $.isArray(position)) {
	//			myAt = $.isArray(position) ? position : position.split(' ');

			if ( typeof position === "string" || (typeof position === "object" && "0" in position ) ) {
				myAt = position.split ? position.split( " " ) : [ position[ 0 ], position[ 1 ] ];
				if ( myAt.length === 1 ) {
					myAt[ 1 ] = myAt[ 0 ];
				}

				$.each( [ "left", "top" ], function( i, offsetPosition ) {
					if ( +myAt[ i ] === myAt[ i ] ) {
						offset[ i ] = myAt[ i ];
						myAt[ i ] = offsetPosition;
					}
				});

				position = {
					my: myAt.join( " " ),
					at: myAt.join( " " ),
					offset: offset.join( " " )
				};
			} 

			position = $.extend( {}, $.ui.dialog.prototype.options.position, position );
		} else {
			position = $.ui.dialog.prototype.options.position;
		}

		// need to show the dialog to get the actual offset in the position plugin
		isVisible = this.uiDialog.is( ":visible" );
		if ( !isVisible ) {
			this.uiDialog.show();
		}
		this.uiDialog.position( position );
		if ( !isVisible ) {
			this.uiDialog.hide();
		}
	},

	_setOptions: function( options ) {
		var self = this,
			resizableOptions = {},
			resize = false;

		$.each( options, function( key, value ) {
			self._setOption( key, value );
			
			if ( key in sizeRelatedOptions ) {
				resize = true;
			}
			if ( key in resizableRelatedOptions ) {
				resizableOptions[ key ] = value;
			}
		});

		if ( resize ) {
			this._size();
		}
		if ( this.uiDialog.is( ":data(resizable)" ) ) {
			this.uiDialog.resizable( "option", resizableOptions );
		}
	},

	_setOption: function( key, value ) {
		var self = this,
			uiDialog = self.uiDialog;

		switch ( key ) {
			case "buttons":
				self._createButtons( value );
				break;
			case "closeText":
				// ensure that we always pass a string
				self.uiDialogTitlebarCloseText.text( "" + value );
				break;
			case "dialogClass":
				uiDialog
					.removeClass( self.options.dialogClass )
					.addClass( uiDialogClasses + value );
				break;
			case "disabled":
				if ( value ) {
					uiDialog.addClass( "ui-dialog-disabled" );
				} else {
					uiDialog.removeClass( "ui-dialog-disabled" );
				}
				break;
			case "draggable":
				var isDraggable = uiDialog.is( ":data(draggable)" );
				if ( isDraggable && !value ) {
					self.uiDialogTitlebar
						.removeAttr("tabindex")
						.removeAttr("role")
						.removeAttr("title")
						.unbind("keydown");
					
					uiDialog.draggable( "destroy" );
				}
				
				if ( !isDraggable && value ) {
					self._makeDraggable();
				}
				break;
			case "position":
				self._position( value );
				break;
			case "resizable":
				// currently resizable, becoming non-resizable
				var isResizable = uiDialog.is( ":data(resizable)" );
				if ( isResizable && !value ) {
					uiDialog.resizable( "destroy" );
				}

				// currently resizable, changing handles
				if ( isResizable && typeof value === "string" ) {
					uiDialog.resizable( "option", "handles", value );
				}

				// currently non-resizable, becoming resizable
				if ( !isResizable && value !== false ) {
					self._makeResizable( value );
				}
				break;
			case "title":
				// convert whatever was passed in o a string, for html() to not throw up
				$( ".ui-dialog-title", self.uiDialogTitlebar )
					.html( "" + ( value || "&#160;" ) );
				break;
		}

		this._super( "_setOption", key, value );
	},

	_size: function() {
		/* If the user has resized the dialog, the .ui-dialog and .ui-dialog-content
		 * divs will both have width and height set, so we need to reset them
		 */
		var options = this.options,
			nonContentHeight,
			minContentHeight,
			isVisible = this.uiDialog.is( ":visible" );

		// reset content sizing
		this.element.show().css({
			width: "auto",
			minHeight: 0,
			height: 0
		});

		if ( options.minWidth > options.width ) {
			options.width = options.minWidth;
		}

		// reset wrapper sizing
		// determine the height of all the non-content elements
		nonContentHeight = this.uiDialog.css({
				height: "auto",
				width: options.width
			})
			.height();
		minContentHeight = Math.max( 0, options.minHeight - nonContentHeight );
		
		if ( options.height === "auto" ) {
			// only needed for IE6 support
			if ( $.support.minHeight ) {
				this.element.css({
					minHeight: minContentHeight,
					height: "auto"
				});
			} else {
				this.uiDialog.show();
				var autoHeight = this.element.css( "height", "auto" ).height();
				if ( !isVisible ) {
					this.uiDialog.hide();
				}
				this.element.height( Math.max( autoHeight, minContentHeight ) );
			}
		} else {
			this.element.height( Math.max( options.height - nonContentHeight, 0 ) );
		}

		if (this.uiDialog.is( ":data(resizable)" ) ) {
			this.uiDialog.resizable( "option", "minHeight", this._minHeight() );
		}
	}
});

$.extend($.ui.dialog, {
	version: "@VERSION",

	uuid: 0,
	maxZ: 0,

	getTitleId: function($el) {
		var id = $el.attr( "id" );
		if ( !id ) {
			this.uuid += 1;
			id = this.uuid;
		}
		return "ui-dialog-title-" + id;
	},

	overlay: function( dialog ) {
		this.$el = $.ui.dialog.overlay.create( dialog );
	}
});

$.extend( $.ui.dialog.overlay, {
	instances: [],
	// reuse old instances due to IE memory leak with alpha transparency (see #5185)
	oldInstances: [],
	maxZ: 0,
	events: $.map(
		"focus,mousedown,mouseup,keydown,keypress,click".split( "," ),
		function( event ) {
			return event + ".dialog-overlay";
		}
	).join( " " ),
	create: function( dialog ) {
		if ( this.instances.length === 0 ) {
			// prevent use of anchors and inputs
			$("<div class='ui-helper-hidden-accessible' tabindex='0'></div>")
				.focus(function(event){
					$(dialog.uiDialog.find(":tabbable").get().concat(dialog.uiDialog.get(0)))
						.first().focus();
				})
				.attr("id", "ui-dialog-overlay-start")
				.prependTo(document.body)
				.clone(true)
				.attr("id","ui-dialog-overlay-end")
				.appendTo(document.body);
			
			// we use a setTimeout in case the overlay is created from an
			// event that we're going to be cancelling (see #2804)
			setTimeout(function() {
				// handle $(el).dialog().dialog('close') (see #4065)
				if ( $.ui.dialog.overlay.instances.length ) {
					$( document.body ).bind( $.ui.dialog.overlay.events, function( event ) {
						// stop events if the z-index of the target is < the z-index of the overlay
						// we cannot return true when we don't want to cancel the event (#3523)
						if ( $( event.target ).zIndex() < $.ui.dialog.overlay.maxZ ) {
							return false;
						}
					});
				}
			}, 1 );

			// allow closing by pressing the escape key
			$( document ).bind( "keydown.dialog-overlay", function( event ) {
				if ( dialog.options.closeOnEscape && !event.isDefaultPrevented() && event.keyCode &&
					event.keyCode === $.ui.keyCode.ESCAPE ) {
					
					dialog.close( event );
					event.preventDefault();
				}
			});

			// handle window resize
			$( window ).bind( "resize.dialog-overlay", $.ui.dialog.overlay.resize );
		}

		var $el = ( this.oldInstances.pop() || $( "<div>" ).addClass( "ui-widget-overlay" ) )
			.appendTo( document.body )
			.css({
				width: this.width(),
				height: this.height()
			});

		if ( $.fn.bgiframe ) {
			$el.bgiframe();
		}

		this.instances.push( $el );
		return $el;
	},

	destroy: function( $el ) {
		var indexOf = $.inArray( $el, this.instances );
		if ( indexOf !== -1 ) {
			this.oldInstances.push( this.instances.splice( indexOf, 1 )[ 0 ] );
		}

		if ( this.instances.length === 0 ) {
			$( [ document, window ] ).unbind( ".dialog-overlay" );
			$("#ui-dialog-overlay-start, #ui-dialog-overlay-end").remove();	
		}

		$el.remove();

		// adjust the maxZ to allow other modal dialogs to continue to work (see #4309)
		var maxZ = 0;
		$.each( this.instances, function() {
			maxZ = Math.max( maxZ, this.css( "z-index" ) );
		});
		this.maxZ = maxZ;
	},

	height: function() {
		var scrollHeight,
			offsetHeight;
		// handle IE 6
		if ( $.browser.msie && $.browser.version < 7 ) {
			scrollHeight = Math.max(
				document.documentElement.scrollHeight,
				document.body.scrollHeight
			);
			offsetHeight = Math.max(
				document.documentElement.offsetHeight,
				document.body.offsetHeight
			);

			if ( scrollHeight < offsetHeight ) {
				return $( window ).height() + "px";
			} else {
				return scrollHeight + "px";
			}
		// handle "good" browsers
		} else {
			return $( document ).height() + "px";
		}
	},

	width: function() {
		var scrollWidth,
			offsetWidth;
		// handle IE 6
		if ( $.browser.msie && $.browser.version < 7 ) {
			scrollWidth = Math.max(
				document.documentElement.scrollWidth,
				document.body.scrollWidth
			);
			offsetWidth = Math.max(
				document.documentElement.offsetWidth,
				document.body.offsetWidth
			);

			if ( scrollWidth < offsetWidth ) {
				return $( window ).width() + "px";
			} else {
				return scrollWidth + "px";
			}
		// handle "good" browsers
		} else {
			return $( document ).width() + "px";
		}
	},

	resize: function() {
		/* If the dialog is draggable and the user drags it past the
		 * right edge of the window, the document becomes wider so we
		 * need to stretch the overlay. If the user then drags the
		 * dialog back to the left, the document will become narrower,
		 * so we need to shrink the overlay to the appropriate size.
		 * This is handled by shrinking the overlay before setting it
		 * to the full document size.
		 */
		var $overlays = $( [] );
		$.each( $.ui.dialog.overlay.instances, function() {
			$overlays = $overlays.add( this );
		});

		$overlays.css({
			width: 0,
			height: 0
		}).css({
			width: $.ui.dialog.overlay.width(),
			height: $.ui.dialog.overlay.height()
		});
	}
});

$.extend( $.ui.dialog.overlay.prototype, {
	destroy: function() {
		$.ui.dialog.overlay.destroy( this.$el );
	}
});

}( jQuery ) );
