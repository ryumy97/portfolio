import { FULLSCREEN_TRIANGLE } from "./constants";

export function createFullscreenTriangleBuffer(
	gl: WebGLRenderingContext,
): WebGLBuffer | null {
	const buffer = gl.createBuffer();
	if (!buffer) return null;

	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_TRIANGLE, gl.STATIC_DRAW);
	return buffer;
}

export function drawFullscreenTriangle(
	gl: WebGLRenderingContext,
	program: WebGLProgram,
	buffer: WebGLBuffer,
	attribName = "a_pos",
) {
	const location = gl.getAttribLocation(program, attribName);
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.enableVertexAttribArray(location);
	gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLES, 0, 3);
}
