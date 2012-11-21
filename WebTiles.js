define([
	"dojo/_base/declare" // declare
], function(declare) {

return declare(null, {
	
	init: function() {
		var str = this.yFirst ? "y}/{x" : "x}/{y"
			tileLayer = new L.TileLayer("{s}/{z}/{" + str + "}.png", {
			subdomains: this.url
		});
		this._tileLayer = tileLayer;
		this.map.engine.lmap.addLayer(tileLayer);
	}
});

});
