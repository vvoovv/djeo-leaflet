define([
	"dojo/_base/declare"
], function(declare) {

return declare(null, {

	enable: function(enable) {
		if (enable === undefined) enable = true;
		var lmap = this.map.engine.lmap;
		if (enable) {
			lmap.dragging.enable();
			lmap.touchZoom.enable();
			lmap.scrollWheelZoom.enable();
			lmap.doubleClickZoom.enable();
			lmap.on("zoomend", this._onZoom, this);
		}
		else {
			lmap.dragging.disable();
			lmap.touchZoom.disable();
			lmap.scrollWheelZoom.disable();
			lmap.doubleClickZoom.disable();
			lmap.off("zoomend", this._onZoom, this);
		}
	},
	
	
});

});