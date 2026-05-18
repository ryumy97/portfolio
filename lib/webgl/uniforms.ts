export function setResolutionUniform(
	gl: WebGLRenderingContext,
	location: WebGLUniformLocation | null,
) {
	if (location) {
		gl.uniform2f(location, gl.drawingBufferWidth, gl.drawingBufferHeight);
	}
}
