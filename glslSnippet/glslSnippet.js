"use strict";
(function (Prism) {
  function resolveShader(gl, code, gl2) {
    const vs = `${gl2 ? `#version 300 es` : ``}
    ${
      gl2
        ? "layout(location = 0) in vec4 position;"
        : "attribute vec4 position;"
    }
    void main() {gl_Position = position; }`;

    const fs = `${gl2 ? "#version 300 es" : ""}
    precision highp float;
    ${gl2 ? "out vec4 FragColor;" : ""}

    ${code}

    void main() {
    ${
      gl2
        ? `mainImage(FragColor, gl_FragCoord.xy);`
        : `vec4 fragColor = vec4(0, 0, 0, 1);
        vec2 fragCoord = gl_FragCoord.xy;
        mainImage(fragColor, fragCoord);
        gl_FragColor = fragColor;`
    }
    }`;
    return twgl.createProgramInfo(gl, [vs, fs]);
  }

  function adjustCanvas(canvas, width, height, heightAsRatio) {
    canvas.style.width = width;
    if (!heightAsRatio) {
      canvas.style.height = height;
      canvas.style.height = `${canvas.clientHeight}px`;
    } else {
      canvas.style.height = `${height * canvas.clientWidth}px`;
      canvas.style.height = `${canvas.clientHeight}px`;
    }
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }

  Prism.hooks.add("complete", function (env) {
    if (
      env.language !== "glsl" ||
      env.plugins ||
      !env.code ||
      env.code.split("\n").lengh == 0
    ) {
      return;
    }
    const element = env.element;
    const pre = element.parentElement;
    const code = env.code;
    const lines = code.split("\n");
    if (!/^\s*\/\/\s*\+glslSnippet/.test(lines[0])) {
      return;
    }

    const params = lines[0]
      .replace(/^\s*\/\/\s*\+glslSnippet/, "")
      .trim()
      .split(" ")
      .filter((s) => s.length > 0);
    let width = 250;
    let height = 250;
    let heightAsRatio = false;
    if (params.length == 1) {
      width = params[0];
      height = params[0];
      heightAsRatio = false;
    } else if (params.length == 2) {
      width = params[0];
      height = params[1];
      heightAsRatio = false;

      if (/^\d+:\d+$/g.test(params[1])) {
        const numbers = params[1].match(/\d+/g);
        height = (1 / numbers[0]) * numbers[1];
        heightAsRatio = true;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.style.margin = "0.8em 0 2.3em";
    if (
      pre.nextSibling &&
      pre.nextSibling.tagName.toLowerCase() === "figcaption"
    ) {
      pre.parentNode.parentNode.insertBefore(canvas, pre.parentNode);
    } else {
      pre.parentNode.insertBefore(canvas, pre.nextSibling);
    }
    adjustCanvas(canvas, width, height, heightAsRatio);
    const gl2 = canvas.getContext("webgl2") != null;
    const gl =
      canvas.getContext("webgl2") != null
        ? canvas.getContext("webgl2")
        : canvas.getContext("webgl");
    const plane = twgl.primitives.createXYQuadBufferInfo(gl);
    const programInfo = resolveShader(gl, code, gl2);

    function render(time) {
      const uniforms = {
        iResolution: [gl.canvas.width, gl.canvas.height],
        iTime: time / 1000,
      };
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(
        gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT
      );
      gl.useProgram(programInfo.program);
      twgl.setUniforms(programInfo, uniforms);
      twgl.setBuffersAndAttributes(gl, programInfo, plane);
      twgl.drawBufferInfo(gl, plane);
    }
    requestAnimationFrame(render);
    window.addEventListener("resize", () => {
      adjustCanvas(canvas, width, height, heightAsRatio);
      requestAnimationFrame(render);
    });
  });
})(Prism);
