import {Vector} from './vector';
import {Primitives} from './primitives';

// Helper class to represent a model with translation, scale, rotation and an array of vertices
class Model {
    constructor(vertices = Primitives.Cube(), translation = new Vector(0, 0, 5),  rotation = new Vector(0, 0, 0), scale = new Vector(1, 1, 1)) {
        this.vertices = vertices;
        this.translation = translation;
        this.rotation = rotation;
        this.scale = scale;
    }
}

class Triangle {
	constructor(p0, p1, p2, colorIndices, ambientIndex) {
		this.p0 = p0;
		this.p1 = p1;
		this.p2 = p2;
		this.colorIndices = colorIndices;
		this.ambientIndex = ambientIndex;
	}
}

class Quad {
	constructor(p0, p1, p2, p3, colorIndices, ambientIndex) {
		this.p0 = p0;
		this.p1 = p1;
		this.p2 = p2;
		this.p3 = p3;
		this.colorIndices = colorIndices;
		this.ambientIndex = ambientIndex;
	}
}

class Geometry {
	constructor(isQuad, triangle, quad, positionForLightCalculation) {
		this.isQuad = isQuad;
		this.triangle = triangle;
		this.quad = quad;
		this.positionForLightCalculation = positionForLightCalculation;
	}

	averageZ() {
		if (this.isQuad) {
			return (this.quad.p0.z + this.quad.p1.z + this.quad.p2.z + this.quad.p3.z) / 4;
		} else {
			return (this.triangle.p0.z + this.triangle.p1.z + this.triangle.p2.z) / 4;
		}
	}

	colorIndices() {
		if (this.isQuad) {
			return this.quad.colorIndices;
		} else {
			return this.triangle.colorIndices;
		}
	}

	getAmbientIndex() {
		if (this.isQuad) {
			return this.quad.ambientIndex;
		} else {
			return this.triangle.ambientIndex;
		}
	}

	worldPositionForLighting() {
		return this.positionForLightCalculation;
	}

	colorIndex(index) {
		return this.colorIndices()[index];
	}

	rawPoints() {
		if (this.isQuad) {
			return [this.quad.p0, this.quad.p1, this.quad.p2, this.quad.p3];
		} else {
			return [this.triangle.p0, this.triangle.p1, this.triangle.p2];
		}
	}

	setRawPoints(points) {
		var colorIndices = this.colorIndices();
		var lightDistance = this.positionForLightCalculation;
		var ambientIndex = this.getAmbientIndex();
		if (points.length == 3) {
			this.isQuad = false;
			this.triangle = new Triangle(points[0], points[1], points[2], colorIndices, ambientIndex);
		} else {
			this.isQuad = true;
			this.quad = new Quad(points[0], points[1], points[2], points[3], colorIndices, ambientIndex);
		}
	}

	pixelAlign(scale) {
		if (this.isQuad) {
			this.setRawPoints([
				this.quad.p0.pixelAlign(scale),
				this.quad.p1.pixelAlign(scale),
				this.quad.p2.pixelAlign(scale),
				this.quad.p3.pixelAlign(scale)
			]);
		} else {
			this.setRawPoints([
				this.triangle.p0.pixelAlign(scale),
				this.triangle.p1.pixelAlign(scale),
				this.triangle.p2.pixelAlign(scale),
			]);
		}
	}
}

var Clipping = {};

Clipping.ClipVertices = (p1, pN, rawPoints) => {
	pN = Vector.Normalize(pN);

	function distance(p, planeP, planeN) {
		return (planeN.x * p.x + planeN.y * p.y + planeN.z * p.z - Vector.Dot(planeN, planeP));
	}

	if (rawPoints.length == 0) {
		return [];
	}

	// Create two temporary storage arrays to classify points either side of plane
	// If distance sign is positive, point lies on "inside" of plane

	var processedPoints = [];
	var allInside = true;
	var allOutside = true;
	var insidePoints = [];
	var outsidePoints = [];

	for (var i = 0; i < rawPoints.length; i++) {
		var p = rawPoints[i];
		var d = distance(p, p1, pN);
		if (d >= 0) {
			// Point is inside
			allOutside = false;
			processedPoints.push({inside:true, point:p});
			insidePoints.push(p);
		} else {
			// Point is outside
			allInside = false;
			processedPoints.push({inside:false, point:p});
			outsidePoints.push(p);
		}
	}

	// All inside? Fine, just return ourselves
	if (allInside) {
		return rawPoints;
	}

	// All outside? Return null so we don't waste time rendering this geometry
	if (allOutside) {
		return [];
	}

	// Triangle clipping
	// 1 point outside (we need to render 2 triangles)
	if (rawPoints.length == 3 && outsidePoints.length == 1) {
		rawPoints = [
			insidePoints[0],
			insidePoints[1],
			Vector.IntersectPlane(p1, pN, insidePoints[1], outsidePoints[0]),
			Vector.IntersectPlane(p1, pN, insidePoints[0], outsidePoints[0]),
		];
	}

	// 2 points outside
	if (rawPoints.length == 3 && outsidePoints.length == 2) {
		rawPoints = [
			insidePoints[0],
			Vector.IntersectPlane(p1, pN, insidePoints[0], outsidePoints[0]),
			Vector.IntersectPlane(p1, pN, insidePoints[0], outsidePoints[1]),
		];
	}

	return rawPoints;
}

export {Model, Triangle, Quad, Geometry, Clipping};