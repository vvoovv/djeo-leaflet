define([
	"dojo/_base/declare", // declare
	"djeo/WebTiles"
], function(declare, WebTiles) {

return declare([WebTiles], {
	
	constructor: function(kwArgs, map) {
		var tileLayer = new L.TileLayer("{s}/{z}/{x}/{y}.png", {
			subdomains: this.url
		});
		this._tileLayer = tileLayer;
		this.map.engine.lmap.addLayer(tileLayer);
	},
	
	init: function() {
		
	}
});

});
