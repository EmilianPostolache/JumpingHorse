'use strict'
/* global flatten vec4 vec3 perspective mult subtract normalize normalMatrix cross */

let gl
let modelViewMatrix
let cameraMatrix
let modelViewMatrixLoc
let normalMatrixLoc
let ambientProdLoc
let diffuseProdLoc
let lightPosLoc
let textureFade, textureCheckerboard, textureTransparent, textureBlack
let texMap1Pos, texMap2Pos

// Camera data
let r =  30
let theta = -20
let phi = 70

const at = vec3(0, 0, 0)
const up = vec3(0, 1, 0)

const fovy = 45
const aspect = 1
const near = 0.001
const far = 100

// Light data
const lightPos = vec4(100, 100, 50, 0.0)
const lightMaterial = new Material(vec4(0.5, 0.5, 0.5, 1.0), vec4(0.8, 0.8, 0.8, 1.0))

// Texture data
const texSize = 512

// Horse data
const horseScale = 1.2
const torsoHeight = horseScale
const torsoWidth = horseScale * 3.0
const upperLegHeight = horseScale
const upperLegWidth = horseScale * 0.25
const lowerLegHeight = horseScale
const lowerLegWidth = horseScale * (1 / 6)
const headHeight = horseScale * 0.5
const headWidth = horseScale
const tailHeight = horseScale
const tailWidth = horseScale * (1 / 12)
const legPadding = horseScale * (1 / 16)

const horseMaterial = new Material(vec4(0.75, 0.2, 0.8, 1.0), vec4(0.45, 0.1, 0.85, 1.0))
let horse

// Obstacle data
const obstacleInitX = 0
const obstacleScaleX = 0.30 // 0.35
const obstacleScaleY = 0.25 // 0.35
let obstacle

// Floor data
const floorHeight = 0.01
const floorWidth = 200
const floorMaterial = new Material(vec4(0.1, 1, 0.1, 1), vec4(0.0, 0.0, 0.0, 1))
let floor

// Animation data
const framesRun = [
// xPos  yPos  torsoT  headT    fluT   fllT    fruT    frlT    bluT    bllT    bruT   brlT   tailT
  [0.0,  0.00, -7.00, -31.00,  -1.33,	-40.00,	 -3.91,   0.00, -40.31,	63.00, -28.24, 12.00, -50.00], // 1
  [0.1,  0.00, -6.50, -30.50,	  4.82,	-49.00, -11.47,   0.00, -40.44,	66.00, -35.17, 18.00, -47.00], // 2
  [0.2,  0.00, -6.00, -31.50,  14.25, -66.00,  -7.75,   0.00, -35.60, 69.00, -41.24, 45.00, -45.00], // 3
  [0.3,  0.00, -6.00, -34.00,  19.68, -60.00,  -5.21, -19.00, -25.77, 57.00, -51.11, 66.00, -49.00], // 4
  [0.4,  0.00, -4.50, -32.50,  25.45, -55.00,  -0.27, -30.00,  -8.25, 42.00, -44.05, 70.00, -45.00], // 5
  [0.5,  0.00, -2.30, -34.70,  33.02, -54.00,   7.75, -43.00,  -4.89, 35.00, -39.59, 70.00, -54.00], // 6
  [0.6,  0.00, -1.20, -29.80,  42.50, -49.00,  26.12, -70.00,   3.19, 24.00, -37.40, 81.00, -46.00], // 7
  [0.7, -0.02,  1.91, -29.09,  38.32, -40.00,  36.67, -82.00,  -9.00, 34.00, -24.67, 60.00, -46.00], // 8
  [0.8, -0.04,  2.00, -30.25,  35.69, -24.00,  44.61, -82.00, -10.05, 31.00, -10.84, 60.00, -35.00], // 9
  [0.9, -0.06,  2.36, -34.61,  30.35, -10.00,  45.85, -71.00, -19.19, 31.00,  -7.49, 50.00, -31.00], // 10
  [1.0, -0.08,  1.40, -33.53,  15.23,  12.00,  50.43, -61.00, -26.00, 32.00,   7.60, 40.00, -25.00], // 11
  [1.1, -0.10,  1.00, -35.43,  14.09,   8.00,  51.83, -56.00, -36.03, 40.00,   9.48, 30.00, -31.00], // 12
  [1.2, -0.12,  0.50, -32.43,   8.10,   1.00,  55.32, -49.00, -38.77, 37.00,  10.62, 23.00, -27.00], // 13
  [1.3, -0.12, -1.00, -36.25,   1.30,   0.00,  51.08, -43.00, -43.09, 33.00,  -3.82, 42.00, -31.00], // 14
  [1.4, -0.12, -1.11, -34.89,  -4.44,   0.00,  47.26, -23.00, -38.64, 25.00, -11.42, 47.00, -31.00], // 15
  [1.5, -0.14, -1.41, -36.59, -10.89,   0.00,  42.90,   0.00, -44.98, 27.00, -16.11, 50.00, -31.00], // 16
  [1.6, -0.14, -2.99, -37.01, -16.64,   0.00,  29.44,   0.00, -43.20, 27.00,  -24.7, 55.00, -32.00], // 17
  [1.7, -0.14, -4.33, -35.67, -24.16,   0.00,  24.60,   0.00, -42.18, 33.00, -28.06, 52.00, -32.00], // 18
  [1.8, -0.12, -4.71, -33.29, -19.68,   0.00,  19.89,   0.00, -47.99, 39.00, -33.17, 47.00, -34.00], // 19
  [1.9, -0.10, -5.09, -30.91,	-28.00,	 -3.00,	 13.48,   0.00,	-50.37,	49.00, -34.92, 39.00,	-35.00], // 20
  [2.0, -0.08, -5.31,	-32.69,	-20.53, -22.00,   5.02,	  0.00,	-50.49,	62.00, -27.06, 27.00,	-36.00], // 21
  [2.1,	-0.06, -5.43,	-32.57,	-12.07,	-32.00,	 -4.00,	  0.00,	-54.76,	76.00, -27.92, 22.00,	-37.00], // 22
  [2.2,	-0.04, -6.00,	-34.00,	  0.50,	-48.00,	 -2.28,	  0.00, -54.97, 64.00, -32.02, 18.00, -38.00], // 23
  [2.3, -0.02, -7.33,	-29.67,	 -3.76,	-37.00,	 -6.00,	  0.00,	-46.32,	64.00, -30.05, 29.00,	-40.00]  // 24
]

const framesJump = [
// xPos   yPos  torsoT   headT   fluT    fllT    fruT     frlT     bluT   bllT    bruT    brlT     tailT
  [0.00, -0.00,  -3.20, -17.40, -14.16,	-32.67,	 -0.35,	  -4.27, -52.39, 101.33, -47.58,  95.09,  -67.70],
  [0.10, -0.00,   3.00, -27.00,	 6.54,	-78.36,	-22.98,	   0.00, -31.05,  86.83, -29.12,  81.82,  -81.31],
  [0.20, -0.00,   6.60, -34.10,	37.52, 	-94.43,	-22.28,	 -23.27,  -9.10,  53.73,  -6.54,  50.69,  -88.70],
  [0.30, -0.00,  11.31, -43.19,	60.53,  -96.12,	  3.85,	 -76.82, -23.52,  56.27,	 2.44,  26.83, -103.90],
  [0.40,  0.01,  14.84, -46.65,	79.22,	-96.21,  35.62,	-109.33, -54.52,  80.21, -26.49,  52.67, -106.70],

  [0.50,  0.03,  22.09, -43.70,	74.24,  -83.17,  71.89,	-127.02, -46.37,  59.87, -63.65,  64.47, -103.00],
  [0.60,  0.05,  15.58, -31.31,	84.76,  -93.40,  95.44,	-113.83, -51.48,  49.00, -58.21,  39.57,  -85.03],
  [0.70,  0.06,  10.99, -24.81,	78.78,  -95.12,  84.14,	 -98.72, -42.76,  23.06, -44.74,   19.1,  -83.99],
  [0.80,  0.07,   4.85, -17.14,	59.92,  -97.07,  80.29,	 -91.47, -42.35,  27.30, -53.95,  29.69,  -75.34],
  [0.90,  0.08,  -1.48, -13.59,	68.88,	-93.88, 	54.5,  -60.64, -50.00,	29.86, -56.45,	32.47,	-58.57],

  [1.00,  0.07,  -5.35,  -9.72,  76.43,  -93.48,  76.05,  -43.41, -61.04,  56.42, -67.81,  58.23,  -58.33],
  [1.10,  0.06,  -8.00,  -9.27,	73.69,  -80.71,	 53.65,	 -14.58, -70.47,  68.34, -73.64,  73.50,  -57.43],
  [1.20,  0.05, -14.26,  -3.69,	80.20,	-71.72,	 38.02,	   0.00, -76.34,  93.32, -80.14,  96.85,  -54.89],
  [1.30,  0.03, -19.72,  -1.57,	78.86,	-47.12,	 33.15,	  -1.09, -75.78, 109.57, -80.10, 100.66,  -56.35],
  [1.40,  0.01, -20.64,   0.08,	67.91,	-17.49,	 13.12,	  -2.13, -75.60, 129.82, -75.60, 129.82,  -62.79],

  [1.50,  0.00, -21.93,  -2.07,	42.00,	  0.00,	  0.10,	  -1.00, -64.54, 125.75, -89.70, 131.50,  -77.38],
  [1.60,  0.00, -13.95, -23.53,	12.00,	  0.00,	 -2.81,	 -35.10, -16.44,  79.01, -31.97, 113.69,  -91.40],
  [1.70,  0.00,  -7.27, -32.24, -15.07,	  0.00,	 27.14,	 -86.41, -13.30,  41.12, -11.78,	84.73, -104.10],
  [1.70, -0.02,  -2.92, -39.08, -22.02,	-25.34,	 53.40,	 -92.72,  -0.90,  61.67, -34.42,	57.00, -109.20]]

const delta = 0.008
const xMult = 6
const jumpYMult = 8
const runYMult = 2
const xOffset = -34.9

let frames = createFrames()
let t = 1

window.onload = init

/* ---------------- Functions ------------------ */

function createFrames () {

  for (let i = 0; i < framesRun.length; i++) {
    framesRun[i][1] *= runYMult
  }

  for (let i = 0; i < framesJump.length; i++) {
    framesJump[i][1] *= jumpYMult
  }

  let frames = framesRun
  frames = frames.concat(framesRun.map(l => [l[0] + frames[frames.length - 1][0] + 0.1].concat(l.slice(1))))
  frames = frames.concat(framesJump.map(l => [l[0] + frames[frames.length - 1][0] + 0.1].concat(l.slice(1))))

  for (let i = 0; i < frames.length; i++) {
    frames[i][0] *= xMult
    frames[i][0] += xOffset
  }

  return frames
}

function createImages () {
  const numRows = 8
  const numCols = 8

  const imageTransparent = new Uint8Array(4 * texSize * texSize)
  const imageCheckerboard = new Uint8Array(4 * texSize * texSize)
  const imageFade = new Uint8Array(4 * texSize * texSize)
  const imageBlack = new Uint8Array(4 * texSize * texSize)

  for (let i = 0; i < texSize; i++) {
    for (let j = 0; j < texSize; j++) {
      const patchX = Math.floor(j / (texSize / numCols))
      const patchY = Math.floor(i / (texSize / numRows))
      const c = patchX % 2 !== patchY % 2 ? 255 : 0

      imageTransparent[4 * i * texSize + 4 * j] = 255
      imageTransparent[4 * i * texSize + 4 * j + 1] = 255
      imageTransparent[4 * i * texSize + 4 * j + 2] = 255
      imageTransparent[4 * i * texSize + 4 * j + 3] = 255

      imageCheckerboard[4 * i * texSize + 4 * j] = c
      imageCheckerboard[4 * i * texSize + 4 * j + 1] = c
      imageCheckerboard[4 * i * texSize + 4 * j + 2] = c
      imageCheckerboard[4 * i * texSize + 4 * j + 3] = 255

      imageFade[4 * i * texSize + 4 * j] = j / texSize * 255
      imageFade[4 * i * texSize + 4 * j + 1] = j / texSize * 255
      imageFade[4 * i * texSize + 4 * j + 2] = j / texSize * 255
      imageFade[4 * i * texSize + 4 * j + 3] = 255

      imageBlack[4 * i * texSize + 4 * j] = 0
      imageBlack[4 * i * texSize + 4 * j + 1] = 0
      imageBlack[4 * i * texSize + 4 * j + 2] = 0
      imageBlack[4 * i * texSize + 4 * j + 3] = 255
    }
  }

  return [imageTransparent, imageCheckerboard, imageFade, imageBlack]
}

function configureTextures () {
  const [imageTransparent, imageCheckerboard, imageFade, imageBlack] = createImages()

  textureCheckerboard = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, textureCheckerboard)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageCheckerboard)
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)

  textureTransparent = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, textureTransparent)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageTransparent)
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)

  textureFade = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, textureFade)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageFade)
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)

  textureBlack = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, textureBlack)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageBlack)
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
}

function generateVertices () {
  const pointsArray = []
  const normalsArray = []
  const texCoordsArray1 = []
  const texCoordsArray2 = []

  const vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
  ]

  function quad (a, b, c, d) {
    const n1 = subtract(vertices[b], vertices[a])
    const n2 = subtract(vertices[c], vertices[a])
    const normal = normalize(cross(n1, n2))

    pointsArray.push(vertices[a])
    normalsArray.push(normal)
    pointsArray.push(vertices[b])
    normalsArray.push(normal)
    pointsArray.push(vertices[c])
    normalsArray.push(normal)

    pointsArray.push(vertices[a])
    normalsArray.push(normal)
    pointsArray.push(vertices[c])
    normalsArray.push(normal)
    pointsArray.push(vertices[d])
    normalsArray.push(normal)
  }

  quad(0, 3, 2, 1)
  texCoordsArray2.push(vec2(0, 0))
  texCoordsArray2.push(vec2(1, 0))
  texCoordsArray2.push(vec2(1, 1))
  texCoordsArray2.push(vec2(0, 0))
  texCoordsArray2.push(vec2(1, 1))
  texCoordsArray2.push(vec2(0, 1))

  texCoordsArray1.push(vec2(0, 0))
  texCoordsArray1.push(vec2(3, 0))
  texCoordsArray1.push(vec2(3, 1))
  texCoordsArray1.push(vec2(0, 0))
  texCoordsArray1.push(vec2(3, 1))
  texCoordsArray1.push(vec2(0, 1))

  quad(3, 7, 6, 2)
  texCoordsArray2.push(vec2(1, 1))
  texCoordsArray2.push(vec2(0.98, 0.98))
  texCoordsArray2.push(vec2(0.98, 1))
  texCoordsArray2.push(vec2(1, 1))
  texCoordsArray2.push(vec2(0.98, 0.98))
  texCoordsArray2.push(vec2(0.98, 1))

  texCoordsArray1.push(vec2(0, 0))
  texCoordsArray1.push(vec2(1, 0))
  texCoordsArray1.push(vec2(1, 1))
  texCoordsArray1.push(vec2(0, 0))
  texCoordsArray1.push(vec2(1, 1))
  texCoordsArray1.push(vec2(0, 1))


  quad(4, 7, 3, 0)
  texCoordsArray2.push(vec2(0, 0))
  texCoordsArray2.push(vec2(1, 0))
  texCoordsArray2.push(vec2(1, 1))
  texCoordsArray2.push(vec2(0, 0))
  texCoordsArray2.push(vec2(1, 1))
  texCoordsArray2.push(vec2(0, 1))

  texCoordsArray1.push(vec2(0, 0))
  texCoordsArray1.push(vec2(3, 0))
  texCoordsArray1.push(vec2(3, 1))
  texCoordsArray1.push(vec2(0, 0))
  texCoordsArray1.push(vec2(3, 1))
  texCoordsArray1.push(vec2(0, 1))

  quad(1, 2, 6, 5)
  texCoordsArray2.push(vec2(0, 0))
  texCoordsArray2.push(vec2(1, 0))
  texCoordsArray2.push(vec2(1, 1))
  texCoordsArray2.push(vec2(0, 0))
  texCoordsArray2.push(vec2(1, 1))
  texCoordsArray2.push(vec2(0, 1))

  texCoordsArray1.push(vec2(0, 0))
  texCoordsArray1.push(vec2(3, 0))
  texCoordsArray1.push(vec2(3, 1))
  texCoordsArray1.push(vec2(0, 0))
  texCoordsArray1.push(vec2(3, 1))
  texCoordsArray1.push(vec2(0, 1))

  quad(5, 6, 7, 4)
  texCoordsArray2.push(vec2(0, 0))
  texCoordsArray2.push(vec2(1, 0))
  texCoordsArray2.push(vec2(1, 1))
  texCoordsArray2.push(vec2(0, 0))
  texCoordsArray2.push(vec2(1, 1))
  texCoordsArray2.push(vec2(0, 1))

  texCoordsArray1.push(vec2(0, 0))
  texCoordsArray1.push(vec2(3, 0))
  texCoordsArray1.push(vec2(3, 1))
  texCoordsArray1.push(vec2(0, 0))
  texCoordsArray1.push(vec2(3, 1))
  texCoordsArray1.push(vec2(0, 1))

  quad(5, 4, 0, 1)
  texCoordsArray2.push(vec2(0, 0))
  texCoordsArray2.push(vec2(0.01, 0.01))
  texCoordsArray2.push(vec2(0, 0.01))
  texCoordsArray2.push(vec2(0, 0))
  texCoordsArray2.push(vec2(0.01, 0.01))
  texCoordsArray2.push(vec2(0, 0.01))

  texCoordsArray1.push(vec2(0, 0))
  texCoordsArray1.push(vec2(3, 0))
  texCoordsArray1.push(vec2(3, 1))
  texCoordsArray1.push(vec2(0, 0))
  texCoordsArray1.push(vec2(3, 1))
  texCoordsArray1.push(vec2(0, 1))

  return [pointsArray, normalsArray, texCoordsArray1, texCoordsArray2]
}

function init () {
  const canvas = document.getElementById('gl-canvas')

  gl = window.WebGLUtils.setupWebGL(canvas, null)
  if (!gl) { window.alert("WebGL isn't available") }

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.clearColor(0.35, 0.35, 1.0, 1.0)
  gl.enable(gl.DEPTH_TEST)

  //  Load shaders and initialize attribute buffers
  const program = window.initShaders(gl, 'vertex-shader', 'fragment-shader')

  gl.useProgram(program)
  updateModelView()
  modelViewMatrixLoc = gl.getUniformLocation(program, 'modelViewMatrix')

  ambientProdLoc = gl.getUniformLocation(program, 'ambientProd')
  diffuseProdLoc = gl.getUniformLocation(program, 'diffuseProd')
  normalMatrixLoc = gl.getUniformLocation(program, 'normalMatrix')
  const cameraMatrixLoc = gl.getUniformLocation(program, 'cameraMatrix')
  gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(modelViewMatrix))

  lightPosLoc = gl.getUniformLocation(program, 'lightPos')
  gl.uniform4fv(lightPosLoc, flatten(lightPos))

  const projectionMatrix = perspective(fovy, aspect, near, far)
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'projectionMatrix'), false, flatten(projectionMatrix))

  texMap1Pos = gl.getUniformLocation(program, "texMap1")
  texMap2Pos = gl.getUniformLocation(program, "texMap2")

  const [pointsArray, normalsArray, texCoordsArray1, texCoordsArray2] = generateVertices()
  const vBuffer = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW)

  const vPosition = gl.getAttribLocation(program, 'vPosition')
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(vPosition)

  const nBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW)

  const vNormal = gl.getAttribLocation(program, 'vNormal')
  gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(vNormal)

  const tBuffer1 = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer1)
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray1), gl.STATIC_DRAW)

  const vTexCoord1 = gl.getAttribLocation(program, 'vTexCoord1')
  gl.vertexAttribPointer(vTexCoord1, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(vTexCoord1)

  const tBuffer2 = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer2)
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray2), gl.STATIC_DRAW)

  const vTexCoord2 = gl.getAttribLocation(program, 'vTexCoord2')
  gl.vertexAttribPointer(vTexCoord2, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(vTexCoord2)

  interaction()
  configureTextures()
  horse = new Horse(torsoHeight, torsoWidth, headHeight, headWidth, upperLegHeight,
    upperLegWidth, lowerLegHeight, lowerLegWidth, tailHeight, tailWidth,
    legPadding, horseMaterial)
  horse.setQ(frames[0])
  obstacle = new Obstacle(obstacleScaleX, obstacleScaleY, obstacleInitX)
  floor = new Cube(mult(translate(0, -0.5 * floorHeight, 0), scale4(floorWidth, floorHeight, floorWidth)),
    floorMaterial, textureTransparent, textureTransparent)

  render()
}

function updateModelView () {
  const rTheta = radians(theta)
  const rPhi = radians(phi)
  const eye = vec3(r * Math.sin(rPhi) * Math.cos(rTheta), -r * Math.sin(rTheta), r * Math.cos(rPhi) * Math.cos(rTheta))
  modelViewMatrix = window.lookAt(eye, at, up)
}

function interaction () {
  document.getElementById('button').onclick = function () {
    t = 0
  }
  document.getElementById('rSlider').oninput = function (event) {
    r = parseFloat(event.target.value)
    updateModelView()
    document.getElementById('displayR').innerHTML = event.target.value

  }
  document.getElementById('thetaSlider').oninput = function (event) {
    theta = parseFloat(event.target.value)
    updateModelView()
    document.getElementById('displayTheta').innerHTML = event.target.value
  }
  document.getElementById('phiSlider').oninput = function (event) {
    phi = parseFloat(event.target.value)
    updateModelView()
    document.getElementById('displayPhi').innerHTML = event.target.value
  }
}

function splineInterpolate(points, t) {

  let s
  const n = points.length
  const d = points[0].length
  const weights = []

  for(let i = 0; i < n; i++) {
    weights[i] = 1
  }

  const knots = []
  for(let i = 0; i < n + 3; i++) {
    knots[i] = i
  }

  t = t * (knots[knots.length - 3] - knots[2]) + knots[2]

  for(s = 2; s < knots.length - 3; s++) {
    if(t >= knots[s] && t <= knots[s+1]) {
      break
    }
  }

  const v = []
  for(let i = 0; i < n; i++) {
    v[i] = []
    for(let j = 0; j < d; j++) {
      v[i][j] = points[i][j] * weights[i]
    }
    v[i][d] = weights[i]
  }

  let a
  for(let l = 1; l <= 2 + 1; l++) {
    for(let i = s; i > s - 2 - 1 + l; i--) {
      a = (t - knots[i]) / (knots[i + 3 - l] - knots[i])
      for(let j = 0; j < d + 1; j++) {
        v[i][j] = (1 - a) * v[i - 1][j] + a * v[i][j]
      }
    }
  }

  const result = []
  for(let i = 0; i < d; i++) {
    result[i] = v[s][i] / v[s][d]
  }

  return result
}

function scale4 (a, b, c) {
    const result = mat4()
    result[0][0] = a
    result[1][1] = b
    result[2][2] = c
    return result
}

function render () {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  if (t >= 0 && t < 1){
    const interp = splineInterpolate(frames, t)
    horse.setQ(interp)
    t += delta
  }

  horse.render(modelViewMatrix)
  obstacle.render(modelViewMatrix)
  floor.render(modelViewMatrix)
  window.requestAnimFrame(render)
}

/* ---------------- Classes ------------------ */

function Material (ambient, diffuse) {
  this.ambient = ambient
  this.diffuse = diffuse
}

function Cube (instanceTransform, material, texture1, texture2, relativeTransform) {
  this.NUM_VERTICES = 36
  this.children = []
  this.instanceTransform = instanceTransform
  this.relativeTransform = relativeTransform
  this.material = material
  this.texture1 = texture1
  this.texture2 = texture2

  this.render = function (modelViewMatrix) {
    let instanceTransform = mult(modelViewMatrix, this.instanceTransform)
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix(modelViewMatrix, true)))
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceTransform))
    gl.uniform4fv(ambientProdLoc, mult(lightMaterial.ambient, this.material.ambient))
    gl.uniform4fv(diffuseProdLoc, mult(lightMaterial.diffuse, this.material.diffuse))
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture1)
    gl.uniform1i(texMap1Pos, 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.texture2)
    gl.uniform1i(texMap2Pos, 1)

    gl.drawArrays(gl.TRIANGLES, 0, this.NUM_VERTICES)
    this.children.forEach(c => c.render(mult(modelViewMatrix, c.relativeTransform)))
  }

  this.addChild = function (child) {
    this.children.push(child)
  }
}

function Horse (torsoHeight, torsoWidth, headHeight, headWidth, upperLegHeight, upperLegWidth, lowerLegHeight,
                lowerLegWidth, tailHeight, tailWidth, legPadding, material, initQ) {
  this.torsoHeight = torsoHeight
  this.torsoWidth = torsoWidth
  this.headHeight = headHeight
  this.headWidth = headWidth
  this.upperLegHeight = upperLegHeight
  this.upperLegWidth = upperLegWidth
  this.lowerLegHeight = lowerLegHeight
  this.lowerLegWidth = lowerLegWidth
  this.tailWidth = tailWidth
  this.tailHeight = tailHeight
  this.legPadding = legPadding

  this.material = material
  this.q = {}

  this.torso = new Cube(mult(translate(0.0, 0.5 * this.torsoHeight, 0.0),
    scale4(this.torsoWidth, this.torsoHeight, this.torsoHeight)), this.material, textureCheckerboard, textureFade)
  this.head = new Cube(mult(translate(0.0, 0.5 * this.headHeight, 0.0),
    scale4(this.headWidth, this.headHeight, this.headHeight)), this.material, textureTransparent, textureTransparent)
  this.frontLeftUpperLeg = new Cube(mult(translate(0.0, 0.5 * this.upperLegHeight, 0.0),
    scale4(this.upperLegWidth, this.upperLegHeight, this.upperLegWidth)), this.material, textureTransparent, textureTransparent)
  this.frontLeftLowerLeg = new Cube(mult(translate(0.0, 0.5 * this.lowerLegHeight, 0.0),
    scale4(this.lowerLegWidth, this.lowerLegHeight, this.lowerLegWidth)), this.material, textureTransparent, textureTransparent)
  this.frontRightUpperLeg = new Cube(mult(translate(0.0, 0.5 * this.upperLegHeight, 0.0),
    scale4(this.upperLegWidth, this.upperLegHeight, this.upperLegWidth)), this.material, textureTransparent, textureTransparent)
  this.frontRightLowerLeg = new Cube(mult(translate(0.0, 0.5 * this.lowerLegHeight, 0.0),
    scale4(this.lowerLegWidth, this.lowerLegHeight, this.lowerLegWidth)), this.material, textureTransparent, textureTransparent)
  this.backLeftUpperLeg = new Cube(mult(translate(0.0, 0.5 * this.upperLegHeight, 0.0),
    scale4(this.upperLegWidth, this.upperLegHeight, this.upperLegWidth)), this.material, textureBlack, textureTransparent)
  this.backLeftLowerLeg = new Cube(mult(translate(0.0, 0.5 * this.lowerLegHeight, 0.0),
    scale4(this.lowerLegWidth, this.lowerLegHeight, this.lowerLegWidth)), this.material, textureBlack, textureTransparent)
  this.backRightUpperLeg = new Cube(mult(translate(0.0, 0.5 * this.upperLegHeight, 0.0),
    scale4(this.upperLegWidth, this.upperLegHeight, this.upperLegWidth)), this.material, textureBlack, textureTransparent)
  this.backRightLowerLeg = new Cube(mult(translate(0.0, 0.5 * this.lowerLegHeight, 0.0),
    scale4(this.lowerLegWidth, this.lowerLegHeight, this.lowerLegWidth)), this.material, textureBlack, textureTransparent)
  this.tail = new Cube(mult(translate(0.0, 0.5 * this.tailHeight, 0.0),
    scale4(this.tailWidth, this.tailHeight, this.tailWidth)), this.material, textureBlack, textureTransparent)

  this.frontLeftUpperLeg.addChild(this.frontLeftLowerLeg)
  this.frontRightUpperLeg.addChild(this.frontRightLowerLeg)
  this.backLeftUpperLeg.addChild(this.backLeftLowerLeg)
  this.backRightUpperLeg.addChild(this.backRightLowerLeg)
  this.torso.addChild(this.head)
  this.torso.addChild(this.frontLeftUpperLeg)
  this.torso.addChild(this.frontRightUpperLeg)
  this.torso.addChild(this.backLeftUpperLeg)
  this.torso.addChild(this.backRightUpperLeg)
  this.torso.addChild(this.tail)

  this.translateTorsoY = function (y) {
    this.q.torsoY = y
    this.torso.relativeTransform = this.getRelativeTransform(this.torso)
  }

  this.translateTorsoX = function (x) {
    this.q.torsoX = x
    this.torso.relativeTransform = this.getRelativeTransform(this.torso)
  }

  this.rotateTorsoZ = function (theta) {
    this.q.torsoTheta = theta
    this.torso.relativeTransform = this.getRelativeTransform(this.torso)
  }

  this.rotateHeadZ = function (theta) {
    this.q.headTheta = theta
    this.head.relativeTransform = this.getRelativeTransform(this.head)
  }

  this.rotateFrontLeftUpperLegZ = function (theta) {
    this.q.frontLeftUpperLegTheta = theta
    this.frontLeftUpperLeg.relativeTransform = this.getRelativeTransform(this.frontLeftUpperLeg)
  }

  this.rotateFrontLeftLowerLegZ = function (theta) {
    this.q.frontLeftLowerLegTheta = theta
    this.frontLeftLowerLeg.relativeTransform = this.getRelativeTransform(this.frontLeftLowerLeg)
  }

  this.rotateFrontRightUpperLegZ = function (theta) {
    this.q.frontRightUpperLegTheta = theta
    this.frontRightUpperLeg.relativeTransform = this.getRelativeTransform(this.frontRightUpperLeg)
  }

  this.rotateFrontRightLowerLegZ = function (theta) {
    this.q.frontRightLowerLegTheta = theta
    this.frontRightLowerLeg.relativeTransform = this.getRelativeTransform(this.frontRightLowerLeg)
  }

  this.rotateBackLeftUpperLegZ = function (theta) {
    this.q.backLeftUpperLegTheta = theta
    this.backLeftUpperLeg.relativeTransform = this.getRelativeTransform(this.backLeftUpperLeg)
  }

  this.rotateBackLeftLowerLegZ = function (theta) {
    this.q.backLeftLowerLegTheta = theta
    this.backLeftLowerLeg.relativeTransform = this.getRelativeTransform(this.backLeftLowerLeg)
  }

  this.rotateBackRightUpperLegZ = function (theta) {
    this.q.backRightUpperLegTheta = theta
    this.backRightUpperLeg.relativeTransform = this.getRelativeTransform(this.backRightUpperLeg)
  }

  this.rotateBackRightLowerLegZ = function (theta) {
    this.q.backRightLowerLegTheta = theta
    this.backRightLowerLeg.relativeTransform = this.getRelativeTransform(this.backRightLowerLeg)
  }

  this.rotateTailZ = function (theta) {
    this.q.tailTheta = theta
    this.tail.relativeTransform = this.getRelativeTransform(this.tail)
  }

  this.render = function (modelViewMatrix) {
    this.torso.render(mult(modelViewMatrix, this.torso.relativeTransform))
  }

  this.getRelativeTransform = function (cube) {
    let m = mat4()

    switch (cube) {
      case this.torso:
        m = translate(this.q.torsoX, this.upperLegHeight + this.lowerLegHeight + this.q.torsoY, 0)
        m = mult(m, rotate(this.q.torsoTheta, 0, 0, 1))
        return m

      case this.head:
        m = translate(0.5 * (this.torsoWidth + this.headHeight), this.torsoHeight + 0.5 * this.headHeight, 0.0)
        m = mult(m, rotate(this.q.headTheta, 0, 0, 1))
        m = mult(m, translate(0.0, -0.5 * this.headHeight, 0.0))
        return m

      case this.frontLeftUpperLeg:
        m = translate(0.5 * (this.torsoWidth - this.upperLegWidth) - this.legPadding,
          0, 0.5 * (this.torsoHeight - this.upperLegWidth) - this.legPadding)
        m = mult(m, rotate(this.q.frontLeftUpperLegTheta, 0, 0, 1))
        m = mult(m, translate(0, -this.upperLegHeight, 0))
        return m

      case this.frontLeftLowerLeg:
        m = rotate(this.q.frontLeftLowerLegTheta, 0, 0, 1)
        m = mult(m, translate(0, -this.lowerLegHeight, 0))
        return m

      case this.frontRightUpperLeg:
        m = translate(0.5 * (this.torsoWidth - this.upperLegWidth) - this.legPadding,
          0, 0.5 * (-this.torsoHeight + this.upperLegWidth) + this.legPadding)
        m = mult(m, rotate(this.q.frontRightUpperLegTheta, 0, 0, 1))
        m = mult(m, translate(0, -this.upperLegHeight, 0))
        return m

      case this.frontRightLowerLeg:
        m = rotate(this.q.frontRightLowerLegTheta, 0, 0, 1)
        m = mult(m, translate(0, -this.lowerLegHeight, 0))
        return m

      case this.backLeftUpperLeg:
        m = translate(0.5 * (-this.torsoWidth + this.upperLegWidth) + this.legPadding,
          0, 0.5 * (this.torsoHeight - this.upperLegWidth) - this.legPadding)
        m = mult(m, rotate(this.q.backLeftUpperLegTheta, 0, 0, 1))
        m = mult(m, translate(0, -this.upperLegHeight, 0))
        return m

      case this.backLeftLowerLeg:
        m = rotate(this.q.backLeftLowerLegTheta, 0, 0, 1)
        m = mult(m, translate(0, -this.lowerLegHeight, 0))
        return m

      case this.backRightUpperLeg:
        m = translate(0.5 * (-this.torsoWidth + this.upperLegWidth) + this.legPadding,
          0, 0.5 * (-this.torsoHeight + this.upperLegWidth) + this.legPadding)
        m = mult(m, rotate(this.q.backRightUpperLegTheta, 0, 0, 1))
        m = mult(m, translate(0, -this.upperLegHeight, 0))
        return m

      case this.backRightLowerLeg:
        m = rotate(this.q.backRightLowerLegTheta, 0, 0, 1)
        m = mult(m, translate(0, -this.lowerLegHeight, 0))
        return m

      case this.tail:
        m = translate(-0.5 * (this.torsoWidth + this.tailWidth), this.torsoHeight - 2 * this.legPadding, 0.0)
        m = mult(m, rotate(this.q.tailTheta, 0, 0, 1))
        m = mult(m, translate(0.0, -this.tailHeight, 0.0))
        return m
    }
  }

  this.setQ = function (q) {
    this.translateTorsoX(q[0])
    this.translateTorsoY(q[1])
    this.rotateTorsoZ(q[2])
    this.rotateHeadZ(q[3])
    this.rotateFrontLeftUpperLegZ(q[4])
    this.rotateFrontLeftLowerLegZ(q[5])
    this.rotateFrontRightUpperLegZ(q[6])
    this.rotateFrontRightLowerLegZ(q[7])
    this.rotateBackLeftUpperLegZ(q[8])
    this.rotateBackLeftLowerLegZ(q[9])
    this.rotateBackRightUpperLegZ(q[10])
    this.rotateBackRightLowerLegZ(q[11])
    this.rotateTailZ(q[12])
  }

  if (initQ !== undefined) {
    this.setQ(initQ)
  } else {
    this.setQ([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  }
}

function Obstacle (scaleX, scaleY, initX) {

  this.UNIT_X = scaleX
  this.UNIT_Y = scaleY

  this.BASE_1_HEIGHT = this.UNIT_X
  this.BASE_1_DEPTH = this.UNIT_X * 5
  this.BASE_2_HEIGHT = this.UNIT_Y * 0.5
  this.BASE_2_DEPTH = this.UNIT_X * 4
  this.VERTICAL_HEIGHT = this.UNIT_Y * 10
  this.VERTICAL_WIDTH = this.UNIT_X
  this.HORIZONTAL_1_HEIGHT = this.UNIT_Y
  this.HORIZONTAL_1_WIDTH = this.UNIT_X * 3
  this.HORIZONTAL_1_DEPTH = this.UNIT_X * 0.5
  this.HORIZONTAL_2_HEIGHT = this.UNIT_Y
  this.HORIZONTAL_2_WIDTH = this.UNIT_X * 8
  this.HORIZONTAL_2_DEPTH = this.UNIT_X * 0.25
  this.HORIZONTAL_3_HEIGHT = this.UNIT_Y * 0.5
  this.HORIZONTAL_3_WIDTH = this.UNIT_X * 3

  this.MATERIAL_BLANK = new Material(vec4(1, 1, 1, 1), vec4(1, 1, 1, 1))
  this.MATERIAL_WHITE = new Material(vec4(0.97, 0.97, 0.97, 1), vec4(0.97, 0.97, 0.97, 1))
  this.MATERIAL_BLUE = new Material(vec4(0.11, 0.11, 0.8, 1), vec4(0.11, 0.11, 0.8, 1))
  this.MATERIAL_YELLOW = new Material(vec4(0.96, 0.91, 0.29, 1), vec4(0.96, 0.91, 0.29, 1))
  this.MATERIAL_TEAL = new Material(vec4(0.12, 0.34, 0.47, 1), vec4(0.12, 0.34, 0.47, 1))

  this.xPos = initX

  this.base0 = new Cube(mult(translate(0.0, 0, 0.0), scale4(0.00001, 0.00001, 0.00001)), this.MATERIAL_BLANK, textureTransparent, textureTransparent)
  this.base1LeftOuter = new Cube(mult(translate(0.0, 0.5 * this.BASE_1_HEIGHT, 0.0),
    scale4(this.BASE_1_DEPTH, this.BASE_1_HEIGHT, this.BASE_1_HEIGHT)), this.MATERIAL_WHITE, textureTransparent, textureTransparent)
  this.base1LeftInner = new Cube(mult(translate(0.0, 0.5 * this.BASE_1_HEIGHT, 0.0),
    scale4(this.BASE_1_DEPTH, this.BASE_1_HEIGHT, this.BASE_1_HEIGHT)), this.MATERIAL_WHITE, textureTransparent, textureTransparent)
  this.verticalLeftOuter = new Cube(mult(translate(0.0, 0.5 * this.VERTICAL_HEIGHT, 0.0),
    scale4(this.VERTICAL_WIDTH, this.VERTICAL_HEIGHT, this.VERTICAL_WIDTH)), this.MATERIAL_WHITE, textureTransparent, textureTransparent)
  this.verticalLeftInner = new Cube(mult(translate(0.0, 0.5 * this.VERTICAL_HEIGHT, 0.0),
    scale4(this.VERTICAL_WIDTH, this.VERTICAL_HEIGHT, this.VERTICAL_WIDTH)), this.MATERIAL_WHITE, textureTransparent, textureTransparent)
  this.horizontal1Left1 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_1_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_1_DEPTH, this.HORIZONTAL_1_HEIGHT, this.HORIZONTAL_1_WIDTH)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)
  this.horizontal1Left2 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_1_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_1_DEPTH, this.HORIZONTAL_1_HEIGHT, this.HORIZONTAL_1_WIDTH)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)
  this.horizontal1Left3 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_1_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_1_DEPTH, this.HORIZONTAL_1_HEIGHT, this.HORIZONTAL_1_WIDTH)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)
  this.horizontal1Left4 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_1_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_1_DEPTH, this.HORIZONTAL_1_HEIGHT, this.HORIZONTAL_1_WIDTH)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)
  this.base2LeftOuter = new Cube(mult(translate(0.0, 0.5 * this.BASE_2_HEIGHT, 0.0),
    scale4(this.BASE_2_DEPTH, this.BASE_2_HEIGHT, this.BASE_2_HEIGHT)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)
  this.base2LeftInner = new Cube(mult(translate(0.0, 0.5 * this.BASE_2_HEIGHT, 0.0),
    scale4(this.BASE_2_DEPTH, this.BASE_2_HEIGHT, this.BASE_2_HEIGHT)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)
  this.horizontal2Left1 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_2_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_2_DEPTH, this.HORIZONTAL_2_HEIGHT, this.HORIZONTAL_2_WIDTH)), this.MATERIAL_TEAL, textureTransparent, textureTransparent)
  this.horizontal2Left2 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_2_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_2_DEPTH, this.HORIZONTAL_2_HEIGHT, this.HORIZONTAL_2_WIDTH)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)
  this.horizontal2Left3 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_2_HEIGHT, 0.0),
    scale4( this.HORIZONTAL_2_DEPTH, this.HORIZONTAL_2_HEIGHT, this.HORIZONTAL_2_WIDTH)), this.MATERIAL_WHITE, textureTransparent, textureTransparent)
  this.horizontal3LeftLower1 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_3_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_WIDTH)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)
  this.horizontal3LeftLower2 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_3_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_WIDTH)), this.MATERIAL_YELLOW, textureTransparent, textureTransparent)
  this.horizontal3LeftLower3 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_3_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_WIDTH)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)
  this.horizontal3LeftUpper1 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_3_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_WIDTH)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)
  this.horizontal3LeftUpper2 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_3_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_WIDTH)), this.MATERIAL_YELLOW, textureTransparent, textureTransparent)
  this.horizontal3LeftUpper3 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_3_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_WIDTH)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)

  this.base1RightOuter = new Cube(mult(translate(0.0, 0.5 * this.BASE_1_HEIGHT, 0.0),
    scale4(this.BASE_1_DEPTH, this.BASE_1_HEIGHT, this.BASE_1_HEIGHT)), this.MATERIAL_WHITE, textureTransparent, textureTransparent)
  this.base1RightInner = new Cube(mult(translate(0.0, 0.5 * this.BASE_1_HEIGHT, 0.0),
    scale4(this.BASE_1_DEPTH, this.BASE_1_HEIGHT, this.BASE_1_HEIGHT)), this.MATERIAL_WHITE, textureTransparent, textureTransparent)
  this.verticalRightOuter = new Cube(mult(translate(0.0, 0.5 * this.VERTICAL_HEIGHT, 0.0),
    scale4(this.VERTICAL_WIDTH, this.VERTICAL_HEIGHT, this.VERTICAL_WIDTH)), this.MATERIAL_WHITE, textureTransparent, textureTransparent)
  this.verticalRightInner = new Cube(mult(translate(0.0, 0.5 * this.VERTICAL_HEIGHT, 0.0),
    scale4(this.VERTICAL_WIDTH, this.VERTICAL_HEIGHT, this.VERTICAL_WIDTH)), this.MATERIAL_WHITE, textureTransparent, textureTransparent)
  this.horizontal1Right1 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_1_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_1_DEPTH, this.HORIZONTAL_1_HEIGHT, this.HORIZONTAL_1_WIDTH)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)
  this.horizontal1Right2 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_1_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_1_DEPTH, this.HORIZONTAL_1_HEIGHT, this.HORIZONTAL_1_WIDTH)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)
  this.horizontal1Right3 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_1_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_1_DEPTH, this.HORIZONTAL_1_HEIGHT, this.HORIZONTAL_1_WIDTH)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)
  this.horizontal1Right4 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_1_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_1_DEPTH, this.HORIZONTAL_1_HEIGHT, this.HORIZONTAL_1_WIDTH)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)
  this.base2RightOuter = new Cube(mult(translate(0.0, 0.5 * this.BASE_2_HEIGHT, 0.0),
    scale4(this.BASE_2_DEPTH, this.BASE_2_HEIGHT, this.BASE_2_HEIGHT)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)
  this.base2RightInner = new Cube(mult(translate(0.0, 0.5 * this.BASE_2_HEIGHT, 0.0),
    scale4(this.BASE_2_DEPTH, this.BASE_2_HEIGHT, this.BASE_2_HEIGHT)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)
  this.horizontal2Right1 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_2_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_2_DEPTH, this.HORIZONTAL_2_HEIGHT, this.HORIZONTAL_2_WIDTH)), this.MATERIAL_TEAL, textureTransparent, textureTransparent)
  this.horizontal2Right2 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_2_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_2_DEPTH, this.HORIZONTAL_2_HEIGHT, this.HORIZONTAL_2_WIDTH)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)
  this.horizontal2Right3 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_2_HEIGHT, 0.0),
    scale4( this.HORIZONTAL_2_DEPTH, this.HORIZONTAL_2_HEIGHT, this.HORIZONTAL_2_WIDTH)), this.MATERIAL_WHITE, textureTransparent, textureTransparent)
  this.horizontal3RightLower1 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_3_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_WIDTH)), this.MATERIAL_YELLOW, textureTransparent, textureTransparent)
  this.horizontal3RightLower2 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_3_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_WIDTH)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)
  this.horizontal3RightLower3 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_3_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_WIDTH)), this.MATERIAL_YELLOW, textureTransparent, textureTransparent)
  this.horizontal3RightUpper1 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_3_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_WIDTH)), this.MATERIAL_YELLOW, textureTransparent, textureTransparent)
  this.horizontal3RightUpper2 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_3_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_WIDTH)), this.MATERIAL_BLUE, textureTransparent, textureTransparent)
  this.horizontal3RightUpper3 = new Cube(mult(translate(0.0, 0.5 * this.HORIZONTAL_3_HEIGHT, 0.0),
    scale4(this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_HEIGHT, this.HORIZONTAL_3_WIDTH)), this.MATERIAL_YELLOW, textureTransparent, textureTransparent)

  this.base0.addChild(this.base1LeftOuter)
  this.base0.addChild(this.base1LeftInner)
  this.base0.addChild(this.base2LeftOuter)
  this.base0.addChild(this.base2LeftInner)
  this.base0.addChild(this.base1RightOuter)
  this.base0.addChild(this.base1RightInner)
  this.base0.addChild(this.base2RightOuter)
  this.base0.addChild(this.base2RightInner)

  this.base1LeftOuter.addChild(this.verticalLeftOuter)
  this.base1LeftInner.addChild(this.verticalLeftInner)
  this.verticalLeftOuter.addChild(this.horizontal1Left1)
  this.horizontal1Left1.addChild(this.horizontal1Left2)
  this.horizontal1Left2.addChild(this.horizontal1Left3)
  this.horizontal1Left3.addChild(this.horizontal1Left4)
  this.horizontal1Left3.addChild(this.horizontal3LeftLower1)
  this.horizontal1Left4.addChild(this.horizontal3LeftUpper1)
  this.horizontal3LeftLower1.addChild(this.horizontal3LeftLower2)
  this.horizontal3LeftLower2.addChild(this.horizontal3LeftLower3)
  this.horizontal3LeftUpper1.addChild(this.horizontal3LeftUpper2)
  this.horizontal3LeftUpper2.addChild(this.horizontal3LeftUpper3)
  this.base2LeftOuter.addChild(this.horizontal2Left1)
  this.horizontal2Left1.addChild(this.horizontal2Left2)
  this.horizontal2Left2.addChild(this.horizontal2Left3)
  this.base1RightOuter.addChild(this.verticalRightOuter)
  this.base1RightInner.addChild(this.verticalRightInner)
  this.verticalRightOuter.addChild(this.horizontal1Right1)
  this.horizontal1Right1.addChild(this.horizontal1Right2)
  this.horizontal1Right2.addChild(this.horizontal1Right3)
  this.horizontal1Right3.addChild(this.horizontal1Right4)
  this.horizontal1Right3.addChild(this.horizontal3RightLower1)
  this.horizontal1Right4.addChild(this.horizontal3RightUpper1)
  this.horizontal3RightLower1.addChild(this.horizontal3RightLower2)
  this.horizontal3RightLower2.addChild(this.horizontal3RightLower3)
  this.horizontal3RightUpper1.addChild(this.horizontal3RightUpper2)
  this.horizontal3RightUpper2.addChild(this.horizontal3RightUpper3)
  this.base2RightOuter.addChild(this.horizontal2Right1)
  this.horizontal2Right1.addChild(this.horizontal2Right2)
  this.horizontal2Right2.addChild(this.horizontal2Right3)

  this.base0.relativeTransform = translate(this.xPos, 0, 0)
  this.base1LeftOuter.relativeTransform = translate(0, 0,
    -(this.HORIZONTAL_2_WIDTH + this.BASE_1_HEIGHT + this.HORIZONTAL_1_WIDTH + this.BASE_1_HEIGHT * 0.5 + this.UNIT_X))
  this.base1LeftInner.relativeTransform = translate(0, 0,
    -(this.HORIZONTAL_2_WIDTH + this.BASE_1_HEIGHT * 0.5 + this.UNIT_X))
  this.verticalLeftOuter.relativeTransform = translate(0, this.BASE_1_HEIGHT,0)
  this.verticalLeftInner.relativeTransform = translate(0, this.BASE_1_HEIGHT,0)
  this.horizontal1Left1.relativeTransform = translate(0, this.UNIT_Y,
    0.5 * (this.VERTICAL_WIDTH + this.HORIZONTAL_1_WIDTH))
  this.horizontal1Left2.relativeTransform = translate(0, 2 * this.UNIT_Y, 0)
  this.horizontal1Left3.relativeTransform = translate(0, 2 * this.UNIT_Y, 0)
  this.horizontal1Left4.relativeTransform = translate(0, 2 * this.UNIT_Y, 0)
  this.horizontal1Left4.relativeTransform = translate(0, 2 * this.UNIT_Y, 0)
  this.base2LeftOuter.relativeTransform = translate(0, 0, (-this.HORIZONTAL_2_WIDTH + 0.5 * this.BASE_2_HEIGHT))
  this.base2LeftInner.relativeTransform = translate(0, 0, -(this.UNIT_Y + 0.5 * this.BASE_2_HEIGHT))
  this.horizontal2Left1.relativeTransform = translate(0, this.BASE_2_HEIGHT, 0.5 * (this.HORIZONTAL_2_WIDTH - this.BASE_2_HEIGHT))
  this.horizontal2Left2.relativeTransform = translate(0, this.HORIZONTAL_2_HEIGHT, 0)
  this.horizontal2Left3.relativeTransform = translate(0, this.HORIZONTAL_2_HEIGHT, 0)
  this.horizontal3LeftLower1.relativeTransform = translate(0,0, (this.HORIZONTAL_1_WIDTH * 0.5 +
    this.VERTICAL_WIDTH + this.HORIZONTAL_3_WIDTH * 0.5))
  this.horizontal3LeftLower2.relativeTransform = translate(0, 0, this.HORIZONTAL_3_WIDTH)
  this.horizontal3LeftLower3.relativeTransform = translate(0, 0, this.HORIZONTAL_3_WIDTH)
  this.horizontal3LeftUpper1.relativeTransform = translate(0,0, this.HORIZONTAL_1_WIDTH * 0.5 +
    this.VERTICAL_WIDTH + this.HORIZONTAL_3_WIDTH * 0.5)
  this.horizontal3LeftUpper2.relativeTransform = translate(0, 0, this.HORIZONTAL_3_WIDTH)
  this.horizontal3LeftUpper3.relativeTransform = translate(0, 0, this.HORIZONTAL_3_WIDTH)

  /// <! ---------------------------------

  this.base1RightOuter.relativeTransform = translate(0, 0,
    this.HORIZONTAL_2_WIDTH + this.BASE_1_HEIGHT + this.HORIZONTAL_1_WIDTH + this.BASE_1_HEIGHT * 0.5 + this.UNIT_X)
  this.base1RightInner.relativeTransform = translate(0, 0,
    this.HORIZONTAL_2_WIDTH + this.BASE_1_HEIGHT * 0.5 + this.UNIT_X)
  this.verticalRightOuter.relativeTransform = translate(0, this.BASE_1_HEIGHT,0)
  this.verticalRightInner.relativeTransform = translate(0, this.BASE_1_HEIGHT,0)
  this.horizontal1Right1.relativeTransform = translate(0, this.UNIT_Y,
    -0.5 * (this.VERTICAL_WIDTH + this.HORIZONTAL_1_WIDTH))
  this.horizontal1Right2.relativeTransform = translate(0, 2 * this.UNIT_Y, 0)
  this.horizontal1Right3.relativeTransform = translate(0, 2 * this.UNIT_Y, 0)
  this.horizontal1Right4.relativeTransform = translate(0, 2 * this.UNIT_Y, 0)
  this.horizontal1Right4.relativeTransform = translate(0, 2 * this.UNIT_Y, 0)
  this.base2RightOuter.relativeTransform = translate(0, 0, -(-this.HORIZONTAL_2_WIDTH + 0.5 * this.BASE_2_HEIGHT))
  this.base2RightInner.relativeTransform = translate(0, 0, (1 + 0.5 * this.BASE_2_HEIGHT) * this.UNIT_X)
  this.horizontal2Right1.relativeTransform = translate(0, this.BASE_2_HEIGHT, -0.5 * (this.HORIZONTAL_2_WIDTH - this.BASE_2_HEIGHT))
  this.horizontal2Right2.relativeTransform = translate(0, this.HORIZONTAL_2_HEIGHT, 0)
  this.horizontal2Right3.relativeTransform = translate(0, this.HORIZONTAL_2_HEIGHT, 0)
  this.horizontal3RightLower1.relativeTransform = translate(0,0, -(this.HORIZONTAL_1_WIDTH * 0.5 +
    this.VERTICAL_WIDTH + this.HORIZONTAL_3_WIDTH * 0.5))
  this.horizontal3RightLower2.relativeTransform = translate(0, 0, -this.HORIZONTAL_3_WIDTH)
  this.horizontal3RightLower3.relativeTransform = translate(0, 0, -this.HORIZONTAL_3_WIDTH)
  this.horizontal3RightUpper1.relativeTransform = translate(0,0, -(this.HORIZONTAL_1_WIDTH * 0.5 +
    this.VERTICAL_WIDTH + this.HORIZONTAL_3_WIDTH * 0.5))
  this.horizontal3RightUpper2.relativeTransform = translate(0, 0, -this.HORIZONTAL_3_WIDTH)
  this.horizontal3RightUpper3.relativeTransform = translate(0, 0, -this.HORIZONTAL_3_WIDTH)

  this.render = function () {
    this.base0.render(mult(modelViewMatrix, this.base0.relativeTransform))
  }

  /*this.translateX = function (x) {
    this.xPos = x
    this.base0.relativeTransform = translate(this.xPos, 0, 0)
  }*/
}
