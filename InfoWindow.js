define([
	"dojo/_base/declare"
], function(declare) {

return declare(null, {
	
	init: function() {
		this.infoWindow = new L.Popup();
	},

	process: function(event){
		var feature = event.feature,
			cs = feature.reg.cs,
			iw = this.infoWindow,
			content = cs.info ? cs.info(feature) : this.content(feature),
			ll
		;
		if (feature.isPoint()) {
			var coords = feature.getCoords();
			ll = new L.LatLng(coords[1], coords[0]);
		}
		else {
			ll = event.event.latlng;
		}
		iw.setLatLng(ll);
		iw.setContent(content);
		iw.openOn(this.map.engine.lmap);
	}

});

});