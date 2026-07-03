export type FramebufferTarget = {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
};

function createColorTexture(
  gl: WebGLRenderingContext,
  width: number,
  height: number,
) {
  const texture = gl.createTexture();
  if (!texture) return null;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  return texture;
}

export function createFramebuffer(
  gl: WebGLRenderingContext,
  width: number,
  height: number,
): FramebufferTarget | null {
  const framebuffer = gl.createFramebuffer();
  const texture = createColorTexture(gl, width, height);
  if (!framebuffer || !texture) {
    if (framebuffer) gl.deleteFramebuffer(framebuffer);
    if (texture) gl.deleteTexture(texture);
    return null;
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  );

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);

  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteFramebuffer(framebuffer);
    gl.deleteTexture(texture);
    return null;
  }

  return { framebuffer, texture, width, height };
}

export function resizeFramebuffer(
  gl: WebGLRenderingContext,
  target: FramebufferTarget,
  width: number,
  height: number,
) {
  if (target.width === width && target.height === height) return;

  target.width = width;
  target.height = height;
  gl.bindTexture(gl.TEXTURE_2D, target.texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  gl.bindTexture(gl.TEXTURE_2D, null);
}

export function bindFramebuffer(
  gl: WebGLRenderingContext,
  target: FramebufferTarget | null,
) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
}

export function deleteFramebuffer(
  gl: WebGLRenderingContext,
  target: FramebufferTarget,
) {
  gl.deleteFramebuffer(target.framebuffer);
  gl.deleteTexture(target.texture);
}
