import * as THREE from 'three';

export class ImageFilter {
    constructor() {
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
        })
        this.renderer.localClippingEnabled = true;

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.domElement.className = 'imageFilterCanvas'

        this.initLights();
        this.initCamera();

        this.figures = [];
        this.contentsFigure = [];
        this.videoFigures = [];
        this.updateImages();
        
        window.addEventListener('resize', this.resize.bind(this), false);
        window.addEventListener('_update_images', this.updateImages.bind(this), false);
        // window.addEventListener('keydown', this.updateImages.bind(this), false);
    }

    initLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 2);
        this.scene.add(ambientLight);
    }

    initCamera() {
        const fov = (180 * (2 * Math.atan(window.innerHeight / 2 / 800)));

        this.camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -1000, 1000)
        this.camera.position.set(0, 0, 0)
    }

    updateImages(e) {
        document.querySelectorAll('.strip-wrap').forEach(_ => {
            const img = _.querySelector('.imageFilter')
            if (img) {
                const fig = this.figures.find(_ => {
                    return img.isEqualNode(_.image);
                });

                if (fig) {
                }
                else {
                    this.figures.push(
                        new Figure(this.scene, _, img, e.detail.opacity)
                    )
                }
            }
        })
        this.contentsFigure.forEach(_ => {
            _.remove();
        });

        this.contentsFigure = [];

        document.querySelectorAll('.clippingImageStrip').forEach(_ => {
            const container = _.querySelector('.clippingImageContainer');
            const image = _.querySelector('.clippedImageFilter');
            if (image && container) {
                this.contentsFigure.push(
                    new ContentFigure(this.scene, image, _, container)
                );
            }
        })


        this.videoFigures.forEach(_ => {
            _.remove();
        });
        this.videoFigures = [];

        document.querySelectorAll('.clippingVideoStrip').forEach(_ => {
            const container = _.querySelector('.clippingVideoContainer');
            const image = _.querySelector('.clippedVideoFilter');
            if (image && container) {
                this.contentsFigure.push(
                    new AnimationFigure(this.scene, image, _, container)
                );
            }
        })

    }

    resize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.camera.left = window.innerWidth / -2;
        this.camera.right = window.innerWidth / 2;
        this.camera.top = window.innerHeight / 2;
        this.camera.bottom = window.innerHeight / -2;
        this.camera.updateProjectionMatrix();

    }
    
    getElement() {
        return this.renderer.domElement;
    }

    draw(elapsed) {
        this.figures.forEach(_ => {
            _.update(elapsed)
        });

        this.contentsFigure.forEach(_ => {
            _.update(elapsed)
        });

        this.renderer.render(this.scene, this.camera);
    }
}

export class ContentFigure {
    constructor(scene, image, wrapper, container) {
        this.wrapper = wrapper;
        this.image = image;
        this.scene = scene;
        this.imageContainer = container;

        this.sizes = new THREE.Vector2(0, 0);
        this.offset = new THREE.Vector2(0, 0);
        this.imageSizes = new THREE.Vector2(0, 0);
        this.imageOffset = new THREE.Vector2(0, 0);
        this.rotation = new THREE.Vector2(0, 0);

        this.loader = new THREE.TextureLoader();
        this.imageTexture = this.loader.load(this.image.src);

        this.mouseSaved = new THREE.Vector2(0, 0);
        this.mouse = new THREE.Vector2(0, 0);
        this.mouseDown = false;
        this.enable = true;

        this.opacity = 1;

        this.getSizes()
        this.createMesh();

        window.addEventListener('mousemove', this.onMove.bind(this), false);
        window.addEventListener('mousedown', this.onDown.bind(this), false);
        window.addEventListener('mouseup', this.onUp.bind(this), false);

        window.addEventListener('touchmove', this.onTouchMove.bind(this), false);
        window.addEventListener('touchstart', this.onTouchStart.bind(this), false);
        window.addEventListener('touchend', this.onTouchEnd.bind(this), false);

        window.addEventListener('_enable_figures', this.enableFigures.bind(this), false);
        window.addEventListener('_disable_figures', this.disableFigures.bind(this), false);
    }

    getSizes() {
        const wrapperBox = this.wrapper.getBoundingClientRect();
        const imageBox = this.image.getBoundingClientRect()
        const imageContainerBox = this.imageContainer.getBoundingClientRect();

        this.imageSizes.set(imageBox.width, imageBox.height);
        this.imageOffset.set(
            0,
            0.5
            );

        this.sizes.set(wrapperBox.width, imageContainerBox.top + imageContainerBox.height - wrapperBox.top);
		this.offset.set(
            wrapperBox.left - window.innerWidth / 2 + wrapperBox.width / 2,
            -wrapperBox.top + window.innerHeight / 2 - wrapperBox.height / 2
            )

	}

    createMesh() {
		this.geometry = new THREE.PlaneBufferGeometry(1, 1, 
            30,
            30);
        this.geometry.translate(0, 0, -1);

        this.uniforms = {
            uOffset: {
                value: new THREE.Vector2(0.0, 0.0)
            },
            uTexture: { value: this.imageTexture },
            uImageSizes: { 
                value: new THREE.Vector2(0.0, 0.0)
            },
            uImageOffset: {
                value: new THREE.Vector2(0.0, 0.0)
            },
            uOpacity: {
                value: this.opacity
            },
            uMouse: { value: this.mouse },
            uTime: { value: 0 },
            uRes: {
                value: new THREE.Vector2(window.innerWidth, window.innerHeight)
            },
            uStrip: {
                value: this.sizes
            },
            uStripOffset: {
                value: this.offset
            },
            uAmplitude: {
                value: 0.0
            },
            uHoverRadius: {
                value: 0.5
            }
        }

        const vertexShader = `
            #define M_PI 3.1415926535897932384626433832795

            uniform vec2 uImageSizes;
            uniform vec2 uImageOffset;
            uniform float uTime;
            uniform float uAmplitude;
            uniform float uHoverRadius;

            uniform vec2 uMouse;
            uniform vec2 uRes;
            uniform vec2 uStrip;
            uniform vec2 uStripOffset;

            varying vec2 vUv;
            varying float vDistort;

            void main() {
            	vUv = uImageSizes * (uv - vec2(0, 0.5)) + uImageOffset;

                // if (position.x >= 0.5 || position.x <= -0.5 || position.y >= 0.5 || position.y <= -0.5) {
                //     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                //     vDistort = 0.0;
                // }
                // else {
                    float _freq = 10.0;
                    
                    vec2 mouse = (uMouse - uStripOffset / uRes * 2.0) * uRes / uStrip * 0.5 - position.xy;
                    float dist = sqrt(mouse.x * mouse.x + mouse.y * mouse.y);

                    float _wave = sin(uTime + (position.y + position.x) * M_PI * 5.0) * uAmplitude;
                
                    float _distort = _wave * (0.5 - dist) * 4.0;

                    if (dist > 0.5) {
                        _distort = 0.0;
                    }

                    vec4 _plane = modelViewMatrix * vec4(position, 1.0);
                    _plane += _distort;

                	gl_Position = projectionMatrix * _plane;
                    vDistort = _distort;
                // }
            }
        `

        const fragmentShader = `
            uniform sampler2D uTexture;
            uniform vec2 uOffset;
            uniform float uOpacity;

            uniform vec2 uMouse;
            uniform vec2 uRes;

            varying vec2 vUv;
            varying float vDistort;
        
            float circle(in vec2 _st, in float _radius, in float blurriness){
                vec2 dist = _st;
                return 1.-smoothstep(_radius-(_radius*blurriness), _radius+(_radius*blurriness), dot(dist,dist)*4.0);
            }

            void main() {

                vec2 res = uRes * PR;
                vec2 st = gl_FragCoord.xy / res.xy - vec2(0.5);
                st.y *= uRes.y / uRes.x;

                vec2 mouse = uMouse * -0.5;

                float r = texture2D(uTexture, vUv + (vDistort * 1.0)).r;
                float g = texture2D(uTexture, vUv + (vDistort * 1.5)).g;
                float b = texture2D(uTexture, vUv + (vDistort * 2.0)).b;

                vec3 color = vec3(r, g, b);

                vec2 circlePos = st + mouse;
            	float c = circle(circlePos, .03, 2.);

                // gl_FragColor = vec4(vec3(c), uOpacity);
                // gl_FragColor = vec4(texture2D(uTexture, vUv).rgb, uOpacity);
                gl_FragColor = vec4(color, uOpacity);
            }
        `

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            defines: {
                PR: window.devicePixelRatio.toFixed(1)
            },
            transparent: true
        })
        
		// this.material = new THREE.MeshBasicMaterial({
		// 	map: this.imageTexture,
        //     transparent: true,
        //     opacity: 0
		// })

		this.mesh = new THREE.Mesh(this.geometry, this.material)

		this.mesh.position.set(this.offset.x, this.offset.y, 0)
		this.mesh.scale.set(this.sizes.x, this.sizes.y, 1)

		this.scene.add(this.mesh)
	}

    update(elapsed) {
        this.opacity += (1 - this.opacity) * 0.001 * elapsed;
        if (this.opacity > 1) {
            this.opacity = 1;
        }

        this.mouse.x += (this.mouseSaved.x - this.mouse.x) * 0.01 * elapsed;
        this.mouse.y += (this.mouseSaved.y - this.mouse.y) * 0.01 * elapsed;

        this.rotation.set(
            -this.mouse.y * 0.3,
            this.mouse.x * (Math.PI / 6)
        );

        this.uniforms.uOffset.value = this.mouse;
        
        this.getSizes();

        // this.mesh.rotation.set(this.rotation.x, this.rotation.y, 0)
		this.mesh.position.set(this.offset.x, this.offset.y, 1)
		this.mesh.scale.set(this.sizes.x, this.sizes.y, 1)
        this.mesh.material.opacity = this.opacity;

        // this.imageTexture.center.set(this.imageOffset.x, this.imageOffset.y)
        // this.imageTexture.repeat.set(this.sizes.x / this.imageSizes.x, this.sizes.y / this.imageSizes.y)

        this.uniforms.uTexture.value = this.imageTexture;
        this.uniforms.uImageSizes.value.set(
            this.sizes.x / this.imageSizes.x,
            this.sizes.y / this.imageSizes.y
        )
        this.uniforms.uImageOffset.value = this.imageOffset;
        this.uniforms.uOpacity.value = this.opacity;
        this.uniforms.uMouse.value = this.mouse;
        this.uniforms.uTime.value += 0.01;
        this.uniforms.uStrip.value = this.sizes;
        this.uniforms.uStripOffset.value = this.offset;

        let targetAmplitude = 0;
        if (this.enable && !this.mouseDown) {
            targetAmplitude = 0.01;
        }

        this.uniforms.uAmplitude.value += (targetAmplitude - this.uniforms.uAmplitude.value) * 0.005 * elapsed;
    }

    remove(scene) {
        this.scene.remove(this.mesh);
    }

    onMove(event) {
        this.mouseSaved.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouseSaved.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onDown(event) {
        this.mouseDown = true;
    }

    onUp(event) {
        this.mouseDown = false;
    }

    onTouchMove(event) {
        this.mouseSaved.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        this.mouseSaved.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
    }

    onTouchStart(event) {
        this.mouseDown = true;
    }

    onTouchEnd(event) {
        this.mouseDown = false;
    }

    disableFigures(e) {
        this.enable = false;
    }

    enableFigures(e) {
        this.enable = true;
    }
}

export class Figure {
    constructor(scene, wrapper, image, opacity) {
        this.wrapper = wrapper;
        this.image = image;
        this.scene = scene;

        this.sizes = new THREE.Vector2(0, 0);
        this.offset = new THREE.Vector2(0, 0);
        this.imageSizes = new THREE.Vector2(0, 0);
        this.imageOffset = new THREE.Vector2(0, 0);
        this.rotation = new THREE.Vector2(0, 0);

        this.loader = new THREE.TextureLoader();
        this.imageTexture = this.loader.load(this.image.src);

        this.mouseSaved = new THREE.Vector2(0, 0);
        this.mouse = new THREE.Vector2(0, 0);
        this.mouseDown = false;
        this.enable = false;

        this.opacity = opacity;

        this.getSizes()
        this.createMesh();

        window.addEventListener('mousemove', this.onMove.bind(this), false);
        window.addEventListener('mousedown', this.onDown.bind(this), false);
        window.addEventListener('mouseup', this.onUp.bind(this), false);

        window.addEventListener('touchmove', this.onTouchMove.bind(this), false);
        window.addEventListener('touchstart', this.onTouchStart.bind(this), false);
        window.addEventListener('touchend', this.onTouchEnd.bind(this), false);

        window.addEventListener('_enable_figures', this.enableFigures.bind(this), false);
        window.addEventListener('_disable_figures', this.disableFigures.bind(this), false);
    }

    getSizes() {
        const wrapperBox = this.wrapper.getBoundingClientRect();
        const imageBox = this.image.getBoundingClientRect()

        this.imageSizes.set(imageBox.width, imageBox.height);
        this.imageOffset.set(
            0,
            0.3 + (wrapperBox.top + wrapperBox.height / 2) / window.innerHeight * 0.4
            );

        this.sizes.set(wrapperBox.width, wrapperBox.height);
		this.offset.set(
            wrapperBox.left - window.innerWidth / 2 + wrapperBox.width / 2,
            -wrapperBox.top + window.innerHeight / 2 - wrapperBox.height / 2
            )
	}    

    createMesh() {
		this.geometry = new THREE.PlaneBufferGeometry(1, 1, 
            30,
            30);
        this.geometry.translate(0, 0, -1);

        this.uniforms = {
            uOffset: {
                value: new THREE.Vector2(0.0, 0.0)
            },
            uTexture: { value: this.imageTexture },
            uImageSizes: { 
                value: new THREE.Vector2(0.0, 0.0)
            },
            uImageOffset: {
                value: new THREE.Vector2(0.0, 0.0)
            },
            uOpacity: {
                value: this.opacity
            },
            uMouse: { value: this.mouse },
            uTime: { value: 0 },
            uRes: {
                value: new THREE.Vector2(window.innerWidth, window.innerHeight)
            },
            uStrip: {
                value: this.sizes
            },
            uStripOffset: {
                value: this.offset
            },
            uAmplitude: {
                value: 0.0
            },
            uHoverRadius: {
                value: 0.5
            }
        }

        const vertexShader = `
            #define M_PI 3.1415926535897932384626433832795

            uniform vec2 uImageSizes;
            uniform vec2 uImageOffset;
            uniform float uTime;
            uniform float uAmplitude;
            uniform float uHoverRadius;

            uniform vec2 uMouse;
            uniform vec2 uRes;
            uniform vec2 uStrip;
            uniform vec2 uStripOffset;

            varying vec2 vUv;
            varying float vDistort;

            void main() {
            	vUv = uImageSizes * (uv - vec2(0, 0.5)) + uImageOffset;

                if (position.x >= 0.5 || position.x <= -0.5 || position.y >= 0.5 || position.y <= -0.5) {
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    vDistort = 0.0;
                }
                else {
                    float _freq = 10.0;
                    
                    vec2 mouse = (uMouse - uStripOffset / uRes * 2.0) * uRes / uStrip * 0.5 - position.xy;
                    float dist = sqrt(mouse.x * mouse.x + mouse.y * mouse.y);

                    float _wave = sin(uTime + (position.y + position.x) * M_PI * 5.0) * uAmplitude;
                
                    float _distort = _wave * dist;

                    if (dist > 1.0) {
                        _distort = _wave;
                    }

                    vec4 _plane = modelViewMatrix * vec4(position, 1.0);
                    _plane += _distort;

                	gl_Position = projectionMatrix * _plane;
                    vDistort = _distort;
                }
            }
        `

        const fragmentShader = `
            uniform sampler2D uTexture;
            uniform vec2 uOffset;
            uniform float uOpacity;

            uniform vec2 uMouse;
            uniform vec2 uRes;

            varying vec2 vUv;
            varying float vDistort;
        
            float circle(in vec2 _st, in float _radius, in float blurriness){
                vec2 dist = _st;
                return 1.-smoothstep(_radius-(_radius*blurriness), _radius+(_radius*blurriness), dot(dist,dist)*4.0);
            }

            void main() {

                vec2 res = uRes * PR;
                vec2 st = gl_FragCoord.xy / res.xy - vec2(0.5);
                st.y *= uRes.y / uRes.x;

                vec2 mouse = uMouse * -0.5;

                float r = texture2D(uTexture, vUv + (vDistort * 1.0)).r;
                float g = texture2D(uTexture, vUv + (vDistort * 1.5)).g;
                float b = texture2D(uTexture, vUv + (vDistort * 2.0)).b;

                vec3 color = vec3(r, g, b);

                vec2 circlePos = st + mouse;
            	float c = circle(circlePos, .03, 2.);

                // gl_FragColor = vec4(vec3(c), uOpacity);
                // gl_FragColor = vec4(texture2D(uTexture, vUv).rgb, uOpacity);
                gl_FragColor = vec4(color, uOpacity);
            }
        `

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            defines: {
                PR: window.devicePixelRatio.toFixed(1)
            },
            transparent: true
        })
        
		// this.material = new THREE.MeshBasicMaterial({
		// 	map: this.imageTexture,
        //     transparent: true,
        //     opacity: 0
		// })

		this.mesh = new THREE.Mesh(this.geometry, this.material)

		this.mesh.position.set(this.offset.x, this.offset.y, 0)
		this.mesh.scale.set(this.sizes.x, this.sizes.y, 1)

		this.scene.add(this.mesh)
	}

    update(elapsed) {
        this.opacity += (1 - this.opacity) * 0.001 * elapsed;
        if (this.opacity > 1) {
            this.opacity = 1;
        }

        this.mouse.x += (this.mouseSaved.x - this.mouse.x) * 0.01 * elapsed;
        this.mouse.y += (this.mouseSaved.y - this.mouse.y) * 0.01 * elapsed;

        this.rotation.set(
            -this.mouse.y * 0.3,
            this.mouse.x * (Math.PI / 6)
        );

        this.uniforms.uOffset.value = this.mouse;
        
        this.getSizes();

        this.mesh.rotation.set(this.rotation.x, this.rotation.y, 0)
		this.mesh.position.set(this.offset.x, this.offset.y, 1)
		this.mesh.scale.set(this.sizes.x, this.sizes.y, 1)
        this.mesh.material.opacity = this.opacity;

        // this.imageTexture.center.set(this.imageOffset.x, this.imageOffset.y)
        // this.imageTexture.repeat.set(this.sizes.x / this.imageSizes.x, this.sizes.y / this.imageSizes.y)

        this.uniforms.uTexture.value = this.imageTexture;
        this.uniforms.uImageSizes.value.set(
            this.sizes.x / this.imageSizes.x,
            this.sizes.y / this.imageSizes.y
        )
        this.uniforms.uImageOffset.value = this.imageOffset;
        this.uniforms.uOpacity.value = this.opacity;
        this.uniforms.uMouse.value = this.mouse;
        this.uniforms.uTime.value += 0.01;
        this.uniforms.uStrip.value = this.sizes;
        this.uniforms.uStripOffset.value = this.offset;

        let targetAmplitude = 0;
        if (this.enable && !this.mouseDown) {
            targetAmplitude = 0.01;
        }

        this.uniforms.uAmplitude.value += (targetAmplitude - this.uniforms.uAmplitude.value) * 0.005 * elapsed;
    }

    remove(scene) {
        scene.remove(this.mesh);
    }

    onMove(event) {
        this.mouseSaved.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouseSaved.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onTouchMove(event) {
        this.mouseSaved.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        this.mouseSaved.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
    }

    onTouchStart(event) {
        this.mouseDown = true;
    }

    onTouchEnd(event) {
        this.mouseDown = false;
    }

    onDown(event) {
        this.mouseDown = true;
    }

    onUp(event) {
        this.mouseDown = false;
    }

    disableFigures(e) {
        this.enable = false;
    }

    enableFigures(e) {
        this.enable = true;
    }
}

export class AnimationFigure {
    constructor(scene, video, wrapper, container) {
        this.wrapper = wrapper;
        this.video = video;

        this.video.play();
        this.video.muted = true;
        this.video.loop = true;

        this.video.onloadeddata = () => {
            this.video.play()
        }

        this.scene = scene;
        this.imageContainer = container;

        this.sizes = new THREE.Vector2(0, 0);
        this.offset = new THREE.Vector2(0, 0);
        this.imageSizes = new THREE.Vector2(0, 0);
        this.imageOffset = new THREE.Vector2(0, 0);
        this.rotation = new THREE.Vector2(0, 0);

        this.imageTexture = new THREE.VideoTexture(this.video);
        this.imageTexture.needsUpdate = true;

        this.mouseSaved = new THREE.Vector2(0, 0);
        this.mouse = new THREE.Vector2(0, 0);
        this.mouseDown = false;
        this.enable = true;

        this.opacity = 1;

        this.getSizes()
        this.createMesh();

        window.addEventListener('mousemove', this.onMove.bind(this), false);
        window.addEventListener('mousedown', this.onDown.bind(this), false);
        window.addEventListener('mouseup', this.onUp.bind(this), false);

        window.addEventListener('touchmove', this.onTouchMove.bind(this), false);
        window.addEventListener('touchstart', this.onTouchStart.bind(this), false);
        window.addEventListener('touchend', this.onTouchEnd.bind(this), false);

        window.addEventListener('_enable_figures', this.enableFigures.bind(this), false);
        window.addEventListener('_disable_figures', this.disableFigures.bind(this), false);
    }

    getSizes() {
        const wrapperBox = this.wrapper.getBoundingClientRect();
        const imageBox = this.video.getBoundingClientRect()
        const imageContainerBox = this.imageContainer.getBoundingClientRect();

        this.imageSizes.set(imageBox.width, imageBox.height);
        this.imageOffset.set(
            0,
            0.5
            );

        this.sizes.set(wrapperBox.width, imageContainerBox.top + imageContainerBox.height - wrapperBox.top);
		this.offset.set(
            wrapperBox.left - window.innerWidth / 2 + wrapperBox.width / 2,
            -wrapperBox.top + window.innerHeight / 2 - wrapperBox.height / 2
            )

	}

    createMesh() {
		this.geometry = new THREE.PlaneBufferGeometry(1, 1, 
            30,
            30);
        this.geometry.translate(0, 0, -1);

        this.uniforms = {
            uOffset: {
                value: new THREE.Vector2(0.0, 0.0)
            },
            uTexture: { value: this.imageTexture },
            uImageSizes: { 
                value: new THREE.Vector2(0.0, 0.0)
            },
            uImageOffset: {
                value: new THREE.Vector2(0.0, 0.0)
            },
            uOpacity: {
                value: this.opacity
            },
            uMouse: { value: this.mouse },
            uTime: { value: 0 },
            uRes: {
                value: new THREE.Vector2(window.innerWidth, window.innerHeight)
            },
            uStrip: {
                value: this.sizes
            },
            uStripOffset: {
                value: this.offset
            },
            uAmplitude: {
                value: 0.0
            },
            uHoverRadius: {
                value: 0.5
            }
        }

        const vertexShader = `
            #define M_PI 3.1415926535897932384626433832795

            uniform vec2 uImageSizes;
            uniform vec2 uImageOffset;
            uniform float uTime;
            uniform float uAmplitude;
            uniform float uHoverRadius;

            uniform vec2 uMouse;
            uniform vec2 uRes;
            uniform vec2 uStrip;
            uniform vec2 uStripOffset;

            varying vec2 vUv;
            varying float vDistort;

            void main() {
            	vUv = uImageSizes * (uv - vec2(0, 0.5)) + uImageOffset;

                // if (position.x >= 0.5 || position.x <= -0.5 || position.y >= 0.5 || position.y <= -0.5) {
                //     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                //     vDistort = 0.0;
                // }
                // else {
                    float _freq = 10.0;
                    
                    vec2 mouse = (uMouse - uStripOffset / uRes * 2.0) * uRes / uStrip * 0.5 - position.xy;
                    float dist = sqrt(mouse.x * mouse.x + mouse.y * mouse.y);

                    float _wave = sin(uTime + (position.y + position.x) * M_PI * 5.0) * uAmplitude;
                
                    float _distort = _wave * (0.5 - dist) * 4.0;

                    if (dist > 0.5) {
                        _distort = 0.0;
                    }

                    vec4 _plane = modelViewMatrix * vec4(position, 1.0);
                    _plane += _distort;

                	gl_Position = projectionMatrix * _plane;
                    vDistort = _distort;
                // }
            }
        `

        const fragmentShader = `
            uniform sampler2D uTexture;
            uniform vec2 uOffset;
            uniform float uOpacity;

            uniform vec2 uMouse;
            uniform vec2 uRes;

            varying vec2 vUv;
            varying float vDistort;
        
            float circle(in vec2 _st, in float _radius, in float blurriness){
                vec2 dist = _st;
                return 1.-smoothstep(_radius-(_radius*blurriness), _radius+(_radius*blurriness), dot(dist,dist)*4.0);
            }

            void main() {

                vec2 res = uRes * PR;
                vec2 st = gl_FragCoord.xy / res.xy - vec2(0.5);
                st.y *= uRes.y / uRes.x;

                vec2 mouse = uMouse * -0.5;

                float r = texture2D(uTexture, vUv + (vDistort * 1.0)).r;
                float g = texture2D(uTexture, vUv + (vDistort * 1.5)).g;
                float b = texture2D(uTexture, vUv + (vDistort * 2.0)).b;

                vec3 color = vec3(r, g, b);

                vec2 circlePos = st + mouse;
            	float c = circle(circlePos, .03, 2.);

                // gl_FragColor = vec4(vec3(c), uOpacity);
                // gl_FragColor = vec4(texture2D(uTexture, vUv).rgb, uOpacity);
                gl_FragColor = vec4(color, uOpacity);
            }
        `

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            defines: {
                PR: window.devicePixelRatio.toFixed(1)
            },
            transparent: true
        })
        this.material.needsUpdate = true;
        
		// this.material = new THREE.MeshBasicMaterial({
		// 	map: this.imageTexture,
        //     transparent: true,
        //     opacity: 0
		// })

		this.mesh = new THREE.Mesh(this.geometry, this.material)

		this.mesh.position.set(this.offset.x, this.offset.y, 0)
		this.mesh.scale.set(this.sizes.x, this.sizes.y, 1)

		this.scene.add(this.mesh)
	}

    update(elapsed) {
        this.opacity += (1 - this.opacity) * 0.001 * elapsed;
        if (this.opacity > 1) {
            this.opacity = 1;
        }

        this.mouse.x += (this.mouseSaved.x - this.mouse.x) * 0.01 * elapsed;
        this.mouse.y += (this.mouseSaved.y - this.mouse.y) * 0.01 * elapsed;

        this.rotation.set(
            -this.mouse.y * 0.3,
            this.mouse.x * (Math.PI / 6)
        );

        this.uniforms.uOffset.value = this.mouse;
        
        this.getSizes();

        // this.mesh.rotation.set(this.rotation.x, this.rotation.y, 0)
		this.mesh.position.set(this.offset.x, this.offset.y, 1)
		this.mesh.scale.set(this.sizes.x, this.sizes.y, 1)
        this.mesh.material.opacity = this.opacity;

        // this.imageTexture.center.set(this.imageOffset.x, this.imageOffset.y)
        // this.imageTexture.repeat.set(this.sizes.x / this.imageSizes.x, this.sizes.y / this.imageSizes.y)

        this.uniforms.uTexture.value = this.imageTexture;
        this.uniforms.uImageSizes.value.set(
            this.sizes.x / this.imageSizes.x,
            this.sizes.y / this.imageSizes.y
        )
        this.uniforms.uImageOffset.value = this.imageOffset;
        this.uniforms.uOpacity.value = this.opacity;
        this.uniforms.uMouse.value = this.mouse;
        this.uniforms.uTime.value += 0.01;
        this.uniforms.uStrip.value = this.sizes;
        this.uniforms.uStripOffset.value = this.offset;

        let targetAmplitude = 0;
        if (this.enable && !this.mouseDown) {
            targetAmplitude = 0.01;
        }

        this.uniforms.uAmplitude.value += (targetAmplitude - this.uniforms.uAmplitude.value) * 0.005 * elapsed;
    }

    remove(scene) {
        this.scene.remove(this.mesh);
    }

    onMove(event) {
        this.mouseSaved.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouseSaved.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onDown(event) {
        this.mouseDown = true;
    }

    onUp(event) {
        this.mouseDown = false;
    }

    onTouchMove(event) {
        this.mouseSaved.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        this.mouseSaved.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
    }

    onTouchStart(event) {
        this.mouseDown = true;
    }

    onTouchEnd(event) {
        this.mouseDown = false;
    }

    disableFigures(e) {
        this.enable = false;
    }

    enableFigures(e) {
        this.enable = true;
    }
}