define([
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // mixin
	"dojo/_base/array", // forEach, map
	"dojo/_base/Color",
	"djeo/util/_base",
	"djeo/common/Placemark"
], function(declare, lang, array, Color, u, P){

var Placemark = declare([P], {

	constructor: function(kwArgs) {
		lang.mixin(this, kwArgs);
	},

	makePoint: function(feature, coords) {
		// do nothing here
	},

	makeLineString: function(feature, coords) {
		var points = [];
		array.forEach(coords, function(point) {
			points.push(new L.LatLng(point[1],point[0]));
		});
		return new L.Polyline(points);
	},

	makePolygon: function(feature, coords) {
		var parts = [];
		array.forEach(coords, function(_polygonPart) {
			var points = [];
			array.forEach(_polygonPart, function(_point) {
				points.push(new L.LatLng(_point[1], _point[0]));
			});
			parts.push(points);
		});
		return new L.Polygon(parts);
	},
	
	makeMultiLineString: function(feature, coords) {
		var linestrings = [];
		array.forEach(coords, function(_linestring){
			var points = [];
			array.forEach(_linestring, function(_point) {
				points.push(new L.LatLng(_point[1],_point[0]));
			});
			linestrings.push(points);
		}, this);
		return new L.MultiPolyline(linestrings);
	},
	
	makeMultiPolygon: function(feature, coords) {
		var polygons = [];
		array.forEach(coords, function(_polygon){
			array.forEach(_polygon, function(_polygonPart) {
				var points = [];
				array.forEach(_polygonPart, function(_point) {
					points.push(new L.LatLng(_point[1],_point[0]));
				});
				polygons.push(points);
			});
		}, this);
		return new L.MultiPolygon(polygons);
	},
	
	applyPointStyle: function(feature, calculatedStyle, coords) {
		var specificStyle = calculatedStyle.point,
			specificShapeStyle = P.getSpecificShapeStyle(calculatedStyle.points, this.specificStyleIndex),
			marker = feature.baseShapes[0],
			shapeType = P.get("shape", calculatedStyle, specificStyle, specificShapeStyle),
			src = P.getImgSrc(calculatedStyle, specificStyle, specificShapeStyle),
			isVectorShape = true,
			scale = P.getScale(calculatedStyle, specificStyle, specificShapeStyle),
			heading = feature.orientation
		;

		if (!shapeType && src) isVectorShape = false;
		else if (!P.shapes[shapeType] && !marker)
			// set default value for the shapeType only if we haven't already styled the feature (!miExists)
			shapeType = P.defaultShapeType;

		var iconOptions = marker ? marker.options.icon.options : {
			shadowUrl: ""
		};
		
		var url = this._getIconUrl(isVectorShape, shapeType, src);
		if (heading != undefined) {
			if (lang.isObject(heading)) heading = heading.heading;
			heading = Math.round(u.radToDeg(heading));
			if (heading<0) heading = 360 + heading;
			iconOptions.angle = heading;
		}
		if (url) iconOptions.iconUrl = url;

		var size = isVectorShape ? P.getSize(calculatedStyle, specificStyle, specificShapeStyle) : P.getImgSize(calculatedStyle, specificStyle, specificShapeStyle);
		if (size) {
			var anchor = isVectorShape ? [size[0]/2, size[1]/2] : P.getAnchor(calculatedStyle, specificStyle, specificShapeStyle, size);
			iconOptions.iconSize = [scale*size[0], scale*size[1]];
			iconOptions.iconAnchor = [scale*anchor[0], scale*anchor[1]];
		}
		else if (marker) {
			// check if we can apply relative scale (rScale)
			var rScale = P.get("rScale", calculatedStyle, specificStyle, specificShapeStyle);
			if (rScale !== undefined) {
				var iconSize = iconOptions.iconSize,
					iconAnchor = iconOptions.iconAnchor
				;
				iconOptions.iconSize = [rScale*iconSize[0], rScale*iconSize[1]];
				iconOptions.iconAnchor = [rScale*iconAnchor[0], rScale*iconAnchor[1]];
			}
		}

		var icon = new L.Icon(iconOptions);
		if (marker) {
			marker.setIcon(icon);
		}
		else {
			feature.baseShapes[0] = new L.Marker([coords[1], coords[0]], {
				icon: icon
			});
		}
	},
	
	applyLineStyle: function(feature, calculatedStyle, coords) {
		var specificStyle = calculatedStyle.line,
			specificShapeStyle = P.getSpecificShapeStyle(calculatedStyle.lines, this.specificStyleIndex),
			polyline = feature.baseShapes[0],
			stroke = P.get("stroke", calculatedStyle, specificStyle, specificShapeStyle),
			strokeOpacity = P.get("strokeOpacity", calculatedStyle, specificStyle, specificShapeStyle),
			strokeWidth = P.get("strokeWidth", calculatedStyle, specificStyle, specificShapeStyle),
			polylineOptions = {}
		;

		if (stroke) polylineOptions.color = stroke;
		if (strokeOpacity !== undefined) polylineOptions.opacity = strokeOpacity;
		if (strokeWidth !== undefined) polylineOptions.weight = strokeWidth;
		polyline.setStyle(polylineOptions);
	},

	applyPolygonStyle: function(feature, calculatedStyle, coords) {
		// no specific shape styles for a polygon!
		var specificStyle = calculatedStyle.polygon,
			polygon = feature.baseShapes[0],
			fill = P.get("fill", calculatedStyle, specificStyle),
			fillOpacity = P.get("fillOpacity", calculatedStyle, specificStyle),
			stroke = P.get("stroke", calculatedStyle, specificStyle),
			strokeOpacity = P.get("strokeOpacity", calculatedStyle, specificStyle),
			strokeWidth = P.get("strokeWidth", calculatedStyle, specificStyle),
			polygonOptions = {};

		if (fill) polygonOptions.fillColor = fill;
		if (fillOpacity !== undefined) polygonOptions.fillOpacity = fillOpacity;

		if (stroke) polygonOptions.color = stroke;
		if (strokeOpacity !== undefined) polygonOptions.opacity = strokeOpacity;
		if (strokeWidth !== undefined) polygonOptions.weight = strokeWidth;

		polygon.setStyle(polygonOptions);
	},
	
	remove: function(feature) {

	},
	
	show: function(feature, show) {
		if (show) this.engine.lmap.addLayer(feature.baseShapes[0]);
		else this.engine.lmap.removeLayer(feature.baseShapes[0]);
	},
	
	makeText: function(feature, calculatedStyle) {
		if (feature.textShapes) {
			array.forEach(feature.textShapes, function(t) {
				this.engine.lmap.removeLayer(t);
			}, this);
		}

		var textStyle = P.getTextStyle(feature, calculatedStyle);
		if (!textStyle) return;

		var label = textStyle.label || this._getLabel(feature, textStyle);

		if (label) {
			// ts states for "text style"
			feature.reg.ts = textStyle;

			// halo is ignored
			var coords = feature.getCoords(),
				scale = P.getScale(feature.reg.cs),
				dx = ("dx" in textStyle) ? scale*textStyle.dx : 0,
				dy = ("dy" in textStyle) ? scale*textStyle.dy : 0,
				iconOptions = {
					html: label,
					iconAnchor: [dx,dy]
				}
			;
			if ("size" in textStyle) {
				iconOptions.size = scale*textStyle.size;
			}
			return new L.Marker([coords[1], coords[0]], {
				icon: new L.TextIcon(iconOptions),
				zIndexOffset: 1
			});
		}
	},

	setCoords: function(coords, feature) {
		var ll = new L.LatLng(coords[1], coords[0]);
		feature.baseShapes[0].setLatLng(ll);
		if (feature.textShapes) {
			feature.textShapes[0].setLatLng(ll);
		}
	},

	setOrientation: function(o, feature) {
		// orientation is actually heading
		if (!feature.map.simulateOrientation) return;
		var marker = feature.baseShapes[0],
			iconOptions = marker.options.icon.options,
			heading = Math.round(u.radToDeg(o))
		;
		if (heading<0) heading = 360 + heading;
		iconOptions.angle = heading;
		marker.setIcon(new L.Icon(iconOptions));
	}
});

function convertColor(c, a) {
	rgba = new Color(c).toRgba();
	// convert alpha to [0..255] scale
	rgba[3] = Math.round(255*a);
	// convert to hex
	var rgbaHex = array.map(rgba, function(c){
		var s = c.toString(16);
		return s.length < 2 ? "0" + s : s;
	});
	return rgbaHex.join('');
};

function getColor(color) {
	return "#" + color.substring(0,6);
};

function getOpacity(color) {
	return parseInt(color.substring(6), 16) / 255;
};

function applyStroke(style, calculatedStyle, specificStyle, specificShapeStyle) {
	var stroke = P.get("stroke", calculatedStyle, specificStyle, specificShapeStyle),
		strokeWidth = P.get("strokeWidth", calculatedStyle, specificStyle, specificShapeStyle),
		strokeOpacity = P.get("strokeOpacity", calculatedStyle, specificStyle, specificShapeStyle);

	if (stroke || strokeWidth!==undefined || strokeOpacity!==undefined) {
		stroke = stroke ? stroke : getColor(style.strokeColor);
		strokeOpacity = strokeOpacity!==undefined ? strokeOpacity : getOpacity(style.strokeColor);
		style.strokeColor = convertColor(stroke, strokeOpacity);
		if (strokeWidth !== undefined) style.strokeWidth = strokeWidth;
	}
};

return Placemark;
});
