import {Vector} from './vector'

class Matrix {
	// Makes a 2 dimensional matrix of size (e.g. Matrix.Make([4, 4]))
	static Make(dimensions) {
		var array = [];
		for (var i = 0; i < dimensions[0]; ++i) {
			array.push(dimensions.length == 1 ? 0 : Matrix.Make(dimensions.slice(1)));
		}
		return array;
	}

	static Identity() {
		var matrix = Matrix.Make([4, 4]);
		matrix[0][0] = 1.0;
		matrix[1][1] = 1.0;
		matrix[2][2] = 1.0;
		matrix[3][3] = 1.0;
		return matrix;
	}

	static Translation(translation) {
		var matrix = Matrix.Identity();
		matrix[3][0] = translation.x;
		matrix[3][1] = translation.y;
		matrix[3][2] = translation.z;
		return matrix;
	}

	static Scale(scale) {
		var matrix = Matrix.Identity();
		matrix[0][0] = scale.x;
		matrix[1][1] = scale.y;
		matrix[2][2] = scale.z;
		return matrix;
	}

	static RotationX(angle) {
		var matrix = Matrix.Identity();
		matrix[0][0] = 1.0; 
		matrix[1][1] = Math.cos(angle);
		matrix[1][2] = Math.sin(angle);
		matrix[2][1] = -Math.sin(angle);
		matrix[2][2] = Math.cos(angle);
		matrix[3][3] = 1.0;
		return matrix;
	}

	static RotationY(angle) {
		var matrix = Matrix.Identity();
		matrix[0][0] = Math.cos(angle);
		matrix[0][2] = Math.sin(angle);
		matrix[1][1] = 1.0;
		matrix[2][0] = -Math.sin(angle);
		matrix[2][2] = Math.cos(angle);
		matrix[3][3] = 1.0;
		return matrix;
	}

	static RotationZ(angle) {
		var matrix = Matrix.Identity();
		matrix[0][0] = Math.cos(angle);
		matrix[0][1] = Math.sin(angle);
		matrix[1][0] = -Math.sin(angle);
		matrix[1][1] = Math.cos(angle);
		matrix[2][2] = 1.0;
		matrix[3][3] = 1.0;
		return matrix;
	}

	static Rotation(rotation) {
		var matrix = Matrix.Identity();
		matrix = Matrix.Multiply(matrix, Matrix.RotationX(rotation.x));
		matrix = Matrix.Multiply(matrix, Matrix.RotationY(rotation.y));
		matrix = Matrix.Multiply(matrix, Matrix.RotationZ(rotation.z));
		return matrix;
	}

	static Projection(aspectRatio, fieldOfView, near, far) {
		var matrix = Matrix.Identity();
		matrix[0][0] = aspectRatio * fieldOfView;
		matrix[1][1] = fieldOfView;
		matrix[2][2] = far / (far - near);
		matrix[3][2] = (-far * near) / (far - near);
		matrix[2][3] = 1.0;
		matrix[3][3] = 0;
		return matrix;
	}

	static Multiply(m1, m2) {
		var matrix = Matrix.Identity();
		for (var c = 0; c < 4; c++) {
			for (var r = 0; r < 4; r++) {
				matrix[r][c] = m1[r][0] * m2[0][c] + m1[r][1] * m2[1][c] + m1[r][2] * m2[2][c] + m1[r][3] * m2[3][c];
			}
		}
		return matrix;
	}

	static Inverse(m) {
		// Taken from http://blog.acipo.com/matrix-inversion-in-javascript/
		var inverse = Matrix.Identity();
		for (var i = 0; i < 4; i++) {
			var e = m[i][i];
			if (e == 0) {
				for (var ii = i + 1; ii < dim; ii += 1) {
					if (m[ii][i] != 0){
						for (j = 0; j < 4; j++) {
							e = m[i][j];
							m[i][j] = m[ii][j];
							m[ii][j] = e;
							e = inverse[i][j];
							inverse[i][j] = inverse[ii][j];
							inverse[ii][j] = e; 
						}
						break;
					}
				}
				e = m[i][i];
				if(e == 0) return Matrix.Identity();
			}
        
			for (var j=0; j < 4; j++) {
				m[i][j] = m[i][j] / e;
				inverse[i][j] = inverse[i][j] / e;
			}
        
			for(var ii=0; ii < 4; ii++) {
				if(ii == i) continue;
				e = m[ii][i];
				for(var j=0; j < 4; j++) {
					m[ii][j] -= e * m[i][j];
					inverse[ii][j] -= e * inverse[i][j];
				}
			}
		}
    
		return inverse;
	}

	static LookAt(pos, target, up) {
		// Calculate new forward direction
		var newForward = Vector.Subtract(target, pos);
		newForward = Vector.Normalize(newForward);

		// Calculate new Up direction
		var a = Vector.Multiply(newForward, Vector.Dot(up, newForward));
		var newUp = Vector.Subtract(up, a);
		newUp = Vector.Normalize(newUp);

		// New Right direction is easy, its just cross product
		var newRight = Vector.Cross(newUp, newForward);

		// Construct Dimensioning and Translation Matrix	
		var matrix = Matrix.Identity();
		matrix[0][0] = newRight.x;
		matrix[0][1] = newRight.y;	
		matrix[0][2] = newRight.z;	
		matrix[0][3] = 0.0;
		matrix[1][0] = newUp.x;		
		matrix[1][1] = newUp.y;		
		matrix[1][2] = newUp.z;		
		matrix[1][3] = 0.0;
		matrix[2][0] = newForward.x;	
		matrix[2][1] = newForward.y;	
		matrix[2][2] = newForward.z;	
		matrix[2][3] = 0.0;
		matrix[3][0] = pos.x;			
		matrix[3][1] = pos.y;			
		matrix[3][2] = pos.z;			
		matrix[3][3] = 1.0;
		return matrix;
	}

	static Print(m, name="Matrix") {
		console.log(name);
		for (var r = 0; r < 4; r++) {
			for (var c = 0; c < 4; c++) {
				console.log("[" + r + "]" + "[" + c + "] = " + m[r][c]);
			}
		}
	}
}

export {Matrix};