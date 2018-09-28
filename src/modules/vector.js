import {Utils} from "./utils"

class Vector {
	constructor(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = 1;
	}

	static Add(v1, v2) {
		return new Vector(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
	}

	static Subtract(v1, v2) {
		return new Vector(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
	}

	static Multiply(v, factor) {
		return new Vector(v.x * factor, v.y * factor, v.z * factor);
	}

	static Divide(v, factor) {
		return new Vector(v.x / factor, v.y / factor, v.z / factor);
	}

	static Dot(v1, v2) {
		return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
	}

	static Length(v) {
		return Math.sqrt(Vector.Dot(v, v));
	}

	static Normalize(v) {
		var length = Vector.Length(v);
		return new Vector(v.x / length, v.y / length, v.z / length);
	}

	static Cross(v1, v2) {
		return new Vector(
			v1.y * v2.z - v1.z * v2.y,
			v1.z * v2.x - v1.x * v2.z,
			v1.x * v2.y - v1.y * v2.x,
		);
	}

	static MultiplyWithMatrix(v, m) {
		var vector = new Vector(0,0,0);
		vector.x = v.x * m[0][0] + v.y * m[1][0] + v.z * m[2][0] + v.w * m[3][0];
		vector.y = v.x * m[0][1] + v.y * m[1][1] + v.z * m[2][1] + v.w * m[3][1];
		vector.z = v.x * m[0][2] + v.y * m[1][2] + v.z * m[2][2] + v.w * m[3][2];
		vector.w = v.x * m[0][3] + v.y * m[1][3] + v.z * m[2][3] + v.w * m[3][3];
		return vector;
	}

	static IntersectPlane(p1, pN, lineStart, lineEnd) {
		pN = Vector.Normalize(pN);
		var planeD = -Vector.Dot(pN, p1);
		var ad = Vector.Dot(lineStart, pN);
		var bd = Vector.Dot(lineEnd, pN);
		var t = (-planeD - ad) / (bd - ad);
		var lineStartToEnd = Vector.Subtract(lineEnd, lineStart);
		var lineToIntersect = Vector.Multiply(lineStartToEnd, t);
		return Vector.Add(lineStart, lineToIntersect);
	}

	static Print(v, name = "Vector") {
		console.log(name + ": " + "x: " + v.x + " y: " + v.y + " z:" + v.z);
	}

	pixelAlign(scale) {
		this.x = Utils.RoundToPixelGrid(this.x, scale);
		this.y = Utils.RoundToPixelGrid(this.y, scale);
		this.z = Utils.RoundToPixelGrid(this.z, scale);
		return this;
	}
}

export {Vector};