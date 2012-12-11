define([
	"require",
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // mixin, hitch, isArray
	"dojo/_base/array", // forEach
	"dojo/aspect", // after
	"dojo/io/script", // get
	"djeo/Engine",
	"./Placemark",
	"djeo/_tiles",
	"xstyle/css!./dist/leaflet.css"
], function(require, declare, lang, array, aspect, script, Engine, Placemark, supportedLayers){
	
var mapEvents = {
	zoom_changed: 1,
	click: 1,
	mousemove: 1
};
	
function _wrapListener(lmap, event, callback, context) {
	return {
		remove: function() {
			lmap.off(event, callback, context);
		}
	};
}

return declare([Engine], {
	
	lmap: null,
	
	constructor: function(kwArgs) {
		this._require = require;
		// set ignored dependencies
		lang.mixin(this.ignoredDependencies, {"Highlight": 1, "Tooltip": 1});
		this._supportedLayers = supportedLayers;
		// initialize basic factories
		this._initBasicFactories(new Placemark({
			map: this.map,
			engine: this
		}));
	},
	
	initialize: function(/* Function */readyFunction) {
		if (window.L) {
			// the first case: Leaflet API is completely loaded
			this.map.projection = "EPSG:4326";
			var lmap = new L.Map(this.map.container, {
				//dragging: false, TODO: getting error otherwise
				touchZoom: false,
				scrollWheelZoom: false,
				doubleClickZoom: false,
				// disable GUI "+" and "-" buttons
				zoomControl: false,
				// disable attribution
				attributionControl: false
			});
			this.lmap = lmap;
			
			this.initialized = true;
			readyFunction();
		}
		else if (this._initializing) {
			aspect.after(this, "_initializing", lang.hitch(this, function(){
				this.initialize(readyFunction);
			}));
		}
		else {
			this._initializing = function(){};
			script.get({
				url: require.toUrl("./dist/leaflet.js"),
				load: lang.hitch(this, function() {
					this._initializing();
					delete this._initializing;
					this.initialize(readyFunction);
				})
			});
		}
	},

	createContainer: function(feature) {
	},
	
	appendChild: function(child, feature) {
		this.lmap.addLayer(child);
	},
	
	getTopContainer: function() {
		var features = this.ge.getFeatures();
		return this.ge;
	},
	
	onForFeature: function(feature, event, method, context) {
		var connections = [];
		// normalize the callback function
		method = this.normalizeCallback(feature, event, method, context);
		array.forEach(feature.baseShapes, function(shape){
			connections.push( [shape, event, method] );
			shape.on(event, method);
		});
		return connections;
	},
	
	disconnect: function(connections) {
		array.forEach(connections, function(connection){
			connection[0].off(connection[1], connection[2]);
		});
	},

	onForMap: function(event, method, context) {
		var callback = function(e){
			var ll = e.latlng;
			method.call(context, {
				mapCoords: [ll.lng, ll.lat],
				nativeEvent: e
			});
		};
		this.lmap.on(event, callback);
		return _wrapListener(this.lmap, event, callback);
	},

	_on_zoom_changed: function(event, method, context) {
		this.lmap.on("zoomend", method, context);
		return _wrapListener(this.lmap, "zoomend", method, context);
	},

	zoomTo: function(extent) {
		// A hack for a point
		if (extent[0]==extent[2] && extent[1]==extent[3]) {
			extent = [0.99999*extent[0], 0.99999*extent[1], 1.00001*extent[2], 1.00001*extent[3]];
		}
		var lBounds = new L.LatLngBounds(new L.LatLng(extent[1], extent[0]), new L.LatLng(extent[3], extent[2]));
		this.lmap.fitBounds(lBounds);
	},
	
	destroy: function() {
		
	},
	
	_setCamera: function(kwArgs) {
		var c = kwArgs.center;
		c = new L.LatLng(c[1], c[0]);
		this.lmap.setView(c, kwArgs.zoom);
	},

	_set_center: function(center) {
		this.lmap.setView(new L.LatLng(center[1], center[0]), this.lmap.getZoom());
	},
	
	_get_center: function() {
		var center = this.lmap.getCenter();
		return [center.lng, center.lat];
	},
	
	_set_zoom: function(zoom) {
		this.lmap.setZoom(zoom);
	},
	
	_get_zoom: function() {
		return this.lmap.getZoom();
	}
});

});